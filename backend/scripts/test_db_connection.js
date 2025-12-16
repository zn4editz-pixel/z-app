
import { PrismaClient } from '@prisma/client';

console.log("🛠️ Testing Database Connection...");
console.log("   URL:", process.env.DATABASE_URL ? "Defined (Hidden)" : "MISSING");

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    try {
        console.log("   ⏳ Connecting to Prisma...");
        await prisma.$connect();
        console.log("   ✅ Connected!");

        console.log("   ⏳ Running test query (User count)...");
        const count = await prisma.user.count();
        console.log(`   ✅ Query Successful! User count: ${count}`);
    } catch (e) {
        console.error("\n❌ CONNECTION ERROR:");
        console.error(e);
        console.error("\n💡 ANALYSIS:");
        if (e.message.includes("certificate")) {
            console.log("   -> SSL/Certificate Error. Try changing 'sslmode=verify-full' to 'sslmode=require' or 'sslmode=no-verify' in .env");
        } else if (e.message.includes("does not exist")) {
            console.log("   -> Database/Table not found. You need to run 'npx prisma db push'");
        } else if (e.message.includes("Authentication failed")) {
            console.log("   -> Wrong Password/User in DATABASE_URL.");
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
