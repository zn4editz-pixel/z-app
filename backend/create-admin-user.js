// 🚀 Create Admin User for SQLite Database
import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';

async function createAdminUser() {
    try {
        console.log('🚀 Creating admin user for SQLite database...');
        
        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: 'ronaldo@gmail.com' }
        });
        
        if (existingAdmin) {
            console.log('✅ Admin user already exists!');
            console.log('📧 Email:', existingAdmin.email);
            console.log('👤 Username:', existingAdmin.username);
            console.log('🔑 Password: safwan123');
            return;
        }
        
        // Create admin user
        const hashedPassword = await bcrypt.hash('safwan123', 12);
        
        const adminUser = await prisma.user.create({
            data: {
                fullName: 'Admin User',
                email: 'ronaldo@gmail.com',
                username: 'admin',
                nickname: 'Admin',
                password: hashedPassword,
                hasCompletedProfile: true,
                isVerified: true,
                country: 'United States',
                countryCode: 'US',
                city: 'New York',
                region: 'NY',
                timezone: 'America/New_York'
            }
        });
        
        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: ronaldo@gmail.com');
        console.log('🔑 Password: safwan123');
        console.log('👤 Username: admin');
        console.log('🆔 ID:', adminUser.id);
        
        // Create a test user for demo
        const testUser = await prisma.user.create({
            data: {
                fullName: 'Test User',
                email: 'test@example.com',
                username: 'testuser',
                nickname: 'Tester',
                password: hashedPassword,
                hasCompletedProfile: true,
                isVerified: false,
                country: 'Canada',
                countryCode: 'CA',
                city: 'Toronto',
                region: 'ON'
            }
        });
        
        console.log('✅ Test user created for demo!');
        console.log('📧 Test Email: test@example.com');
        console.log('🔑 Test Password: safwan123');
        
        console.log('\n🎉 DATABASE READY! Your project is alive!');
        console.log('🌟 Login to your beautiful golden admin panel:');
        console.log('   📧 ronaldo@gmail.com');
        console.log('   🔑 safwan123');
        
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminUser();