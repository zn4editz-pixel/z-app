import http from 'http';

function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body, headers: res.headers });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testAdminLogin() {
    console.log('🧪 Testing Admin Login...\n');
    
    try {
        // Test admin login
        const loginData = {
            emailOrUsername: 'ronaldo@gmail.com',
            password: 'safwan123'
        };
        
        console.log('Attempting admin login...');
        const loginResponse = await makeRequest('/api/auth/login', 'POST', loginData);
        
        console.log(`Login Status: ${loginResponse.status}`);
        console.log('Login Response:', loginResponse.data);
        
        if (loginResponse.status === 200 && loginResponse.data.token) {
            console.log('\n✅ Admin login successful!');
            console.log('Token:', loginResponse.data.token.substring(0, 20) + '...');
            
            // Test protected route with token
            console.log('\nTesting protected route with token...');
            const authResponse = await makeRequest('/api/auth/check', 'GET');
            console.log(`Auth Check Status: ${authResponse.status}`);
            console.log('Auth Response:', authResponse.data);
        } else {
            console.log('❌ Admin login failed');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testAdminLogin();