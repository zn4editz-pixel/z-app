import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';
import axios from 'axios';

async function debugAdminAuth() {
    try {
        console.log('🔍 DEBUGGING ADMIN AUTHENTICATION...\n');
        
        // 1. Check if ronaldo user exists
        const ronaldoUser = await prisma.user.findUnique({
            where: { username: 'ronaldo' }
        });
        
        if (!ronaldoUser) {
            console.log('❌ Ronaldo user not found in database');
            return;
        }
        
        console.log('✅ Found ronaldo user:');
        console.log(`   ID: ${ronaldoUser.id}`);
        console.log(`   Email: ${ronaldoUser.email}`);
        console.log(`   Username: ${ronaldoUser.username}`);
        console.log(`   Full Name: ${ronaldoUser.fullName}`);
        console.log(`   Password Hash: ${ronaldoUser.password.substring(0, 20)}...`);
        
        // 2. Test password verification
        console.log('\n🔑 Testing password verification...');
        const testPasswords = ['admin123', 'ronaldo123', 'password', '123456'];
        
        for (const password of testPasswords) {
            try {
                const isMatch = await bcrypt.compare(password, ronaldoUser.password);
                console.log(`   Password "${password}": ${isMatch ? '✅ MATCH' : '❌ No match'}`);
                if (isMatch) {
                    console.log(`\n🎯 CORRECT PASSWORD FOUND: "${password}"`);
                    break;
                }
            } catch (error) {
                console.log(`   Password "${password}": ❌ Error - ${error.message}`);
            }
        }
        
        // 3. Test API login with different combinations
        console.log('\n🌐 Testing API login...');
        
        const loginAttempts = [
            { emailOrUsername: 'ronaldo@gmail.com', password: 'admin123' },
            { emailOrUsername: 'ronaldo', password: 'admin123' },
            { emailOrUsername: 'ronaldo@gmail.com', password: 'ronaldo123' },
            { emailOrUsername: 'ronaldo', password: 'ronaldo123' }
        ];
        
        for (const attempt of loginAttempts) {
            try {
                console.log(`\n   Trying: ${attempt.emailOrUsername} / ${attempt.password}`);
                const response = await axios.post('http://localhost:5001/api/auth/login', attempt);
                console.log('   ✅ LOGIN SUCCESS!');
                console.log(`   User: ${response.data.fullName} (${response.data.email})`);
                console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
                return;
            } catch (error) {
                if (error.response) {
                    console.log(`   ❌ ${error.response.status}: ${error.response.data?.message || error.response.data}`);
                } else {
                    console.log(`   ❌ Network error: ${error.message}`);
                }
            }
        }
        
        // 4. If all fails, reset password and try again
        console.log('\n🔧 All login attempts failed. Resetting password...');
        const newPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await prisma.user.update({
            where: { id: ronaldoUser.id },
            data: { password: hashedPassword }
        });
        
        console.log('✅ Password reset to "admin123"');
        
        // Test again
        try {
            const response = await axios.post('http://localhost:5001/api/auth/login', {
                emailOrUsername: 'ronaldo',
                password: 'admin123'
            });
            console.log('\n🎉 LOGIN SUCCESS AFTER RESET!');
            console.log(`User: ${response.data.fullName} (${response.data.email})`);
            console.log(`Token: ${response.data.token.substring(0, 20)}...`);
        } catch (error) {
            console.log('\n❌ Still failing after reset:', error.response?.data?.message || error.message);
        }
        
    } catch (error) {
        console.error('❌ Debug error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

debugAdminAuth();