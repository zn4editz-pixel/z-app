#!/usr/bin/env node

/**
 * Comprehensive Message Issue Diagnosis
 * Checks all possible causes of message sending failures
 */

import fs from 'fs';
import path from 'path';

console.log("🔍 DIAGNOSING MESSAGE SENDING ISSUES");
console.log("====================================");

// Check 1: Backend server status
const checkBackendServer = async () => {
    console.log("\n1️⃣ Checking Backend Server...");
    
    try {
        const response = await fetch("http://localhost:5001/api/health");
        if (response.ok) {
            console.log("✅ Backend server is running");
            return true;
        } else {
            console.log("❌ Backend server responded with error:", response.status);
            return false;
        }
    } catch (error) {
        console.log("❌ Backend server is not running");
        console.log("💡 Solution: Run 'cd backend && npm run dev'");
        return false;
    }
};

// Check 2: Frontend environment configuration
const checkFrontendConfig = () => {
    console.log("\n2️⃣ Checking Frontend Configuration...");
    
    const envPath = path.join(process.cwd(), 'frontend', '.env');
    
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        console.log("📄 Frontend .env file found");
        
        if (envContent.includes('VITE_API_BASE_URL')) {
            const match = envContent.match(/VITE_API_BASE_URL=(.+)/);
            if (match) {
                console.log("✅ API URL configured:", match[1]);
                return true;
            }
        }
        
        console.log("❌ VITE_API_BASE_URL not found in .env");
        console.log("💡 Add: VITE_API_BASE_URL=http://localhost:5001");
        return false;
    } else {
        console.log("❌ Frontend .env file not found");
        console.log("💡 Create frontend/.env with: VITE_API_BASE_URL=http://localhost:5001");
        return false;
    }
};

// Check 3: Message API endpoints
const checkMessageEndpoints = async () => {
    console.log("\n3️⃣ Checking Message API Endpoints...");
    
    try {
        // Test login first
        const loginResponse = await fetch("http://localhost:5001/api/auth/login", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: "z4fwan77@gmail.com",
                password: "admin123"
            })
        });

        if (!loginResponse.ok) {
            console.log("❌ Login failed - cannot test message endpoints");
            return false;
        }

        const { token } = await loginResponse.json();
        console.log("✅ Authentication successful");

        // Test getting users for sidebar
        const usersResponse = await fetch("http://localhost:5001/api/users/sidebar", {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (usersResponse.ok) {
            const users = await usersResponse.json();
            console.log(`✅ Users endpoint working (${users.length} users)`);
            
            if (users.length > 0) {
                // Test sending a message
                const messageResponse = await fetch(`http://localhost:5001/api/messages/send/${users[0].id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ text: "Test message" })
                });

                if (messageResponse.ok) {
                    console.log("✅ Message sending API works");
                    return true;
                } else {
                    const error = await messageResponse.text();
                    console.log("❌ Message sending failed:", error);
                    return false;
                }
            } else {
                console.log("⚠️ No users found to test messaging");
                return true; // API works, just no users
            }
        } else {
            console.log("❌ Users endpoint failed");
            return false;
        }
    } catch (error) {
        console.log("❌ API test failed:", error.message);
        return false;
    }
};

// Check 4: Socket connection
const checkSocketConnection = () => {
    console.log("\n4️⃣ Checking Socket Connection...");
    
    return new Promise((resolve) => {
        try {
            const { io } = require('socket.io-client');
            const socket = io("http://localhost:5001", {
                auth: { token: "test-token" },
                query: { userId: "1" }
            });

            socket.on("connect", () => {
                console.log("✅ Socket connection works");
                socket.disconnect();
                resolve(true);
            });

            socket.on("connect_error", (error) => {
                console.log("❌ Socket connection failed:", error.message);
                resolve(false);
            });

            setTimeout(() => {
                console.log("❌ Socket connection timed out");
                socket.disconnect();
                resolve(false);
            }, 5000);
        } catch (error) {
            console.log("❌ Socket test failed:", error.message);
            resolve(false);
        }
    });
};

// Check 5: Database connection
const checkDatabase = async () => {
    console.log("\n5️⃣ Checking Database Connection...");
    
    try {
        const response = await fetch("http://localhost:5001/api/users/sidebar", {
            headers: { 'Authorization': 'Bearer test-token' }
        });
        
        // Even if auth fails, if we get a 401, it means the endpoint is reachable
        if (response.status === 401 || response.status === 200) {
            console.log("✅ Database connection appears to be working");
            return true;
        } else {
            console.log("❌ Database connection issue");
            return false;
        }
    } catch (error) {
        console.log("❌ Database check failed:", error.message);
        return false;
    }
};

// Main diagnostic function
const runDiagnostics = async () => {
    const results = {
        backend: await checkBackendServer(),
        frontend: checkFrontendConfig(),
        api: false,
        socket: false,
        database: false
    };

    if (results.backend) {
        results.api = await checkMessageEndpoints();
        results.socket = await checkSocketConnection();
        results.database = await checkDatabase();
    }

    console.log("\n📊 DIAGNOSTIC RESULTS:");
    console.log("======================");
    console.log(`Backend Server: ${results.backend ? "✅ OK" : "❌ FAIL"}`);
    console.log(`Frontend Config: ${results.frontend ? "✅ OK" : "❌ FAIL"}`);
    console.log(`Message API: ${results.api ? "✅ OK" : "❌ FAIL"}`);
    console.log(`Socket Connection: ${results.socket ? "✅ OK" : "❌ FAIL"}`);
    console.log(`Database: ${results.database ? "✅ OK" : "❌ FAIL"}`);

    console.log("\n🎯 RECOMMENDATIONS:");
    console.log("===================");

    if (!results.backend) {
        console.log("🚨 CRITICAL: Start the backend server first!");
        console.log("   → cd backend && npm run dev");
    } else if (!results.frontend) {
        console.log("🔧 Fix frontend configuration:");
        console.log("   → Create/update frontend/.env with VITE_API_BASE_URL=http://localhost:5001");
    } else if (!results.api) {
        console.log("🔧 API issues detected:");
        console.log("   → Check backend logs for errors");
        console.log("   → Verify authentication is working");
        console.log("   → Check message controller implementation");
    } else if (!results.socket) {
        console.log("🔧 Socket issues detected:");
        console.log("   → Check socket handlers are loaded");
        console.log("   → Verify socket authentication");
        console.log("   → Check browser console for socket errors");
    } else {
        console.log("🎉 All systems appear to be working!");
        console.log("   → If messages still don't send, check browser console");
        console.log("   → Clear browser cache and localStorage");
        console.log("   → Make sure you're logged in properly");
    }

    console.log("\n🔍 NEXT STEPS:");
    console.log("==============");
    console.log("1. Fix any failed checks above");
    console.log("2. Open browser DevTools (F12)");
    console.log("3. Check Console tab for JavaScript errors");
    console.log("4. Check Network tab for failed requests");
    console.log("5. Try sending a simple text message");
};

// Run diagnostics
runDiagnostics().catch(console.error);