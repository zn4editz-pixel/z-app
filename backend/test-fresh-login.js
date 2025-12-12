import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

async function testFreshLogin() {
    try {
        console.log('🔐 Testing fresh admin login...\n');
        
        // Test with username
        console.log('1️⃣ Testing with username: admin');
        try {
            const response1 = await axios.post(`${API_BASE_URL}/auth/login`, {
                emailOrUsername: 'admin',
                password: 'admin123'
            });
            
            console.log('✅ Username login SUCCESS!');
            console.log('User:', response1.data.fullName);
            console.log('Email:', response1.data.email);
            console.log('Token:', response1.data.token ? 'Present' : 'Missing');
            
        } catch (error) {
            console.log('❌ Username login FAILED:', error.response?.data?.message || error.message);
        }
        
        // Test with email
        console.log('\n2️⃣ Testing with email: admin@admin.com');
        try {
            const response2 = await axios.post(`${API_BASE_URL}/auth/login`, {
                emailOrUsername: 'admin@admin.com',
                password: 'admin123'
            });
            
            console.log('✅ Email login SUCCESS!');
            console.log('User:', response2.data.fullName);
            console.log('Email:', response2.data.email);
            console.log('Token:', response2.data.token ? 'Present' : 'Missing');
            
        } catch (error) {
            console.log('❌ Email login FAILED:', error.response?.data?.message || error.message);
        }
        
        // Test with test user
        console.log('\n3️⃣ Testing test user login');
        try {
            const response3 = await axios.post(`${API_BASE_URL}/auth/login`, {
                emailOrUsername: 'test',
                password: 'test123'
            });
            
            console.log('✅ Test user login SUCCESS!');
            console.log('User:', response3.data.fullName);
            console.log('Email:', response3.data.email);
            
        } catch (error) {
            console.log('❌ Test user login FAILED:', error.response?.data?.message || error.message);
        }
        
        console.log('\n🎉 Login test complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testFreshLogin();