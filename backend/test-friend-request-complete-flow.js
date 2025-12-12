// Complete Friend Request Flow Test
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import prisma from './src/lib/prisma.js';

const BASE_URL = 'http://localhost:5001';
const JWT_SECRET = 'myscretkey';

async function testCompleteFriendFlow() {
    console.log('🧪 TESTING COMPLETE FRIEND REQUEST FLOW');
    console.log('=' .repeat(60));
    
    try {
        // 1. Get test users
        console.log('\n1️⃣ SETTING UP TEST USERS...');
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
        
        const [user1, user2] = users;
        console.log(`👤 User 1: ${user1.fullName} (@${user1.username})`);
        console.log(`👤 User 2: ${user2.fullName} (@${user2.username})`);
        
        // Generate tokens
        const token1 = jwt.sign({ userId: user1.id }, JWT_SECRET, { expiresIn: '1h' });
        const token2 = jwt.sign({ userId: user2.id }, JWT_SECRET, { expiresIn: '1h' });
        
        // 2. Clean up any existing friend requests
        console.log('\n2️⃣ CLEANING UP EXISTING DATA...');
        await prisma.friendRequest.deleteMany({
            where: {
                OR: [
                    { senderId: user1.id, receiverId: user2.id },
                    { senderId: user2.id, receiverId: user1.id }
                ]
            }
        });
        console.log('✅ Cleaned up existing friend requests');
        
        // 3. Test sending friend request
        console.log('\n3️⃣ TESTING SEND FRIEND REQUEST...');
        const sendResponse = await fetch(`${BASE_URL}/api/friends/send/${user2.id}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token1}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', sendResponse.status);
        const responseText = await sendResponse.text();
        console.log('Response body:', responseText);
        
        if (sendResponse.ok) {
            const result = JSON.parse(responseText);
            console.log('✅ Friend request sent successfully:', result.message);
        } else {
            try {
                const error = JSON.parse(responseText);
                console.log('❌ Send request failed:', error.message || error.error);
            } catch (e) {
                console.log('❌ Send request failed with status:', sendResponse.status);
                console.log('Raw response:', responseText);
            }
            return;
        }
        
        // 4. Verify request appears in sender's sent list
        console.log('\n4️⃣ VERIFYING SENDER\'S SENT REQUESTS...');
        const senderRequestsRes = await fetch(`${BASE_URL}/api/friends/requests`, {
            headers: { 'Authorization': `Bearer ${token1}` }
        });
        
        if (senderRequestsRes.ok) {
            const senderRequests = await senderRequestsRes.json();
            console.log(`📤 Sender has ${senderRequests.sent?.length || 0} sent requests`);
            
            const sentToUser2 = senderRequests.sent?.find(r => r.id === user2.id);
            if (sentToUser2) {
                console.log('✅ Request appears in sender\'s sent list');
            } else {
                console.log('❌ Request NOT in sender\'s sent list');
            }
        }
        
        // 5. Verify request appears in receiver's received list
        console.log('\n5️⃣ VERIFYING RECEIVER\'S RECEIVED REQUESTS...');
        const receiverRequestsRes = await fetch(`${BASE_URL}/api/friends/requests`, {
            headers: { 'Authorization': `Bearer ${token2}` }
        });
        
        if (receiverRequestsRes.ok) {
            const receiverRequests = await receiverRequestsRes.json();
            console.log(`📥 Receiver has ${receiverRequests.received?.length || 0} received requests`);
            
            const receivedFromUser1 = receiverRequests.received?.find(r => r.id === user1.id);
            if (receivedFromUser1) {
                console.log('✅ Request appears in receiver\'s received list');
            } else {
                console.log('❌ Request NOT in receiver\'s received list');
                return;
            }
        }
        
        // 6. Test accepting friend request
        console.log('\n6️⃣ TESTING ACCEPT FRIEND REQUEST...');
        const acceptResponse = await fetch(`${BASE_URL}/api/friends/accept/${user1.id}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token2}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (acceptResponse.ok) {
            const result = await acceptResponse.json();
            console.log('✅ Friend request accepted:', result.message);
        } else {
            const error = await acceptResponse.json();
            console.log('❌ Accept request failed:', error.message);
            return;
        }
        
        // 7. Verify friend request is removed from both lists
        console.log('\n7️⃣ VERIFYING REQUEST REMOVAL...');
        
        // Check sender's requests
        const senderRequestsAfter = await fetch(`${BASE_URL}/api/friends/requests`, {
            headers: { 'Authorization': `Bearer ${token1}` }
        });
        
        if (senderRequestsAfter.ok) {
            const requests = await senderRequestsAfter.json();
            const stillHasSent = requests.sent?.find(r => r.id === user2.id);
            if (!stillHasSent) {
                console.log('✅ Request removed from sender\'s sent list');
            } else {
                console.log('❌ Request still in sender\'s sent list');
            }
        }
        
        // Check receiver's requests
        const receiverRequestsAfter = await fetch(`${BASE_URL}/api/friends/requests`, {
            headers: { 'Authorization': `Bearer ${token2}` }
        });
        
        if (receiverRequestsAfter.ok) {
            const requests = await receiverRequestsAfter.json();
            const stillHasReceived = requests.received?.find(r => r.id === user1.id);
            if (!stillHasReceived) {
                console.log('✅ Request removed from receiver\'s received list');
            } else {
                console.log('❌ Request still in receiver\'s received list');
            }
        }
        
        // 8. Verify both users are now friends
        console.log('\n8️⃣ VERIFYING FRIENDSHIP...');
        
        // Check user1's friends list
        const user1FriendsRes = await fetch(`${BASE_URL}/api/friends/all`, {
            headers: { 'Authorization': `Bearer ${token1}` }
        });
        
        if (user1FriendsRes.ok) {
            const friends = await user1FriendsRes.json();
            const isFriendWithUser2 = friends.find(f => f.id === user2.id);
            if (isFriendWithUser2) {
                console.log('✅ User1 has User2 in friends list');
            } else {
                console.log('❌ User1 does NOT have User2 in friends list');
            }
        }
        
        // Check user2's friends list
        const user2FriendsRes = await fetch(`${BASE_URL}/api/friends/all`, {
            headers: { 'Authorization': `Bearer ${token2}` }
        });
        
        if (user2FriendsRes.ok) {
            const friends = await user2FriendsRes.json();
            const isFriendWithUser1 = friends.find(f => f.id === user1.id);
            if (isFriendWithUser1) {
                console.log('✅ User2 has User1 in friends list');
            } else {
                console.log('❌ User2 does NOT have User1 in friends list');
            }
        }
        
        // 9. Test sidebar users (message system)
        console.log('\n9️⃣ VERIFYING SIDEBAR USERS...');
        
        const sidebarRes = await fetch(`${BASE_URL}/api/messages/users`, {
            headers: { 'Authorization': `Bearer ${token1}` }
        });
        
        if (sidebarRes.ok) {
            const sidebarUsers = await sidebarRes.json();
            const user2InSidebar = sidebarUsers.find(u => u.id === user2.id);
            if (user2InSidebar) {
                console.log('✅ Friend appears in sidebar users');
            } else {
                console.log('❌ Friend does NOT appear in sidebar users');
            }
        }
        
        console.log('\n🎉 COMPLETE FRIEND REQUEST FLOW TEST FINISHED');
        console.log('=' .repeat(60));
        
    } catch (error) {
        console.error('\n💥 TEST FAILED:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testCompleteFriendFlow();