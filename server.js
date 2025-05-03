const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fetch = require("node-fetch");

// Import User model
const User = require("./models/user");

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

// Express route for image upload
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


// Use Gemini to identify the birds or plant
app.post("/identify", async (req, res) => {
  const { imageUrl } = req.body; // Get Cloudinary URL from request
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Create Gemini request
  const geminiRequest = {
    contents: [
      {
        parts: [
          {
            text: "Identify whether this is a bird or plant. If a bird, provide its common name, scientific name, and confirm it's a bird. If a plant, provide its common name, scientific name, and confirm it's a plant.",
          },
          { text: `Image URL: ${imageUrl}` },
        ],
      },
    ],
  };

  try {
    // Call Gemini API
    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiRequest),
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini Error: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    const speciesInfo = geminiData.candidates[0].content.parts[0].text;

    // Parse response (simple parsing; use regex for robustness)
    const isBird = speciesInfo.toLowerCase().includes("bird");
    const isPlant = speciesInfo.toLowerCase().includes("plant");
    let commonName, scientificName;

    if (isBird || isPlant) {
      commonName = speciesInfo.match(/Common Name: ([^\n,]+)/)?.[1]?.trim();
      scientificName = speciesInfo
        .match(/Scientific Name: ([^\n]+)/)?.[1]
        ?.trim();
    }

    res.json({
      type: isBird ? "bird" : isPlant ? "plant" : "unknown",
      commonName,
      scientificName,
      rawResponse: speciesInfo,
    });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Failed to identify species" });
  }
});

// API to fetch bird details
app.post("/bird-details", async (req, res) => {
  const {
    scientificName,
    latitude = 49.299999,
    longitude = -123.139999,
  } = req.body; // Default to Stanley Park
  const EBIRD_API_KEY = process.env.EBIRD_API_KEY;
  const TAXONOMY_URL =
    "https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json&locale=en&cat=species";

  try {
    // Get species code from taxonomy
    const taxonomyResponse = await fetch(TAXONOMY_URL, {
      headers: { "x-ebirdapitoken": EBIRD_API_KEY },
    });
    if (!taxonomyResponse.ok) {
      throw new Error("eBird Taxonomy Error");
    }

    const taxonomy = await taxonomyResponse.json();
    const species = taxonomy.find(
      (s) => s.sciName.toLowerCase() === scientificName.toLowerCase()
    );
    if (!species) {
      return res
        .status(404)
        .json({ error: `Species ${scientificName} not found` });
    }

    // Get recent sightings
    const sightingsUrl = `https://api.ebird.org/v2/data/obs/geo/recent/${species.speciesCode}?lat=${latitude}&lng=${longitude}`;
    const sightingsResponse = await fetch(sightingsUrl, {
      headers: { "x-ebirdapitoken": EBIRD_API_KEY },
    });
    const sightings = sightingsResponse.ok
      ? await sightingsResponse.json()
      : [];

    // Construct response (habitat inferred from sightings)
    res.json({
      commonName: species.comName,
      scientificName: species.sciName,
      family: species.familyComName,
      sightings: sightings.slice(0, 5).map((obs) => ({
        location: obs.locName,
        date: obs.obsDt,
        count: obs.howMany || "N/A",
      })),
      habitat:
        "Inferred from sightings; check external sources for detailed habitat data",
    });
  } catch (error) {
    console.error("eBird Error:", error);
    res.status(500).json({ error: "Failed to fetch bird details" });
  }
});

// fetch plantnet API
app.post("/plant-details", async (req, res) => {
  const { imageUrl, scientificName } = req.body; // Use Gemini's scientific name as fallback
  const PLANTNET_API_KEY = process.env.PLANTNET_API_KEY;
  const PLANTNET_URL = "https://my-api.plantnet.org/v2/identify/all";

  try {
    // Call PlantNet API
    const plantnetResponse = await fetch(PLANTNET_URL, {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" }, // Note: Requires form-data handling
      body: JSON.stringify({
        "api-key": PLANTNET_API_KEY,
        images: [imageUrl],
        lang: "en",
      }),
    });

    if (!plantnetResponse.ok) {
      throw new Error("PlantNet Error");
    }

    const plantnetData = await plantnetResponse.json();
    const topResult = plantnetData.results[0]?.species || {};

    res.json({
      commonName: topResult.commonNames?.[0] || "N/A",
      scientificName: topResult.scientificName || scientificName,
      family: topResult.family?.scientificName || "N/A",
      confidence: plantnetData.results[0]?.score || "N/A",
      metadata: {
        distribution: "Check external sources for detailed distribution", // PlantNet metadata is limited
        note: "PlantNet provides basic metadata; use Trefle for detailed care info",
      },
    });
  } catch (error) {
    console.error("PlantNet Error:", error);
    res.status(500).json({ error: "Failed to fetch plant details" });
  }
});

// Routes
app.get("/", (req, res) => {
  res.redirect("/index");
});

app.get("/index", (req, res) => {
  res.render("index", { error: null, title: "Nature Nexus - Home" });
});

app.get("/explore", (req, res) => {
  res.render("explore", { error: null });
});

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.get("/tiles/:z/:x/:y", async (req, res) => {
  const { z, x, y } = req.params;
  const r = "";
  const tileUrl = `https://tile.jawg.io/jawg-streets/${z}/${x}/${y}${r}.png?access-token=${process.env.JAWG_API}`;

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
      res.redirect("/collection");
    } else {
      res.render("login", { error: "Invalid email or password" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.render("login", { error: "An error occurred" });
  }
});

app.get("/register", (req, res) => {
  res.render("login", { error: null });
});

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  console.log("Registration attempt:", { email, password });
  if (!email || !password) {
    console.log("Missing email or password");
    return res.render("login", { error: "Email and password are required" });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email already registered:", email);
      res.render("login", { error: "Email already registered" });
    } else {
      const saltRounds = process.env.SALT_ROUND
        ? parseInt(process.env.SALT_ROUND)
        : 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log("Hashed password:", hashedPassword);
      const newUser = new User({ email, password: hashedPassword });
      const savedUser = await newUser.save();
      console.log("User saved to MongoDB:", savedUser);
      res.redirect("/login");
    }
  } catch (err) {
    console.error("Registration error:", err);
    res.render("login", { error: `Registration failed: ${err.message}` });
  }
});

app.get("/collection", (req, res) => {
  if (req.session.user) {
    res.send(
      'This is your personalized collection! <a href="/logout">Logout</a>'
    );
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
