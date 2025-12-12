import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';

async function testRonaldoLogin() {
    try {
        console.log('🔑 TESTING YOUR ORIGINAL ADMIN LOGIN...\n');
        
        // Find the ronaldo user
        const ronaldoUser = await prisma.user.findUnique({
            where: { username: 'ronaldo' }
        });
        
        if (!ronaldoUser) {
            console.log('❌ Ronaldo user not found');
            return;
        }
        
        console.log('✅ Found your original admin user:');
        console.log(`   Name: ${ronaldoUser.fullName}`);
        console.log(`   Email: ${ronaldoUser.email}`);
        console.log(`   Username: ${ronaldoUser.username}`);
        console.log(`   ID: ${ronaldoUser.id}`);
        console.log(`   Profile Pic: ${ronaldoUser.profilePic ? 'Yes' : 'No'}`);
        
        // Test different possible passwords
        const possiblePasswords = [
            'admin123',
            'ronaldo123',
            'password',
            '123456',
            'admin',
            'ronaldo'
        ];
        
        console.log('\n🔍 Testing possible passwords...');
        
        for (const password of possiblePasswords) {
            try {
                const isMatch = await bcrypt.compare(password, ronaldoUser.password);
                if (isMatch) {
                    console.log(`✅ PASSWORD FOUND: "${password}"`);
                    console.log('\n🎉 YOUR ORIGINAL ADMIN LOGIN CREDENTIALS:');
                    console.log('==========================================');
                    console.log(`🔑 Username: ${ronaldoUser.username}`);
                    console.log(`🔑 Email: ${ronaldoUser.email}`);
                    console.log(`🔑 Password: ${password}`);
                    console.log('\n✅ You can now login with these credentials!');
                    return;
                }
            } catch (error) {
                console.log(`   ❌ Error testing password "${password}": ${error.message}`);
            }
        }
        
        console.log('\n⚠️ None of the common passwords worked.');
        console.log('Let me reset the password to "admin123" for you...');
        
        // Reset password to admin123
        const newPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await prisma.user.update({
            where: { id: ronaldoUser.id },
            data: { password: hashedPassword }
        });
        
        console.log('\n✅ PASSWORD RESET SUCCESSFUL!');
        console.log('🎉 YOUR UPDATED ADMIN LOGIN CREDENTIALS:');
        console.log('=========================================');
        console.log(`🔑 Username: ${ronaldoUser.username}`);
        console.log(`🔑 Email: ${ronaldoUser.email}`);
        console.log(`🔑 Password: ${newPassword}`);
        console.log('\n✅ You can now login with these credentials!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testRonaldoLogin();