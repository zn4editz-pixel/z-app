#!/usr/bin/env node

/**
 * SIMPLE MESSAGE SENDING TEST
 * Quick test to identify the exact issue
 */

const BACKEND_URL = "http://localhost:5001";

console.log("🧪 SIMPLE MESSAGE SENDING TEST");
console.log("==============================");

const runTest = async () => {
    try {
        // Step 1: Test backend health
        console.log("1️⃣ Testing backend health...");
        const healthResponse = await fetch(`${BACKEND_URL}/health/ping`);
        if (!healthResponse.ok) {
            console.log("❌ Backend health check failed");
            return;
        }
        console.log("✅ Backend is healthy");

        // Step 2: Login
        console.log("\n2️⃣ Testing login...");
        const loginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emailOrUsername: "z4fwan77@gmail.com",
                password: "admin123"
            })
        });

        if (!loginResponse.ok) {
            console.log("❌ Login failed:", loginResponse.status);
            const error = await loginResponse.text();
            console.log("Error:", error);
            return;
        }

        const loginData = await loginResponse.json();
        console.log("✅ Login successful");
        console.log("User:", loginData.username || loginData.fullName);
        
        const token = loginData.token;
        if (!token) {
            console.log("❌ No token received");
            return;
        }

        // Step 3: Get users
        console.log("\n3️⃣ Getting users...");
        const usersResponse = await fetch(`${BACKEND_URL}/api/messages/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!usersResponse.ok) {
            console.log("❌ Users fetch failed:", usersResponse.status);
            return;
        }

        const users = await usersResponse.json();
        console.log(`✅ Found ${users.length} users`);
        
        if (users.length === 0) {
            console.log("❌ No users to send message to");
            return;
        }

        const receiverId = users[0].id;
        console.log("Target user:", users[0].username || users[0].nickname);

        // Step 4: Send message (THE CRITICAL TEST)
        console.log("\n4️⃣ Sending test message...");
        const messageResponse = await fetch(`${BACKEND_URL}/api/messages/send/${receiverId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                text: `🧪 Test message - ${new Date().toISOString()}`
            })
        });

        console.log("Response status:", messageResponse.status);
        console.log("Response headers:", Object.fromEntries(messageResponse.headers.entries()));

        if (messageResponse.ok) {
            const message = await messageResponse.json();
            console.log("🎉 MESSAGE SENDING WORKS!");
            console.log("Message ID:", message.id);
            console.log("Text:", message.text);
            console.log("\n✅ CONCLUSION: Backend API is working correctly");
            console.log("If frontend still doesn't work, the issue is in the frontend code");
        } else {
            const error = await messageResponse.text();
            console.log("❌ MESSAGE SENDING FAILED");
            console.log("Status:", messageResponse.status);
            console.log("Error:", error);
            
            // Analyze the error
            if (messageResponse.status === 401) {
                console.log("\n🔍 ANALYSIS: Authentication issue");
            } else if (messageResponse.status === 404) {
                console.log("\n🔍 ANALYSIS: Route not found or user doesn't exist");
            } else if (messageResponse.status === 500) {
                console.log("\n🔍 ANALYSIS: Server error - check backend logs");
            }
        }

    } catch (error) {
        console.log("💥 Test failed with error:", error.message);
        console.log("\n🔍 ANALYSIS: Network or connection issue");
        console.log("- Check if backend is running on port 5001");
        console.log("- Check for CORS issues");
    }
};

runTest();