require("dotenv").config();
const fetch = require("node-fetch");

async function testEBird() {
  const EBIRD_API_KEY = process.env.EBIRD_API_KEY;
  const scientificName = "Turdus migratorius"; // American Robin
  const latitude = 40.7128; // Default: New York City
  const longitude = -74.006;
  const TAXONOMY_URL =
    "https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json&locale=en&cat=species";

  if (!EBIRD_API_KEY) {
    console.error("Missing EBIRD_API_KEY");
    return;
  }

  try {
    // Step 1: Fetch taxonomy
    console.log("Fetching eBird taxonomy...");
    const taxonomyResponse = await fetch(TAXONOMY_URL, {
      headers: { "x-ebirdapitoken": EBIRD_API_KEY },
    });
    if (!taxonomyResponse.ok) {
      const errorText = await taxonomyResponse.text();
      throw new Error(
        `eBird Taxonomy failed: ${taxonomyResponse.status} - ${errorText}`
      );
    }
    const taxonomy = await taxonomyResponse.json();
    const species = taxonomy.find(
      (s) => s.sciName.toLowerCase() === scientificName.toLowerCase()
    );
    if (!species) {
      throw new Error(`Species ${scientificName} not found in eBird taxonomy`);
    }
    console.log("Found species:", {
      commonName: species.comName,
      scientificName: species.sciName,
      speciesCode: species.speciesCode,
    });

    // Step 2: Fetch recent sightings
    const sightingsUrl = `https://api.ebird.org/v2/data/obs/geo/recent/${species.speciesCode}?lat=${latitude}&lng=${longitude}`;
    console.log("Fetching sightings for:", sightingsUrl);
    const sightingsResponse = await fetch(sightingsUrl, {
      headers: { "x-ebirdapitoken": EBIRD_API_KEY },
    });
    const sightings = sightingsResponse.ok
      ? await sightingsResponse.json()
      : [];
    console.log(
      "Sightings:",
      JSON.stringify(
        sightings.slice(0, 5).map((obs) => ({
          location: obs.locName,
          date: obs.obsDt,
          count: obs.howMany || "N/A",
        })),
        null,
        2
      )
    );
  } catch (error) {
    console.error("eBird Error:", error.message);
  }
}

testEBird();
