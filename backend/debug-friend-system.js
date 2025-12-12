import prisma from './src/lib/prisma.js';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';
const JWT_SECRET = 'myscretkey';

async function debugFriendSystem() {
    console.log('🔍 DEBUGGING FRIEND SYSTEM\n');
    console.log('=' .repeat(50));
    
    try {
        // 1. Get test users
        console.log('\n1️⃣ GETTING TEST USERS...');
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                fullName: true,
                email: true
            },
            take: 3
        });
        
        if (users.length < 2) {
            console.log('❌ Need at least 2 users for testing');
            return;
        }
        
        const [user1, user2, user3] = users;
        console.log(`👤 User 1: ${user1.fullName} (@${user1.username})`);
        console.log(`👤 User 2: ${user2.fullName} (@${user2.username})`);
        if (user3) console.log(`👤 User 3: ${user3.fullName} (@${user3.username})`);
        
        // 2. Generate tokens
        console.log('\n2️⃣ GENERATING TOKENS...');
        const token1 = jwt.sign({ userId: user1.id }, JWT_SECRET, { expiresIn: '1h' });
        const token2 = jwt.sign({ userId: user2.id }, JWT_SECRET, { expiresIn: '1h' });
        console.log('✅ Tokens generated');
        
        // 3. Check current friend requests in database
        console.log('\n3️⃣ CHECKING DATABASE STATE...');
        const allRequests = await prisma.friendRequest.findMany({
            include: {
                sender: { select: { username: true, fullName: true } },
                receiver: { select: { username: true, fullName: true } }
            }
        });
        
        console.log(`📊 Total friend requests in DB: ${allRequests.length}`);
        allRequests.forEach((req, i) => {
            console.log(`   ${i+1}. ${req.sender.username} → ${req.receiver.username} (${req.createdAt})`);
        });
        
        // 4. Test sending friend request
        console.log('\n4️⃣ TESTING SEND FRIEND REQUEST...');
        try {
            const sendResponse = await fetch(`${BASE_URL}/api/friends/send/${user2.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token1}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (sendResponse.ok) {
                const result = await sendResponse.json();
                console.log('✅ Send request successful:', result.message);
            } else {
                const error = await sendResponse.json();
                console.log('❌ Send request failed:', error.message);
            }
        } catch (error) {
            console.log('❌ Send request error:', error.message);
        }
        
        // 5. Check database after sending
        console.log('\n5️⃣ CHECKING DATABASE AFTER SEND...');
        const requestsAfterSend = await prisma.friendRequest.findMany({
            include: {
                sender: { select: { username: true, fullName: true } },
                receiver: { select: { username: true, fullName: true } }
            }
        });
        
        console.log(`📊 Friend requests after send: ${requestsAfterSend.length}`);
        requestsAfterSend.forEach((req, i) => {
            console.log(`   ${i+1}. ${req.sender.username} → ${req.receiver.username} (${req.createdAt})`);
        });
        
        // 6. Test getting friend requests for user1 (sender)
        console.log('\n6️⃣ TESTING GET REQUESTS FOR SENDER...');
        try {
            const requestsResponse = await fetch(`${BASE_URL}/api/friends/requests`, {
                headers: {
                    'Authorization': `Bearer ${token1}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (requestsResponse.ok) {
                const requests = await requestsResponse.json();
                console.log('✅ Get requests successful');
                console.log(`   📤 Sent: ${requests.sent?.length || 0}`);
                console.log(`   📥 Received: ${requests.received?.length || 0}`);
                
                if (requests.sent?.length > 0) {
                    requests.sent.forEach((req, i) => {
                        console.log(`      Sent ${i+1}: To ${req.username} (${req.fullName})`);
                    });
                }
                
                if (requests.received?.length > 0) {
                    requests.received.forEach((req, i) => {
                        console.log(`      Received ${i+1}: From ${req.username} (${req.fullName})`);
                    });
                }
            } else {
                const error = await requestsResponse.json();
                console.log('❌ Get requests failed:', error.message);
            }
        } catch (error) {
            console.log('❌ Get requests error:', error.message);
        }
        
        // 7. Test getting friend requests for user2 (receiver)
        console.log('\n7️⃣ TESTING GET REQUESTS FOR RECEIVER...');
        try {
            const requestsResponse = await fetch(`${BASE_URL}/api/friends/requests`, {
                headers: {
                    'Authorization': `Bearer ${token2}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (requestsResponse.ok) {
                const requests = await requestsResponse.json();
                console.log('✅ Get requests successful');
                console.log(`   📤 Sent: ${requests.sent?.length || 0}`);
                console.log(`   📥 Received: ${requests.received?.length || 0}`);
                
                if (requests.received?.length > 0) {
                    requests.received.forEach((req, i) => {
                        console.log(`      Received ${i+1}: From ${req.username} (${req.fullName})`);
                    });
                }
            } else {
                const error = await requestsResponse.json();
                console.log('❌ Get requests failed:', error.message);
            }
        } catch (error) {
            console.log('❌ Get requests error:', error.message);
        }
        
        // 8. Test accepting friend request
        console.log('\n8️⃣ TESTING ACCEPT FRIEND REQUEST...');
        try {
            const acceptResponse = await fetch(`${BASE_URL}/api/friends/accept/${user1.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token2}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (acceptResponse.ok) {
                const result = await acceptResponse.json();
                console.log('✅ Accept request successful:', result.message);
            } else {
                const error = await acceptResponse.json();
                console.log('❌ Accept request failed:', error.message);
            }
        } catch (error) {
            console.log('❌ Accept request error:', error.message);
        }
        
        // 9. Test getting friends list
        console.log('\n9️⃣ TESTING GET FRIENDS LIST...');
        try {
            const friendsResponse = await fetch(`${BASE_URL}/api/friends/all`, {
                headers: {
                    'Authorization': `Bearer ${token1}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (friendsResponse.ok) {
                const friends = await friendsResponse.json();
                console.log('✅ Get friends successful');
                console.log(`   👥 Friends count: ${friends.length}`);
                
                friends.forEach((friend, i) => {
                    console.log(`      Friend ${i+1}: ${friend.username} (${friend.fullName})`);
                });
            } else {
                const error = await friendsResponse.json();
                console.log('❌ Get friends failed:', error.message);
            }
        } catch (error) {
            console.log('❌ Get friends error:', error.message);
        }
        
        // 10. Test sidebar users (message system)
        console.log('\n🔟 TESTING SIDEBAR USERS...');
        try {
            const sidebarResponse = await fetch(`${BASE_URL}/api/messages/users`, {
                headers: {
                    'Authorization': `Bearer ${token1}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (sidebarResponse.ok) {
                const users = await sidebarResponse.json();
                console.log('✅ Get sidebar users successful');
                console.log(`   👥 Sidebar users count: ${users.length}`);
                
                users.forEach((user, i) => {
                    console.log(`      User ${i+1}: ${user.username} (${user.nickname || user.fullName})`);
                });
            } else {
                const error = await sidebarResponse.json();
                console.log('❌ Get sidebar users failed:', error.message);
            }
        } catch (error) {
            console.log('❌ Get sidebar users error:', error.message);
        }
        
        console.log('\n🎉 FRIEND SYSTEM DEBUG COMPLETE');
        console.log('=' .repeat(50));
        
    } catch (error) {
        console.error('\n❌ DEBUG FAILED:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

debugFriendSystem();