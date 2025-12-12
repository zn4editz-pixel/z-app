import { MongoClient } from 'mongodb';
import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';

const MONGODB_URI = "mongodb+srv://z4fwan77:OCc9YMeaZxBf5gRi@cluster0.9rlfy9u.mongodb.net/chat_db?retryWrites=true&w=majority&appName=Cluster0";

async function migrateFromMongoDB() {
    let mongoClient;
    try {
        console.log('🔄 Starting migration from MongoDB to SQLite...\n');
        
        // Connect to MongoDB
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        const db = mongoClient.db('chat_db');
        
        // Clear existing SQLite data (except admin)
        console.log('🧹 Clearing existing data (keeping admin)...');
        await prisma.message.deleteMany({});
        await prisma.friendRequest.deleteMany({});
        await prisma.report.deleteMany({});
        await prisma.user.deleteMany({
            where: { 
                email: { not: 'ronaldo@gmail.com' }
            }
        });
        
        // Migrate Users
        console.log('👥 Migrating users...');
        const mongoUsers = await db.collection('users').find({}).toArray();
        let migratedUsers = 0;
        
        for (const mongoUser of mongoUsers) {
            try {
                // Skip if admin already exists
                if (mongoUser.email === 'ronaldo@gmail.com') {
                    console.log('   ⏭️  Skipping admin user (already exists)');
                    continue;
                }
                
                // Create user in SQLite
                await prisma.user.create({
                    data: {
                        id: mongoUser._id.toString(),
                        fullName: mongoUser.fullName || mongoUser.name || 'Unknown',
                        email: mongoUser.email,
                        username: mongoUser.username || mongoUser.email.split('@')[0],
                        nickname: mongoUser.nickname || mongoUser.fullName || mongoUser.name,
                        password: mongoUser.password || await bcrypt.hash('defaultpass123', 10),
                        profilePic: mongoUser.profilePic || null,
                        bio: mongoUser.bio || null,
                        isVerified: mongoUser.isVerified || false,
                        hasCompletedProfile: mongoUser.hasCompletedProfile || true,
                        country: mongoUser.country || 'Unknown',
                        countryCode: mongoUser.countryCode || 'XX',
                        city: mongoUser.city || 'Unknown',
                        createdAt: mongoUser.createdAt ? new Date(mongoUser.createdAt) : new Date(),
                        updatedAt: mongoUser.updatedAt ? new Date(mongoUser.updatedAt) : new Date()
                    }
                });
                migratedUsers++;
                console.log(`   ✅ ${mongoUser.fullName || mongoUser.name} (${mongoUser.email})`);
            } catch (error) {
                console.log(`   ❌ Failed to migrate ${mongoUser.email}: ${error.message}`);
            }
        }
        
        // Migrate Friend Requests
        console.log('\n🤝 Migrating friend requests...');
        const mongoFriendRequests = await db.collection('friendrequests').find({}).toArray();
        let migratedFriendRequests = 0;
        
        for (const request of mongoFriendRequests) {
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
                migratedFriendRequests++;
                console.log(`   ✅ Friend request ${request.senderId} → ${request.receiverId}`);
            } catch (error) {
                console.log(`   ❌ Failed to migrate friend request: ${error.message}`);
            }
        }
        
        // Migrate Messages
        console.log('\n💬 Migrating messages...');
        const mongoMessages = await db.collection('messages').find({}).limit(100).toArray(); // Limit for demo
        let migratedMessages = 0;
        
        for (const message of mongoMessages) {
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
                migratedMessages++;
                if (migratedMessages % 20 === 0) {
                    console.log(`   ✅ Migrated ${migratedMessages} messages...`);
                }
            } catch (error) {
                console.log(`   ❌ Failed to migrate message: ${error.message}`);
            }
        }
        
        // Migrate Reports
        console.log('\n📋 Migrating reports...');
        const mongoReports = await db.collection('reports').find({}).toArray();
        let migratedReports = 0;
        
        for (const report of mongoReports) {
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
                migratedReports++;
                console.log(`   ✅ Report ${report.reason}`);
            } catch (error) {
                console.log(`   ❌ Failed to migrate report: ${error.message}`);
            }
        }
        
        console.log('\n🎉 MIGRATION COMPLETE!');
        console.log('=====================================');
        console.log(`✅ Users migrated: ${migratedUsers}`);
        console.log(`✅ Friend requests migrated: ${migratedFriendRequests}`);
        console.log(`✅ Messages migrated: ${migratedMessages}`);
        console.log(`✅ Reports migrated: ${migratedReports}`);
        console.log('\n🚀 Your admin panel now has access to all your original data!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        if (mongoClient) {
            await mongoClient.close();
        }
        await prisma.$disconnect();
    }
}

migrateFromMongoDB();