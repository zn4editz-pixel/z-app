// Frontend Connectivity Test
import fetch from 'node-fetch';

const FRONTEND_URL = 'http://localhost:5174';
const BACKEND_URL = 'http://localhost:5001';

async function testFrontendConnectivity() {
    console.log('🧪 FRONTEND CONNECTIVITY TEST\n');
    console.log('=' .repeat(50));
    
    try {
        // 1. Test Frontend Server
        console.log('\n1️⃣ TESTING FRONTEND SERVER...');
        try {
            const frontendResponse = await fetch(FRONTEND_URL, { timeout: 5000 });
            if (frontendResponse.ok) {
                console.log('✅ Frontend server responding');
                console.log(`   📊 Status: ${frontendResponse.status}`);
            } else {
                console.log(`❌ Frontend server error: ${frontendResponse.status}`);
            }
        } catch (error) {
            console.log(`❌ Frontend server not accessible: ${error.message}`);
        }
        
        // 2. Test Backend Server
        console.log('\n2️⃣ TESTING BACKEND SERVER...');
        try {
            const backendResponse = await fetch(`${BACKEND_URL}/health/ping`, { timeout: 5000 });
            if (backendResponse.ok) {
                const data = await backendResponse.json();
                console.log('✅ Backend server responding');
                console.log(`   📊 Status: ${backendResponse.status}`);
                console.log(`   ⏱️ Uptime: ${Math.round(data.uptime)}s`);
                console.log(`   💾 Memory: ${data.memory}`);
            } else {
                console.log(`❌ Backend server error: ${backendResponse.status}`);
            }
        } catch (error) {
            console.log(`❌ Backend server not accessible: ${error.message}`);
        }
        
        // 3. Test CORS
        console.log('\n3️⃣ TESTING CORS CONFIGURATION...');
        try {
            const corsResponse = await fetch(`${BACKEND_URL}/api/test`, {
                method: 'GET',
                headers: {
                    'Origin': FRONTEND_URL,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            
            if (corsResponse.ok) {
                console.log('✅ CORS configuration working');
            } else {
                console.log(`❌ CORS issue: ${corsResponse.status}`);
            }
        } catch (error) {
            console.log(`❌ CORS test failed: ${error.message}`);
        }
        
        // 4. Test API Endpoints
        console.log('\n4️⃣ TESTING KEY API ENDPOINTS...');
        
        const endpoints = [
            '/api/auth/check',
            '/api/friends/all',
            '/api/messages/users',
            '/api/admin/users'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                    headers: { 'Origin': FRONTEND_URL },
                    timeout: 3000
                });
                
                // 401 is expected for protected routes without auth
                if (response.status === 401) {
                    console.log(`✅ ${endpoint} - Protected (401 as expected)`);
                } else if (response.ok) {
                    console.log(`✅ ${endpoint} - Working (${response.status})`);
                } else {
                    console.log(`❌ ${endpoint} - Error (${response.status})`);
                }
            } catch (error) {
                console.log(`❌ ${endpoint} - Failed: ${error.message}`);
            }
        }
        
        // 5. Summary
        console.log('\n🎉 CONNECTIVITY TEST SUMMARY');
        console.log('=' .repeat(50));
        console.log('✅ Frontend URL: ' + FRONTEND_URL);
        console.log('✅ Backend URL: ' + BACKEND_URL);
        console.log('✅ Test completed - Check results above');
        console.log('\n📝 Next Steps:');
        console.log('1. Open browser to: ' + FRONTEND_URL);
        console.log('2. Check browser console for any errors');
        console.log('3. Test login and friend functionality');
        
    } catch (error) {
        console.error('\n❌ CONNECTIVITY TEST FAILED:', error.message);
    }
}

testFrontendConnectivity();