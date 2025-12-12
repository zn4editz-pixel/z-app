import prisma from './src/lib/prisma.js';

async function checkRecoveredUsers() {
    try {
        const users = await prisma.user.findMany();
        console.log('🎉 RECOVERED USERS:');
        console.log('==================');
        
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.fullName} (${user.email})`);
            console.log(`   Username: ${user.username}`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Profile Pic: ${user.profilePic ? 'Yes' : 'No'}`);
            console.log(`   Country: ${user.country}`);
            console.log('   ---');
        });
        
        console.log(`\n📊 Total users recovered: ${users.length}`);
        
        // Look for admin users
        const adminUsers = users.filter(u => 
            u.username?.toLowerCase().includes('admin') || 
            u.username?.toLowerCase().includes('ronaldo') ||
            u.email?.toLowerCase().includes('admin') ||
            u.email?.toLowerCase().includes('ronaldo')
        );
        
        if (adminUsers.length > 0) {
            console.log('\n👑 POTENTIAL ADMIN USERS:');
            adminUsers.forEach(admin => {
                console.log(`   ${admin.fullName} (${admin.email}) - Username: ${admin.username}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkRecoveredUsers();