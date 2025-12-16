
import 'dotenv/config';

console.log("🔍 Checking Environment Variable Format...");

const keys = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
let hasIssues = false;

keys.forEach(key => {
    const val = process.env[key];
    if (!val) {
        console.log(`❌ ${key}: MISSING`);
        hasIssues = true;
        return;
    }

    const issues = [];
    if (val.startsWith(' ')) issues.push("Leading space");
    if (val.endsWith(' ')) issues.push("Trailing space");
    if (val.startsWith('"') || val.startsWith("'")) issues.push("Starts with quote");
    if (val.endsWith('"') || val.endsWith("'")) issues.push("Ends with quote");

    if (issues.length > 0) {
        console.log(`❌ ${key}: Has issues -> [${issues.join(', ')}]`);
        console.log(`   Current Value starts with: '${val.substring(0, 1)}' and ends with: '${val.substring(val.length - 1)}'`);
        hasIssues = true;
    } else {
        console.log(`✅ ${key}: Format looks clean (Len: ${val.length})`);
    }
});

if (hasIssues) {
    console.log("\n⚠️  ISSUES FOUND: Please open .env and remove spaces or quotes around values.");
} else {
    console.log("\n✅ No formatting issues found. If it still fails, the values themselves might be wrong.");
}
