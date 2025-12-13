#!/usr/bin/env node

// PRODUCTION STARTUP SCRIPT - COCKROACHDB EDITION
// Updated to support CockroachDB Serverless.

import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀  Starting Production Server (CockroachDB Mode)...");

// 1. Check DATABASE_URL
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("❌  DATABASE_URL is missing! Please set it in Render Dashboard.");
    process.exit(1);
}

if (!dbUrl.includes("cockroachlabs.cloud")) {
    console.warn("⚠️  DATABASE_URL does not look like a CockroachDB URL. Proceeding anyway...");
}

// 2. FORCE Production Schema (CockroachDB)
// We copy prisma/schema.production.prisma -> prisma/schema.prisma
const prodSchemaPath = path.join(__dirname, "../prisma/schema.production.prisma");
const targetSchemaPath = path.join(__dirname, "../prisma/schema.prisma");

try {
    console.log("📄  Copying schema.production.prisma -> schema.prisma...");
    fs.copyFileSync(prodSchemaPath, targetSchemaPath);
    console.log("✅  Schema updated for CockroachDB.");
} catch (error) {
    console.error(`❌  Failed to copy schema: ${error.message}`);
    process.exit(1);
}

// 3. Run Prisma Generate
console.log("🔄  Running Prisma Generate...");
try {
    execSync("npx prisma generate", { stdio: "inherit", env: process.env });
    console.log("✅  Prisma Generate Complete");
} catch (error) {
    console.error(`❌  Prisma Generate Failed: ${error.message}`);
    // We don't exit here, sometimes it's just a warning
}

// 4. Push Schema to Database
// Using 'db push' is best for Serverless/Prototyping to ensure tables exist without complex migrations
console.log("📦  Pushing DB Schema to CockroachDB...");
try {
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit", env: process.env });
    console.log("✅  Database Push Complete");
} catch (error) {
    console.error(`❌  DB Push Failed: ${error.message}`);
    console.error("👉  Check your DATABASE_URL and ensure the cluster is active.");
}

// 5. Start Server
console.log("🚀  Starting Node Server...");
const serverProcess = spawn("node", ["src/index.js"], {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: 'production' }
});

serverProcess.on("close", (code) => {
    console.log(`Server process exited with code ${code}`);
    process.exit(code);
});
