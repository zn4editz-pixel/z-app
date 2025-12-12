import prisma from './src/lib/prisma.js';
import jwt from 'jsonwebtoken';

async function testFriendAPI() {
    try {
        console.log('🧪 Testing Friend API...\n');
        
        // Get two users for testing
        const users = await prisma.user.findMany({
            take: 2,
            select: {
                id: true,
                fullName: true,
                username: true,
                email: true
            }
        });
        
        if (users.length < 2) {
            console.log('❌ Need at least 2 users to test friend system');
            return;
        }
        
        const [user1, user2] = users;
        console.log(`👤 User 1: ${user1.fullName} (@${user1.username})`);
        console.log(`👤 User 2: ${user2.fullName} (@${user2.username})\n`);
        
        // Test friend request creation
        console.log('🔄 Testing friend request creation...');
        
        // Check if friend request already exists
        const existingRequest = await prisma.friendRequest.findUnique({
            where: {
                senderId_receiverId: {
                    senderId: user1.id,
                    receiverId: user2.id
                }
            }
        });
        
        if (existingRequest) {
            console.log('✅ Friend request already exists');
        } else {
            // Create friend request
            await prisma.friendRequest.create({
                data: {
                    senderId: user1.id,
                    receiverId: user2.id
                }
            });
            console.log('✅ Friend request created successfully');
        }
        
        // Test getting friends
        console.log('\n🔄 Testing get friends...');
        const friendRequests = await prisma.friendRequest.findMany({
            where: {
                OR: [
                    { senderId: user1.id },
                    { receiverId: user1.id }
                ]
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true
                    }
                }
            }
        });
        
        console.log(`✅ Found ${friendRequests.length} friend connections for ${user1.fullName}`);
        
        // Test getting pending requests
        console.log('\n🔄 Testing get pending requests...');
        const receivedRequests = await prisma.friendRequest.findMany({
            where: { receiverId: user2.id },
            include: {
                sender: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true
                    }
                }
            }
        });
        
        const sentRequests = await prisma.friendRequest.findMany({
            where: { senderId: user1.id },
            include: {
                receiver: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true
                    }
                }
            }
        });
        
        console.log(`✅ ${user2.fullName} has ${receivedRequests.length} pending received requests`);
        console.log(`✅ ${user1.fullName} has ${sentRequests.length} pending sent requests`);
        
        // Generate test JWT tokens
        console.log('\n🔑 Generating test JWT tokens...');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        
        const token1 = jwt.sign({ userId: user1.id }, JWT_SECRET, { expiresIn: '7d' });
        const token2 = jwt.sign({ userId: user2.id }, JWT_SECRET, { expiresIn: '7d' });
        
        console.log(`✅ Token for ${user1.username}: ${token1.substring(0, 50)}...`);
        console.log(`✅ Token for ${user2.username}: ${token2.substring(0, 50)}...`);
        
        console.log('\n🎉 Friend API test completed successfully!');
        console.log('\n📝 Test with curl:');
        console.log(`curl -H "Authorization: Bearer ${token1}" http://localhost:5001/api/friends/all`);
        console.log(`curl -H "Authorization: Bearer ${token2}" http://localhost:5001/api/friends/requests`);
        
    } catch (error) {
        console.error('❌ Error testing friend API:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testFriendAPI();