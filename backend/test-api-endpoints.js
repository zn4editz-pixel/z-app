import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';

async function testEndpoints() {
    console.log('🧪 Testing API Endpoints...\n');
    
    const endpoints = [
        '/health',
        '/api/auth/check',
        '/api/friends/all',
        '/api/friends/requests',
        '/api/admin/stats'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`Testing: ${endpoint}`);
            const response = await fetch(`${BASE_URL}${endpoint}`);
            console.log(`Status: ${response.status} ${response.statusText}`);
            
            if (response.status === 404) {
                console.log('❌ Route not found');
            } else if (response.status === 401) {
                console.log('🔒 Authentication required (expected)');
            } else {
                console.log('✅ Route exists');
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        console.log('---');
    }
}

testEndpoints().catch(console.error);