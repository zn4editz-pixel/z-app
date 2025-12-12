import prisma from './src/lib/prisma.js';

async function checkTestUser() {
    try {
        const testUser = await prisma.user.findFirst({
            where: { username: 'test' },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                hasCompletedProfile: true
            }
        });
        
        if (testUser) {
            console.log('✅ Test user found:');
            console.log('   Username:', testUser.username);
            console.log('   Email:', testUser.email);
            console.log('   Full Name:', testUser.fullName);
            console.log('   Profile Complete:', testUser.hasCompletedProfile);
            console.log('\n💡 Try logging in with:');
            console.log('   Username: test');
            console.log('   Email: test@gmail.com');
            console.log('   Password: [original password from registration]');
        } else {
            console.log('❌ Test user not found');
            
            // Show available users
            const users = await prisma.user.findMany({
                select: {
                    username: true,
                    email: true,
                    fullName: true
                },
                take: 5
            });
            
            console.log('\n📋 Available users:');
            users.forEach(user => {
                console.log(`   - ${user.username} (${user.email}) - ${user.fullName}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkTestUser();