const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const passport = require('passport');

// Initialize passport configuration
require('./passport-config')(passport);

// Import User model
const User = require("./models/user");
const Sighting = require("./models/sighting");
const DailyFeature = require("./models/dailyFeature");

// IMPORTANT: Import auth routes first to access checkRememberToken
const { router: authRoutes, checkRememberToken } = require("./routes/auth");

// Import routes
// const authRoutes = require("./routes/auth");
const identifyRoutes = require("./routes/identify");
const articlesRoutes = require("./routes/articles");
const collectionsRoutes = require("./routes/collections");
const settingsRoutes = require("./routes/settings");
const exploreRoutes = require("./routes/explore");

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

// Use cookie-parser before session middleware
app.use(cookieParser());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(checkRememberToken);


app.use(passport.initialize());
app.use(passport.session());

app.use(express.static("public"));
app.set("views", "./views");
app.set("view engine", "ejs");

// Use routes
app.use(authRoutes);
app.use(identifyRoutes);
app.use(articlesRoutes);
app.use(collectionsRoutes);
app.use(settingsRoutes);
app.use(exploreRoutes);

// Function to get daily feature based on current date
async function getDailyFeature() {
  try {
    // Get the current date and use it as a seed for selection
    const today = new Date();
    const dateString = `${today.getFullYear()}-${
      today.getMonth() + 1
    }-${today.getDate()}`;

    // Count total features
    const count = await DailyFeature.countDocuments();
    if (count === 0) return null;

    // Create a deterministic "random" index based on the date
    // This ensures the same feature is shown all day, but changes daily
    const hash = dateString.split("").reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    const index = hash % count;

    // Get the feature at this index
    return await DailyFeature.findOne().skip(index);
  } catch (error) {
    console.error("Error getting daily feature:", error);
    return null;
  }
}

app.get("/", async (req, res) => {
  try {
    // Use the date-based function to get today's feature
    const dailyFeature = await getDailyFeature();

    res.render("index", {
      title: "Nature Nexus - Home",
      user: req.session.user || null,
      currentPage: "home",
      dailyFeature: dailyFeature, // Pass the daily feature to the template
    });
  } catch (error) {
    console.error("Error fetching daily feature:", error);
    res.render("index", {
      title: "Nature Nexus - Home",
      user: req.session.user || null,
      currentPage: "home",
      dailyFeature: null, // Pass null if there's an error
    });
  }
});

app.get("/index", async (req, res) => {
  try {
    // Use the same date-based function for consistency
    const dailyFeature = await getDailyFeature();

    res.render("index", {
      title: "Nature Nexus - Home",
      user: req.session.user || null,
      currentPage: "home",
      dailyFeature: dailyFeature,
    });
  } catch (error) {
    console.error("Error fetching daily feature:", error);
    res.render("index", {
      title: "Nature Nexus - Home",
      user: req.session.user || null,
      currentPage: "home",
      dailyFeature: null,
    });
  }
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

// Add a route to manually refresh the daily feature (useful for testing)
app.get("/refresh-daily-feature", async (req, res) => {
  try {
    const dailyFeature = await getDailyFeature();
    res.json({
      success: true,
      message: "Daily feature refreshed",
      feature: dailyFeature
        ? {
            type: dailyFeature.type,
            commonName: dailyFeature.commonName,
            scientificName: dailyFeature.scientificName,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to refresh daily feature",
      error: error.message,
    });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
