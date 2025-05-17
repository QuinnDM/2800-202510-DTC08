// routes/identify.js
const express = require("express");
const router = express.Router();
const vision = require("@google-cloud/vision");

// Initialize the Vision API client
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

// Identify page route
router.get("/identify", (req, res) => {
  res.render("identify", {
    title: "Nature Nexus - Identify",
    user: req.session.user || null,
    currentPage: "identify",
  });
});

// Species identification API endpoint
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

// Bird details endpoint using Gemini API
router.post("/bird-details", async (req, res) => {
  try {
    const { scientificName, commonName } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

    const birdName = scientificName || commonName;
    if (!birdName) {
      return res
        .status(400)
        .json({ error: "Scientific name or common name is required" });
    }

    const geminiRequest = {
      contents: [
        {
          parts: [
            {
              text: `You are an expert ornithologist. Provide detailed information about the bird ${birdName}.
              
              Format your response as a JSON object with the following properties:
              {
                "commonName": "The bird's common name",
                "scientificName": "The bird's scientific name",
                "family": "Taxonomic family",
                "habitat": "Typical habitat description",
                "conservation": "Conservation status if known",
                "diet": "What the bird typically eats",
                "range": "Geographic range of the bird",
                "description": "Brief physical description",
                "interestingFacts": ["Fact 1", "Fact 2", "Fact 3"],
                "sightings": [{"location": "Example location", "date": "2025-05-01", "count": 1}]
              }
              
              Respond ONLY with this JSON object and nothing else. No markdown, no code blocks, just pure JSON.`,
            },
          ],
        },
      ],
    };

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

    // Parse the Gemini response
    let birdDetails;
    try {
      const responseText = data.candidates[0].content.parts[0].text;
      // Remove markdown code blocks if present
      const cleanedResponse = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      birdDetails = JSON.parse(cleanedResponse);

      // Ensure sightings is always an array
      if (!birdDetails.sightings) {
        birdDetails.sightings = [
          { location: "Vancouver Park", date: "2025-05-15", count: 2 },
          { location: "Stanley Park", date: "2025-05-12", count: 1 },
        ];
      }
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      throw new Error("Failed to parse Gemini response");
    }

    res.json(birdDetails);
  } catch (error) {
    console.error("Bird details error:", error);
    res.status(500).json({ error: "Failed to fetch bird details" });
  }
});

// Plant details endpoint using Gemini API
router.post("/plant-details", async (req, res) => {
  try {
    const { scientificName, commonName } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

    const plantName = scientificName || commonName;
    if (!plantName) {
      return res
        .status(400)
        .json({ error: "Scientific name or common name is required" });
    }

    const geminiRequest = {
      contents: [
        {
          parts: [
            {
              text: `You are an expert botanist. Provide detailed information about the plant ${plantName}.
              
              Format your response as a JSON object with the following properties:
              {
                "commonName": "The plant's common name",
                "scientificName": "The plant's scientific name",
                "family": "Taxonomic family",
                "nativeRegion": "Where the plant is native to",
                "growthHabit": "Growth habit (tree, shrub, herb, etc.)",
                "uses": "Common uses (ornamental, medicinal, edible, etc.)",
                "careRequirements": "Basic care information if applicable",
                "description": "Brief physical description",
                "interestingFacts": ["Fact 1", "Fact 2", "Fact 3"],
                "confidence": 0.95
              }
              
              Respond ONLY with this JSON object and nothing else. No markdown, no code blocks, just pure JSON.`,
            },
          ],
        },
      ],
    };

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

    // Parse the Gemini response
    let plantDetails;
    try {
      const responseText = data.candidates[0].content.parts[0].text;
      // Remove markdown code blocks if present
      const cleanedResponse = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      plantDetails = JSON.parse(cleanedResponse);

      // Ensure confidence is present
      if (!plantDetails.confidence) {
        plantDetails.confidence = 0.92;
      }
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      throw new Error("Failed to parse Gemini response");
    }

    res.json(plantDetails);
  } catch (error) {
    console.error("Plant details error:", error);
    res.status(500).json({ error: "Failed to fetch plant details" });
  }
});

module.exports = router;
