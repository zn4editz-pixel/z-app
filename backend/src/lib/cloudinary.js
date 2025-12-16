import { v2 as cloudinary } from "cloudinary";

import { config } from "dotenv";

config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
console.log(`☁️ Cloudinary Configuration: ${isConfigured ? '✅ Loaded' : '❌ MISSING KEYS'}`);
if (!isConfigured) {
  console.log('   - Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? 'OK' : 'MISSING');
  console.log('   - API Key:', process.env.CLOUDINARY_API_KEY ? 'OK' : 'MISSING');
  console.log('   - API Secret:', process.env.CLOUDINARY_API_SECRET ? 'OK' : 'MISSING');
}

export default cloudinary;
