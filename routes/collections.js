// routes/collections.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Collections page
router.get("/collections", (req, res) => {
  res.render("collection", {
    title: "Nature Nexus - Collections",
    user: req.session.user || null,
    currentPage: "collections",
  });
});

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
      return res.json({ birds: 0, plants: 0 });
    }

    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user.stats || { birds: 0, plants: 0 });
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

    const { type } = req.body;
    if (!type || (type !== "bird" && type !== "plant")) {
      return res.status(400).json({ error: "Invalid species type" });
    }

    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Initialize stats if they don't exist
    if (!user.stats) {
      user.stats = { birds: 0, plants: 0 };
    }

    // Increment the appropriate counter
    if (type === "bird") {
      user.stats.birds += 1;
    } else {
      user.stats.plants += 1;
    }

    await user.save();
    res.json(user.stats);
  } catch (error) {
    console.error("Update stats error:", error);
    res.status(500).json({ error: "Failed to update stats" });
  }
});

module.exports = router;