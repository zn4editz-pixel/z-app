import { MongoClient } from 'mongodb';

const MONGODB_URI = "mongodb+srv://z4fwan77:OCc9YMeaZxBf5gRi@cluster0.9rlfy9u.mongodb.net/chat_db?retryWrites=true&w=majority&appName=Cluster0";

async function checkMongoDB() {
    let client;
    try {
        console.log('🔍 Checking MongoDB for your original data...\n');
        
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        const db = client.db('chat_db');
        
        // Check users collection
        const usersCollection = db.collection('users');
        const userCount = await usersCollection.countDocuments();
        console.log(`👥 USERS IN MONGODB: ${userCount}`);
        
        if (userCount > 0) {
            const users = await usersCollection.find({}).limit(10).toArray();
            console.log('\n📋 SAMPLE USERS:');
            users.forEach((user, i) => {
                console.log(`${i+1}. ${user.fullName || user.name} (${user.email})`);
            });
        }
        
        // Check messages
        const messagesCollection = db.collection('messages');
        const messageCount = await messagesCollection.countDocuments();
        console.log(`\n💬 MESSAGES IN MONGODB: ${messageCount}`);
        
        // Check other collections
        const collections = await db.listCollections().toArray();
        console.log('\n📁 COLLECTIONS FOUND:');
        for (const collection of collections) {
            const count = await db.collection(collection.name).countDocuments();
            console.log(`   ${collection.name}: ${count} documents`);
        }
        
        if (userCount > 2) {
            console.log('\n✅ FOUND YOUR ORIGINAL DATA IN MONGODB!');
            console.log('🔄 We can migrate this data back to your current database.');
        }
        
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error.message);
        console.log('\n💡 This might mean:');
        console.log('   - MongoDB connection expired');
        console.log('   - Data was only in PostgreSQL');
        console.log('   - Need to check other backup sources');
    } finally {
        if (client) {
            await client.close();
        }
    }
}

checkMongoDB();