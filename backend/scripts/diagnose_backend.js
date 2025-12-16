
import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runDiagnostics() {
    console.log("🔍 STARTING BACKEND DIAGNOSTICS...");
    console.log("====================================");

    // 1. Environment Variables
    console.log("\n1️⃣  Checking Environment Variables:");
    const requiredKeys = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'DATABASE_URL', 'PORT'];
    let envOk = true;
    requiredKeys.forEach(key => {
        if (!process.env[key]) {
            console.log(`   ❌ MISSING: ${key}`);
            envOk = false;
        } else {
            console.log(`   ✅ PRESENT: ${key}`);
        }
    });

    if (!envOk) {
        console.error("   🚨 CRITICAL: Missing environment variables. Fix .env file.");
    }

    // 2. Cloudinary Config & Test
    console.log("\n2️⃣  Testing Cloudinary Connection:");
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    try {
        console.log("   ☁️  Attempting to upload test image...");
        // Tiny 1x1 base64 transparent gif
        const testImage = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        const uploadResult = await cloudinary.uploader.upload(testImage, {
            folder: "diagnostics",
            public_id: `test_${Date.now()}`
        });
        console.log(`   ✅ Cloudinary Upload Success: ${uploadResult.secure_url}`);

        // Cleanup
        await cloudinary.uploader.destroy(uploadResult.public_id);
        console.log("   ✅ Test image cleaned up.");
    } catch (error) {
        console.error("   ❌ Cloudinary Test Failed:", error.message);
        if (error.message.includes("Must supply cloud_name")) {
            console.error("      👉 HINT: Check CLOUDINARY_CLOUD_NAME in .env");
        } else if (error.message.includes("api_key")) {
            console.error("      👉 HINT: Check CLOUDINARY_API_KEY in .env");
        } else if (error.http_code === 401) {
            console.error("      👉 HINT: Authentication failed. Check API Key and Secret.");
        }
    }

    // 3. Database Connection
    console.log("\n3️⃣  Testing Database Connection (Prisma):");
    try {
        await prisma.$connect();
        const userCount = await prisma.user.count();
        console.log(`   ✅ Database Connected. User count: ${userCount}`);
        await prisma.$disconnect();
    } catch (error) {
        console.error("   ❌ Database Connection Failed:", error.message);
    }

    console.log("\n====================================");
    console.log("🏁 DIAGNOSTICS COMPLETE");
}

runDiagnostics();
