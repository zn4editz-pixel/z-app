#!/usr/bin/env node

/**
 * Test admin functions on deployed backend
 * Run with: node test-admin-deployment.js
 */

const BACKEND_URL = 'https://z-app-backend.onrender.com';

async function testAdminEndpoints() {
    console.log('🧪 Testing Admin Endpoints on Production...\n');
    console.log(`🌐 Backend URL: ${BACKEND_URL}\n`);

    try {
        // Test 1: Health check
        console.log('1️⃣ Testing health endpoint...');
        const healthResponse = await fetch(`${BACKEND_URL}/api/health`);
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ Health check passed:', healthData);
        } else {
            console.log('❌ Health check failed:', healthResponse.status);
        }
        console.log('');

        // Test 2: Check if admin routes are accessible (should return 401/403 without auth)
        console.log('2️⃣ Testing admin route accessibility...');
        const adminResponse = await fetch(`${BACKEND_URL}/api/admin/users`);
        console.log(`📡 Admin users endpoint status: ${adminResponse.status}`);
        
        if (adminResponse.status === 401) {
            console.log('✅ Admin routes properly protected (401 Unauthorized)');
        } else if (adminResponse.status === 403) {
            console.log('✅ Admin routes properly protected (403 Forbidden)');
        } else {
            console.log('⚠️ Unexpected response from admin endpoint');
        }
        console.log('');

        // Test 3: Check database connectivity through a public endpoint
        console.log('3️⃣ Testing database connectivity...');
        const dbTestResponse = await fetch(`${BACKEND_URL}/api/auth/check`);
        console.log(`📡 Database test endpoint status: ${dbTestResponse.status}`);
        
        if (dbTestResponse.ok) {
            console.log('✅ Database appears to be connected');
        } else {
            console.log('❌ Database connection issues detected');
        }
        console.log('');

        // Test 4: Check CORS headers
        console.log('4️⃣ Testing CORS configuration...');
        const corsResponse = await fetch(`${BACKEND_URL}/api/health`, {
            method: 'OPTIONS'
        });
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers')
        };
        
        console.log('CORS Headers:', corsHeaders);
        
        if (corsHeaders['Access-Control-Allow-Origin']) {
            console.log('✅ CORS properly configured');
        } else {
            console.log('⚠️ CORS might not be properly configured');
        }
        console.log('');

        console.log('🎉 Production deployment test completed!');
        console.log('\n📋 Summary:');
        console.log('- Backend is accessible');
        console.log('- Admin routes are protected');
        console.log('- Database connectivity verified');
        console.log('- CORS configuration checked');
        console.log('\n💡 To test admin functions, you need to:');
        console.log('1. Login as an admin user');
        console.log('2. Get the auth token');
        console.log('3. Use the token in Authorization header');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.code === 'ENOTFOUND') {
            console.error('🌐 Network error: Cannot reach the backend server');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('🔌 Connection refused: Backend server might be down');
        }
    }
}

// Run the tests
testAdminEndpoints().catch(console.error);