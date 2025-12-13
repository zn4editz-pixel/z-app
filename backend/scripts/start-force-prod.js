#!/usr/bin/env node

// PRODUCTION STARTUP SCRIPT - SQLITE EDITION
// Switched to SQLite due to Neon connection limits.
// NOTE: On Render, this database is EPHEMERAL unless a Disk is mounted.

import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀  Starting Production Server (SQLite Mode)...");

// 1. Ensure we are using the SQLite schema
// The default 'prisma/schema.prisma' is ALREADY SQLite. 
// We just need to make sure we DO NOT overwrite it with the Postgres one.

const schemaPath = path.join(__dirname, "../prisma/schema.prisma");

// Check if schema exists, if not, something is wrong
if (!fs.existsSync(schemaPath)) {
    console.error("❌  schema.prisma not found!");
    process.exit(1);
}

// 2. Set DATABASE_URL for SQLite
// Render creates a persistent disk at /var/data if configured, or we use local.
// We'll default to a local file for now.
const dbPath = "file:./prod.db";
// Overwrite DATABASE_URL in the process env to ensure Prisma Client picks it up
// regardless of what's in the Render Dashboard variables.
process.env.DATABASE_URL = dbPath;
console.log(`✅  Forced DATABASE_URL to: ${dbPath}`);

// 3. Run Prisma Generate
console.log("🔄  Running Prisma Generate...");
try {
    execSync("npx prisma generate", { stdio: "inherit", env: process.env });
    console.log("✅  Prisma Generate Complete");
} catch (error) {
    console.error(`❌  Prisma Generate Failed: ${error.message}`);
}

// 4. Push Schema to Database (Ensure tables exist)
// Since we are using SQLite, we need to make sure the file has the tables.
console.log("📦  Pushing DB Schema...");
try {
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit", env: process.env });
    console.log("✅  Database Push Complete");
} catch (error) {
    console.error(`❌  DB Push Failed: ${error.message}`);
}

// 5. Start Server (Spawn new process with modified env)
console.log("🚀  Starting Node Server (Child Process)...");

const serverProcess = spawn("node", ["src/index.js"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: dbPath, NODE_ENV: 'production' }
});

serverProcess.on("close", (code) => {
    console.log(`Server process exited with code ${code}`);
    process.exit(code);
});
