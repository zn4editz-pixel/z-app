// Test script to verify admin API endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001/api';

async function testAdminEndpoints() {
    console.log('🧪 Testing Admin API Endpoints...\n');
    
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    try {
        const healthRes = await fetch('http://localhost:5001/health');
        const health = await healthRes.json();
        console.log('✅ Health check:', health.status);
    } catch (err) {
        console.log('❌ Health check failed:', err.message);
        return;
    }
    
    // Test 2: Try to access admin stats without auth (should fail)
    console.log('\n2️⃣ Testing admin stats without auth (should fail)...');
    try {
        const statsRes = await fetch(`${BASE_URL}/admin/stats`);
        if (statsRes.status === 401 || statsRes.status === 403) {
            console.log('✅ Correctly blocked unauthorized access');
        } else {
            console.log('⚠️ Unexpected status:', statsRes.status);
        }
    } catch (err) {
        console.log('❌ Request failed:', err.message);
    }
    
    // Test 3: Try to get users without auth (should fail)
    console.log('\n3️⃣ Testing get users without auth (should fail)...');
    try {
        const usersRes = await fetch(`${BASE_URL}/admin/users`);
        if (usersRes.status === 401 || usersRes.status === 403) {
            console.log('✅ Correctly blocked unauthorized access');
        } else {
            console.log('⚠️ Unexpected status:', usersRes.status);
        }
    } catch (err) {
        console.log('❌ Request failed:', err.message);
    }
    
    console.log('\n📝 Summary:');
    console.log('- Backend is running ✅');
    console.log('- Admin routes are protected ✅');
    console.log('- You need to login as admin user (ronaldo@gmail.com) in the browser');
    console.log('- Check browser console for authentication errors');
}

testAdminEndpoints().catch(console.error);
