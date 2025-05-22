const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fs = require("fs");
const vision = require("@google-cloud/vision");
const app = express();

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json()); // Added JSON parser for API endpoints

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

// Configure Cloudinary for uploading image
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Multer for file uploads
const upload = multer({ dest: "uploads/" });

// Added identify route
router.get("/identify", (req, res) => {
  res.render("identify", {
    title: "Nature Nexus - Identify",
    user: req.session.user || null,
    currentPage: "identify",
  });
});
// Step 1: Upload image to cloudinary and get imageURL in return
router.post("/upload", upload.single("image"), async (req, res) => {
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

//If the user wishes to remove an image it gets removed from cloudinary
router.post('/delete-image', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    const urlParts = imageUrl.split('/');
    const publicIdWithExtension = urlParts.slice(-2).join('/');
    const publicId = publicIdWithExtension.split('.')[0];
    
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      return res.status(200).json({ message: 'Image deleted successfully' });
    } else {
      return res.status(400).json({ error: 'Failed to delete image' });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// Step 2: Identify species using Gemini API endpoint
router.post("/identify", async (req, res) => {
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
router.post("/bird-details", async (req, res) => {
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
router.post("/plant-details", async (req, res) => {
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

module.exports = router;
``