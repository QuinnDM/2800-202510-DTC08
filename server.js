const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const vision = require("@google-cloud/vision");

// Initialize the Vision API client (add after other middleware)

// Replace the existing /identify endpoint with this:

// Import User model
const User = require("./models/user");
const Sighting = require("./models/sighting");

const app = express();
const port = 3000;

const visionClient = new vision.ImageAnnotatorClient({
  credentials: {
    type: "service_account",
    project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
    private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
    auth_uri: process.env.GOOGLE_CLOUD_AUTH_URI,
    token_uri: process.env.GOOGLE_CLOUD_TOKEN_URI,
    auth_provider_x509_cert_url:
      process.env.GOOGLE_CLOUD_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLOUD_CLIENT_CERT_URL,
  },
});
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
    // get the Cloudinary URL
    const imageUrl = result.secure_url;

    // Delete the temporary file from the uploads folder
    fs.unlink(req.file.path, (unlinkErr) => {
      if (unlinkErr) {
        console.error("Failed to delete temporary file:", unlinkErr);
      } else {
        console.log("Successfully deleted temporary file:", req.file.path);
      }
    });

    // Return the Cloudinary URL
    res.json({ imageUrl });
  } catch (error) {
    console.error("Cloudinary Error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// Import routes
const authRoutes = require("./routes/auth");
const articlesRoutes = require("./routes/articles");
const collectionsRoutes = require("./routes/collections");

// Use routes
app.use(authRoutes);
app.use(articlesRoutes);
app.use(collectionsRoutes);

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
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    console.log(`Analyzing image: ${imageUrl}`);

    // First, use Vision API to get basic labels and web entities
    const [labelResult] = await visionClient.labelDetection(imageUrl);
    const labels = labelResult.labelAnnotations;
    const [webResult] = await visionClient.webDetection(imageUrl);
    const webEntities = webResult.webDetection?.webEntities || [];

    // Prepare the Gemini prompt with Vision API results as context
    const geminiRequest = {
      contents: [
        {
          parts: [
            {
              text: `You are an expert biologist and bird watcher. Analyze this image and the following context:
              
              Vision API detected labels: ${labels
                .slice(0, 5)
                .map((l) => l.description)
                .join(", ")}
              Web entities found: ${webEntities
                .slice(0, 3)
                .map((e) => e.description)
                .join(", ")}
              
              If it's a bird, provide:
              1. Type: "bird"
              2. Common Name: [bird's common name]
              3. Scientific Name: [bird's scientific name]
              4. Family: [bird family]
              5. Habitat: [typical habitat]
              6. Conservation Status: [if known]
              7. Interesting Facts: [2-3 interesting facts]

              If it's a plant, provide:
              1. Type: "plant"
              2. Common Name: [plant's common name]
              3. Scientific Name: [plant's scientific name]
              4. Family: [plant family]
              5. Native Region: [if known]
              6. Uses: [common uses if any]
              7. Interesting Facts: [2-3 interesting facts]

              If the image doesn't clearly show a bird or plant, or if you're uncertain, respond with:
              1. Type: "unknown"

              Format your response ONLY as a JSON object like this:
              {
                "type": "bird" or "plant" or "unknown",
                "commonName": "Common name of species",
                "scientificName": "Scientific name of species",
                "confidence": 0.95,
                "family": "Family name",
                "habitat": "Typical habitat",
                "conservationStatus": "Status if known",
                "interestingFacts": ["Fact 1", "Fact 2"],
                "details": "Brief description about the species",
                "visionLabels": ["label1", "label2"] // top 3 labels from Vision API
              }

              Respond ONLY with this JSON object and nothing else. No markdown, no code blocks, just pure JSON.`,
            },
          ],
        },
      ],
    };

    // Call Gemini API
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Extract the JSON response from Gemini
    let geminiResponse;
    try {
      const responseText = data.candidates[0].content.parts[0].text;
      // Remove markdown code blocks if present
      const cleanedResponse = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      geminiResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      throw new Error("Failed to parse Gemini response");
    }

    // Enhance the response with Vision API data
    const enhancedResponse = {
      ...geminiResponse,
      visionLabels: labels.slice(0, 3).map((label) => ({
        description: label.description,
        score: label.score,
      })),
      webEntities: webEntities.slice(0, 3).map((entity) => ({
        description: entity.description,
        score: entity.score,
      })),
    };

    res.json(enhancedResponse);
  } catch (error) {
    console.error("Error analyzing image:", error.message);
    res.status(500).json({
      type: "error",
      details: error.message,
      error: "Failed to identify species",
    });
  }
});

// Updated bird details endpoint to use Gemini's enhanced response
app.post("/bird-details", async (req, res) => {
  try {
    const {
      commonName,
      scientificName,
      family,
      habitat,
      conservationStatus,
      interestingFacts,
      details,
    } = req.body;

    const birdDetails = {
      commonName: commonName || "Unknown Bird",
      scientificName: scientificName || "Unknown Species",
      family: family || "Unknown Family",
      habitat: habitat || "Habitat information not available",
      conservationStatus: conservationStatus || "Unknown",
      interestingFacts: interestingFacts || ["No additional facts available"],
      description: details || "No description available",
      sightings: [],
    };

    res.json(birdDetails);
  } catch (error) {
    console.error("Bird details error:", error);
    res.status(500).json({ error: "Failed to fetch bird details" });
  }
});

// Updated plant details endpoint to use Gemini's enhanced response
app.post("/plant-details", async (req, res) => {
  try {
    const {
      commonName,
      scientificName,
      family,
      nativeRegion,
      uses,
      interestingFacts,
      details,
    } = req.body;

    const plantDetails = {
      commonName: commonName || "Unknown Plant",
      scientificName: scientificName || "Unknown Species",
      family: family || "Unknown Family",
      nativeRegion: nativeRegion || "Unknown",
      uses: uses || "Unknown",
      interestingFacts: interestingFacts || ["No additional facts available"],
      description: details || "No description available",
      confidence: 0.85,
    };

    res.json(plantDetails);
  } catch (error) {
    console.error("Plant details error:", error);
    res.status(500).json({ error: "Failed to fetch plant details" });
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

// Settings page route
app.get("/settings", (req, res) => {
  res.render("settings", {
    title: "Nature Nexus - Settings",
    user: req.session.user || null,
    currentPage: "settings",
  });
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
