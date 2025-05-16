const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fetch = require("node-fetch");
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
app.use(bodyParser.json()); // Added JSON parser for API endpoints
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

// Configure Cloudinary for uploading image
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Multer for file uploads
const upload = multer({ dest: "uploads/" });

// Step 1: Upload image to cloudinary and get imageURL in return
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "species_identification",
    });
    const imageUrl = result.secure_url; // Public URL
    res.json({ imageUrl });
  } catch (error) {
    console.error("Cloudinary Error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// Routes
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

app.get("/explore", (req, res) => {
  res.render("explore", {
    title: "Nature Nexus - Explore",
    error: null,
    currentPage: "explore",
    user: req.session.user || null,
  });
});

app.get("/login", (req, res) => {
  res.render("login", {
    title: "Nature Nexus - Login",
    error: null,
    currentPage: "login",
  });
});

app.get("/openweathermap/:lat/:lon", async (req, res) => {
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

app.get("/tiles/:z/:x/:y", async (req, res) => {
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

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.user = user;
      res.redirect("/");
    } else {
      res.render("login", {
        title: "Nature Nexus - Login",
        error: "Invalid email or password",
        currentPage: "login",
      });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.render("login", {
      title: "Nature Nexus - Login",
      error: "An error occurred",
      currentPage: "login",
    });
  }
});

app.get("/register", (req, res) => {
  res.render("login", {
    title: "Nature Nexus - Register",
    error: null,
    currentPage: "register",
  });
});

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  console.log("Registration attempt:", { email, password: "***" });
  if (!email || !password) {
    console.log("Missing email or password");
    return res.render("login", {
      title: "Nature Nexus - Register",
      error: "Email and password are required",
      currentPage: "register",
    });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email already registered:", email);
      res.render("login", {
        title: "Nature Nexus - Register",
        error: "Email already registered",
        currentPage: "register",
      });
    } else {
      const saltRounds = process.env.SALT_ROUND
        ? parseInt(process.env.SALT_ROUND)
        : 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log("Password hashed successfully");
      const newUser = new User({
        email,
        password: hashedPassword,
        stats: { birds: 0, plants: 0 },
        collections: [],
      });
      const savedUser = await newUser.save();
      console.log("User saved to MongoDB:", savedUser._id);
      res.redirect("/login");
    }
  } catch (err) {
    console.error("Registration error:", err);
    res.render("login", {
      title: "Nature Nexus - Register",
      error: `Registration failed: ${err.message}`,
      currentPage: "register",
    });
  }
});

app.get("/collections", (req, res) => {
  res.render("collection", {
    title: "Nature Nexus - Collections",
    user: req.session.user || null,
    currentPage: "collections",
  });
});

app.get("/collection", (req, res) => {
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

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// Added identify route
app.get("/identify", (req, res) => {
  res.render("identify", {
    title: "Nature Nexus - Identify",
    user: req.session.user || null,
    currentPage: "identify",
  });
});

// Step 2: Identify species using Gemini API endpoint
app.post("/identify", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    // For now, let's return a mock result
    const mockIdentification = {
      type: Math.random() > 0.5 ? "bird" : "plant",
      commonName: Math.random() > 0.5 ? "American Robin" : "Oak Tree",
      scientificName:
        Math.random() > 0.5 ? "Turdus migratorius" : "Quercus robur",
    };

    res.json(mockIdentification);
  } catch (error) {
    console.error("Identification error:", error);
    res.status(500).json({ error: "Failed to identify species" });
  }
});

// Bird details API endpoint
app.post("/bird-details", async (req, res) => {
  try {
    const { scientificName } = req.body;
    // Mock bird details
    const birdDetails = {
      commonName: "American Robin",
      scientificName: scientificName || "Turdus migratorius",
      family: "Turdidae",
      habitat: "Woodland, urban gardens, parks",
      sightings: [
        { location: "City Park", date: "2025-04-28", count: 3 },
        { location: "Backyard", date: "2025-05-01", count: 1 },
      ],
    };

    res.json(birdDetails);
  } catch (error) {
    console.error("Bird details error:", error);
    res.status(500).json({ error: "Failed to fetch bird details" });
  }
});

// Plant details API endpoint
app.post("/plant-details", async (req, res) => {
  try {
    const { scientificName } = req.body;
    // Mock plant details
    const plantDetails = {
      commonName: "English Oak",
      scientificName: scientificName || "Quercus robur",
      family: "Fagaceae",
      confidence: 0.95,
      metadata: { note: "Deciduous tree native to Europe" },
    };

    res.json(plantDetails);
  } catch (error) {
    console.error("Plant details error:", error);
    res.status(500).json({ error: "Failed to fetch plant details" });
  }
});

// Get user stats
app.get("/stats", async (req, res) => {
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
app.post("/update-stats", async (req, res) => {
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

// Get user collections
app.get("/api/collections", async (req, res) => {
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
app.post("/api/collections", async (req, res) => {
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

// Settings page route
app.get("/settings", (req, res) => {
  res.render("settings", {
    title: "Nature Nexus - Settings",
    user: req.session.user || null,
    currentPage: "settings",
  });
});

// Article routes
app.get("/articles/getting-started", (req, res) => {
  res.render("articles/getting-started", {
    title: "Getting Started with Bird Watching - Nature Nexus",
    user: req.session.user || null,
    currentPage: "articles",
  });
});

app.get("/articles/bird-identification-tips", (req, res) => {
  res.render("articles/bird-identification-tips", {
    title: "Bird Identification Tips - Nature Nexus",
    user: req.session.user || null,
    currentPage: "articles",
  });
});

app.get("/articles/bird-photography-fundamentals", (req, res) => {
  res.render("articles/bird-photography-fundamentals", {
    title: "Bird Photography Fundamentals - Nature Nexus",
    user: req.session.user || null,
    currentPage: "articles",
  });
});

// Migration guide article route
app.get("/articles/migration-guide", (req, res) => {
  res.render("articles/migration-guide", {
    title: "Seasonal Bird Migration Guide",
    user: req.session.user || null,
    currentPage: "articles",
  });
});

// Journal guide article route
app.get("/articles/journal-guide", (req, res) => {
  res.render("articles/journal-guide", {
    title: "Creating Your Bird Watching Journal",
    user: req.session.user || null,
    currentPage: "articles",
  });
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
