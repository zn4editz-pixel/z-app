#!/usr/bin/env node

// ULTRA ROBUST FIX FOR RENDER DEPLOYMENT ISSUES
// 1. Force fix DATABASE_URL (append :5432 if missing)
// 2. Force fix missing '@' symbol (Correctly identifying the split between password and slug)
// 3. Force PRODUCTION schema copy
// 4. Run Prisma Generate
// 5. Start Server via Child Process

import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Fix DATABASE_URL
console.log("🛠️  Checking DATABASE_URL for common malformations...");
let dbUrl = process.env.DATABASE_URL;

if (dbUrl) {
    let modified = false;

    // FIX 1: Missing @ symbol check
    // Malformation: postgres://user:password-endpoint-pooler... (Missing @ separator)
    // Goal: postgres://user:password@endpoint-pooler...

    if (dbUrl.includes("postgresql://") && !dbUrl.includes("@")) {
        console.log("⚠️  Malformation detected: Missing '@' separator in DATABASE_URL!");

        // Improved Heuristic: Search for the Neon Endpoint Slug pattern (word-word-chars)
        // Pattern: [something]-[something]-[something]-pooler
        // Example: wispy-mud-a1h6xwvk-pooler
        const slugRegex = /([a-z]+-[a-z]+-[a-z0-9]+)-pooler/;
        const match = dbUrl.match(slugRegex);

        if (match) {
            // match[0] is like "wispy-mud-a1h6xwvk-pooler"
            // match[1] is like "wispy-mud-a1h6xwvk"
            const slugStart = dbUrl.indexOf(match[0]);

            // Check the character immediately preceding the slug start
            // If it's a hyphen, we assume that's the "missing @" spot
            if (slugStart > 0 && dbUrl[slugStart - 1] === '-') {
                console.log(`✅  Heuristic found split point at index ${slugStart - 1} (before '${match[1]}')`);

                // Reconstruct string: ...PasswordChars@EndpointSlug...
                const before = dbUrl.substring(0, slugStart - 1);
                const after = dbUrl.substring(slugStart); // Includes the slug and the rest
                dbUrl = before + "@" + after;

                modified = true;
                console.log("✅  Fixed missing '@' (Correctly placed before endpoint slug)");
            } else {
                console.log("⚠️  Could not safely determine split point for missing '@'.");
            }
        } else if (dbUrl.includes("-pooler.ap-southeast")) {
            // Fallback: If we can't find the slug pattern, but see pooler, 
            // we might be in a weird state. 
            // But previously we replaced -pooler with @pooler which was WRONG.
            // Better to do nothing than break it further if we aren't sure.
            console.log("⚠️  detected '-pooler' but seemingly invalid slug structure. Skipping auto-fix to avoid host corruption.");
        }
    }

    // FIX 2: Missing Port
    if (dbUrl.includes("neon.tech") && !dbUrl.includes("neon.tech:5432")) {
        console.log("⚠️  Missing port detected!");
        dbUrl = dbUrl.replace("neon.tech", "neon.tech:5432");
        modified = true;
        console.log("✅  Fixed DATABASE_URL (added :5432)");
    }

    if (modified) {
        process.env.DATABASE_URL = dbUrl;
        console.log("🔗  Final URL Structure (masked): " + dbUrl.replace(/:[^:@]*@/, ":****@"));
    } else {
        console.log("✅  DATABASE_URL looks okay (or could not be safely auto-patched).");
    }
} else {
    console.log("⚠️  DATABASE_URL is MISSING or empty.");
}

// 2. Force Schema Copy
const schemaPath = path.join(__dirname, "../prisma/schema.prisma");
const productionSchemaPath = path.join(__dirname, "../prisma/schema.production.prisma");

if (fs.existsSync(productionSchemaPath)) {
    try {
        fs.copyFileSync(productionSchemaPath, schemaPath);
        console.log("✅  Copied schema.production.prisma -> schema.prisma");
    } catch (e) {
        console.error("⚠️ Failed to copy schema:", e.message);
    }
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
