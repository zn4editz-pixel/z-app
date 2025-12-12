import axios from 'axios';

async function testSuggestedUsersAPI() {
    try {
        console.log('🧪 TESTING SUGGESTED USERS API...\n');
        
        // 1. Login as admin to get token
        console.log('1️⃣ Logging in as admin...');
        const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
            emailOrUsername: 'z4fwan77@gmail.com',
            password: 'admin123'
        });
        
        console.log('   ✅ Admin login successful');
        const adminToken = loginResponse.data.token;
        
        // 2. Test suggested users API
        console.log('\n2️⃣ Testing suggested users API...');
        const suggestedResponse = await axios.get('http://localhost:5001/api/users/suggested', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        const suggestedUsers = suggestedResponse.data;
        console.log(`   ✅ API returned ${suggestedUsers.length} suggested users`);
        
        // 3. Display suggested users
        console.log('\n3️⃣ Suggested users returned by API:');
        suggestedUsers.forEach((user, index) => {
            console.log(`     ${index + 1}. ${user.nickname || user.username} (@${user.username})`);
            console.log(`        Bio: ${user.bio || 'No bio'}`);
            console.log(`        Location: ${user.city}, ${user.country}`);
            console.log(`        Verified: ${user.isVerified ? '✅' : '❌'}`);
            console.log(`        Online: ${user.isOnline ? '🟢' : '⚫'}`);
            console.log('        ---');
        });
        
        console.log('\n🎉 SUGGESTED USERS API TEST COMPLETE!');
        console.log('=====================================');
        console.log(`✅ API working: ${suggestedUsers.length > 0 ? 'YES' : 'NO'}`);
        console.log(`✅ Users available: ${suggestedUsers.length}`);
        console.log('✅ Frontend should now show these users in suggested section');
        
        if (suggestedUsers.length === 0) {
            console.log('\n⚠️ If frontend still shows no users:');
            console.log('   1. Clear browser cache/localStorage');
            console.log('   2. Refresh the page');
            console.log('   3. Check browser console for errors');
        }
        
    } catch (error) {
        console.error('❌ API test failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data?.message || error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testSuggestedUsersAPI();