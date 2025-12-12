import { io } from 'socket.io-client';
import axios from 'axios';

// Create axios instance for testing
const axiosInstance = axios.create({
    baseURL: 'http://localhost:5001/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

async function testStrangerChat() {
    try {
        console.log('🧪 Testing stranger chat connection...');
        
        // First, login as admin to get a valid token
        const loginRes = await axiosInstance.post('/auth/login', {
            emailOrUsername: 'z4fwan77@gmail.com',
            password: 'admin123'
        });
        
        const token = loginRes.data.token;
        const user = loginRes.data;
        
        console.log('✅ Login successful for user:', user.username);
        
        // Create socket connection with authentication
        const socket = io('http://localhost:5001', {
            auth: {
                token: token
            },
            query: {
                userId: user.id,
                token: token
            },
            transports: ['websocket']
        });
        
        // Set up socket event listeners
        socket.on('connect', () => {
            console.log('✅ Socket connected:', socket.id);
            
            // Try to join stranger chat queue
            console.log('🚀 Joining stranger chat queue...');
            socket.emit('stranger:joinQueue', {
                userId: user.id,
                username: user.username,
                nickname: user.nickname,
                profilePic: user.profilePic,
                isVerified: user.isVerified,
                allowFriendRequests: true,
                privacySettings: {
                    showUsername: true,
                    showProfilePic: true,
                    showVerificationBadge: true,
                    allowFriendRequests: true
                }
            });
        });
        
        socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error.message);
        });
        
        socket.on('stranger:waiting', () => {
            console.log('⏳ Waiting for a match...');
        });
        
        socket.on('stranger:matched', (data) => {
            console.log('🎉 Matched with partner!', {
                partnerId: data.partnerId,
                partnerUserId: data.partnerUserId,
                partnerUserData: data.partnerUserData
            });
        });
        
        socket.on('stranger:disconnected', () => {
            console.log('👋 Partner disconnected');
        });
        
        socket.on('disconnect', (reason) => {
            console.log('⚠️ Socket disconnected:', reason);
        });
        
        // Keep the test running for 30 seconds
        setTimeout(() => {
            console.log('🔌 Disconnecting socket...');
            socket.disconnect();
            console.log('✅ Stranger chat test completed');
        }, 30000);
        
    } catch (error) {
        console.error('❌ Stranger chat test failed:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.response?.data?.error || error.message,
            data: error.response?.data
        });
    }
}

testStrangerChat();