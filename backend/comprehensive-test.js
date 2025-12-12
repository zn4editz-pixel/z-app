import prisma from './src/lib/prisma.js';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';
const JWT_SECRET = process.env.JWT_SECRET || 'myscretkey';

async function runComprehensiveTest() {
    console.log('🧪 COMPREHENSIVE SYSTEM TEST\n');
    console.log('=' .repeat(50));
    
    try {
        // 1. Database Connection Test
        console.log('\n1️⃣ TESTING DATABASE CONNECTION...');
        const userCount = await prisma.user.count();
        const messageCount = await prisma.message.count();
        const friendRequestCount = await prisma.friendRequest.count();
        
        console.log(`✅ Database connected successfully`);
        console.log(`   📊 Users: ${userCount}`);
        console.log(`   💬 Messages: ${messageCount}`);
        console.log(`   🤝 Friend Requests: ${friendRequestCount}`);
        
        // 2. Get test users
        console.log('\n2️⃣ GETTING TEST USERS...');
        const admin = await prisma.user.findFirst({
            where: { username: 'admin' }
        });
        
        const regularUsers = await prisma.user.findMany({
            where: { username: { not: 'admin' } },
            take: 2
        });
        
        if (!admin || regularUsers.length < 2) {
            throw new Error('Need admin user and at least 2 regular users for testing');
        }
        
        const [user1, user2] = regularUsers;
        console.log(`✅ Admin: ${admin.fullName} (@${admin.username})`);
        console.log(`✅ User 1: ${user1.fullName} (@${user1.username})`);
        console.log(`✅ User 2: ${user2.fullName} (@${user2.username})`);
        
        // 3. Generate tokens
        console.log('\n3️⃣ GENERATING JWT TOKENS...');
        const adminToken = jwt.sign({ userId: admin.id }, JWT_SECRET, { expiresIn: '7d' });
        const user1Token = jwt.sign({ userId: user1.id }, JWT_SECRET, { expiresIn: '7d' });
        const user2Token = jwt.sign({ userId: user2.id }, JWT_SECRET, { expiresIn: '7d' });
        
        console.log('✅ Tokens generated successfully');
        
        // 4. Test Health Endpoints
        console.log('\n4️⃣ TESTING HEALTH ENDPOINTS...');
        const healthResponse = await fetch(`${BASE_URL}/health/ping`);
        const healthData = await healthResponse.json();
        
        if (healthResponse.ok) {
            console.log('✅ Health endpoint working');
            console.log(`   📊 Uptime: ${Math.round(healthData.uptime)}s`);
            console.log(`   💾 Memory: ${healthData.memory}`);
        } else {
            throw new Error('Health endpoint failed');
        }
        
        // 5. Test Authentication
        console.log('\n5️⃣ TESTING AUTHENTICATION...');
        const authResponse = await fetch(`${BASE_URL}/api/auth/check`, {
            headers: { 'Authorization': `Bearer ${user1Token}` }
        });
        
        if (authResponse.ok) {
            const authData = await authResponse.json();
            console.log(`✅ Authentication working for ${authData.username}`);
        } else {
            throw new Error('Authentication failed');
        }
        
        // 6. Test Friend System
        console.log('\n6️⃣ TESTING FRIEND SYSTEM...');
        
        // Get friends
        const friendsResponse = await fetch(`${BASE_URL}/api/friends/all`, {
            headers: { 'Authorization': `Bearer ${user1Token}` }
        });
        
        if (friendsResponse.ok) {
            const friends = await friendsResponse.json();
            console.log(`✅ Get friends working - ${friends.length} friends found`);
        } else {
            throw new Error('Get friends failed');
        }
        
        // Get friend requests
        const requestsResponse = await fetch(`${BASE_URL}/api/friends/requests`, {
            headers: { 'Authorization': `Bearer ${user2Token}` }
        });
        
        if (requestsResponse.ok) {
            const requests = await requestsResponse.json();
            console.log(`✅ Get friend requests working`);
            console.log(`   📥 Received: ${requests.received?.length || 0}`);
            console.log(`   📤 Sent: ${requests.sent?.length || 0}`);
        } else {
            throw new Error('Get friend requests failed');
        }
        
        // 7. Test Message System
        console.log('\n7️⃣ TESTING MESSAGE SYSTEM...');
        const usersResponse = await fetch(`${BASE_URL}/api/messages/users`, {
            headers: { 'Authorization': `Bearer ${user1Token}` }
        });
        
        if (usersResponse.ok) {
            const users = await usersResponse.json();
            console.log(`✅ Get sidebar users working - ${users.length} users found`);
        } else {
            throw new Error('Get sidebar users failed');
        }
        
        // 8. Test Admin System
        console.log('\n8️⃣ TESTING ADMIN SYSTEM...');
        const adminUsersResponse = await fetch(`${BASE_URL}/api/admin/users`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (adminUsersResponse.ok) {
            const adminUsers = await adminUsersResponse.json();
            console.log(`✅ Admin get users working - ${adminUsers.length} users found`);
        } else {
            throw new Error('Admin get users failed');
        }
        
        // 9. Test User Profile System
        console.log('\n9️⃣ TESTING USER PROFILE SYSTEM...');
        const profileResponse = await fetch(`${BASE_URL}/api/users/me`, {
            headers: { 'Authorization': `Bearer ${user1Token}` }
        });
        
        if (profileResponse.ok) {
            const profile = await profileResponse.json();
            console.log(`✅ Get profile working for ${profile.username}`);
        } else {
            throw new Error('Get profile failed');
        }
        
        // 10. Summary
        console.log('\n🎉 COMPREHENSIVE TEST COMPLETED SUCCESSFULLY!');
        console.log('=' .repeat(50));
        console.log('✅ Database Connection: WORKING');
        console.log('✅ Health Endpoints: WORKING');
        console.log('✅ Authentication: WORKING');
        console.log('✅ Friend System: WORKING');
        console.log('✅ Message System: WORKING');
        console.log('✅ Admin System: WORKING');
        console.log('✅ User Profile System: WORKING');
        console.log('\n🚀 ALL MAJOR SYSTEMS ARE FUNCTIONAL!');
        
    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.log('\n🔧 DEBUGGING INFO:');
        console.log('- Check if backend is running on port 5001');
        console.log('- Check database connection');
        console.log('- Check if all required users exist');
    } finally {
        await prisma.$disconnect();
    }
}

// Add fetch polyfill for Node.js
if (!global.fetch) {
    global.fetch = fetch;
}

runComprehensiveTest();