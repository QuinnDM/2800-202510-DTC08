require("dotenv").config();

async function testGemini() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const imageUrl =
    "https://res.cloudinary.com/dr4sceokg/image/upload/v1747075829/gemini/temp_output.png";
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const geminiRequest = {
    contents: [
      {
        parts: [
          {
            text: "Identify this bird, its not a northern cardinal",
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
