import fetch from "node-fetch";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// These 3 lines allow __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const imageUrl = "https://png.pngtree.com/png-clipart/20230927/original/pngtree-red-mushroom-png-png-image_13144538.png";
const inputPath = path.join(__dirname, "input.png");
const outputPath = path.join(__dirname, "output.png");

async function downloadImage(url, filepath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.statusText}`);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(buffer));
  console.log("✅ Image downloaded.");
}

function removeBackground(input, output) {
  return new Promise((resolve, reject) => {
    exec(`rembg i ${input} ${output}`, (error, stdout, stderr) => {
      if (error) return reject(`rembg error: ${stderr}`);
      console.log("✅ Background removed.");
      resolve();
    });
  });
}

async function main() {
  try {
    await downloadImage(imageUrl, inputPath);
    await removeBackground(inputPath, outputPath);
    console.log("🎉 Done. Check output.png in this folder.");
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

main();
