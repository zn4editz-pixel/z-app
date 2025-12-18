import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    console.log("Database URL:", process.env.DATABASE_URL ? "Set" : "Not Set");
    if (process.env.DATABASE_URL) {
        try {
            const url = new URL(process.env.DATABASE_URL);
            console.log("Database Protocol:", url.protocol);
        } catch (e) {
            console.log("Database URL is invalid or not parseable as URL");
        }
    }
    try {
        console.log("Attempting to connect to database...");
        await prisma.$connect();
        console.log("✅ Successfully connected to database.");

        // Try a simple query
        const count = await prisma.user.count();
        console.log(`✅ Query successful. User count: ${count}`);
    } catch (error) {
        console.error("❌ Database connection failed:");
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
