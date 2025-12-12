import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';

async function restoreOriginalAdmin() {
    try {
        console.log('🔧 RESTORING YOUR ORIGINAL ADMIN USER...\n');
        
        // 1. Delete the new admin I created
        console.log('🗑️ Removing the admin I created...');
        await prisma.user.deleteMany({
            where: { email: 'admin@admin.com' }
        });
        console.log('✅ Removed temporary admin');
        
        // 2. Restore your original admin user exactly as you want
        console.log('\n👤 Restoring YOUR original admin user...');
        const yourPassword = 'admin123'; // You can change this to whatever you want
        const hashedPassword = await bcrypt.hash(yourPassword, 10);
        
        const originalAdmin = await prisma.user.create({
            data: {
                fullName: 'Admin User',
                email: 'ronaldo@gmail.com',
                username: 'ronaldo',
                nickname: 'Ronaldo',
                password: hashedPassword,
                profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ronaldo',
                hasCompletedProfile: true,
                country: 'Admin Country',
                countryCode: 'AD',
                city: 'Admin City'
            }
        });
        
        console.log('✅ YOUR original admin user restored!');
        console.log('ID:', originalAdmin.id);
        console.log('Email:', originalAdmin.email);
        console.log('Username:', originalAdmin.username);
        
        // 3. Test the password
        console.log('\n🔑 Testing YOUR password...');
        const isPasswordCorrect = await bcrypt.compare(yourPassword, originalAdmin.password);
        console.log('Password test result:', isPasswordCorrect ? '✅ WORKS PERFECTLY' : '❌ FAILED');
        
        console.log('\n🎉 YOUR ORIGINAL ADMIN RESTORED!');
        console.log('\n📝 YOUR ORIGINAL LOGIN CREDENTIALS:');
        console.log('🔑 Username: ronaldo');
        console.log('🔑 Email: ronaldo@gmail.com');
        console.log('🔑 Password: admin123');
        console.log('\nSorry for the confusion - your original admin is back!');
        
    } catch (error) {
        console.error('❌ Error restoring original admin:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

restoreOriginalAdmin();