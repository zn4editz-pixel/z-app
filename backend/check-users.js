import prisma from './src/lib/prisma.js';

async function checkUsers() {
    try {
        console.log('🔍 Checking your database...\n');
        
        const users = await prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                email: true,
                username: true,
                createdAt: true,
                isVerified: true,
                hasCompletedProfile: true
            }
        });
        
        console.log(`📊 TOTAL USERS FOUND: ${users.length}\n`);
        
        if (users.length > 0) {
            console.log('👥 YOUR USERS:');
            console.log('================');
            users.forEach((user, i) => {
                console.log(`${i+1}. ${user.fullName}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Username: ${user.username}`);
                console.log(`   Created: ${new Date(user.createdAt).toLocaleDateString()}`);
                console.log(`   Verified: ${user.isVerified ? '✅' : '❌'}`);
                console.log(`   Profile Complete: ${user.hasCompletedProfile ? '✅' : '❌'}`);
                console.log('   ---');
            });
        } else {
            console.log('❌ No users found in database');
        }
        
        // Check messages
        const messageCount = await prisma.message.count();
        console.log(`💬 TOTAL MESSAGES: ${messageCount}`);
        
        // Check friend requests
        const friendRequestCount = await prisma.friendRequest.count();
        console.log(`🤝 FRIEND REQUESTS: ${friendRequestCount}`);
        
    } catch (error) {
        console.error('❌ Error checking database:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();