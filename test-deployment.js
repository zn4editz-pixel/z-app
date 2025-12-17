#!/usr/bin/env node

// DEPLOYMENT VERIFICATION SCRIPT
// Run with: node test-deployment.js

import fetch from 'node-fetch';

const BACKEND_URL = 'https://z-app-backend.onrender.com';
const FRONTEND_URL = 'https://z-app-official.vercel.app';

console.log('🧪 Testing Z-App Deployment...\n');

// Test 1: Backend Health Check
async function testBackendHealth() {
  try {
    console.log('1️⃣ Testing backend health...');
    const response = await fetch(`${BACKEND_URL}/health/ping`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend health check passed');
      console.log(`   Status: ${data.status}`);
      console.log(`   Database: ${data.database || 'unknown'}`);
    } else {
      console.log('❌ Backend health check failed');
      console.log(`   Status: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ Backend health check error:', error.message);
  }
  console.log('');
}

// Test 2: Backend API Endpoints
async function testBackendAPI() {
  try {
    console.log('2️⃣ Testing backend API endpoints...');
    
    // Test settings endpoint
    const settingsResponse = await fetch(`${BACKEND_URL}/api/settings`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (settingsResponse.ok) {
      console.log('✅ Settings API endpoint working');
    } else {
      console.log('❌ Settings API endpoint failed:', settingsResponse.status);
    }
    
    // Test auth endpoint (should return 400 for missing data, not CORS error)
    const authResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    if (authResponse.status === 400) {
      console.log('✅ Auth API endpoint working (400 expected for empty body)');
    } else {
      console.log('❌ Auth API endpoint unexpected status:', authResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Backend API test error:', error.message);
  }
  console.log('');
}

// Test 3: Frontend Accessibility
async function testFrontend() {
  try {
    console.log('3️⃣ Testing frontend accessibility...');
    const response = await fetch(FRONTEND_URL, {
      method: 'GET',
      headers: { 'Accept': 'text/html' }
    });
    
    if (response.ok) {
      console.log('✅ Frontend is accessible');
      console.log(`   Status: ${response.status} ${response.statusText}`);
    } else {
      console.log('❌ Frontend accessibility failed');
      console.log(`   Status: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ Frontend test error:', error.message);
  }
  console.log('');
}

// Test 4: CORS Preflight
async function testCORS() {
  try {
    console.log('4️⃣ Testing CORS configuration...');
    const response = await fetch(`${BACKEND_URL}/api/settings`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
    };
    
    if (corsHeaders['Access-Control-Allow-Origin']) {
      console.log('✅ CORS headers present');
      console.log(`   Allow-Origin: ${corsHeaders['Access-Control-Allow-Origin']}`);
      console.log(`   Allow-Methods: ${corsHeaders['Access-Control-Allow-Methods']}`);
    } else {
      console.log('❌ CORS headers missing');
    }
    
  } catch (error) {
    console.log('❌ CORS test error:', error.message);
  }
  console.log('');
}

// Run all tests
async function runTests() {
  await testBackendHealth();
  await testBackendAPI();
  await testFrontend();
  await testCORS();
  
  console.log('🎯 Test Summary:');
  console.log('   Backend URL:', BACKEND_URL);
  console.log('   Frontend URL:', FRONTEND_URL);
  console.log('');
  console.log('📋 Next Steps:');
  console.log('   1. Update environment variables as per URGENT_DEPLOYMENT_INSTRUCTIONS.md');
  console.log('   2. Redeploy both services');
  console.log('   3. Run this script again to verify');
  console.log('   4. Test login functionality in browser');
}

runTests().catch(console.error);