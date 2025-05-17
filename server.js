const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Import models
const User = require("./models/user");
const Sighting = require("./models/sighting");
const DailyFeature = require("./models/dailyFeature");

// Import routes
const indexRoutes = require("./routes/index");
const authRoutes = require("./routes/auth");
const collectionsRoutes = require("./routes/collections");
const sightingsRoutes = require("./routes/sightings");
const articlesRoutes = require("./routes/articles");
const identifyRoutes = require("./routes/identify");
const apiRoutes = require("./routes/api");

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

// Species identification API endpoint
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

// Use route modules
app.use(indexRoutes);
app.use(authRoutes);
app.use(collectionsRoutes);
app.use(sightingsRoutes);
app.use(articlesRoutes);
app.use(identifyRoutes);
app.use(apiRoutes);

// API routes for getting user collections
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

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
