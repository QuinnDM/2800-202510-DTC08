// routes/index.js
const express = require("express");
const router = express.Router();
const DailyFeature = require("../models/dailyFeature");

// Home route with daily feature
router.get("/", async (req, res) => {
  try {
    // Get the current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Determine if we should show a bird or plant based on the day
    // Alternate between birds and plants (odd days get birds, even days get plants)
    const featureType = today.getDate() % 2 === 0 ? "plant" : "bird";

    // Find a random featured item of the selected type
    const count = await DailyFeature.countDocuments({
      type: featureType,
      featured: true,
    });

    // Get a random index
    const random = Math.floor(Math.random() * count);

    // Find one featured item skipping to the random position
    const dailyFeature = await DailyFeature.findOne({
      type: featureType,
      featured: true,
    }).skip(random);

    res.render("index", {
      title: "Nature Nexus - Home",
      user: req.session.user || null,
      currentPage: "home",
      dailyFeature: dailyFeature || null,
    });
  } catch (error) {
    console.error("Error getting daily feature:", error);
    // If there's an error, still render the page without the feature
    res.render("index", {
      title: "Nature Nexus - Home",
      user: req.session.user || null,
      currentPage: "home",
      dailyFeature: null,
    });
  }
});

router.get("/index", (req, res) => {
  res.redirect("/");
});

router.get("/explore", (req, res) => {
  res.render("explore", {
    title: "Nature Nexus - Explore",
    error: null,
    currentPage: "explore",
    user: req.session.user || null,
  });
});

router.get("/settings", (req, res) => {
  res.render("settings", {
    title: "Nature Nexus - Settings",
    user: req.session.user || null,
    currentPage: "settings",
  });
});

// Map tile proxy routes
router.get("/tiles/:z/:x/:y", async (req, res) => {
  const { z, x, y } = req.params;
  const tileUrl = `https://tile.jawg.io/jawg-streets/${z}/${x}/${y}.png?access-token=${process.env.JAWG_API}`;
  try {
    const tileRes = await fetch(tileUrl);

    if (!tileRes.ok) {
      console.error(
        `Tile fetch failed (${tileRes.status}): ${tileRes.statusText}`
      );
      const errorText = await tileRes.text();
      console.error("Tile error response:", errorText);
      return res.status(500).send("Tile service returned an error.");
    }

    const contentType = tileRes.headers.get("content-type");
    const buffer = await tileRes.arrayBuffer();

    res.set("Content-Type", contentType || "image/png");
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Tile fetch threw error:", err);
    res.status(500).send("Internal fetch error.");
  }
});

module.exports = router;
