import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function testAdminLogin() {
    try {
        console.log('🔍 Testing admin login credentials...\n');
        
        // Open SQLite database
        const db = await open({
            filename: './dev.db',
            driver: sqlite3.Database
        });
        
        const testEmail = 'z4fwan77@gmail.com';
        const testPassword = 'admin123';
        
        console.log(`📧 Testing email: ${testEmail}`);
        console.log(`🔑 Testing password: ${testPassword}`);
        
        // Find user by email
        const userByEmail = await db.get('SELECT * FROM User WHERE email = ?', [testEmail]);
        
        if (!userByEmail) {
            console.log('❌ User not found by email');
            
            // Try to find by username
            const userByUsername = await db.get('SELECT * FROM User WHERE username = ?', ['admin']);
            if (userByUsername) {
                console.log('✅ Found user by username:', userByUsername.username);
                console.log('   Email:', userByUsername.email);
            } else {
                console.log('❌ User not found by username either');
            }
            return;
        }
        
        console.log('✅ User found by email:');
        console.log(`   ID: ${userByEmail.id}`);
        console.log(`   Email: ${userByEmail.email}`);
        console.log(`   Username: ${userByEmail.username}`);
        console.log(`   Full Name: ${userByEmail.fullName}`);
        console.log(`   Profile Complete: ${userByEmail.hasCompletedProfile}`);
        console.log(`   Verified: ${userByEmail.isVerified}`);
        
        // Test password
        const isPasswordValid = await bcrypt.compare(testPassword, userByEmail.password);
        console.log(`\n🔑 Password test: ${isPasswordValid ? '✅ VALID' : '❌ INVALID'}`);
        
        if (!isPasswordValid) {
            console.log('\n🔧 Fixing password...');
            const hashedPassword = await bcrypt.hash(testPassword, 10);
            await db.run('UPDATE User SET password = ? WHERE id = ?', [hashedPassword, userByEmail.id]);
            
            // Test again
            const retestPassword = await bcrypt.compare(testPassword, hashedPassword);
            console.log(`   Retest: ${retestPassword ? '✅ FIXED' : '❌ STILL BROKEN'}`);
        }
        
        // Check if user is blocked or suspended
        if (userByEmail.isBlocked) {
            console.log('⚠️  User is BLOCKED');
        }
        if (userByEmail.isSuspended) {
            console.log('⚠️  User is SUSPENDED');
        }
        
        await db.close();
        
        console.log('\n🎯 LOGIN TEST SUMMARY:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 Email: ${testEmail}`);
        console.log(`🔑 Password: ${testPassword}`);
        console.log(`✅ User exists: ${userByEmail ? 'Yes' : 'No'}`);
        console.log(`🔐 Password valid: ${isPasswordValid ? 'Yes' : 'Fixed'}`);
        console.log(`🚫 Blocked: ${userByEmail.isBlocked ? 'Yes' : 'No'}`);
        console.log(`⏸️  Suspended: ${userByEmail.isSuspended ? 'Yes' : 'No'}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
    } catch (error) {
        console.error('❌ Error testing admin login:', error);
    }
}

testAdminLogin();