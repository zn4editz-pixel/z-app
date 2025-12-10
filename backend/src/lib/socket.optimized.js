// ⚡ OPTIMIZED SOCKET HANDLER
// Performance improvements for WebSocket connections

import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";

const app = express();
const server = http.createServer(app);

// Optimized Socket.IO configuration
const io = new Server(server, {
	cors: {
		origin: [
			"http://localhost:5173",
			"https://z-app-beta-z.onrender.com",
			"https://z-app-frontend-2-0.onrender.com",
			"https://z-pp-main-com.onrender.com",
		],
		credentials: true,
	},
	// Performance optimizations
	transports: ["websocket", "polling"],
	pingTimeout: 60000,
	pingInterval: 25000,
	maxHttpBufferSize: 1e6, // 1MB max message size
	perMessageDeflate: {
		threshold: 1024 // Compress messages > 1KB
	},
	// Connection limits
	connectTimeout: 45000,
	// Optimize for high concurrency
	allowEIO3: true
});

// Optimized user socket map with Set for faster lookups
const userSocketMap = new Map(); // userId -> Set of socketIds
const socketUserMap = new Map(); // socketId -> userId

// Fast socket lookup
export const getReceiverSocketId = (userId) => {
	const sockets = userSocketMap.get(userId);
	return sockets ? Array.from(sockets)[0] : null;
};

// Get all socket IDs for a user (for multi-device support)
export const getAllUserSockets = (userId) => {
	return userSocketMap.get(userId) || new Set();
};

// Optimized emit to user (supports multiple devices)
export const emitToUser = (userId, event, data) => {
	const sockets = userSocketMap.get(userId);
	if (sockets && sockets.size > 0) {
		sockets.forEach(socketId => {
			io.to(socketId).emit(event, data);
		});
		return true;
	}
	return false;
};

// Batch emit to multiple users (more efficient)
export const emitToUsers = (userIds, event, data) => {
	const socketIds = [];
	userIds.forEach(userId => {
		const sockets = userSocketMap.get(userId);
		if (sockets) {
			socketIds.push(...Array.from(sockets));
		}
	});
	
	if (socketIds.length > 0) {
		io.to(socketIds).emit(event, data);
	}
};

// Optimized authentication middleware
io.use((socket, next) => {
	try {
		const token = socket.handshake.auth.token || socket.handshake.query.token;
		
		if (token) {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			socket.userId = decoded.userId;
		}
		
		next();
	} catch (error) {
		console.error("Socket auth error:", error.message);
		next();
	}
});

// Connection handler with optimizations
io.on("connection", (socket) => {
	const userId = socket.userId;
	
	if (userId) {
		// Add to maps
		if (!userSocketMap.has(userId)) {
			userSocketMap.set(userId, new Set());
		}
		userSocketMap.get(userId).add(socket.id);
		socketUserMap.set(socket.id, userId);
		
		console.log(`✅ User ${userId} connected (${socket.id})`);
		
		// Broadcast online status efficiently
		socket.broadcast.emit("userOnline", { userId, isOnline: true });
		
		// Send current online users (optimized)
		const onlineUserIds = Array.from(userSocketMap.keys());
		socket.emit("getOnlineUsers", onlineUserIds);
	}
	
	// Optimized message handler with rate limiting
	const messageRateLimit = new Map();
	const MESSAGE_RATE_LIMIT = 10; // messages per second
	
	socket.on("sendMessage", async (data) => {
		const now = Date.now();
		const lastMessage = messageRateLimit.get(userId) || 0;
		
		// Rate limiting
		if (now - lastMessage < 1000 / MESSAGE_RATE_LIMIT) {
			socket.emit("error", { message: "Rate limit exceeded" });
			return;
		}
		
		messageRateLimit.set(userId, now);
		
		// Process message (implement your logic here)
		const { receiverId, message } = data;
		emitToUser(receiverId, "newMessage", {
			senderId: userId,
			message,
			timestamp: now
		});
	});
	
	// Typing indicator with debouncing
	let typingTimeout;
	socket.on("typing", (data) => {
		clearTimeout(typingTimeout);
		const { receiverId } = data;
		emitToUser(receiverId, "userTyping", { userId, isTyping: true });
		
		typingTimeout = setTimeout(() => {
			emitToUser(receiverId, "userTyping", { userId, isTyping: false });
		}, 3000);
	});
	
	// Disconnect handler
	socket.on("disconnect", () => {
		if (userId) {
			const userSockets = userSocketMap.get(userId);
			if (userSockets) {
				userSockets.delete(socket.id);
				
				// Only mark offline if no more sockets
				if (userSockets.size === 0) {
					userSocketMap.delete(userId);
					socket.broadcast.emit("userOffline", { 
						userId, 
						isOnline: false,
						lastSeen: new Date()
					});
					console.log(`❌ User ${userId} disconnected (all devices)`);
				}
			}
			socketUserMap.delete(socket.id);
		}
	});
});

// Cleanup old connections periodically
setInterval(() => {
	const now = Date.now();
	let cleaned = 0;
	
	socketUserMap.forEach((userId, socketId) => {
		const socket = io.sockets.sockets.get(socketId);
		if (!socket || !socket.connected) {
			socketUserMap.delete(socketId);
			const userSockets = userSocketMap.get(userId);
			if (userSockets) {
				userSockets.delete(socketId);
				if (userSockets.size === 0) {
					userSocketMap.delete(userId);
				}
			}
			cleaned++;
		}
	});
	
	if (cleaned > 0) {
		console.log(`🧹 Cleaned ${cleaned} stale socket connections`);
	}
}, 60000); // Every minute

// Export optimized socket map
export { userSocketMap, io, app, server };
