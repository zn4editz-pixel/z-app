import prisma from './src/lib/prisma.js';

async function clearOldAuthData() {
    try {
        console.log('🧹 Clearing old authentication data from all database migrations...\n');
        
        // 1. Check current database state
        console.log('📊 Current database state:');
        const userCount = await prisma.user.count();
        const messageCount = await prisma.message.count();
        const friendRequestCount = await prisma.friendRequest.count();
        
        console.log(`   Users: ${userCount}`);
        console.log(`   Messages: ${messageCount}`);
        console.log(`   Friend Requests: ${friendRequestCount}`);
        
        // 2. Find users with MongoDB-style IDs (24 hex characters)
        const mongoUsers = await prisma.user.findMany({
            where: {
                id: {
                    // MongoDB ObjectIds are 24 hex characters
                    contains: ''
                }
            },
            select: {
                id: true,
                email: true,
                username: true,
                fullName: true
            }
        });
        
        console.log(`\n🔍 Found ${mongoUsers.length} users in database:`);
        mongoUsers.forEach(user => {
            const isMongoId = user.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(user.id);
            console.log(`   ${user.fullName || user.username} (${user.email}) - ID: ${user.id} ${isMongoId ? '[MONGO ID]' : '[NEW ID]'}`);
        });
        
        // 3. Check for admin user
        const adminEmail = process.env.ADMIN_EMAIL || 'ronaldo@gmail.com';
        const adminUser = await prisma.user.findUnique({
            where: { email: adminEmail }
        });
        
        if (adminUser) {
            console.log(`\n✅ Admin user found: ${adminUser.fullName} (${adminUser.email})`);
            console.log(`   Admin ID: ${adminUser.id}`);
        } else {
            console.log(`\n❌ Admin user not found with email: ${adminEmail}`);
            console.log('   Creating admin user...');
            
            const bcrypt = await import('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            const newAdmin = await prisma.user.create({
                data: {
                    fullName: 'Admin User',
                    email: adminEmail,
                    username: 'admin',
                    nickname: 'Admin',
                    password: hashedPassword,
                    profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
                    hasCompletedProfile: true,
                    country: 'Unknown',
                    countryCode: 'XX',
                    city: 'Unknown'
                }
            });
            
            console.log(`   ✅ Admin user created: ${newAdmin.id}`);
        }
        
        // 4. Test database operations
        console.log('\n🧪 Testing database operations...');
        
        // Test user creation
        try {
            const testUser = await prisma.user.create({
                data: {
                    fullName: 'Test User',
                    email: 'test@example.com',
                    username: 'testuser',
                    nickname: 'Test',
                    password: 'hashedpassword',
                    profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
                    hasCompletedProfile: true,
                    country: 'Test Country',
                    countryCode: 'TC',
                    city: 'Test City'
                }
            });
            
            console.log(`   ✅ User creation test passed: ${testUser.id}`);
            
            // Clean up test user
            await prisma.user.delete({ where: { id: testUser.id } });
            console.log(`   🧹 Test user cleaned up`);
            
        } catch (error) {
            console.log(`   ❌ User creation test failed: ${error.message}`);
        }
        
        // 5. Show final state
        console.log('\n📊 Final database state:');
        const finalUserCount = await prisma.user.count();
        console.log(`   Total users: ${finalUserCount}`);
        
        console.log('\n🎉 Database analysis complete!');
        console.log('\n📝 RECOMMENDATIONS:');
        console.log('   1. Clear browser localStorage to remove old auth tokens');
        console.log('   2. Create new user accounts for testing');
        console.log('   3. Use the admin account for admin panel access');
        console.log(`   4. Admin login: ${adminEmail} / admin123`);
        
    } catch (error) {
        console.error('❌ Error analyzing database:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

clearOldAuthData();