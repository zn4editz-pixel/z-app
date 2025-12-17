#!/usr/bin/env node

/**
 * Quick test of admin functions on production
 * This tests the endpoints without authentication to verify they're properly protected
 */

const BACKEND_URL = 'https://z-app-backend.onrender.com';

async function quickAdminTest() {
    console.log('🚀 Quick Admin Functions Test\n');

    const testEndpoints = [
        { method: 'GET', path: '/api/admin/users', name: 'Get Users' },
        { method: 'GET', path: '/api/admin/stats', name: 'Get Stats' },
        { method: 'PUT', path: '/api/admin/suspend/test-id', name: 'Suspend User' },
        { method: 'DELETE', path: '/api/admin/delete/test-id', name: 'Delete User' }
    ];

    for (const endpoint of testEndpoints) {
        try {
            console.log(`🧪 Testing ${endpoint.name}...`);
            
            const response = await fetch(`${BACKEND_URL}${endpoint.path}`, {
                method: endpoint.method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: endpoint.method === 'PUT' ? JSON.stringify({ reason: 'test', duration: '1h' }) : undefined
            });

            const status = response.status;
            const statusText = response.statusText;

            if (status === 401) {
                console.log(`✅ ${endpoint.name}: Properly protected (401 Unauthorized)`);
            } else if (status === 403) {
                console.log(`✅ ${endpoint.name}: Properly protected (403 Forbidden)`);
            } else if (status === 404) {
                console.log(`⚠️ ${endpoint.name}: Endpoint not found (404) - Check route configuration`);
            } else if (status === 500) {
                console.log(`❌ ${endpoint.name}: Server error (500) - Function has issues`);
                try {
                    const errorText = await response.text();
                    console.log(`   Error details: ${errorText.substring(0, 200)}...`);
                } catch (e) {
                    console.log('   Could not read error details');
                }
            } else {
                console.log(`🔍 ${endpoint.name}: Unexpected status ${status} ${statusText}`);
            }

        } catch (error) {
            console.log(`❌ ${endpoint.name}: Network error - ${error.message}`);
        }
    }

    console.log('\n📋 Test Summary:');
    console.log('✅ = Endpoint is working and properly protected');
    console.log('⚠️ = Endpoint might have configuration issues');
    console.log('❌ = Endpoint has errors that need fixing');
    
    console.log('\n💡 Next Steps:');
    console.log('1. If all endpoints show ✅, the admin functions are ready');
    console.log('2. If any show ❌, check the backend logs on Render');
    console.log('3. Test with authentication using: node test-admin-with-auth.js [TOKEN]');
}

quickAdminTest().catch(console.error);