
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🛠️ STARTING INFRASTRUCTURE FIX...");

// 1. Overwrite .env
console.log("\n1️⃣  Restoring .env file...");
const envContent = `MONGODB_URI=mongodb+srv://z4fwan77:OCc9YMeaZxBf5gRi@cluster0.9rlfy9u.mongodb.net/chat_db?retryWrites=true&w=majority&appName=Cluster0
DATABASE_URL=postgresql://s4fwan_x:tZrL_-MUluvmSdrFNEy5rw@iron-orc-11183.jxf.gcp-europe-west3.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full

PORT=5002
JWT_SECRET=myscretkey
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=dsol2p21u
CLOUDINARY_API_KEY=455557543893756
CLOUDINARY_API_SECRET=MyvMZN6iRSisWvX5SL-tDMsWCv4
ADMIN_EMAIL=z4fwan77@gmail.com
EMAIL_USER=z4fwan77@gmail.com
EMAIL_PASS=adpl whrp rkmg glrv
ADMIN_USERNAME=admin
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
`;

const envPath = path.join(__dirname, '..', '.env');
try {
    // Try to force delete first
    try { if (fs.existsSync(envPath)) fs.unlinkSync(envPath); } catch (e) { console.log("   (Could not delete old .env, trying to overwrite)"); }
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log("   ✅ .env Restored (PORT=5002).");
} catch (error) {
    console.error("   ❌ Failed to write .env: " + error.message);
    console.error("   ⚠️  PLEASE STOP THE SERVER (npm run dev) AND TRY AGAIN.");
    process.exit(1);
}

// 2. Run Prisma Migration
console.log("\n2️⃣  Running Database Migration (CockroachDB)...");
try {
    console.log("   ⏳ Generating Prisma Client...");
    execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

    console.log("   ⏳ Pushing Schema to DB...");
    execSync('npx prisma db push', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log("   ✅ Database Ready!");
} catch (error) {
    console.error("   ❌ Migration Failed:");
    console.error(error.message);
    process.exit(1);
}

console.log("\n✅ ALL FIXED! You can now start the server: npm run dev");
