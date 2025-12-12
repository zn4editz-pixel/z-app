import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';

async function debugLoginIssue() {
    try {
        console.log('🔍 Debugging login issue...\n');
        
        // 1. Check all users in database
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                username: true,
                fullName: true,
                password: true
            }
        });
        
        console.log(`📊 Found ${users.length} users in database:`);
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.fullName} (${user.email})`);
            console.log(`   Username: ${user.username}`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
            console.log('');
        });
        
        // 2. Find admin user specifically
        const adminByEmail = await prisma.user.findUnique({
            where: { email: 'ronaldo@gmail.com' }
        });
        
        const adminByUsername = await prisma.user.findUnique({
            where: { username: 'admin' }
        });
        
        console.log('🔍 Admin user search results:');
        console.log('By email (ronaldo@gmail.com):', adminByEmail ? 'FOUND' : 'NOT FOUND');
        console.log('By username (admin):', adminByUsername ? 'FOUND' : 'NOT FOUND');
        
        if (adminByEmail) {
            console.log('\n✅ Admin user details:');
            console.log('Email:', adminByEmail.email);
            console.log('Username:', adminByEmail.username);
            console.log('Full Name:', adminByEmail.fullName);
            
            // Test different passwords
            const passwords = ['admin123', 'password', '123456', 'admin', 'ronaldo'];
            console.log('\n🔑 Testing passwords:');
            
            for (const pwd of passwords) {
                const isMatch = await bcrypt.compare(pwd, adminByEmail.password);
                console.log(`   "${pwd}": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
            }
            
            // Reset password to admin123
            console.log('\n🔧 Resetting password to "admin123"...');
            const newHash = await bcrypt.hash('admin123', 10);
            await prisma.user.update({
                where: { id: adminByEmail.id },
                data: { password: newHash }
            });
            
            // Verify new password
            const updatedUser = await prisma.user.findUnique({
                where: { id: adminByEmail.id }
            });
            const finalCheck = await bcrypt.compare('admin123', updatedUser.password);
            console.log(`✅ Password reset complete. "admin123" works: ${finalCheck}`);
        }
        
        // 3. Create a simple test user for easier login
        console.log('\n👤 Creating simple test user...');
        try {
            const testHash = await bcrypt.hash('test123', 10);
            const testUser = await prisma.user.create({
                data: {
                    fullName: 'Test User',
                    email: 'test@test.com',
                    username: 'test',
                    nickname: 'Test',
                    password: testHash,
                    profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
                    hasCompletedProfile: true,
                    country: 'Test Country',
                    countryCode: 'TC',
                    city: 'Test City'
                }
            });
            
            console.log('✅ Test user created:');
            console.log('   Email: test@test.com');
            console.log('   Username: test');
            console.log('   Password: test123');
            
        } catch (error) {
            if (error.message.includes('Unique constraint')) {
                console.log('ℹ️ Test user already exists');
                
                // Update existing test user password
                const existingTest = await prisma.user.findUnique({
                    where: { email: 'test@test.com' }
                });
                
                if (existingTest) {
                    const testHash = await bcrypt.hash('test123', 10);
                    await prisma.user.update({
                        where: { id: existingTest.id },
                        data: { password: testHash }
                    });
                    console.log('✅ Test user password updated to: test123');
                }
            } else {
                console.log('❌ Error creating test user:', error.message);
            }
        }
        
        console.log('\n🎉 Debug complete!');
        console.log('\n📝 LOGIN CREDENTIALS:');
        console.log('🔑 ADMIN:');
        console.log('   Email: ronaldo@gmail.com');
        console.log('   Password: admin123');
        console.log('');
        console.log('🔑 TEST USER:');
        console.log('   Email: test@test.com');
        console.log('   Username: test');
        console.log('   Password: test123');
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

debugLoginIssue();