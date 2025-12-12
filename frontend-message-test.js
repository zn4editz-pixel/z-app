#!/usr/bin/env node

/**
 * FRONTEND MESSAGE SENDING TEST
 * Test the frontend message sending logic
 */

console.log("🧪 FRONTEND MESSAGE SENDING TEST");
console.log("================================");

// Simulate browser environment
global.window = {
    location: { pathname: '/home' },
    localStorage: {
        data: {},
        getItem(key) { return this.data[key] || null; },
        setItem(key, value) { this.data[key] = value; },
        removeItem(key) { delete this.data[key]; }
    },
    navigator: { onLine: true }
};

global.localStorage = global.window.localStorage;

// Mock fetch for axios
global.fetch = async (url, options) => {
    console.log(`📤 Frontend API Call: ${options?.method || 'GET'} ${url}`);
    console.log(`   Headers:`, options?.headers);
    console.log(`   Body:`, options?.body);
    
    // Simulate the actual backend
    const baseUrl = "http://localhost:5001";
    const actualUrl = url.replace(/^http:\/\/localhost:5001/, baseUrl);
    
    try {
        const response = await fetch(actualUrl, options);
        console.log(`📥 Response: ${response.status}`);
        return response;
    } catch (error) {
        console.log(`❌ Request failed: ${error.message}`);
        throw error;
    }
};

const testFrontendMessageSending = async () => {
    try {
        console.log("1️⃣ Testing frontend axios configuration...");
        
        // Import axios instance
        const { axiosInstance } = await import('./frontend/src/lib/axios.js');
        
        console.log("✅ Axios instance loaded");
        console.log("Base URL:", axiosInstance.defaults.baseURL);
        
        // Test login
        console.log("\n2️⃣ Testing frontend login...");
        
        const loginResponse = await axiosInstance.post('/auth/login', {
            emailOrUsername: "z4fwan77@gmail.com",
            password: "admin123"
        });
        
        console.log("✅ Frontend login successful");
        console.log("User:", loginResponse.data.username || loginResponse.data.fullName);
        
        const token = loginResponse.data.token;
        localStorage.setItem('token', token);
        localStorage.setItem('authUser', JSON.stringify(loginResponse.data));
        
        // Test getting users
        console.log("\n3️⃣ Testing frontend users fetch...");
        
        const usersResponse = await axiosInstance.get('/messages/users');
        console.log("✅ Frontend users fetch successful");
        console.log(`Found ${usersResponse.data.length} users`);
        
        if (usersResponse.data.length === 0) {
            console.log("❌ No users to send message to");
            return;
        }
        
        const receiverId = usersResponse.data[0].id;
        console.log("Target user:", usersResponse.data[0].username || usersResponse.data[0].nickname);
        
        // Test message sending
        console.log("\n4️⃣ Testing frontend message sending...");
        
        const messageResponse = await axiosInstance.post(`/messages/send/${receiverId}`, {
            text: `🧪 Frontend test message - ${new Date().toISOString()}`
        });
        
        console.log("🎉 FRONTEND MESSAGE SENDING WORKS!");
        console.log("Message ID:", messageResponse.data.id);
        console.log("Text:", messageResponse.data.text);
        
        console.log("\n✅ CONCLUSION: Frontend axios is working correctly");
        console.log("The issue might be in the React components or socket connection");
        
    } catch (error) {
        console.log("💥 Frontend test failed:", error.message);
        
        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Data:", error.response.data);
        }
        
        console.log("\n🔍 ANALYSIS:");
        if (error.message.includes('ECONNREFUSED')) {
            console.log("- Backend is not running on localhost:5001");
        } else if (error.response?.status === 401) {
            console.log("- Authentication issue");
        } else if (error.response?.status === 404) {
            console.log("- API endpoint not found");
        } else {
            console.log("- Unknown frontend issue");
        }
    }
};

testFrontendMessageSending();