import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';

async function createTestUsers() {
    console.log('🔧 Creating test users...');
    
    try {
        // Create test users
        const hashedPassword = await bcrypt.hash('password123', 12);
        
        const users = [
            {
                fullName: 'Test User',
                email: 'test@example.com',
                username: 'test',
                password: hashedPassword,
                hasCompletedProfile: true,
                profilePic: 'https://randomuser.me/api/portraits/men/1.jpg'
            },
            {
                fullName: 'Muhammed Safwan',
                email: 's4fwan@example.com',
                username: 's4fwan_x',
                password: hashedPassword,
                hasCompletedProfile: true,
                profilePic: 'https://randomuser.me/api/portraits/men/2.jpg'
            },
            {
                fullName: 'Admin User',
                email: 'ronaldo@gmail.com',
                username: 'admin',
                password: hashedPassword,
                hasCompletedProfile: true,
                profilePic: 'https://randomuser.me/api/portraits/men/3.jpg'
            }
        ];
        
        for (const userData of users) {
            await prisma.user.upsert({
                where: { email: userData.email },
                update: userData,
                create: userData
            });
            console.log(`✅ Created user: ${userData.fullName} (@${userData.username})`);
        }
        
        console.log('🎉 Test users created successfully!');
        
    } catch (error) {
        console.error('❌ Error creating test users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestUsers();