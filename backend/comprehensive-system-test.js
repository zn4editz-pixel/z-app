// Comprehensive System Test - Check All Features
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import prisma from './src/lib/prisma.js';

const BASE_URL = 'http://localhost:5001';
const JWT_SECRET = 'myscretkey';

async function comprehensiveSystemTest() {
    console.log('🔍 COMPREHENSIVE SYSTEM TEST');
    console.log('=' .repeat(60));
    
    let testResults = {
        database: false,
        auth: false,
        users: false,
        friends: false,
        messages: false,
        admin: false,
        health: false
    };
    
    try {
        // 1. Test Database Connection
        console.log('\n1️⃣ TESTING DATABASE CONNECTION...');
        try {
            const userCount = await prisma.user.count();
            console.log(`✅ Database connected - ${userCount} users found`);
            testResults.database = true;
        } catch (error) {
            console.log('❌ Database connection failed:', error.message);
        }
        
        // 2. Test Health Endpoints
        console.log('\n2️⃣ TESTING HEALTH ENDPOINTS...');
        try {
            const healthRes = await fetch(`${BASE_URL}/health/ping`);
            if (healthRes.ok) {
                const health = await healthRes.json();
                console.log('✅ Health endpoint working:', health.message);
                testResults.health = true;
            } else {
                console.log('❌ Health endpoint failed');
            }
        } catch (error) {
            console.log('❌ Health endpoint error:', error.message);
        }
        
        // 3. Test Authentication System
        console.log('\n3️⃣ TESTING AUTHENTICATION SYSTEM...');
        try {
            // Test login endpoint
            const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: 'test',
                    password: 'password123'
                })
            });
            
            if (loginRes.status === 200 || loginRes.status === 400) {
                console.log('✅ Auth endpoint accessible');
                testResults.auth = true;
            } else {
                console.log('❌ Auth endpoint failed');
            }
        } catch (error) {
            console.log('❌ Auth test error:', error.message);
        }
        
        // 4. Test User System
        console.log('\n4️⃣ TESTING USER SYSTEM...');
        try {
            const users = await prisma.user.findMany({ take: 2 });
            if (users.length >= 1) {
                const user = users[0];
                const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
                
                // Test user profile endpoint
                const profileRes = await fetch(`${BASE_URL}/api/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (profileRes.ok) {
                    console.log('✅ User profile endpoint working');
                    testResults.users = true;
                } else {
                    console.log('❌ User profile endpoint failed');
                }
            }
        } catch (error) {
            console.log('❌ User system error:', error.message);
        }
        
        // 5. Test Friend System
        console.log('\n5️⃣ TESTING FRIEND SYSTEM...');
        try {
            const users = await prisma.user.findMany({ take: 2 });
            if (users.length >= 2) {
                const [user1, user2] = users;
                const token1 = jwt.sign({ userId: user1.id }, JWT_SECRET, { expiresIn: '1h' });
                
                // Test friend requests endpoint
                const friendsRes = await fetch(`${BASE_URL}/api/friends/requests`, {
                    headers: { 'Authorization': `Bearer ${token1}` }
                });
                
                if (friendsRes.ok) {
                    console.log('✅ Friend system endpoints working');
                    testResults.friends = true;
                } else {
                    console.log('❌ Friend system failed');
                }
            }
        } catch (error) {
            console.log('❌ Friend system error:', error.message);
        }
        
        // 6. Test Message System
        console.log('\n6️⃣ TESTING MESSAGE SYSTEM...');
        try {
            const users = await prisma.user.findMany({ take: 1 });
            if (users.length >= 1) {
                const user = users[0];
                const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
                
                // Test messages endpoint
                const messagesRes = await fetch(`${BASE_URL}/api/messages/users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (messagesRes.ok) {
                    console.log('✅ Message system endpoints working');
                    testResults.messages = true;
                } else {
                    console.log('❌ Message system failed');
                }
            }
        } catch (error) {
            console.log('❌ Message system error:', error.message);
        }
        
        // 7. Test Admin System
        console.log('\n7️⃣ TESTING ADMIN SYSTEM...');
        try {
            // Find admin user by email (since isAdmin is not a DB field)
            const adminUser = await prisma.user.findFirst({ 
                where: { email: process.env.ADMIN_EMAIL || 'ronaldo@gmail.com' } 
            });
            if (adminUser) {
                const adminToken = jwt.sign({ userId: adminUser.id }, JWT_SECRET, { expiresIn: '1h' });
                
                // Test admin endpoint
                const adminRes = await fetch(`${BASE_URL}/api/admin/users`, {
                    headers: { 'Authorization': `Bearer ${adminToken}` }
                });
                
                if (adminRes.ok) {
                    console.log('✅ Admin system endpoints working');
                    testResults.admin = true;
                } else {
                    console.log('❌ Admin system failed');
                }
            } else {
                console.log('⚠️ No admin user found with email:', process.env.ADMIN_EMAIL || 'ronaldo@gmail.com');
            }
        } catch (error) {
            console.log('❌ Admin system error:', error.message);
        }
        
        // 8. Summary
        console.log('\n📊 TEST RESULTS SUMMARY');
        console.log('=' .repeat(60));
        
        const totalTests = Object.keys(testResults).length;
        const passedTests = Object.values(testResults).filter(Boolean).length;
        const failedTests = totalTests - passedTests;
        
        Object.entries(testResults).forEach(([system, passed]) => {
            console.log(`${passed ? '✅' : '❌'} ${system.toUpperCase()}: ${passed ? 'WORKING' : 'FAILED'}`);
        });
        
        console.log(`\n🎯 OVERALL SCORE: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
        
        if (passedTests === totalTests) {
            console.log('🎉 ALL SYSTEMS WORKING PERFECTLY!');
        } else if (passedTests >= totalTests * 0.8) {
            console.log('⚠️ MOSTLY WORKING - Minor issues detected');
        } else {
            console.log('🚨 MAJOR ISSUES DETECTED - Needs immediate attention');
        }
        
        return testResults;
        
    } catch (error) {
        console.error('\n💥 CRITICAL ERROR:', error.message);
        return testResults;
    } finally {
        await prisma.$disconnect();
    }
}

comprehensiveSystemTest();