import prisma from './src/lib/prisma.js';
import { MongoClient } from 'mongodb';

const MONGODB_URI = "mongodb+srv://z4fwan77:OCc9YMeaZxBf5gRi@cluster0.9rlfy9u.mongodb.net/chat_db?retryWrites=true&w=majority&appName=Cluster0";

async function fixMissingRelationships() {
    let mongoClient;
    try {
        console.log('🔧 FIXING MISSING FRIEND RELATIONSHIPS AND CHATS...\n');
        
        // Connect to MongoDB
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        const db = mongoClient.db('chat_db');
        
        // 1. Get all accepted friend requests from MongoDB
        console.log('1️⃣ Recovering accepted friend requests...');
        const acceptedFriendRequests = await db.collection('friendrequests').find({
            status: 'accepted'
        }).toArray();
        
        console.log(`   Found ${acceptedFriendRequests.length} accepted friend requests`);
        
        // 2. Create Friend relationships in SQLite
        console.log('\n2️⃣ Creating friend relationships...');
        let friendsCreated = 0;
        
        for (const request of acceptedFriendRequests) {
            try {
                // Check if both users exist in SQLite
                const sender = await prisma.user.findUnique({ where: { id: request.sender } });
                const receiver = await prisma.user.findUnique({ where: { id: request.receiver } });
                
                if (sender && receiver) {
                    // Create bidirectional friendship
                    try {
                        await prisma.friend.create({
                            data: {
                                userId: request.sender,
                                friendId: request.receiver,
                                createdAt: new Date(request.createdAt),
                                updatedAt: new Date(request.updatedAt)
                            }
                        });
                        
                        await prisma.friend.create({
                            data: {
                                userId: request.receiver,
                                friendId: request.sender,
                                createdAt: new Date(request.createdAt),
                                updatedAt: new Date(request.updatedAt)
                            }
                        });
                        
                        friendsCreated += 2;
                        console.log(`   ✅ Created friendship: ${sender.username} ↔ ${receiver.username}`);
                    } catch (error) {
                        if (!error.message.includes('Unique constraint')) {
                            console.log(`   ❌ Error creating friendship: ${error.message}`);
                        }
                    }
                } else {
                    console.log(`   ⚠️ Skipped: User not found (${request.sender} or ${request.receiver})`);
                }
            } catch (error) {
                console.log(`   ❌ Error processing request: ${error.message}`);
            }
        }
        
        // 3. Migrate ALL remaining messages
        console.log('\n3️⃣ Migrating ALL remaining messages...');
        
        const totalMongoMessages = await db.collection('messages').countDocuments();
        const currentSQLiteMessages = await prisma.message.count();
        
        console.log(`   MongoDB messages: ${totalMongoMessages}`);
        console.log(`   SQLite messages: ${currentSQLiteMessages}`);
        console.log(`   Missing: ${totalMongoMessages - currentSQLiteMessages}`);
        
        if (totalMongoMessages > currentSQLiteMessages) {
            console.log('   🔄 Migrating remaining messages...');
            
            // Get all messages from MongoDB
            const allMongoMessages = await db.collection('messages').find({}).toArray();
            let messagesAdded = 0;
            
            for (const message of allMongoMessages) {
                try {
                    // Check if message already exists
                    const existingMessage = await prisma.message.findUnique({
                        where: { id: message._id.toString() }
                    });
                    
                    if (!existingMessage) {
                        // Check if both users exist
                        const sender = await prisma.user.findUnique({ where: { id: message.senderId } });
                        const receiver = await prisma.user.findUnique({ where: { id: message.receiverId } });
                        
                        if (sender && receiver) {
                            await prisma.message.create({
                                data: {
                                    id: message._id.toString(),
                                    senderId: message.senderId,
                                    receiverId: message.receiverId,
                                    text: message.text || '',
                                    image: message.image || null,
                                    createdAt: message.createdAt ? new Date(message.createdAt) : new Date(),
                                    updatedAt: message.updatedAt ? new Date(message.updatedAt) : new Date()
                                }
                            });
                            messagesAdded++;
                            
                            if (messagesAdded % 100 === 0) {
                                console.log(`     Added ${messagesAdded} messages...`);
                            }
                        }
                    }
                } catch (error) {
                    if (!error.message.includes('Unique constraint')) {
                        console.log(`     ❌ Error adding message: ${error.message}`);
                    }
                }
            }
            
            console.log(`   ✅ Added ${messagesAdded} new messages`);
        }
        
        // 4. Update friend requests status
        console.log('\n4️⃣ Updating friend request statuses...');
        
        for (const request of acceptedFriendRequests) {
            try {
                await prisma.friendRequest.upsert({
                    where: { id: request._id.toString() },
                    update: {
                        status: request.status,
                        updatedAt: new Date(request.updatedAt)
                    },
                    create: {
                        id: request._id.toString(),
                        senderId: request.sender,
                        receiverId: request.receiver,
                        status: request.status,
                        createdAt: new Date(request.createdAt),
                        updatedAt: new Date(request.updatedAt)
                    }
                });
            } catch (error) {
                console.log(`   ❌ Error updating friend request: ${error.message}`);
            }
        }
        
        // 5. Verify the fixes
        console.log('\n5️⃣ Verifying fixes...');
        
        const finalStats = {
            users: await prisma.user.count(),
            messages: await prisma.message.count(),
            friendRequests: await prisma.friendRequest.count(),
            friends: await prisma.friend.count()
        };
        
        console.log('   Final database stats:');
        console.log(`     Users: ${finalStats.users}`);
        console.log(`     Messages: ${finalStats.messages}`);
        console.log(`     Friend Requests: ${finalStats.friendRequests}`);
        console.log(`     Friends: ${finalStats.friends}`);
        
        // Show some example friendships
        const sampleFriends = await prisma.friend.findMany({
            take: 5,
            include: {
                user: { select: { username: true, fullName: true } },
                friend: { select: { username: true, fullName: true } }
            }
        });
        
        console.log('\n   Sample friendships:');
        sampleFriends.forEach(friendship => {
            console.log(`     ${friendship.user.username} is friends with ${friendship.friend.username}`);
        });
        
        // Show conversation counts
        const conversations = await prisma.message.groupBy({
            by: ['senderId', 'receiverId'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5
        });
        
        console.log('\n   Top conversations:');
        for (const conv of conversations) {
            const sender = await prisma.user.findUnique({ where: { id: conv.senderId }, select: { username: true } });
            const receiver = await prisma.user.findUnique({ where: { id: conv.receiverId }, select: { username: true } });
            console.log(`     ${sender?.username} → ${receiver?.username}: ${conv._count.id} messages`);
        }
        
        console.log('\n🎉 RELATIONSHIP RECOVERY COMPLETE!');
        console.log('=====================================');
        console.log(`✅ Friends created: ${friendsCreated}`);
        console.log(`✅ Total messages: ${finalStats.messages}`);
        console.log(`✅ Friend relationships: ${finalStats.friends}`);
        console.log('\n🚀 Now users should see their friends and chat history!');
        
    } catch (error) {
        console.error('❌ Fix error:', error.message);
    } finally {
        if (mongoClient) {
            await mongoClient.close();
        }
        await prisma.$disconnect();
    }
}

fixMissingRelationships();