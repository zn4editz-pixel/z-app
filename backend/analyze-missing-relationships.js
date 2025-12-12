import prisma from './src/lib/prisma.js';
import { MongoClient } from 'mongodb';

const MONGODB_URI = "mongodb+srv://z4fwan77:OCc9YMeaZxBf5gRi@cluster0.9rlfy9u.mongodb.net/chat_db?retryWrites=true&w=majority&appName=Cluster0";

async function analyzeMissingRelationships() {
    let mongoClient;
    try {
        console.log('🔍 ANALYZING MISSING FRIEND RELATIONSHIPS AND CHATS...\n');
        
        // 1. Check current SQLite data
        console.log('1️⃣ Current SQLite Database Status:');
        const currentUsers = await prisma.user.count();
        const currentMessages = await prisma.message.count();
        const currentFriendRequests = await prisma.friendRequest.count();
        
        console.log(`   Users: ${currentUsers}`);
        console.log(`   Messages: ${currentMessages}`);
        console.log(`   Friend Requests: ${currentFriendRequests}`);
        
        // Check if we have a Friends table
        try {
            const friendsCount = await prisma.friend.count();
            console.log(`   Friends: ${friendsCount}`);
        } catch (error) {
            console.log(`   Friends table: ❌ Not found or empty`);
        }
        
        // 2. Connect to MongoDB to check original data
        console.log('\n2️⃣ Connecting to MongoDB to check original relationships...');
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        const db = mongoClient.db('chat_db');
        
        // Check all collections
        const collections = await db.listCollections().toArray();
        console.log('\n📋 Available MongoDB Collections:');
        collections.forEach(col => {
            console.log(`   - ${col.name}`);
        });
        
        // 3. Analyze friend relationships in MongoDB
        console.log('\n3️⃣ Analyzing Friend Relationships in MongoDB:');
        
        // Check for friends collection
        try {
            const mongoFriends = await db.collection('friends').find({}).toArray();
            console.log(`   Friends collection: ${mongoFriends.length} records`);
            if (mongoFriends.length > 0) {
                console.log('   Sample friend record:');
                console.log('  ', JSON.stringify(mongoFriends[0], null, 2));
            }
        } catch (error) {
            console.log('   Friends collection: ❌ Not found');
        }
        
        // Check friend requests
        try {
            const mongoFriendRequests = await db.collection('friendrequests').find({}).toArray();
            console.log(`   Friend requests: ${mongoFriendRequests.length} records`);
            if (mongoFriendRequests.length > 0) {
                console.log('   Sample friend request:');
                console.log('  ', JSON.stringify(mongoFriendRequests[0], null, 2));
            }
        } catch (error) {
            console.log('   Friend requests: ❌ Error accessing');
        }
        
        // 4. Analyze message relationships
        console.log('\n4️⃣ Analyzing Message Relationships:');
        
        const mongoMessages = await db.collection('messages').find({}).limit(10).toArray();
        console.log(`   Total messages in MongoDB: ${await db.collection('messages').countDocuments()}`);
        
        if (mongoMessages.length > 0) {
            console.log('   Sample message structure:');
            console.log('  ', JSON.stringify(mongoMessages[0], null, 2));
            
            // Check unique conversations
            const conversations = await db.collection('messages').aggregate([
                {
                    $group: {
                        _id: {
                            user1: { $min: ["$senderId", "$receiverId"] },
                            user2: { $max: ["$senderId", "$receiverId"] }
                        },
                        count: { $sum: 1 }
                    }
                }
            ]).toArray();
            
            console.log(`   Unique conversations: ${conversations.length}`);
            console.log('   Top conversations:');
            conversations.slice(0, 5).forEach(conv => {
                console.log(`     ${conv._id.user1} ↔ ${conv._id.user2}: ${conv.count} messages`);
            });
        }
        
        // 5. Check current SQLite message relationships
        console.log('\n5️⃣ Current SQLite Message Analysis:');
        
        const sqliteMessages = await prisma.message.findMany({
            take: 5,
            include: {
                sender: { select: { username: true, fullName: true } },
                receiver: { select: { username: true, fullName: true } }
            }
        });
        
        console.log('   Sample SQLite messages:');
        sqliteMessages.forEach(msg => {
            console.log(`     ${msg.sender?.username || 'Unknown'} → ${msg.receiver?.username || 'Unknown'}: "${msg.text?.substring(0, 50)}..."`);
        });
        
        // 6. Identify the problem
        console.log('\n🎯 PROBLEM IDENTIFICATION:');
        console.log('=====================================');
        
        if (mongoFriends && mongoFriends.length > 0) {
            console.log('❌ MISSING: Friend relationships not migrated');
            console.log('   Solution: Need to migrate friends collection');
        }
        
        const totalMongoMessages = await db.collection('messages').countDocuments();
        if (totalMongoMessages > currentMessages) {
            console.log(`❌ MISSING: ${totalMongoMessages - currentMessages} messages not migrated`);
            console.log('   Solution: Need to migrate all messages');
        }
        
        console.log('\n🔧 RECOMMENDED FIXES:');
        console.log('1. Migrate all friend relationships from MongoDB');
        console.log('2. Migrate ALL messages (not just 330)');
        console.log('3. Create proper friend connections');
        console.log('4. Ensure chat history shows in frontend');
        
    } catch (error) {
        console.error('❌ Analysis error:', error.message);
    } finally {
        if (mongoClient) {
            await mongoClient.close();
        }
        await prisma.$disconnect();
    }
}

analyzeMissingRelationships();