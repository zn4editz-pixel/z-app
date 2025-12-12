import axios from 'axios';

// Create axios instance for testing
const axiosInstance = axios.create({
    baseURL: 'http://localhost:5001/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

async function testUsernameUpdate() {
    try {
        console.log('🧪 Testing username update functionality...');
        
        // First, login as admin
        const loginRes = await axiosInstance.post('/auth/login', {
            emailOrUsername: 'z4fwan77@gmail.com',
            password: 'admin123'
        });
        
        console.log('✅ Login successful');
        
        // Set authorization header
        const token = loginRes.data.token;
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Get current user info
        const userRes = await axiosInstance.get('/users/me');
        const currentUser = userRes.data;
        console.log('📋 Current user:', {
            username: currentUser.username,
            fullName: currentUser.fullName,
            email: currentUser.email
        });
        
        // Test username availability check
        const newUsername = 'safwan_updated_' + Date.now().toString().slice(-4);
        console.log(`🔍 Checking availability for username: ${newUsername}`);
        
        const availabilityRes = await axiosInstance.get(`/users/check-username/${newUsername}`);
        console.log('✅ Username availability:', availabilityRes.data);
        
        // Test username update
        console.log(`🔄 Updating username to: ${newUsername}`);
        const updateRes = await axiosInstance.put('/users/me', {
            username: newUsername
        });
        
        console.log('✅ Username update successful!');
        console.log('📋 Updated user:', {
            username: updateRes.data.username,
            fullName: updateRes.data.fullName,
            email: updateRes.data.email
        });
        
        // Test username change info
        const changeInfoRes = await axiosInstance.get('/users/username-change-info');
        console.log('📊 Username change info:', changeInfoRes.data);
        
        console.log('🎉 All username update tests passed!');
        
    } catch (error) {
        console.error('❌ Username update test failed:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.response?.data?.error || error.message,
            data: error.response?.data
        });
    }
}

testUsernameUpdate();