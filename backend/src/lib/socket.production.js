import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import cloudinary from "./cloudinary.js";
import prisma from "./prisma.js";
import redisClient from "./redis.js";
import { clearFriendsCache } from "../controllers/friend.controller.js";

const app = express();
const server = http.createServer(app);

// ============================================
// PRODUCTION-OPTIMIZED SOCKET.IO CONFIGURATION
// ============================================

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
	// ✅ PERFORMANCE: Optimized transport settings
	transports: ["websocket", "polling"],
	pingTimeout: 60000,
	pingInterval: 25000,
	// ✅ PERFORMANCE: Connection limits and optimization
	maxHttpBufferSize: 1e6, // 1MB limit for file uploads
	allowEIO3: true, // Backward compatibility
	// ✅ PERFORMANCE: Compression for large payloads
	compression: true,
	// ✅ PERFORMANCE: Connection state recovery
	connectionStateRecovery: {
		maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
		skipMiddlewares: true,
	}
});

// ============================================
// REDIS ADAPTER FOR HORIZONTAL SCALING
// ============================================
const useRedis = (process.env.REDIS_URL || process.env.REDIS_HOST) && redisClient;

if (useRedis) {
	try {
		const pubClient = redisClient.duplicate();
		const subClient = redisClient.duplicate();
		io.adapter(createAdapter(pubClient, subClient));
		console.log("✅ Socket.io: Redis adapter enabled (Multi-server support)");
	} catch (error) {
		console.error("❌ Socket.io: Redis adapter error:", error.message);
		console.log("⚠️ Socket.io: Running in single-server mode");
	}
} else {
	console.log("⚠️ Socket.io: Running in single-server mode (no Redis)");
}

// ============================================
// OPTIMIZED CONNECTION MANAGEMENT
// ============================================

// Connection pools with automatic cleanup
const userSocketMap = new Map(); // userId -> Set of socketIds
const socketUserMap = new Map(); // socketId -> userId
const connectionMetrics = {
	totalConnections: 0,
	activeUsers: 0,
	peakConnections: 0,
	connectionTimes: []
};

// ✅ PERFORMANCE: Optimized typing indicators with debouncing
const typingTimeouts = new Map();
const TYPING_TIMEOUT = 3000;

// ✅ PERFORMANCE: Connection cleanup with batching
const cleanupInterval = setInterval(() => {
	const now = Date.now();
	let cleaned = 0;
	
	// Clean up old typing timeouts
	for (const [key, timeout] of typingTimeouts.entries()) {
		if (now - timeout.created > TYPING_TIMEOUT * 2) {
			clearTimeout(timeout.timer);
			typingTimeouts.delete(key);
			cleaned++;
		}
	}
	
	// Update metrics
	connectionMetrics.activeUsers = userSocketMap.size;
	connectionMetrics.peakConnections = Math.max(
		connectionMetrics.peakConnections, 
		connectionMetrics.totalConnections
	);
	
	if (process.env.NODE_ENV === 'development' && cleaned > 0) {
		console.log(`🧹 Cleaned up ${cleaned} stale connections`);
	}
}, 30000); // Every 30 seconds

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================
io.use(async (socket, next) => {
	try {
		const token = socket.handshake.auth.token;
		if (!token) {
			return next(new Error("Authentication error: No token provided"));
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
			select: {
				id: true,
				username: true,
				fullName: true,
				profilePic: true,
				isVerified: true,
				isSuspended: true,
				suspensionEndTime: true
			}
		});

		if (!user) {
			return next(new Error("Authentication error: User not found"));
		}

		// ✅ SECURITY: Check suspension status
		if (user.isSuspended && user.suspensionEndTime && new Date(user.suspensionEndTime) > new Date()) {
			return next(new Error("Account suspended"));
		}

		socket.userId = user.id;
		socket.user = user;
		next();
	} catch (err) {
		next(new Error("Authentication error: Invalid token"));
	}
});

// ============================================
// OPTIMIZED UTILITY FUNCTIONS
// ============================================

// ✅ PERFORMANCE: Batched user emission
const emitToUser = (userId, event, data) => {
	const userSockets = userSocketMap.get(userId);
	if (userSockets && userSockets.size > 0) {
		userSockets.forEach(socketId => {
			const socket = io.sockets.sockets.get(socketId);
			if (socket) {
				socket.emit(event, data);
			}
		});
		return true;
	}
	return false;
};

// ✅ PERFORMANCE: Optimized online status with caching
const getOnlineUsers = () => {
	return Array.from(userSocketMap.keys());
};

// ✅ PERFORMANCE: Batch status updates
const broadcastUserStatus = (userId, isOnline, lastSeen = null) => {
	const statusData = {
		userId,
		isOnline,
		lastSeen: lastSeen || new Date()
	};
	
	// Emit to all connected users
	io.emit("userStatusChanged", statusData);
	
	// Emit to admin dashboard
	io.emit("admin:userStatusChanged", statusData);
};

// ============================================
// CONNECTION EVENT HANDLERS
// ============================================

io.on("connection", (socket) => {
	const startTime = Date.now();
	connectionMetrics.totalConnections++;
	
	// ✅ PERFORMANCE: Optimized user registration
	const userId = socket.userId;
	
	// Add to connection maps
	if (!userSocketMap.has(userId)) {
		userSocketMap.set(userId, new Set());
	}
	userSocketMap.get(userId).add(socket.id);
	socketUserMap.set(socket.id, userId);
	
	// ✅ PERFORMANCE: Batch join user rooms
	socket.join(`user_${userId}`);
	
	// Update user online status in database (async, non-blocking)
	prisma.user.update({
		where: { id: userId },
		data: { 
			isOnline: true,
			lastSeen: new Date()
		}
	}).catch(err => {
		if (process.env.NODE_ENV === 'development') {
			console.error("Failed to update user online status:", err);
		}
	});
	
	// Broadcast online status
	broadcastUserStatus(userId, true);
	
	// Track connection time
	connectionMetrics.connectionTimes.push(Date.now() - startTime);
	if (connectionMetrics.connectionTimes.length > 100) {
		connectionMetrics.connectionTimes.shift(); // Keep only last 100
	}

	// ============================================
	// MESSAGE EVENTS - OPTIMIZED
	// ============================================
	
	socket.on("sendMessage", async (data) => {
		try {
			const { receiverId, text, image, voiceMessage, replyTo } = data;
			
			// ✅ PERFORMANCE: Validate input efficiently
			if (!receiverId || (!text && !image && !voiceMessage)) {
				return socket.emit("error", { message: "Invalid message data" });
			}

			// ✅ PERFORMANCE: Parallel database operations
			const [receiver, sender] = await Promise.all([
				prisma.user.findUnique({
					where: { id: receiverId },
					select: { id: true, username: true, isOnline: true }
				}),
				prisma.user.findUnique({
					where: { id: userId },
					select: { id: true, username: true, profilePic: true }
				})
			]);

			if (!receiver) {
				return socket.emit("error", { message: "Receiver not found" });
			}

			// ✅ PERFORMANCE: Optimized message creation
			const messageData = {
				senderId: userId,
				receiverId,
				text: text || null,
				image: image || null,
				voiceMessage: voiceMessage || null,
				replyToId: replyTo?.id || null
			};

			const newMessage = await prisma.message.create({
				data: messageData,
				include: {
					sender: {
						select: {
							id: true,
							username: true,
							fullName: true,
							profilePic: true,
							isVerified: true
						}
					},
					replyTo: {
						include: {
							sender: {
								select: {
									id: true,
									username: true,
									fullName: true,
									profilePic: true
								}
							}
						}
					}
				}
			});

			// ✅ PERFORMANCE: Batch emit to both users
			const messagePayload = { message: newMessage };
			
			// Emit to receiver
			emitToUser(receiverId, "newMessage", messagePayload);
			
			// Emit back to sender for confirmation
			socket.emit("newMessage", messagePayload);

		} catch (error) {
			if (process.env.NODE_ENV === 'development') {
				console.error("Send message error:", error);
			}
			socket.emit("error", { message: "Failed to send message" });
		}
	});

	// ============================================
	// TYPING INDICATORS - OPTIMIZED WITH DEBOUNCING
	// ============================================
	
	socket.on("typing", (data) => {
		const { receiverId, isTyping } = data;
		if (!receiverId) return;
		
		const typingKey = `${userId}_${receiverId}`;
		
		// Clear existing timeout
		if (typingTimeouts.has(typingKey)) {
			clearTimeout(typingTimeouts.get(typingKey).timer);
		}
		
		if (isTyping) {
			// Set new timeout
			const timer = setTimeout(() => {
				emitToUser(receiverId, "userTyping", { userId, isTyping: false });
				typingTimeouts.delete(typingKey);
			}, TYPING_TIMEOUT);
			
			typingTimeouts.set(typingKey, { timer, created: Date.now() });
			emitToUser(receiverId, "userTyping", { userId, isTyping: true });
		} else {
			emitToUser(receiverId, "userTyping", { userId, isTyping: false });
			typingTimeouts.delete(typingKey);
		}
	});

	// ============================================
	// DISCONNECT HANDLER - OPTIMIZED CLEANUP
	// ============================================
	
	socket.on("disconnect", async (reason) => {
		connectionMetrics.totalConnections--;
		
		// Remove from maps
		const userSockets = userSocketMap.get(userId);
		if (userSockets) {
			userSockets.delete(socket.id);
			if (userSockets.size === 0) {
				userSocketMap.delete(userId);
				
				// User is completely offline
				try {
					await prisma.user.update({
						where: { id: userId },
						data: { 
							isOnline: false,
							lastSeen: new Date()
						}
					});
					
					broadcastUserStatus(userId, false, new Date());
				} catch (error) {
					if (process.env.NODE_ENV === 'development') {
						console.error("Failed to update offline status:", error);
					}
				}
			}
		}
		
		socketUserMap.delete(socket.id);
		
		// Clean up typing indicators for this user
		for (const [key, timeout] of typingTimeouts.entries()) {
			if (key.startsWith(`${userId}_`)) {
				clearTimeout(timeout.timer);
				typingTimeouts.delete(key);
			}
		}
	});
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGTERM', () => {
	console.log('🛑 SIGTERM received, shutting down gracefully');
	
	// Clear all intervals
	clearInterval(cleanupInterval);
	
	// Close all socket connections
	io.close(() => {
		console.log('✅ Socket.IO server closed');
		process.exit(0);
	});
});

// ============================================
// METRICS ENDPOINT FOR MONITORING
// ============================================

app.get('/socket-metrics', (req, res) => {
	res.json({
		...connectionMetrics,
		activeConnections: io.sockets.sockets.size,
		rooms: io.sockets.adapter.rooms.size,
		timestamp: new Date().toISOString()
	});
});

export { app, io, server, getOnlineUsers };