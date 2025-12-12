#!/usr/bin/env node

/**
 * Simple Message API Test
 * Tests if message sending API is working
 */

const BACKEND_URL = "http://localhost:5001";

// Test if backend is running
const testBackend = async () => {
    console.log("🔍 Testing backend connection...");
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/health`);
        if (response.ok) {
            console.log("✅ Backend is running");
            return true;
        } else {
            console.log("❌ Backend responded with error:", response.status);
            return false;
        }
    } catch (error) {
        console.log("❌ Backend is not running:", error.message);
        console.log("💡 Start backend with: cd backend && npm run dev");
        return false;
    }
};

// Test authentication
const testAuth = async () => {
    console.log("🔍 Testing authentication...");
    
    try {
        // Try to login with admin credentials
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: "z4fwan77@gmail.com",
                password: "admin123"
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Authentication successful");
            return data.token;
        } else {
            const error = await response.text();
            console.log("❌ Authentication failed:", error);
            return null;
        }
    } catch (error) {
        console.log("❌ Auth test failed:", error.message);
        return null;
    }
};

// Test message sending
const testMessageSending = async (token) => {
    console.log("🔍 Testing message sending...");
    
    try {
        // Get users first to find a valid receiver
        const usersResponse = await fetch(`${BACKEND_URL}/api/users/sidebar`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!usersResponse.ok) {
            console.log("❌ Failed to get users");
            return false;
        }

        const users = await usersResponse.json();
        console.log(`📋 Found ${users.length} users`);

        if (users.length === 0) {
            console.log("❌ No users found to send message to");
            return false;
        }

        // Try to send a message to the first user
        const receiverId = users[0].id;
        const messageResponse = await fetch(`${BACKEND_URL}/api/messages/send/${receiverId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                text: "Test message from API test script"
            })
        });

        if (messageResponse.ok) {
            const message = await messageResponse.json();
            console.log("✅ Message sent successfully:", message.id);
            return true;
        } else {
            const error = await messageResponse.text();
            console.log("❌ Message sending failed:", messageResponse.status, error);
            return false;
        }
    } catch (error) {
        console.log("❌ Message test failed:", error.message);
        return false;
    }
};

// Main test function
const runTests = async () => {
    console.log("🧪 MESSAGE API TEST");
    console.log("===================");
    
    // Test backend
    const backendOk = await testBackend();
    if (!backendOk) {
        console.log("\n❌ Backend is not running. Please start it first.");
        return;
    }

    // Test auth
    const token = await testAuth();
    if (!token) {
        console.log("\n❌ Authentication failed. Check credentials.");
        return;
    }

    // Test message sending
    const messageOk = await testMessageSending(token);
    
    console.log("\n📊 TEST RESULTS:");
    console.log("================");
    console.log(`Backend: ${backendOk ? "✅ OK" : "❌ FAIL"}`);
    console.log(`Auth: ${token ? "✅ OK" : "❌ FAIL"}`);
    console.log(`Messages: ${messageOk ? "✅ OK" : "❌ FAIL"}`);
    
    if (backendOk && token && messageOk) {
        console.log("\n🎉 ALL TESTS PASSED!");
        console.log("Message sending API is working correctly.");
    } else {
        console.log("\n❌ SOME TESTS FAILED!");
        console.log("Check the errors above for details.");
    }
};

// Run the tests
runTests().catch(console.error);