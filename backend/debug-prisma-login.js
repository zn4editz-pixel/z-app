import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function debugPrismaLogin() {
    try {
        console.log('🔍 Debugging Prisma login process...\n');
        
        const emailOrUsername = 'z4fwan77@gmail.com';
        const password = 'admin123';
        
        console.log(`📧 Looking for user: ${emailOrUsername}`);
        
        // Step 1: Try to find user by email (same as auth controller)
        let user = await prisma.user.findUnique({
            where: { email: emailOrUsername }
        });
        
        console.log('🔍 User by email:', user ? 'Found' : 'Not found');
        
        if (!user) {
            // Step 2: Try by username
            user = await prisma.user.findUnique({
                where: { username: emailOrUsername.toLowerCase() }
            });
            console.log('🔍 User by username:', user ? 'Found' : 'Not found');
        }
        
        if (!user) {
            console.log('❌ User not found in Prisma query');
            
            // Let's see all users in the database
            const allUsers = await prisma.user.findMany({
                select: { id: true, email: true, username: true, fullName: true }
            });
            console.log('\n📋 All users in database:');
            allUsers.forEach((u, i) => {
                console.log(`   ${i + 1}. ${u.fullName} (${u.email}) @${u.username}`);
            });
            return;
        }
        
        console.log('\n✅ User found via Prisma:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Full Name: ${user.fullName}`);
        console.log(`   Blocked: ${user.isBlocked}`);
        console.log(`   Suspended: ${user.isSuspended}`);
        
        // Step 3: Test password comparison
        console.log('\n🔑 Testing password...');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`   Password match: ${isMatch ? '✅ YES' : '❌ NO'}`);
        
        if (!isMatch) {
            console.log('\n🔧 Password hash details:');
            console.log(`   Stored hash: ${user.password.substring(0, 30)}...`);
            console.log(`   Hash length: ${user.password.length}`);
            
            // Test with different passwords
            const testPasswords = ['admin123', 'Admin123', 'ADMIN123', 'password', '123456'];
            console.log('\n🧪 Testing different passwords:');
            for (const testPwd of testPasswords) {
                const testResult = await bcrypt.compare(testPwd, user.password);
                console.log(`   "${testPwd}": ${testResult ? '✅' : '❌'}`);
            }
        }
        
        // Step 4: Check account status
        if (user.isBlocked) {
            console.log('\n⚠️  Account is BLOCKED');
        }
        if (user.isSuspended) {
            console.log('\n⚠️  Account is SUSPENDED');
        }
        
        console.log('\n🎯 PRISMA LOGIN DEBUG SUMMARY:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 Email/Username: ${emailOrUsername}`);
        console.log(`🔑 Password: ${password}`);
        console.log(`👤 User found: ${user ? 'Yes' : 'No'}`);
        console.log(`🔐 Password valid: ${user && isMatch ? 'Yes' : 'No'}`);
        console.log(`🚫 Blocked: ${user?.isBlocked ? 'Yes' : 'No'}`);
        console.log(`⏸️  Suspended: ${user?.isSuspended ? 'Yes' : 'No'}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
    } catch (error) {
        console.error('❌ Error in Prisma debug:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugPrismaLogin();