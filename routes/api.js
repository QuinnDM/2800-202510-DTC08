// routes/api.js
const express = require("express");
const router = express.Router();
const User = require("../models/user");

// API routes for getting user collections
router.get("/api/collections", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user.collections || []);
  } catch (error) {
    console.error("Collections error:", error);
    res.status(500).json({ error: "Failed to fetch collections" });
  }
});

// Create a new collection
router.post("/api/collections", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Collection name is required" });
    }

    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Initialize collections if they don't exist
    if (!user.collections) {
      user.collections = [];
    }

    // Add the new collection
    user.collections.push({
      name,
      items: [],
    });

    await user.save();
    res.json(user.collections);
  } catch (error) {
    console.error("Create collection error:", error);
    res.status(500).json({ error: "Failed to create collection" });
  }
});

module.exports = router;
