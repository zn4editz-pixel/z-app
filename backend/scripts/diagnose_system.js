
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function diagnose() {
    console.log("🏥 SYSTEM DIAGNOSIS STARTED\n");

    let hasError = false;

    // 1. Check Env Vars
    console.log("1️⃣  Environment Variables:");
    const required = ['DATABASE_URL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'PORT'];
    for (const key of required) {
        if (!process.env[key]) {
            console.error(`   ❌ Missing ${key}`);
            hasError = true;
        } else {
            console.log(`   ✅ ${key} is set.`);
        }
    }

    if (process.env.PORT !== '5002') {
        console.warn(`   ⚠️  PORT is ${process.env.PORT}, but Frontend likely expects 5002.`);
    } else {
        console.log(`   ✅ PORT matches Frontend expectation (5002).`);
    }

    // 2. Check Database
    console.log("\n2️⃣  Database Connection:");
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        console.log("   ✅ Prisma connected to Database!");
        const count = await prisma.user.count();
        console.log(`   ✅ User count query successful (${count} users).`);
    } catch (e) {
        console.error("   ❌ DB Connection FAILED:");
        console.error("      " + e.message.split('\n')[0]);
        hasError = true;
    } finally {
        await prisma.$disconnect();
    }

    // 3. Check Cloudinary
    console.log("\n3️⃣  Cloudinary Connection:");
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    try {
        const result = await cloudinary.api.ping();
        console.log("   ✅ Cloudinary Ping Successful: " + result.status);
    } catch (e) {
        console.error("   ❌ Cloudinary FAILED:");
        console.error("      " + e.message);
        hasError = true;
    }

    console.log("\n--------------------------------");
    if (hasError) {
        console.log("❌ DIAGNOSIS FAILED. See errors above.");
        process.exit(1);
    } else {
        console.log("✅ SYSTEM IS HEALTHY. PLEASE RESTART SERVERS.");
        process.exit(0);
    }
}

diagnose();
