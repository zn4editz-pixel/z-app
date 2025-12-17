#!/usr/bin/env node

/**
 * Test admin functions with authentication
 * Usage: node test-admin-with-auth.js [AUTH_TOKEN]
 */

const BACKEND_URL = 'https://z-app-backend.onrender.com';

async function testAdminWithAuth(authToken) {
    if (!authToken) {
        console.log('❌ Please provide an auth token:');
        console.log('Usage: node test-admin-with-auth.js YOUR_AUTH_TOKEN');
        console.log('\n💡 To get auth token:');
        console.log('1. Login to https://z-app-official.vercel.app/login');
        console.log('2. Open browser DevTools > Application > Local Storage');
        console.log('3. Copy the "auth-token" value');
        return;
    }

    console.log('🧪 Testing Admin Functions with Authentication...\n');

    const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };

    try {
        // Test 1: Get all users
        console.log('1️⃣ Testing getAllUsers...');
        const usersResponse = await fetch(`${BACKEND_URL}/api/admin/users`, { headers });
        
        if (usersResponse.ok) {
            const users = await usersResponse.json();
            console.log(`✅ Successfully fetched ${users.length} users`);
            
            if (users.length > 0) {
                const testUser = users.find(u => !u.isSuspended && u.id !== 'admin-user-id');
                if (testUser) {
                    console.log(`📋 Test user found: ${testUser.username} (${testUser.id})`);
                    
                    // Test 2: Suspend user (if we have a test user)
                    console.log('\n2️⃣ Testing suspendUser...');
                    const suspendResponse = await fetch(`${BACKEND_URL}/api/admin/suspend/${testUser.id}`, {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify({
                            reason: 'Test suspension',
                            duration: '1h'
                        })
                    });
                    
                    if (suspendResponse.ok) {
                        const suspendResult = await suspendResponse.json();
                        console.log('✅ Suspend function working:', suspendResult.message);
                        
                        // Test 3: Unsuspend user
                        console.log('\n3️⃣ Testing unsuspendUser...');
                        const unsuspendResponse = await fetch(`${BACKEND_URL}/api/admin/unsuspend/${testUser.id}`, {
                            method: 'PUT',
                            headers
                        });
                        
                        if (unsuspendResponse.ok) {
                            const unsuspendResult = await unsuspendResponse.json();
                            console.log('✅ Unsuspend function working:', unsuspendResult.message);
                        } else {
                            const error = await unsuspendResponse.text();
                            console.log('❌ Unsuspend failed:', unsuspendResponse.status, error);
                        }
                    } else {
                        const error = await suspendResponse.text();
                        console.log('❌ Suspend failed:', suspendResponse.status, error);
                    }
                }
            }
        } else {
            const error = await usersResponse.text();
            console.log('❌ Get users failed:', usersResponse.status, error);
        }

        // Test 4: Get admin stats
        console.log('\n4️⃣ Testing getAdminStats...');
        const statsResponse = await fetch(`${BACKEND_URL}/api/admin/stats`, { headers });
        
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            console.log('✅ Admin stats working:', {
                totalUsers: stats.totalUsers,
                onlineUsers: stats.onlineUsers,
                suspendedUsers: stats.suspendedUsers
            });
        } else {
            const error = await statsResponse.text();
            console.log('❌ Admin stats failed:', statsResponse.status, error);
        }

        console.log('\n🎉 Admin function testing completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Get auth token from command line argument
const authToken = process.argv[2];
testAdminWithAuth(authToken).catch(console.error);