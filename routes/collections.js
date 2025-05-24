// routes/collections.js
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Sighting = require("../models/sighting");
const { validateUserStats } = require("../utilities/sighting-util");

// User collection page (requires login)
router.get("/collection", (req, res) => {
  if (req.session.user) {
    res.render("collection", {
      title: "Nature Nexus - Collection",
      user: req.session.user,
      currentPage: "collections",
    });
  } else {
    res.redirect("/login");
  }
});

// Get user stats
router.get("/stats", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.json({
        birds: 0,
        plants: 0,
      });
    }

    const [user, sightingCounts] = await Promise.all([
      User.findById(req.session.user._id),
      fetch(`${req.protocol}://${req.get('host')}/user-sighting-counts`, {
        headers: {
          Cookie: req.headers.cookie
        }
      }).then(res => res.json())
    ]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      birdsIdentified: user.stats?.birds || 0,
      plantsIdentified: user.stats?.plants || 0,
      birdsSighted: sightingCounts.birdsSighted || 0,
      plantsSighted: sightingCounts.plantsSighted || 0
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Get user sightings
router.get("/user-sightings", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" })
  }

  try {
    const userID = req.session.user._id;
    const sightings = await Sighting.find({ userID: userID });
    res.json(sightings);
  } catch (error) {
    console.error("Unable to fetch user sightings:", error);
    res.status(500).json({ error: "Failed to fetch sightings" });
  }
});

router.get("/user-species-count", async (req, res) => {
  try {
    const userId = req.session.user._id;
    const birdSpecies = await Sighting.distinct("species", {
      userId: userId,
      taxonomicGroup: "bird"
    });

    const plantSpecies = await Sighting.distinct("species", {
      userId: userId,
      taxonomicGroup: "plant"
    });

    console.log(`Bird Species: ${birdSpecies}`);
    console.log(`Plant Species: ${plantSpecies}`);
    res.json({ count: birdSpecies.length + plantSpecies.length });
  } catch (error) {
    console.error("Unable to fetch user unique species sightings:", error);
    res.status(500).json({ error: "Failed to fetch user unique species sightings" });
  }
});

router.post("/validate-stats", async (req, res) => {
  try {
    // Check to see if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Look for user in DB
    const user = req.session.user._id;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const stats = await validateUserStats(user);
    res.json(stats);
  } catch (error) {
    console.error("Validate stats error:", error);
    res.status(500).json({ error: "Failed to validate stats" });
  }
});

// Update user stats
router.post("/update-stats", async (req, res) => {
  try {
    // Check to see if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { type, action } = req.body;
    if (!type || (type !== "bird" && type !== "plant")) {
      return res.status(400).json({ error: "Invalid species type" });
    }
    if (!action || (action !== "identify" && action !== "sight")) {
      return res.status(400).json({ error: "Invalid action type" });
    }

    // Look for user in DB
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Initialize stats if they don't exist
    if (!user.stats) {
      user.stats = {
        birdsIdentified: 0,
        plantsIdentified: 0,
        birdsSighted: 0,
        plantsSighted: 0
      };
    }

    // Update the appropriate counter
    const statField = `${type}s${action === 'identify' ? 'Identified' : 'Sighted'}`;
    user.stats[statField] += 1;

    await user.save();
    res.json(user.stats);
  } catch (error) {
    console.error("Update stats error:", error);
    res.status(500).json({ error: "Failed to update stats" });
  }
});

module.exports = router;
