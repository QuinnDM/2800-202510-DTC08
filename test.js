require("dotenv").config();

async function testGemini() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const imageUrl =
    "https://www.allaboutbirds.org/guide/assets/photo/305880301-480px.jpg";
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;
  const geminiRequest = {
    contents: [
      {
        parts: [
          {
            text: `You are an expert biologist and bird watcher. Analyze the image and identify if it contains a bird or a plant.

If it's a bird, provide:
1. Type: "bird"
2. Common Name: [bird's common name]
3. Scientific Name: [bird's scientific name]

If it's a plant, provide:
1. Type: "plant"
2. Common Name: [plant's common name]
3. Scientific Name: [plant's scientific name]

If the image doesn't clearly show a bird or plant, or if you're uncertain, respond with:
1. Type: "unknown"

Format your response ONLY as a JSON object like this:
{
  "type": "bird" or "plant" or "unknown",
  "commonName": "Common name of species" (if identified),
  "scientificName": "Scientific name of species" (if identified),
  "confidence": a number between 0 and 1 indicating your confidence level,
  "details": "Brief description about the species" (2-3 sentences maximum)
}

Respond ONLY with this JSON object and nothing else.`,
          },
          { text: `Image URL: ${imageUrl}` },
        ],
      },
    ],
  };

  try {
    console.log("Sending Gemini request for imageUrl:", imageUrl);
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
    console.log("Gemini Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testGemini();
