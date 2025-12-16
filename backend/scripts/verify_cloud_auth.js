
import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log("🔒 Credentials Check:");
console.log(`Cloud Name: '${cloudName}'`);
console.log(`API Key:    '${apiKey}'`);
console.log(`API Secret: '${apiSecret ? apiSecret.slice(0, 4) + '...' : 'MISSING'}'`);

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
});

async function verify() {
    try {
        console.log("\n📡 Pinging Cloudinary...");
        // Try to get usage details (requires valid auth)
        const result = await cloudinary.api.usage();
        console.log("✅ Credentials Validated! Usage plan:", result.plan);
    } catch (error) {
        console.error("❌ Validation Failed:");
        console.error(`   Error Code: ${error.http_code}`);
        console.error(`   Message:    ${error.message}`);

        if (error.message.includes("Unknown API key")) {
            console.log("\n💡 DIAGNOSIS: The API Key is not found in Cloudinary database.");
            console.log("   - Check if you copied the 'API Key' correctly.");
            console.log("   - Check if you are using the correct 'Cloud Name'.");
        } else if (error.http_code === 401) {
            console.log("\n💡 DIAGNOSIS: Authorization failed. API Secret might be wrong or Key doesn't match Secret.");
        }
    }
}

verify();
