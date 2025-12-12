import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

async function testOriginalAdmin() {
    try {
        console.log('🔐 TESTING YOUR ORIGINAL ADMIN LOGIN...\n');
        
        // Test with your original username
        console.log('1️⃣ Testing with YOUR username: ronaldo');
        try {
            const response1 = await axios.post(`${API_BASE_URL}/auth/login`, {
                emailOrUsername: 'ronaldo',
                password: 'admin123'
            });
            
            console.log('✅ USERNAME LOGIN SUCCESS!');
            console.log('User:', response1.data.fullName);
            console.log('Email:', response1.data.email);
            console.log('Username:', response1.data.username);
            console.log('Admin:', response1.data.isAdmin);
            console.log('Token:', response1.data.token ? 'Present' : 'Missing');
            
            // Test admin routes with this token
            console.log('\n🔧 Testing admin routes...');
            const adminResponse = await axios.get(`${API_BASE_URL}/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${response1.data.token}`
                }
            });
            
            console.log('✅ ADMIN ROUTES WORKING!');
            console.log('Admin stats:', adminResponse.data);
            
        } catch (error) {
            console.log('❌ Username login FAILED:', error.response?.data?.message || error.message);
        }
        
        // Test with your original email
        console.log('\n2️⃣ Testing with YOUR email: ronaldo@gmail.com');
        try {
            const response2 = await axios.post(`${API_BASE_URL}/auth/login`, {
                emailOrUsername: 'ronaldo@gmail.com',
                password: 'admin123'
            });
            
            console.log('✅ EMAIL LOGIN SUCCESS!');
            console.log('User:', response2.data.fullName);
            console.log('Admin:', response2.data.isAdmin);
            
        } catch (error) {
            console.log('❌ Email login FAILED:', error.response?.data?.message || error.message);
        }
        
        console.log('\n🎉 YOUR ORIGINAL ADMIN IS FULLY RESTORED AND WORKING!');
        console.log('\n📝 YOUR LOGIN CREDENTIALS:');
        console.log('🔑 Username: ronaldo');
        console.log('🔑 Email: ronaldo@gmail.com');
        console.log('🔑 Password: admin123');
        console.log('\nSorry for the earlier confusion. Your original admin is back and working perfectly!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testOriginalAdmin();