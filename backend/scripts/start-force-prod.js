#!/usr/bin/env node

// HARDCORE FIX FOR RENDER DEPLOYMENT ISSUES
// 1. Force fix DATABASE_URL (append :5432 if missing)
// 2. Force PRODUCTION schema copy
// 3. Run Prisma Generate
// 4. Start Server

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Fix DATABASE_URL
console.log("🛠️  Checking DATABASE_URL...");
let dbUrl = process.env.DATABASE_URL;

if (dbUrl && dbUrl.includes("neon.tech") && !dbUrl.includes("neon.tech:5432")) {
    console.log("⚠️  Missing port detected in DATABASE_URL!");
    dbUrl = dbUrl.replace("neon.tech", "neon.tech:5432");
    process.env.DATABASE_URL = dbUrl;
    console.log("✅  Fixed DATABASE_URL (added :5432)");
} else {
    console.log("✅  DATABASE_URL looks okay (or is missing).");
}

// 2. Force Schema Copy
const schemaPath = path.join(__dirname, "../prisma/schema.prisma");
const productionSchemaPath = path.join(__dirname, "../prisma/schema.production.prisma");

if (fs.existsSync(productionSchemaPath)) {
    fs.copyFileSync(productionSchemaPath, schemaPath);
    console.log("✅  Copied schema.production.prisma -> schema.prisma");
} else {
    console.error("❌  schema.production.prisma NOT FOUND!");
    process.exit(1);
}

// 3. Run Prisma Generate
console.log("🔄  Running Prisma Generate...");
try {
    // Pass the modified env to the child process
    execSync("npx prisma generate", { stdio: "inherit", env: process.env });
    console.log("✅  Prisma Generate Complete");
} catch (error) {
    console.error(`❌  Prisma Generate Failed: ${error.message}`);
    process.exit(1);
}

// 4. Start Server
console.log("🚀  Starting Node Server...");
import("../src/index.js").catch(err => {
    console.error("❌  Server Start Failed:", err);
    process.exit(1);
});
