import { MongoClient } from 'mongodb';

const MONGODB_URI = "mongodb+srv://z4fwan77:OCc9YMeaZxBf5gRi@cluster0.9rlfy9u.mongodb.net/chat_db?retryWrites=true&w=majority&appName=Cluster0";

async function analyzeMongoDBData() {
    let mongoClient;
    try {
        console.log('🔍 ANALYZING YOUR MONGODB DATA STRUCTURE...\n');
        
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        const db = mongoClient.db('chat_db');
        
        // 1. Analyze Users
        console.log('👥 ANALYZING USERS...');
        const users = await db.collection('users').find({}).limit(3).toArray();
        console.log('Sample user structure:');
        users.forEach((user, i) => {
            console.log(`User ${i + 1}:`, JSON.stringify(user, null, 2));
        });
        
        // 2. Analyze Friend Requests
        console.log('\n🤝 ANALYZING FRIEND REQUESTS...');
        const friendRequests = await db.collection('friendrequests').find({}).limit(5).toArray();
        console.log('Sample friend request structure:');
        friendRequests.forEach((req, i) => {
            console.log(`Friend Request ${i + 1}:`, JSON.stringify(req, null, 2));
        });
        
        // 3. Analyze Messages
        console.log('\n💬 ANALYZING MESSAGES...');
        const messages = await db.collection('messages').find({}).limit(3).toArray();
        console.log('Sample message structure:');
        messages.forEach((msg, i) => {
            console.log(`Message ${i + 1}:`, JSON.stringify(msg, null, 2));
        });
        
        // 4. Check all collections
        console.log('\n📊 ALL COLLECTIONS IN YOUR DATABASE:');
        const collections = await db.listCollections().toArray();
        collections.forEach(col => {
            console.log(`   - ${col.name}`);
        });
        
        // 5. Count all data
        console.log('\n📈 DATA COUNTS:');
        const userCount = await db.collection('users').countDocuments();
        const messageCount = await db.collection('messages').countDocuments();
        const friendRequestCount = await db.collection('friendrequests').countDocuments();
        
        console.log(`   Users: ${userCount}`);
        console.log(`   Messages: ${messageCount}`);
        console.log(`   Friend Requests: ${friendRequestCount}`);
        
        // 6. Check for other possible friend data
        console.log('\n🔍 CHECKING FOR OTHER FRIEND DATA...');
        try {
            const friends = await db.collection('friends').find({}).limit(3).toArray();
            console.log('Found friends collection:', friends.length, 'documents');
            if (friends.length > 0) {
                console.log('Sample friend structure:', JSON.stringify(friends[0], null, 2));
            }
        } catch (e) {
            console.log('No friends collection found');
        }
        
    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
    } finally {
        if (mongoClient) {
            await mongoClient.close();
        }
    }
}

analyzeMongoDBData();