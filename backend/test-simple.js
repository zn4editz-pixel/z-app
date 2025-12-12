import http from 'http';

function testEndpoint(path) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 5001,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            console.log(`${path}: ${res.statusCode} ${res.statusMessage}`);
            resolve(res.statusCode);
        });

        req.on('error', (err) => {
            console.log(`${path}: ERROR - ${err.message}`);
            resolve(null);
        });

        req.end();
    });
}

async function testAll() {
    console.log('🧪 Testing API Endpoints...\n');
    
    await testEndpoint('/health');
    await testEndpoint('/api/auth/check');
    await testEndpoint('/api/friends/all');
    await testEndpoint('/api/friends/requests');
    await testEndpoint('/api/admin/stats');
}

testAll();