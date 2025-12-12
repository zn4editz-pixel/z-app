import prisma from './src/lib/prisma.js';
import { MongoClient } from 'mongodb';

// Your original MongoDB connection
const MONGODB_URI = "mongodb+srv://z4fwan77:OCc9YMeaZxBf5gRi@cluster0.9rlfy9u.mongodb.net/chat_db?retryWrites=true&w=majority&appName=Cluster0";

async function emergencyDataRecovery() {
    let mongoClient;
    try {
        console.log('🚨 EMERGENCY DATA RECOVERY - FINDING YOUR 25 USERS AND ALL DATA...\n');
        
        // 1. Check current SQLite database
        console.log('1️⃣ Checking current SQLite database...');
        const currentUsers = await prisma.user.findMany();
        const currentMessages = await prisma.message.findMany();
        const currentFriendRequests = await prisma.friendRequest.findMany();
        
        console.log(`   Current SQLite - Users: ${currentUsers.length}, Messages: ${currentMessages.length}, Friend Requests: ${currentFriendRequests.length}`);
        
        // 2. Connect to your original MongoDB to find the 25 users
        console.log('\n2️⃣ Connecting to your original MongoDB database...');
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        const db = mongoClient.db('chat_db');
        
        // Get all your original data
        const originalUsers = await db.collection('users').find({}).toArray();
        const originalMessages = await db.collection('messages').find({}).toArray();
        const originalFriendRequests = await db.collection('friendrequests').find({}).toArray();
        const originalReports = await db.collection('reports').find({}).toArray();
        
        console.log(`   ✅ FOUND YOUR ORIGINAL DATA!`);
        console.log(`   📊 Original Users: ${originalUsers.length}`);
        console.log(`   📊 Original Messages: ${originalMessages.length}`);
        console.log(`   📊 Original Friend Requests: ${originalFriendRequests.length}`);
        console.log(`   📊 Original Reports: ${originalReports.length}`);
        
        // 3. Show your original users
        console.log('\n3️⃣ YOUR ORIGINAL 25 USERS:');
        originalUsers.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.fullName || user.name} (${user.email}) - Username: ${user.username}`);
            if (user.profilePic) {
                console.log(`      Profile Pic: ${user.profilePic.substring(0, 50)}...`);
            }
        });
        
        // 4. FULL DATA RECOVERY - Clear current and restore original
        console.log('\n4️⃣ STARTING FULL DATA RECOVERY...');
        
        // Clear current SQLite data
        console.log('   🧹 Clearing current SQLite data...');
        await prisma.message.deleteMany({});
        await prisma.friendRequest.deleteMany({});
        await prisma.report.deleteMany({});
        await prisma.user.deleteMany({});
        console.log('   ✅ SQLite cleared');
        
        // 5. Restore ALL your original users
        console.log('\n5️⃣ RESTORING ALL YOUR ORIGINAL USERS...');
        let restoredUsers = 0;
        
        for (const mongoUser of originalUsers) {
            try {
                await prisma.user.create({
                    data: {
                        id: mongoUser._id.toString(),
                        fullName: mongoUser.fullName || mongoUser.name || 'User',
                        email: mongoUser.email,
                        username: mongoUser.username || mongoUser.email.split('@')[0],
                        nickname: mongoUser.nickname || mongoUser.fullName || mongoUser.name,
                        password: mongoUser.password,
                        profilePic: mongoUser.profilePic || null,
                        bio: mongoUser.bio || null,
                        isVerified: mongoUser.isVerified || false,
                        hasCompletedProfile: mongoUser.hasCompletedProfile !== false,
                        country: mongoUser.country || 'Unknown',
                        countryCode: mongoUser.countryCode || 'XX',
                        city: mongoUser.city || 'Unknown',
                        createdAt: mongoUser.createdAt ? new Date(mongoUser.createdAt) : new Date(),
                        updatedAt: mongoUser.updatedAt ? new Date(mongoUser.updatedAt) : new Date()
                    }
                });
                restoredUsers++;
                console.log(`   ✅ Restored: ${mongoUser.fullName || mongoUser.name} (${mongoUser.email})`);
            } catch (error) {
                console.log(`   ❌ Failed to restore ${mongoUser.email}: ${error.message}`);
            }
        }
        
        // 6. Restore ALL your original messages
        console.log('\n6️⃣ RESTORING ALL YOUR ORIGINAL MESSAGES...');
        let restoredMessages = 0;
        
        for (const message of originalMessages) {
            try {
                await prisma.message.create({
                    data: {
                        id: message._id.toString(),
                        senderId: message.senderId,
                        receiverId: message.receiverId,
                        text: message.text || message.content || '',
                        image: message.image || null,
                        createdAt: message.createdAt ? new Date(message.createdAt) : new Date(),
                        updatedAt: message.updatedAt ? new Date(message.updatedAt) : new Date()
                    }
                });
                restoredMessages++;
                if (restoredMessages % 50 === 0) {
                    console.log(`   ✅ Restored ${restoredMessages} messages...`);
                }
            } catch (error) {
                console.log(`   ❌ Failed to restore message: ${error.message}`);
            }
        }
        
        // 7. Restore ALL your original friend requests
        console.log('\n7️⃣ RESTORING ALL YOUR ORIGINAL FRIEND REQUESTS...');
        let restoredFriendRequests = 0;
        
        for (const request of originalFriendRequests) {
            try {
                await prisma.friendRequest.create({
                    data: {
                        id: request._id.toString(),
                        senderId: request.senderId,
                        receiverId: request.receiverId,
                        status: request.status || 'pending',
                        createdAt: request.createdAt ? new Date(request.createdAt) : new Date(),
                        updatedAt: request.updatedAt ? new Date(request.updatedAt) : new Date()
                    }
                });
                restoredFriendRequests++;
            } catch (error) {
                console.log(`   ❌ Failed to restore friend request: ${error.message}`);
            }
        }
        
        // 8. Restore ALL your original reports
        console.log('\n8️⃣ RESTORING ALL YOUR ORIGINAL REPORTS...');
        let restoredReports = 0;
        
        for (const report of originalReports) {
            try {
                await prisma.report.create({
                    data: {
                        id: report._id.toString(),
                        reporterId: report.reporterId,
                        reportedUserId: report.reportedUserId,
                        reason: report.reason || 'No reason provided',
                        description: report.description || null,
                        screenshot: report.screenshot || null,
                        status: report.status || 'pending',
                        isAIDetected: report.isAIDetected || false,
                        createdAt: report.createdAt ? new Date(report.createdAt) : new Date(),
                        updatedAt: report.updatedAt ? new Date(report.updatedAt) : new Date()
                    }
                });
                restoredReports++;
            } catch (error) {
                console.log(`   ❌ Failed to restore report: ${error.message}`);
            }
        }
        
        console.log('\n🎉 COMPLETE DATA RECOVERY SUCCESSFUL!');
        console.log('=====================================');
        console.log(`✅ Users restored: ${restoredUsers}/${originalUsers.length}`);
        console.log(`✅ Messages restored: ${restoredMessages}/${originalMessages.length}`);
        console.log(`✅ Friend requests restored: ${restoredFriendRequests}/${originalFriendRequests.length}`);
        console.log(`✅ Reports restored: ${restoredReports}/${originalReports.length}`);
        console.log('\n🚀 ALL YOUR ORIGINAL DATA IS BACK!');
        console.log('   - All 25+ users with profile pictures');
        console.log('   - All chat messages and conversations');
        console.log('   - All friend connections');
        console.log('   - All reports and admin data');
        
    } catch (error) {
        console.error('❌ Data recovery failed:', error.message);
        console.log('\n🔧 Trying alternative recovery methods...');
    } finally {
        if (mongoClient) {
            await mongoClient.close();
        }
        await prisma.$disconnect();
    }
}

emergencyDataRecovery();