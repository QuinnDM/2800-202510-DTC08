const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

const imageUrl = "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQbPZkYuUTb29CHnSVREtoFdbyEslmzsOLoUHua4Oz8isxRZ1TZXiF7qO19zdFBMkyRIGoNU1nZZXUpYGa1yvfEEw";
const inputPath = path.join(__dirname, "input.png");
const outputPath = path.join(__dirname, "output.png");

async function downloadImage(url, filepath) {
  const fetch = (await import("node-fetch")).default;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.statusText}`);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(buffer));
  console.log("Image downloaded.");
}

function removeBackground(input, output) {
  return new Promise((resolve, reject) => {
    exec(`rembg i ${input} ${output}`, (error, stdout, stderr) => {
      if (error) return reject(`rembg error: ${stderr}`);
      console.log("Background removed.");
      resolve();
    });
  });
}

async function main() {
  try {
    await downloadImage(imageUrl, inputPath);
    await removeBackground(inputPath, outputPath);
    console.log("Done. Check output.png in this folder.");
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
