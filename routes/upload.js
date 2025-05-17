// routes/upload.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Multer for file uploads
const upload = multer({ dest: "uploads/" });

// Upload image to cloudinary and get imageURL in return
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    // Make sure we have a file
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    console.log("Uploading file:", req.file.path);

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "species_identification",
    });

    // Delete the temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });

    const imageUrl = result.secure_url; // Public URL
    console.log("Cloudinary upload successful:", imageUrl);
    res.json({ imageUrl });
  } catch (error) {
    console.error("Cloudinary Error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

module.exports = router;
