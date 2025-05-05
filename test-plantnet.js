require("dotenv").config();
const fetch = require("node-fetch");
const FormData = require("form-data");

async function testPlantNet() {
  const PLANTNET_API_KEY = process.env.PLANTNET_API_KEY;
  const imageUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
  const PLANTNET_URL = "https://my-api.plantnet.org/v2/identify/all";

  if (!PLANTNET_API_KEY) {
    console.error("Missing PLANTNET_API_KEY");
    return;
  }

  try {
    console.log("Sending PlantNet request for imageUrl:", imageUrl);
    const form = new FormData();
    form.append("images", imageUrl);
    form.append("api-key", PLANTNET_API_KEY);
    form.append("lang", "en");

    const response = await fetch(PLANTNET_URL, {
      method: "POST",
      body: form,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PlantNet API failed: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    const topResult = data.results[0]?.species || {};
    console.log(
      "PlantNet Response:",
      JSON.stringify(
        {
          commonName: topResult.commonNames?.[0] || "N/A",
          scientificName: topResult.scientificName || "N/A",
          family: topResult.family?.scientificName || "N/A",
          confidence: data.results[0]?.score || "N/A",
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error("PlantNet Error:", error.message);
  }
}

testPlantNet();
