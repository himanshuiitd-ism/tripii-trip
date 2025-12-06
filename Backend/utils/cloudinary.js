import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config({});

// Configure paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env
config({ path: path.resolve(__dirname, "../../.env") });

const requiredEnvVars = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

// Debug output
console.log("Current working directory:", process.cwd());
console.log("Environment path:", path.resolve(__dirname, "../../.env"));

// Validate
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Initialize
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

console.log("✅ Cloudinary configured successfully");
export default cloudinary;
