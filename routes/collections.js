// routes/collections.js
const express = require("express");
const router = express.Router();
const User = require("../models/user");

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
      plantsIdentified: user.stats?.plants|| 0,
      birdsSighted: sightingCounts.birdsSighted || 0,
      plantsSighted: sightingCounts.plantsSighted || 0
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Update user stats
router.post("/update-stats", async (req, res) => {
  try {
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
