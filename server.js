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
