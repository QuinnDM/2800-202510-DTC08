require("dotenv").config();
const fetch = require("node-fetch");

async function testGemini() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const imageUrl =
    "https://png.pngtree.com/png-clipart/20230927/original/pngtree-red-mushroom-png-png-image_13144538.png";
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const geminiRequest = {
    contents: [
      {
        parts: [
          {
            text: "Identify this image. Give answer in this format: bird or plant and its common name",
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
