const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
    try {
        console.log('🧪 Testing database connection...');
        
        // Test connection
        await prisma.$connect();
        console.log('✅ Database connection successful!');
        
        // Count records
        const userCount = await prisma.user.count();
        const messageCount = await prisma.message.count();
        const reportCount = await prisma.report.count();
        const notificationCount = await prisma.adminNotification.count();
        
        console.log('📊 Database Statistics:');
        console.log(`   👥 Users: ${userCount}`);
        console.log(`   💬 Messages: ${messageCount}`);
        console.log(`   📋 Reports: ${reportCount}`);
        console.log(`   🔔 Notifications: ${notificationCount}`);
        
        // Test admin user
        const adminUser = await prisma.user.findUnique({
            where: { email: 'ronaldo@gmail.com' }
        });
        
        if (adminUser) {
            console.log('✅ Admin user found:');
            console.log(`   📧 Email: ${adminUser.email}`);
            console.log(`   👤 Username: ${adminUser.username}`);
            console.log(`   ✅ Verified: ${adminUser.isVerified}`);
        } else {
            console.log('❌ Admin user not found!');
        }
        
        console.log('🎉 Database test completed successfully!');
        
    } catch (error) {
        console.error('❌ Database test failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run test
testDatabase()
    .then(() => {
        console.log('✅ All tests passed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });