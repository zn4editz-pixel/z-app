
import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

// Configure
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testUpload() {
    console.log("🚀 Starting Cloudinary Upload Test...");

    // Test 1: Image Upload (Base64)
    // Transparent 1x1 GIF
    const base64Image = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

    try {
        console.log("📸 Attempting Image Upload...");
        const imgResult = await cloudinary.uploader.upload(base64Image, {
            folder: "test_uploads",
            resource_type: "image"
        });
        console.log("✅ Image Upload Success:", imgResult.secure_url);

        // Cleanup
        await cloudinary.uploader.destroy(imgResult.public_id);
        console.log("🧹 Image Cleanup Success");

    } catch (error) {
        console.error("❌ Image Upload Failed:", error.message);
        if (error.http_code === 401) console.error("   👉 UNAUTHORIZED: Check API Key/Secret");
        if (error.http_code === 404) console.error("   👉 NOT FOUND: Check Cloud Name");
    }

    // Test 2: 'Voice' Upload (simulated as video resource type as per controller)
    try {
        console.log("mic🎙️ Attempting Video/Voice Upload (resource_type: video)...");
        const videoResult = await cloudinary.uploader.upload(base64Image, { // Using same base64, usually cloudinary handles it or rejects.
            // Better to use a valid minimal video base64 if possible, but let's see if auth works first.
            folder: "test_uploads",
            resource_type: "video" // Controller uses this first
        });
        console.log("✅ Video Upload Success:", videoResult.secure_url);

        await cloudinary.uploader.destroy(videoResult.public_id, { resource_type: 'video' });
        console.log("🧹 Video Cleanup Success");

    } catch (error) {
        console.error("❌ Video/Voice Upload Failed:", error.message);
        // If image worked but video failed, it might be plan limits or file type
    }
}

testUpload();
