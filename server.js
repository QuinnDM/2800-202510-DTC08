const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Import User model
const User = require("./models/user");
const Sighting = require("./models/sighting");

const app = express();
const port = 3000;

// MongoDB Connection using .env
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.static("public"));
app.set("views", "./views");
app.set("view engine", "ejs");

// Import routes
const authRoutes = require("./routes/auth");
const identifyRoutes = require("./routes/identify");
const articlesRoutes = require("./routes/articles");
const collectionsRoutes = require("./routes/collections");
const settingsRoutes = require("./routes/settings");
const exploreRoutes = require("./routes/explore");

// Use routes
app.use(authRoutes);
app.use(identifyRoutes);
app.use(articlesRoutes);
app.use(collectionsRoutes);
app.use(settingsRoutes);
app.use(exploreRoutes);

app.get("/", (req, res) => {
  res.render("index", {
    title: "Nature Nexus - Home",
    user: req.session.user || null,
    currentPage: "home",
  });
});

app.get("/index", (req, res) => {
  res.render("index", {
    title: "Nature Nexus - Home",
    user: req.session.user || null,
    currentPage: "home",
  });
});

// Build filter helper function
function sightingsFilters(query, userIdString) {
  const filters = {};
  if (query.onlyYours == "true") {
    filters.userId = userIdString;
  }
  return filters;
}

// Get sightings
app.get("/sightings", async (req, res) => {
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
app.get("/yourSightings", async (req, res) => {
  if (req.session.user) {
    const sightings = await Sighting.find({ userId: req.session.user._id });
    res.json(sightings);
  } else {
    return res.status(404).json({ error: "User not found" });
  }
});

// Submit a sighting
app.post("/submitSighting", async (req, res) => {
  if (req.session.user) {
    try {
      const newSighting = new Sighting({
        userId: req.session.user._id,
        username: req.session.user.username,
        species: req.body.species,
        description: req.body.description || "",
        location: {
          type: "Point",
          coordinates: req.body.coordinates, // [lng, lat]
        },
        photoUrl: req.body.photoUrl || "",
        timestamp: new Date(req.body.timestamp),
        taxonomicGroup: req.body.taxonomicGroup,
        userDescription: req.body.userDescription,
      });
      const newSightingSaved = await newSighting.save();
      res
        .status(201)
        .json({ message: "Sighting saved", data: newSightingSaved });
    } catch (err) {
      res.status(500).json({ error: "Failed to save sighting" });
    }
  } else {
    return res.status(404).json({
      error: "User not found. You must be logged in to submit a sighting.",
    });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
