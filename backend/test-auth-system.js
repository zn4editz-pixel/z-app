import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

async function testAuthSystem() {
    try {
        console.log('🔐 Testing Authentication System...\n');
        
        // 1. Test health check
        console.log('1️⃣ Testing health check...');
        try {
            const healthResponse = await axios.get('http://localhost:5001/health/ping');
            console.log('   ✅ Health check passed:', healthResponse.data);
        } catch (error) {
            console.log('   ❌ Health check failed:', error.message);
        }
        
        // 2. Test admin login
        console.log('\n2️⃣ Testing admin login...');
        try {
            const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
                emailOrUsername: 'ronaldo@gmail.com',
                password: 'admin123'
            });
            
            const { token, ...user } = loginResponse.data;
            console.log('   ✅ Admin login successful!');
            console.log(`   User: ${user.fullName} (${user.email})`);
            console.log(`   Admin: ${user.isAdmin}`);
            console.log(`   Token: ${token ? 'Present' : 'Missing'}`);
            
            // 3. Test auth check with token
            console.log('\n3️⃣ Testing auth check...');
            try {
                const authResponse = await axios.get(`${API_BASE_URL}/auth/check`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                console.log('   ✅ Auth check passed!');
                console.log(`   User: ${authResponse.data.fullName}`);
                console.log(`   Admin: ${authResponse.data.isAdmin}`);
                
                // 4. Test admin routes
                console.log('\n4️⃣ Testing admin routes...');
                try {
                    const adminStatsResponse = await axios.get(`${API_BASE_URL}/admin/stats`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    console.log('   ✅ Admin stats route working!');
                    console.log('   Stats:', adminStatsResponse.data);
                    
                } catch (error) {
                    console.log('   ❌ Admin routes failed:', error.response?.status, error.response?.data?.error || error.message);
                }
                
            } catch (error) {
                console.log('   ❌ Auth check failed:', error.response?.status, error.response?.data?.error || error.message);
            }
            
        } catch (error) {
            console.log('   ❌ Admin login failed:', error.response?.status, error.response?.data?.message || error.message);
        }
        
        // 5. Test user signup
        console.log('\n5️⃣ Testing user signup...');
        try {
            const signupResponse = await axios.post(`${API_BASE_URL}/auth/signup`, {
                fullName: 'Test User New',
                email: 'testnew@example.com',
                username: 'testnew',
                password: 'password123',
                bio: 'Test user for authentication testing'
            });
            
            const { token: newToken, ...newUser } = signupResponse.data;
            console.log('   ✅ User signup successful!');
            console.log(`   User: ${newUser.fullName} (${newUser.email})`);
            console.log(`   Token: ${newToken ? 'Present' : 'Missing'}`);
            
            // 6. Test friend system
            console.log('\n6️⃣ Testing friend system...');
            try {
                const friendsResponse = await axios.get(`${API_BASE_URL}/friends`, {
                    headers: {
                        'Authorization': `Bearer ${newToken}`
                    }
                });
                
                console.log('   ✅ Friends endpoint working!');
                console.log('   Friends data:', friendsResponse.data);
                
            } catch (error) {
                console.log('   ❌ Friends endpoint failed:', error.response?.status, error.response?.data?.message || error.message);
            }
            
        } catch (error) {
            console.log('   ❌ User signup failed:', error.response?.status, error.response?.data?.message || error.message);
        }
        
        console.log('\n🎉 Authentication system test complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAuthSystem();