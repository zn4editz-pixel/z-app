import axios from 'axios';

async function testAdminLogin() {
    try {
        console.log('🔑 TESTING ADMIN LOGIN API...\n');
        
        const loginData = {
            emailOrUsername: 'ronaldo@gmail.com',
            password: 'admin123'
        };
        
        console.log('Attempting login with:');
        console.log(`Email/Username: ${loginData.emailOrUsername}`);
        console.log(`Password: ${loginData.password}`);
        
        const response = await axios.post('http://localhost:5001/api/auth/login', loginData);
        
        console.log('\n✅ LOGIN SUCCESSFUL!');
        console.log('Response:', response.data);
        
        if (response.data.token) {
            console.log('\n🎉 TOKEN RECEIVED - Authentication working!');
            console.log(`User: ${response.data.fullName} (${response.data.email})`);
            console.log(`Username: ${response.data.username}`);
            console.log(`ID: ${response.data.id}`);
        }
        
    } catch (error) {
        console.error('❌ LOGIN FAILED:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data?.message || error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testAdminLogin();