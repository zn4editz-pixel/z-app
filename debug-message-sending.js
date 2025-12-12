#!/usr/bin/env node

/**
 * Debug Message Sending Issues
 * Tests the complete message flow from frontend to backend
 */

import { axiosInstance } from "./frontend/src/lib/axios.js";
import { io } from "socket.io-client";

const BACKEND_URL = "http://localhost:5001";

// Test API message sending
const testAPIMessageSending = async () => {
    console.log("🧪 Testing API Message Sending...");
    
    try {
        // First, check if backend is running
        const healthCheck = await fetch(`${BACKEND_URL}/api/health`);
        if (!healthCheck.ok) {
            throw new Error(`Backend not responding: ${healthCheck.status}`);
        }
        console.log("✅ Backend is running");

        // Test authentication
        const token = "your-test-token"; // Replace with actual token
        const testMessage = {
            text: "Test message from debug script",
            receiverId: "2" // Replace with actual receiver ID
        };

        const response = await fetch(`${BACKEND_URL}/api/messages/send/2`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testMessage)
        });

        if (response.ok) {
            const result = await response.json();
            console.log("✅ API message sending works:", result);
            return true;
        } else {
            const error = await response.text();
            console.log("❌ API message sending failed:", response.status, error);
            return false;
        }
    } catch (error) {
        console.error("❌ API test failed:", error.message);
        return false;
    }
};

// Test socket connection
const testSocketConnection = () => {
    console.log("🧪 Testing Socket Connection...");
    
    return new Promise((resolve) => {
        const socket = io(BACKEND_URL, {
            auth: { token: "your-test-token" },
            query: { userId: "1", token: "your-test-token" }
        });

        let connected = false;
        
        socket.on("connect", () => {
            console.log("✅ Socket connected:", socket.id);
            connected = true;
            
            // Test sending a message via socket
            socket.emit("sendMessage", {
                receiverId: "2",
                text: "Test socket message",
                senderId: "1"
            });
            
            setTimeout(() => {
                socket.disconnect();
                resolve(true);
            }, 2000);
        });

        socket.on("connect_error", (error) => {
            console.error("❌ Socket connection failed:", error.message);
            resolve(false);
        });

        socket.on("newMessage", (data) => {
            console.log("✅ Received message via socket:", data);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
            if (!connected) {
                console.log("❌ Socket connection timed out");
                socket.disconnect();
                resolve(false);
            }
        }, 10000);
    });
};

// Check frontend environment variables
const checkFrontendConfig = () => {
    console.log("🧪 Checking Frontend Configuration...");
    
    // Read frontend .env file
    try {
        const fs = await import('fs');
        const path = await import('path');
        
        const envPath = path.join(process.cwd(), 'frontend', '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            console.log("📄 Frontend .env content:");
            console.log(envContent);
            
            // Check if API URL is correct
            if (envContent.includes('VITE_API_BASE_URL')) {
                console.log("✅ VITE_API_BASE_URL is configured");
            } else {
                console.log("❌ VITE_API_BASE_URL is missing");
            }
        } else {
            console.log("❌ Frontend .env file not found");
        }
    } catch (error) {
        console.error("❌ Error reading frontend config:", error.message);
    }
};

// Check backend status
const checkBackendStatus = async () => {
    console.log("🧪 Checking Backend Status...");
    
    try {
        // Check if backend process is running
        const response = await fetch(`${BACKEND_URL}/api/health`);
        if (response.ok) {
            const data = await response.json();
            console.log("✅ Backend health check:", data);
        } else {
            console.log("❌ Backend health check failed:", response.status);
        }
    } catch (error) {
        console.error("❌ Backend is not running:", error.message);
        console.log("💡 Try running: cd backend && npm run dev");
    }
};

// Main diagnostic function
const runMessageDiagnostics = async () => {
    console.log("🔍 MESSAGE SENDING DIAGNOSTICS");
    console.log("==============================");
    
    // Check backend status
    await checkBackendStatus();
    
    // Check frontend config
    await checkFrontendConfig();
    
    // Test API message sending
    const apiResult = await testAPIMessageSending();
    
    // Test socket connection
    const socketResult = await testSocketConnection();
    
    // Summary
    console.log("\n📊 DIAGNOSTIC RESULTS:");
    console.log("======================");
    console.log(`API Message Sending: ${apiResult ? "✅ WORKING" : "❌ FAILED"}`);
    console.log(`Socket Connection: ${socketResult ? "✅ WORKING" : "❌ FAILED"}`);
    
    if (!apiResult && !socketResult) {
        console.log("\n🚨 CRITICAL ISSUES FOUND:");
        console.log("- Backend may not be running");
        console.log("- Check if backend is started: cd backend && npm run dev");
        console.log("- Check if frontend API URL is correct in .env");
        console.log("- Verify authentication tokens are valid");
    } else if (!apiResult) {
        console.log("\n⚠️ API ISSUES FOUND:");
        console.log("- API message sending is failing");
        console.log("- Check authentication tokens");
        console.log("- Verify API endpoints are working");
    } else if (!socketResult) {
        console.log("\n⚠️ SOCKET ISSUES FOUND:");
        console.log("- Socket connection is failing");
        console.log("- Check socket authentication");
        console.log("- Verify socket handlers are loaded");
    } else {
        console.log("\n🎉 ALL SYSTEMS WORKING!");
        console.log("Message sending should be functional.");
    }
};

// Run diagnostics
runMessageDiagnostics().catch(console.error);