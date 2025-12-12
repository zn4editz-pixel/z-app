import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

async function comprehensiveProductionAudit() {
    console.log('🔍 COMPREHENSIVE PRODUCTION AUDIT');
    console.log('='.repeat(50));
    console.log('Database Migration Path: MongoDB → PostgreSQL → SQLite\n');
    
    const issues = [];
    const fixes = [];
    
    try {
        // 1. DATABASE SCHEMA VALIDATION
        console.log('1️⃣ DATABASE SCHEMA VALIDATION...');
        
        // Check if all required tables exist
        const tables = ['User', 'Message', 'FriendRequest', 'Report'];
        for (const table of tables) {
            try {
                const count = await prisma[table.toLowerCase()].count();
                console.log(`   ✅ ${table} table: ${count} records`);
            } catch (error) {
                issues.push(`❌ ${table} table missing or corrupted`);
                console.log(`   ❌ ${table} table: ERROR - ${error.message}`);
            }
        }
        
        // 2. USER DATA INTEGRITY
        console.log('\n2️⃣ USER DATA INTEGRITY...');
        
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                username: true,
                fullName: true,
                password: true,
                hasCompletedProfile: true,
                country: true,
                countryCode: true,
                createdAt: true
            }
        });
        
        console.log(`   📊 Total users: ${users.length}`);
        
        let validUsers = 0;
        let invalidUsers = 0;
        
        for (const user of users) {
            const userIssues = [];
            
            // Check for MongoDB ObjectId format (24 hex chars)
            if (user.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(user.id)) {
                userIssues.push('MongoDB ID format detected');
            }
            
            // Check required fields
            if (!user.email || !user.username || !user.password) {
                userIssues.push('Missing required fields');
            }
            
            // Check email format
            if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
                userIssues.push('Invalid email format');
            }
            
            // Check password hash
            if (user.password && !user.password.startsWith('$2')) {
                userIssues.push('Invalid password hash format');
            }
            
            if (userIssues.length > 0) {
                console.log(`   ❌ ${user.email}: ${userIssues.join(', ')}`);
                invalidUsers++;
                issues.push(`User ${user.email}: ${userIssues.join(', ')}`);
            } else {
                validUsers++;
            }
        }
        
        console.log(`   ✅ Valid users: ${validUsers}`);
        console.log(`   ❌ Invalid users: ${invalidUsers}`);
        
        // 3. ADMIN USER VALIDATION
        console.log('\n3️⃣ ADMIN USER VALIDATION...');
        
        const adminEmail = process.env.ADMIN_EMAIL || 'ronaldo@gmail.com';
        const adminUser = await prisma.user.findUnique({
            where: { email: adminEmail }
        });
        
        if (!adminUser) {
            issues.push('Admin user not found');
            console.log(`   ❌ Admin user not found: ${adminEmail}`);
            
            // Create admin user
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
                    country: 'System',
                    countryCode: 'SYS',
                    city: 'System'
                }
            });
            fixes.push(`Created admin user: ${newAdmin.email}`);
            console.log(`   ✅ Created admin user: ${newAdmin.email}`);
        } else {
            // Test admin password
            const isPasswordValid = await bcrypt.compare('admin123', adminUser.password);
            if (!isPasswordValid) {
                issues.push('Admin password invalid');
                console.log(`   ❌ Admin password invalid`);
                
                // Fix admin password
                const hashedPassword = await bcrypt.hash('admin123', 10);
                await prisma.user.update({
                    where: { id: adminUser.id },
                    data: { password: hashedPassword }
                });
                fixes.push('Fixed admin password');
                console.log(`   ✅ Fixed admin password`);
            } else {
                console.log(`   ✅ Admin user valid: ${adminUser.email}`);
            }
        }
        
        // 4. FRIEND SYSTEM VALIDATION
        console.log('\n4️⃣ FRIEND SYSTEM VALIDATION...');
        
        const friendRequests = await prisma.friendRequest.findMany();
        console.log(`   📊 Friend requests: ${friendRequests.length}`);
        
        // Check for orphaned friend requests
        let orphanedRequests = 0;
        for (const request of friendRequests) {
            const sender = await prisma.user.findUnique({ where: { id: request.senderId } });
            const receiver = await prisma.user.findUnique({ where: { id: request.receiverId } });
            
            if (!sender || !receiver) {
                orphanedRequests++;
                issues.push(`Orphaned friend request: ${request.id}`);
            }
        }
        
        if (orphanedRequests > 0) {
            console.log(`   ❌ Orphaned friend requests: ${orphanedRequests}`);
            // Clean up orphaned requests
            await prisma.friendRequest.deleteMany({
                where: {
                    OR: [
                        { sender: null },
                        { receiver: null }
                    ]
                }
            });
            fixes.push(`Cleaned up ${orphanedRequests} orphaned friend requests`);
        } else {
            console.log(`   ✅ All friend requests valid`);
        }
        
        // 5. MESSAGE SYSTEM VALIDATION
        console.log('\n5️⃣ MESSAGE SYSTEM VALIDATION...');
        
        const messages = await prisma.message.findMany();
        console.log(`   📊 Messages: ${messages.length}`);
        
        // Check for orphaned messages
        let orphanedMessages = 0;
        for (const message of messages.slice(0, 100)) { // Check first 100 for performance
            const sender = await prisma.user.findUnique({ where: { id: message.senderId } });
            const receiver = await prisma.user.findUnique({ where: { id: message.receiverId } });
            
            if (!sender || !receiver) {
                orphanedMessages++;
            }
        }
        
        if (orphanedMessages > 0) {
            console.log(`   ❌ Orphaned messages detected: ~${orphanedMessages}`);
            issues.push(`Orphaned messages detected`);
        } else {
            console.log(`   ✅ Message system integrity good`);
        }
        
        // 6. AUTHENTICATION SYSTEM TEST
        console.log('\n6️⃣ AUTHENTICATION SYSTEM TEST...');
        
        try {
            // Test JWT token generation
            const testUser = users[0];
            if (testUser) {
                const token = jwt.sign(
                    { userId: testUser.id },
                    process.env.JWT_SECRET || 'fallback-secret',
                    { expiresIn: '7d' }
                );
                
                // Test token verification
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
                
                if (decoded.userId === testUser.id) {
                    console.log(`   ✅ JWT authentication working`);
                } else {
                    issues.push('JWT token verification failed');
                    console.log(`   ❌ JWT token verification failed`);
                }
            }
        } catch (error) {
            issues.push(`JWT system error: ${error.message}`);
            console.log(`   ❌ JWT system error: ${error.message}`);
        }
        
        // 7. DATABASE PERFORMANCE CHECK
        console.log('\n7️⃣ DATABASE PERFORMANCE CHECK...');
        
        const startTime = Date.now();
        
        // Test query performance
        await Promise.all([
            prisma.user.findMany({ take: 10 }),
            prisma.message.findMany({ take: 10 }),
            prisma.friendRequest.findMany({ take: 10 })
        ]);
        
        const queryTime = Date.now() - startTime;
        console.log(`   📊 Query performance: ${queryTime}ms`);
        
        if (queryTime > 1000) {
            issues.push('Slow database queries detected');
            console.log(`   ⚠️ Slow queries detected (${queryTime}ms)`);
        } else {
            console.log(`   ✅ Database performance good`);
        }
        
        // 8. ENVIRONMENT VALIDATION
        console.log('\n8️⃣ ENVIRONMENT VALIDATION...');
        
        const requiredEnvVars = [
            'JWT_SECRET',
            'DATABASE_URL',
            'ADMIN_EMAIL'
        ];
        
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                issues.push(`Missing environment variable: ${envVar}`);
                console.log(`   ❌ Missing: ${envVar}`);
            } else {
                console.log(`   ✅ Found: ${envVar}`);
            }
        }
        
        // SUMMARY
        console.log('\n' + '='.repeat(50));
        console.log('📋 AUDIT SUMMARY');
        console.log('='.repeat(50));
        
        console.log(`\n🔍 ISSUES FOUND (${issues.length}):`);
        if (issues.length === 0) {
            console.log('   🎉 No issues found! System is production-ready.');
        } else {
            issues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }
        
        console.log(`\n🔧 FIXES APPLIED (${fixes.length}):`);
        if (fixes.length === 0) {
            console.log('   ℹ️ No fixes needed.');
        } else {
            fixes.forEach((fix, index) => {
                console.log(`   ${index + 1}. ${fix}`);
            });
        }
        
        // RECOMMENDATIONS
        console.log('\n💡 PRODUCTION RECOMMENDATIONS:');
        console.log('   1. Clear all browser localStorage before testing');
        console.log('   2. Test all authentication flows');
        console.log('   3. Verify friend request system');
        console.log('   4. Test message sending/receiving');
        console.log('   5. Validate admin panel access');
        console.log('   6. Run performance tests under load');
        
        console.log('\n🚀 SYSTEM STATUS:');
        if (issues.length === 0) {
            console.log('   ✅ PRODUCTION READY');
        } else if (issues.length <= 3) {
            console.log('   ⚠️ MINOR ISSUES - Fix before production');
        } else {
            console.log('   ❌ MAJOR ISSUES - Not production ready');
        }
        
    } catch (error) {
        console.error('\n❌ AUDIT FAILED:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

comprehensiveProductionAudit();