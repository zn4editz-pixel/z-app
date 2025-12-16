
import 'dotenv/config';

console.log("🔍 DEEP CREDENTIAL INSPECTION");

const vars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

vars.forEach(key => {
    const val = process.env[key];
    if (!val) {
        console.log(`❌ ${key}: MISSING`);
        return;
    }

    console.log(`\n🔑 ${key}:`);
    console.log(`   Length: ${val.length}`);
    console.log(`   Value:  "${val}"`); // Print it (it's local terminal only)

    // Check for non-printable characters
    const charCodes = [];
    for (let i = 0; i < val.length; i++) {
        charCodes.push(val.charCodeAt(i));
    }

    console.log(`   Codes: [${charCodes.join(', ')}]`);

    const invisible = val.match(/[^\x20-\x7E]/g);
    if (invisible) {
        console.log(`   ⚠️ WARNING: Found ${invisible.length} non-printable characters!`);
    } else {
        console.log("   ✅ No invisible characters found.");
    }
});

if (process.env.CLOUDINARY_URL) {
    console.log("\n⚠️ WARNING: CLOUDINARY_URL is set! This might override individual keys.");
    console.log(`   Value: ${process.env.CLOUDINARY_URL}`);
}

console.log("\n--- END INSPECTION ---");
