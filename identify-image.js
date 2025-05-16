import "dotenv/config";
import fetch from "node-fetch";
import fs from "fs/promises";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const inputPath = path.join(__dirname, "temp_input.png");
const outputPath = path.join(__dirname, "temp_output.png");

async function downloadImage(url, filepath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.statusText}`);
  const buffer = await res.arrayBuffer();
  await fs.writeFile(filepath, Buffer.from(buffer));
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

async function uploadToCloudinary(filePath) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "gemini",
    use_filename: true,
    unique_filename: false,
    overwrite: true,
  });
  console.log("Uploaded to Cloudinary:", result.secure_url);
  return result.secure_url;
}

async function main() {
  const originalImageUrl =
    "https://png.pngtree.com/png-clipart/20211018/ourmid/pngtree-racing-pigeon-png-image_3988850.png";

  try {
    await downloadImage(originalImageUrl, inputPath);
    await removeBackground(inputPath, outputPath);
    const uploadedUrl = await uploadToCloudinary(outputPath);
  } finally {
    await Promise.allSettled([fs.unlink(inputPath), fs.unlink(outputPath)]);
    console.log("Cleaned up temp files.");
  }
}

main();
