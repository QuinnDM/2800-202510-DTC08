// routes/sightings.js
const express = require("express");
const router = express.Router();
const Sighting = require("../models/sighting");

// Helper function to build filters
function sightingsFilters(query, userIdString) {
  const filters = {};
  if (query.onlyYours == "true") {
    filters.userId = userIdString;
  }
  return filters;
}

// Get all sightings
router.get("/sightings", async (req, res) => {
  if (req.session.user) {
    // apply filter before getting sightings
    const filter = sightingsFilters(req.query, req.session.user._id);
    const sightings = await Sighting.find(filter);
    res.json(sightings);
  } else {
    const sightings = await Sighting.find({});
    res.json(sightings);
  }
});

// Get your sightings
router.get("/yourSightings", async (req, res) => {
  if (req.session.user) {
    const sightings = await Sighting.find({ userId: req.session.user._id });
    res.json(sightings);
  } else {
    return res.status(404).json({ error: "User not found" });
  }
});

// Submit a sighting
router.post("/submitSighting", async (req, res) => {
  if (req.session.user) {
    try {
      const newSighting = new Sighting({
        userId: req.session.user._id,
        username: req.session.user.username || req.session.user.email,
        species: req.body.species,
        description: req.body.description || "",
        location: {
          type: "Point",
          coordinates: req.body.coordinates, // [lng, lat]
        },
        photoUrl: req.body.photoUrl || "",
        timestamp: new Date(req.body.timestamp),
        taxonomicGroup: req.body.taxonomicGroup,
        userDescription: req.body.userDescription || "",
      });
      const newSightingSaved = await newSighting.save();
      res
        .status(201)
        .json({ message: "Sighting saved", data: newSightingSaved });
    } catch (err) {
      console.error("Save sighting error:", err);
      res.status(500).json({ error: "Failed to save sighting" });
    }
  } else {
    return res.status(404).json({
      error: "User not found. You must be logged in to submit a sighting.",
    });
  }
});

// Weather API endpoint
router.get("/openweathermap/:lat/:lon", async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const openweathermapAPI = process.env.OPENWEATHERMAP_API_KEY;
    const openweathermapUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHERMAP_API_KEY}`;
    const weatherRes = await fetch(openweathermapUrl);
    const weatherData = await weatherRes.json();
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

module.exports = router;
