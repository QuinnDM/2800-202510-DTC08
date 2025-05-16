require("dotenv").config();
const vision = require('@google-cloud/vision');

// Initialize the Vision API client
const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Path to your JSON key file
});

async function analyzeImage(imageUrl) {
  try {
    console.log(`Analyzing image: ${imageUrl}`);
    
    // Detect labels (objects, animals, plants)
    const [labelResult] = await client.labelDetection(imageUrl);
    const labels = labelResult.labelAnnotations;

    // Detect web entities (for scientific names)
    const [webResult] = await client.webDetection(imageUrl);
    const webEntities = webResult.webDetection?.webEntities || [];

    // Filter relevant labels (birds/plants)
    const isBird = labels.some(label => 
      label.description.toLowerCase().includes('bird') && label.score > 0.85
    );
    const isPlant = labels.some(label => 
      label.description.toLowerCase().includes('plant') && label.score > 0.85
    );

    // Prepare response
    const response = {
      type: isBird ? 'bird' : isPlant ? 'plant' : 'unknown',
      commonName: isBird || isPlant ? labels[0].description : null,
      scientificName: webEntities[0]?.description || null,
      confidence: isBird || isPlant ? labels[0].score : 0,
      details: `Detected: ${labels.slice(0, 5).map(label => label.description).join(', ')}`
    };

    console.log('Analysis Result:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('Error analyzing image:', error.message);
    return { type: 'error', details: error.message };
  }
}

const imageUrl = 'https://www.allaboutbirds.org/guide/assets/photo/305880301-480px.jpg';
analyzeImage(imageUrl);