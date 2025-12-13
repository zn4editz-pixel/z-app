#!/usr/bin/env node

// SUPER ROBUST FIX FOR RENDER DEPLOYMENT ISSUES
// 1. Force fix DATABASE_URL (append :5432 if missing)
// 2. Force PRODUCTION schema copy
// 3. Run Prisma Generate
// 4. Start Server via Child Process

import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Fix DATABASE_URL
console.log("🛠️  Checking DATABASE_URL...");
let dbUrl = process.env.DATABASE_URL;

if (dbUrl) {
    if (dbUrl.includes("neon.tech") && !dbUrl.includes("neon.tech:5432")) {
        console.log("⚠️  Missing port detected in DATABASE_URL!");
        // Force injection of port :5432
        dbUrl = dbUrl.replace("neon.tech", "neon.tech:5432");
        process.env.DATABASE_URL = dbUrl;
        console.log("✅  Fixed DATABASE_URL (added :5432)");
    } else if (!dbUrl.includes(":5432") && dbUrl.startsWith("postgres")) {
        // Fallback for non-neon URLs, try to find host and inject port
        console.log("⚠️  Potential missing port detected (generic check).");
    } else {
        console.log("✅  DATABASE_URL looks okay (has port or is not neon.tech).");
    }
} else {
    console.log("⚠️  DATABASE_URL is MISSING or empty.");
}

// 2. Force Schema Copy
const schemaPath = path.join(__dirname, "../prisma/schema.prisma");
const productionSchemaPath = path.join(__dirname, "../prisma/schema.production.prisma");

if (fs.existsSync(productionSchemaPath)) {
    fs.copyFileSync(productionSchemaPath, schemaPath);
    console.log("✅  Copied schema.production.prisma -> schema.prisma");
} else {
    console.error("❌  schema.production.prisma NOT FOUND! Proceeding with existing schema...");
}

// 3. Run Prisma Generate
console.log("🔄  Running Prisma Generate...");
try {
    execSync("npx prisma generate", { stdio: "inherit", env: process.env });
    console.log("✅  Prisma Generate Complete");
} catch (error) {
    console.error(`❌  Prisma Generate Failed: ${error.message}`);
    // Don't exit, might still work if previously generated
}

// 4. Start Server (Spawn new process with modified env)
console.log("🚀  Starting Node Server (Child Process)...");

const serverProcess = spawn("node", ["src/index.js"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: dbUrl } // Explicitly pass fixed env
});

serverProcess.on("close", (code) => {
    console.log(`Server process exited with code ${code}`);
    process.exit(code);
});
