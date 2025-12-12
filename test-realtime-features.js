#!/usr/bin/env node

/**
 * Comprehensive Real-Time Features Test
 * Tests friend requests, messages, and notifications in real-time
 */

import { io } from "socket.io-client";
import jwt from "jsonwebtoken";

const BACKEND_URL = "http://localhost:5001";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Test users
const testUsers = [
    { id: "1", username: "safwan", email: "z4fwan77@gmail.com" },
    { id: "2", username: "testuser", email: "test@example.com" }
];

// Create JWT tokens for test users
const createToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

// Create socket connections for both users
const createSocketConnection = (user) => {
    const token = createToken(user.id);
    const socket = io(BACKEND_URL, {
        auth: { token },
        query: { userId: user.id, token }
    });
    
    return new Promise((resolve, reject) => {
        socket.on("connect", () => {
            console.log(`✅ ${user.username} connected with socket ID: ${socket.id}`);
            resolve(socket);
        });
        
        socket.on("connect_error", (error) => {
            console.error(`❌ ${user.username} connection failed:`, error.message);
            reject(error);
        });
        
        // Set up event listeners
        socket.on("friendRequestReceived", (data) => {
            console.log(`📨 ${user.username} received friend request:`, data);
        });
        
        socket.on("friendRequestAccepted", (data) => {
            console.log(`✅ ${user.username} friend request accepted:`, data);
        });
        
        socket.on("newMessage", (data) => {
            console.log(`💬 ${user.username} received message:`, data.text || "[media]");
        });
        
        socket.on("messageDelivered", (data) => {
            console.log(`📬 ${user.username} message delivered:`, data.messageId);
        });
        
        socket.on("messagesRead", (data) => {
            console.log(`📘 ${user.username} messages read by:`, data.readBy);
        });
        
        socket.on("messageReaction", (data) => {
            console.log(`😊 ${user.username} message reaction:`, data.reactions);
        });
        
        socket.on("messageDeleted", (data) => {
            console.log(`🗑️ ${user.username} message deleted:`, data.messageId);
        });
    });
};

// Test friend request flow
const testFriendRequestFlow = async (socket1, socket2, user1, user2) => {
    console.log("\n🧪 Testing Friend Request Flow...");
    
    return new Promise((resolve) => {
        let requestReceived = false;
        let requestAccepted = false;
        
        // User 2 listens for friend request
        socket2.once("friendRequestReceived", (data) => {
            console.log(`✅ Friend request received by ${user2.username}`);
            requestReceived = true;
            
            // Accept the request after a short delay
            setTimeout(() => {
                socket2.emit("friendRequestAccepted", {
                    senderId: user1.id,
                    acceptedBy: user2.id
                });
            }, 1000);
        });
        
        // User 1 listens for acceptance
        socket1.once("friendRequestAccepted", (data) => {
            console.log(`✅ Friend request accepted notification received by ${user1.username}`);
            requestAccepted = true;
            
            if (requestReceived && requestAccepted) {
                console.log("🎉 Friend request flow completed successfully!");
                resolve(true);
            }
        });
        
        // User 1 sends friend request
        socket1.emit("friendRequestSent", {
            receiverId: user2.id,
            senderData: {
                id: user1.id,
                username: user1.username,
                nickname: user1.username
            }
        });
        
        // Timeout after 10 seconds
        setTimeout(() => {
            if (!requestReceived || !requestAccepted) {
                console.log("❌ Friend request flow timed out");
                resolve(false);
            }
        }, 10000);
    });
};

// Test message flow
const testMessageFlow = async (socket1, socket2, user1, user2) => {
    console.log("\n🧪 Testing Message Flow...");
    
    return new Promise((resolve) => {
        let messageReceived = false;
        let messageDelivered = false;
        let messageRead = false;
        
        // User 2 listens for message
        socket2.once("newMessage", (data) => {
            console.log(`✅ Message received by ${user2.username}: ${data.text}`);
            messageReceived = true;
            
            // Mark as read after a short delay
            setTimeout(() => {
                socket2.emit("messageRead", {
                    senderId: user1.id,
                    messageId: data.id
                });
            }, 1000);
        });
        
        // User 1 listens for delivery confirmation
        socket1.once("messageDelivered", (data) => {
            console.log(`✅ Message delivery confirmed for ${user1.username}`);
            messageDelivered = true;
        });
        
        // User 1 listens for read confirmation
        socket1.once("messagesRead", (data) => {
            console.log(`✅ Message read confirmation received by ${user1.username}`);
            messageRead = true;
            
            if (messageReceived && messageDelivered && messageRead) {
                console.log("🎉 Message flow completed successfully!");
                resolve(true);
            }
        });
        
        // User 1 sends message
        socket1.emit("sendMessage", {
            receiverId: user2.id,
            text: "Hello! This is a real-time test message 🚀",
            senderId: user1.id
        });
        
        // Timeout after 10 seconds
        setTimeout(() => {
            if (!messageReceived || !messageDelivered || !messageRead) {
                console.log("❌ Message flow timed out");
                resolve(false);
            }
        }, 10000);
    });
};

// Test typing indicators
const testTypingIndicators = async (socket1, socket2, user1, user2) => {
    console.log("\n🧪 Testing Typing Indicators...");
    
    return new Promise((resolve) => {
        let typingReceived = false;
        
        // User 2 listens for typing indicator
        socket2.once("userTyping", (data) => {
            console.log(`✅ Typing indicator received by ${user2.username} from ${data.senderId}`);
            typingReceived = true;
            resolve(true);
        });
        
        // User 1 starts typing
        socket1.emit("typing", {
            receiverId: user2.id,
            isTyping: true
        });
        
        // Stop typing after 2 seconds
        setTimeout(() => {
            socket1.emit("typing", {
                receiverId: user2.id,
                isTyping: false
            });
        }, 2000);
        
        // Timeout after 5 seconds
        setTimeout(() => {
            if (!typingReceived) {
                console.log("❌ Typing indicators test timed out");
                resolve(false);
            }
        }, 5000);
    });
};

// Main test function
const runRealTimeTests = async () => {
    console.log("🚀 Starting Real-Time Features Test Suite");
    console.log("==========================================");
    
    try {
        // Create socket connections
        console.log("\n📡 Connecting test users...");
        const socket1 = await createSocketConnection(testUsers[0]);
        const socket2 = await createSocketConnection(testUsers[1]);
        
        // Wait a moment for connections to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Run tests
        const friendRequestResult = await testFriendRequestFlow(socket1, socket2, testUsers[0], testUsers[1]);
        const messageResult = await testMessageFlow(socket1, socket2, testUsers[0], testUsers[1]);
        const typingResult = await testTypingIndicators(socket1, socket2, testUsers[0], testUsers[1]);
        
        // Results
        console.log("\n📊 Test Results:");
        console.log("================");
        console.log(`Friend Requests: ${friendRequestResult ? "✅ PASS" : "❌ FAIL"}`);
        console.log(`Messages: ${messageResult ? "✅ PASS" : "❌ FAIL"}`);
        console.log(`Typing Indicators: ${typingResult ? "✅ PASS" : "❌ FAIL"}`);
        
        const allPassed = friendRequestResult && messageResult && typingResult;
        console.log(`\n🎯 Overall Result: ${allPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}`);
        
        // Cleanup
        socket1.disconnect();
        socket2.disconnect();
        
        process.exit(allPassed ? 0 : 1);
        
    } catch (error) {
        console.error("❌ Test suite failed:", error);
        process.exit(1);
    }
};

// Run the tests
runRealTimeTests();