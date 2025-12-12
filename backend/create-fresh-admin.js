import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';

async function createFreshAdmin() {
    try {
        console.log('🔧 Creating fresh admin user...\n');
        
        // 1. Delete existing admin user
        console.log('🗑️ Removing existing admin user...');
        try {
            await prisma.user.deleteMany({
                where: {
                    OR: [
                        { email: 'ronaldo@gmail.com' },
                        { username: 'admin' }
                    ]
                }
            });
            console.log('✅ Existing admin user removed');
        } catch (error) {
            console.log('ℹ️ No existing admin user found');
        }
        
        // 2. Create completely fresh admin user
        console.log('\n👤 Creating new admin user...');
        const adminPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        const adminUser = await prisma.user.create({
            data: {
                fullName: 'Admin User',
                email: 'admin@admin.com',
                username: 'admin',
                nickname: 'Admin',
                password: hashedPassword,
                profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
                hasCompletedProfile: true,
                country: 'Admin Country',
                countryCode: 'AD',
                city: 'Admin City'
            }
        });
        
        console.log('✅ Fresh admin user created!');
        console.log('ID:', adminUser.id);
        console.log('Email:', adminUser.email);
        console.log('Username:', adminUser.username);
        
        // 3. Test the password immediately
        console.log('\n🔑 Testing password...');
        const isPasswordCorrect = await bcrypt.compare(adminPassword, adminUser.password);
        console.log('Password test result:', isPasswordCorrect ? '✅ WORKS' : '❌ FAILED');
        
        // 4. Create a simple test user too
        console.log('\n👤 Creating simple test user...');
        try {
            const testPassword = 'test123';
            const testHashedPassword = await bcrypt.hash(testPassword, 10);
            
            const testUser = await prisma.user.create({
                data: {
                    fullName: 'Test User',
                    email: 'test@test.com',
                    username: 'test',
                    nickname: 'Test',
                    password: testHashedPassword,
                    profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
                    hasCompletedProfile: true,
                    country: 'Test Country',
                    countryCode: 'TC',
                    city: 'Test City'
                }
            });
            
            console.log('✅ Test user created!');
            console.log('Email:', testUser.email);
            console.log('Username:', testUser.username);
            
            // Test this password too
            const isTestPasswordCorrect = await bcrypt.compare(testPassword, testUser.password);
            console.log('Test password result:', isTestPasswordCorrect ? '✅ WORKS' : '❌ FAILED');
            
        } catch (error) {
            if (error.message.includes('Unique constraint')) {
                console.log('ℹ️ Test user already exists, skipping...');
            } else {
                console.log('❌ Error creating test user:', error.message);
            }
        }
        
        // 5. Show all users in database
        console.log('\n📊 All users in database:');
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                username: true,
                fullName: true
            }
        });
        
        allUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.fullName} (${user.email}) - Username: ${user.username}`);
        });
        
        console.log('\n🎉 Fresh admin setup complete!');
        console.log('\n📝 NEW LOGIN CREDENTIALS:');
        console.log('🔑 ADMIN (Fresh):');
        console.log('   Email: admin@admin.com');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('');
        console.log('🔑 TEST USER:');
        console.log('   Email: test@test.com');
        console.log('   Username: test');
        console.log('   Password: test123');
        
    } catch (error) {
        console.error('❌ Error creating fresh admin:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createFreshAdmin();