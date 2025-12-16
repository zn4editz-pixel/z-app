
import 'dotenv/config';

console.log("Checking Cloudinary Configuration:");
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME ? "✅ Present" : "❌ MISSING");
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "✅ Present" : "❌ MISSING");
console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "✅ Present" : "❌ MISSING");
