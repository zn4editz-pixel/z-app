import fetch from 'node-fetch';

async function testLoginAPI() {
    try {
        console.log('🔍 Testing login API endpoint...\n');
        
        const loginData = {
            emailOrUsername: 'z4fwan77@gmail.com',
            password: 'admin123'
        };
        
        console.log('📤 Sending login request:');
        console.log('   URL: http://localhost:5001/api/auth/login');
        console.log('   Data:', loginData);
        
        const response = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });
        
        console.log(`\n📥 Response status: ${response.status}`);
        console.log(`   Status text: ${response.statusText}`);
        
        const responseData = await response.text();
        console.log(`   Response body: ${responseData}`);
        
        if (response.ok) {
            console.log('✅ Login API working correctly!');
            const jsonData = JSON.parse(responseData);
            console.log('   User ID:', jsonData.id);
            console.log('   Email:', jsonData.email);
            console.log('   Is Admin:', jsonData.isAdmin);
        } else {
            console.log('❌ Login API failed');
            try {
                const errorData = JSON.parse(responseData);
                console.log('   Error message:', errorData.message);
            } catch (e) {
                console.log('   Raw error:', responseData);
            }
        }
        
    } catch (error) {
        console.error('❌ Error testing login API:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n🚨 Backend server is not running!');
            console.log('   Please start the backend server:');
            console.log('   cd backend && npm run dev');
        }
    }
}

testLoginAPI();