import jwt from "jsonwebtoken";
import prisma from "./prisma.js";

// === PRIVATE CHAT LOGIC ===
const userSocketMap = {}; // { userId: socketId }

const getUserIdFromSocketId = (socketId) => {
	return Object.keys(userSocketMap).find(
		(key) => userSocketMap[key] === socketId
	);
};

export const getReceiverSocketId = (userId) => userSocketMap[userId];

// Store io instance for use in emitToUser
let ioInstance = null;

export const emitToUser = (userId, event, data) => {
	const socketId = userSocketMap[userId];
	if (socketId && ioInstance) {
		console.log(`Emitting ['${event}'] to user ${userId} (socket ${socketId})`);
		ioInstance.to(socketId).emit(event, data);
	} else {
		console.log(`Could not find socket for user ${userId} to emit ['${event}']`);
	}
};

// === STRANGER CHAT LOGIC ===
let waitingQueue = [];
const matchedPairs = new Map(); // socketId -> partnerSocketId
const recentMatches = new Map(); // socketId -> Set of recent partner socketIds

// Find and match strangers
const findMatch = (socket, io) => {
	console.log(`🔍 Finding match for ${socket.id}. Queue size: ${waitingQueue.length}`);
	
	// Check if this socket is already matched
	if (matchedPairs.has(socket.id)) {
		console.log(`⚠️ ${socket.id} is already matched, skipping`);
		return;
	}
	
	// Remove current socket from queue if present
	waitingQueue = waitingQueue.filter(id => id !== socket.id);
	
	if (waitingQueue.length > 0) {
		// Find first person in queue who is NOT already matched and NOT a recent match
		let partnerSocketId = null;
		let partnerSocket = null;
		const myRecentMatches = recentMatches.get(socket.id) || new Set();
		
		while (waitingQueue.length > 0) {
			partnerSocketId = waitingQueue.shift();
			
			// Skip if partner is already matched
			if (matchedPairs.has(partnerSocketId)) {
				continue;
			}
			
			// Skip if this was a recent match
			if (myRecentMatches.has(partnerSocketId)) {
				continue;
			}
			
			partnerSocket = io.sockets.sockets.get(partnerSocketId);
			
			if (partnerSocket) {
				break; // Found a valid partner
			}
		}
		
		if (partnerSocket && partnerSocketId) {
			// Create match
			matchedPairs.set(socket.id, partnerSocketId);
			matchedPairs.set(partnerSocketId, socket.id);
			
			// Add to recent matches to prevent immediate re-matching
			if (!recentMatches.has(socket.id)) {
				recentMatches.set(socket.id, new Set());
			}
			if (!recentMatches.has(partnerSocketId)) {
				recentMatches.set(partnerSocketId, new Set());
			}
			recentMatches.get(socket.id).add(partnerSocketId);
			recentMatches.get(partnerSocketId).add(socket.id);
			
			// Limit recent matches to last 3 partners
			if (recentMatches.get(socket.id).size > 3) {
				const oldestMatch = Array.from(recentMatches.get(socket.id))[0];
				recentMatches.get(socket.id).delete(oldestMatch);
			}
			if (recentMatches.get(partnerSocketId).size > 3) {
				const oldestMatch = Array.from(recentMatches.get(partnerSocketId))[0];
				recentMatches.get(partnerSocketId).delete(oldestMatch);
			}
			
			// Clear recent matches after 30 seconds
			setTimeout(() => {
				if (recentMatches.has(socket.id)) {
					recentMatches.get(socket.id).delete(partnerSocketId);
				}
				if (recentMatches.has(partnerSocketId)) {
					recentMatches.get(partnerSocketId).delete(socket.id);
				}
			}, 30000);
			
			console.log(`✅ Matched ${socket.id} with ${partnerSocketId}`);
			
			// Send match data to both partners
			const partnerDisplayData = {
				userId: partnerSocket.strangerData?.userId,
				displayName: partnerSocket.strangerData?.username || partnerSocket.strangerData?.nickname ? 
					(partnerSocket.strangerData?.nickname || partnerSocket.strangerData?.username) : "Stranger",
				profilePic: partnerSocket.strangerData?.profilePic || null,
				isVerified: partnerSocket.strangerData?.isVerified || false,
				allowFriendRequests: partnerSocket.strangerData?.allowFriendRequests !== false
			};
			
			const myDisplayData = {
				userId: socket.strangerData?.userId,
				displayName: socket.strangerData?.username || socket.strangerData?.nickname ? 
					(socket.strangerData?.nickname || socket.strangerData?.username) : "Stranger",
				profilePic: socket.strangerData?.profilePic || null,
				isVerified: socket.strangerData?.isVerified || false,
				allowFriendRequests: socket.strangerData?.allowFriendRequests !== false
			};
			
			socket.emit("stranger:matched", { 
				partnerId: partnerSocketId,
				partnerUserId: partnerSocket.strangerData?.userId,
				partnerUserData: partnerDisplayData
			});
			
			partnerSocket.emit("stranger:matched", { 
				partnerId: socket.id,
				partnerUserId: socket.strangerData?.userId,
				partnerUserData: myDisplayData
			});
		} else {
			// No valid partner found, add to queue
			waitingQueue.push(socket.id);
			console.log(`⏳ Added ${socket.id} to queue (no valid partner). Queue size: ${waitingQueue.length}`);
			socket.emit("stranger:waiting");
		}
	} else {
		// Add to queue
		waitingQueue.push(socket.id);
		console.log(`⏳ Added ${socket.id} to queue. Queue size: ${waitingQueue.length}`);
		socket.emit("stranger:waiting");
	}
};

// Clean up matches when user disconnects or skips
const cleanupMatch = (socket, io) => {
	const partnerSocketId = matchedPairs.get(socket.id);
	
	if (partnerSocketId) {
		const partnerSocket = io.sockets.sockets.get(partnerSocketId);
		
		// Remove both from matched pairs
		matchedPairs.delete(socket.id);
		matchedPairs.delete(partnerSocketId);
		
		console.log(`🧹 Cleaned up match: ${socket.id} <-> ${partnerSocketId}`);
		
		if (partnerSocket) {
			return partnerSocket;
		}
	}
	
	// Remove from waiting queue
	waitingQueue = waitingQueue.filter(id => id !== socket.id);
	
	return null;
};

export function initializeSocketHandlers(io) {
	console.log('🔌 Initializing socket handlers with stranger chat support');
	
	// Store io instance for emitToUser function
	ioInstance = io;

	// Socket.IO authentication middleware
	io.use((socket, next) => {
		try {
			// Get token from query or auth header
			const token = socket.handshake.auth.token || socket.handshake.query.token;
			
			if (token) {
				// Verify token
				const decoded = jwt.verify(token, process.env.JWT_SECRET);
				socket.userId = decoded.userId;
				console.log(`✅ Socket authenticated for user ${decoded.userId}`);
			}
			
			next();
		} catch (error) {
			console.error("Socket authentication error:", error.message);
			// Allow connection even without token for backward compatibility
			next();
		}
	});

	io.on("connection", (socket) => {
		console.log(`🔌 Socket connected: ${socket.id}`);
		
		// Register user for private chat
		if (socket.userId) {
			userSocketMap[socket.userId] = socket.id;
			console.log(`👤 User ${socket.userId} registered with socket ${socket.id}`);
			
			// Update user's online status in database
			prisma.user.update({ 
				where: { id: socket.userId }, 
				data: { isOnline: true } 
			})
				.then(user => {
					if (user) {
						console.log(`✅ User ${socket.userId} marked as online in database`);
						// Emit online users to ALL clients
						const onlineUserIds = Object.keys(userSocketMap);
						console.log(`📡 Broadcasting online users: ${onlineUserIds.length} users online`);
						io.emit("getOnlineUsers", onlineUserIds);
					}
				})
				.catch(err => console.error('Failed to update online status:', err));
		}

		// Handle manual user registration (for compatibility)
		socket.on("register-user", (userId) => {
			if (userId) {
				userSocketMap[userId] = socket.id;
				socket.userId = userId;
				console.log(`✅ Manually registered user ${userId} → socket ${socket.id}`);
				console.log(`📊 Current userSocketMap:`, Object.keys(userSocketMap));
				
				// Update user's online status in database
				prisma.user.update({
					where: { id: userId },
					data: { isOnline: true }
				})
					.then(user => {
						if (user) {
							console.log(`✅ User ${userId} marked as online in database`);
							const onlineUserIds = Object.keys(userSocketMap);
							console.log(`📡 Broadcasting online users: ${onlineUserIds.length} users`);
							io.emit("getOnlineUsers", onlineUserIds);
						}
					})
					.catch(err => console.error('Failed to update online status:', err));
			}
		});

		// === STRANGER CHAT EVENTS ===
		socket.on("stranger:joinQueue", (payload) => {
			console.log(`🚀 ${socket.id} joining stranger queue with data:`, JSON.stringify(payload));
			console.log(`📊 Current queue size BEFORE: ${waitingQueue.length}`);
			socket.strangerData = payload; // Store user data on socket
			findMatch(socket, io);
			console.log(`📊 Queue size AFTER: ${waitingQueue.length}`);
		});

		socket.on("stranger:skip", () => {
			console.log(`⏭️ ${socket.id} skipping stranger`);
			const partnerSocket = cleanupMatch(socket, io);
			
			// Notify partner if they exist
			if (partnerSocket) {
				partnerSocket.emit("stranger:disconnected");
			}
			
			// Re-queue the user who skipped
			findMatch(socket, io);
		});

		socket.on("stranger:chatMessage", (payload) => {
			const { message } = payload;
			const partnerSocketId = matchedPairs.get(socket.id);
			
			if (partnerSocketId) {
				const partnerSocket = io.sockets.sockets.get(partnerSocketId);
				if (partnerSocket) {
					console.log(`💬 Message from ${socket.id} to ${partnerSocketId}`);
					partnerSocket.emit("stranger:chatMessage", { message });
				}
			}
		});

		// Reaction handler
		socket.on("stranger:reaction", (payload) => {
			const { emoji } = payload;
			const partnerSocketId = matchedPairs.get(socket.id);
			
			if (partnerSocketId) {
				const partnerSocket = io.sockets.sockets.get(partnerSocketId);
				if (partnerSocket) {
					console.log(`😊 Reaction ${emoji} from ${socket.id} to ${partnerSocketId}`);
					partnerSocket.emit("stranger:reaction", { emoji });
				}
			}
		});

		// WebRTC signaling
		socket.on("webrtc:offer", (payload) => {
			const partnerSocketId = matchedPairs.get(socket.id);
			if (partnerSocketId) {
				const partnerSocket = io.sockets.sockets.get(partnerSocketId);
				if (partnerSocket) {
					partnerSocket.emit("webrtc:offer", payload);
				}
			}
		});

		socket.on("webrtc:answer", (payload) => {
			const partnerSocketId = matchedPairs.get(socket.id);
			if (partnerSocketId) {
				const partnerSocket = io.sockets.sockets.get(partnerSocketId);
				if (partnerSocket) {
					partnerSocket.emit("webrtc:answer", payload);
				}
			}
		});

		socket.on("webrtc:ice-candidate", (payload) => {
			const partnerSocketId = matchedPairs.get(socket.id);
			if (partnerSocketId) {
				const partnerSocket = io.sockets.sockets.get(partnerSocketId);
				if (partnerSocket) {
					partnerSocket.emit("webrtc:ice-candidate", payload);
				}
			}
		});

		// === PRIVATE CHAT EVENTS ===
		// ⚡ ULTRA-FAST MESSAGE SENDING via Socket.IO (REAL-TIME)
		socket.on("sendMessage", async ({ receiverId, text, image, voice, voiceDuration, replyTo, tempId }) => {
			try {
				const senderId = socket.userId;
				console.log(`📤 SOCKET MESSAGE RECEIVED:`);
				console.log(`   From: ${senderId} (socket: ${socket.id})`);
				console.log(`   To: ${receiverId}`);
				console.log(`   Text: ${text?.substring(0, 50)}...`);
				console.log(`   TempId: ${tempId}`);
				
				if (!senderId || !receiverId) {
					console.error('❌ Missing sender or receiver ID:', { senderId, receiverId });
					throw new Error('Sender or receiver ID missing');
				}
				
				// ⚡ OPTIMIZATION: Create message WITHOUT includes (10x faster!)
				const newMessage = await prisma.message.create({
					data: {
						senderId: senderId,
						receiverId: receiverId,
						text: text || null,
						image: image || null,
						voice: voice || null,
						voiceDuration: voiceDuration || null,
						status: 'sent' // ✅ Set status immediately
					}
				});
				
				console.log(`⚡ Message saved in database: ${newMessage.id}`);
				
				// ⚡ OPTIMIZATION: Send to sockets IMMEDIATELY (don't wait for cache clear)
				const receiverSocketId = getReceiverSocketId(receiverId);
				console.log(`📊 Looking for receiver ${receiverId} in userSocketMap...`);
				console.log(`📊 Current userSocketMap:`, Object.keys(userSocketMap));
				console.log(`📊 Receiver socket ID: ${receiverSocketId}`);
				
				if (receiverSocketId) {
					io.to(receiverSocketId).emit("newMessage", newMessage);
					console.log(`⚡ SUCCESS: Message sent to receiver ${receiverId} (socket: ${receiverSocketId})`);
				} else {
					console.log(`⚠️ OFFLINE: Receiver ${receiverId} not online - message saved but not delivered`);
				}
				
				// ⚡ INSTANT: Send back to sender (replace optimistic message)
				socket.emit("newMessage", newMessage);
				console.log(`⚡ SUCCESS: Message confirmed to sender ${senderId}`);
				
			} catch (error) {
				console.error('❌ Socket sendMessage error:', error);
				socket.emit("messageError", { error: error.message, tempId });
			}
		});

		// Friend request events
		socket.on("friendRequestSent", (data) => {
			const receiverSocketId = getReceiverSocketId(data.receiverId);
			if (receiverSocketId) {
				console.log(`👥 Friend request from ${socket.userId} to ${data.receiverId}`);
				io.to(receiverSocketId).emit("friendRequestReceived", data);
			}
		});

		socket.on("friendRequestAccepted", (data) => {
			const senderSocketId = getReceiverSocketId(data.senderId);
			if (senderSocketId) {
				console.log(`✅ Friend request accepted by ${socket.userId} from ${data.senderId}`);
				io.to(senderSocketId).emit("friendRequestAccepted", data);
			}
		});

		// Typing indicators
		socket.on("typing", (data) => {
			const receiverSocketId = getReceiverSocketId(data.receiverId);
			if (receiverSocketId) {
				io.to(receiverSocketId).emit("userTyping", {
					senderId: socket.userId,
					isTyping: data.isTyping
				});
			}
		});

		// Message status updates
		socket.on("messageDelivered", (data) => {
			const senderSocketId = getReceiverSocketId(data.senderId);
			if (senderSocketId) {
				io.to(senderSocketId).emit("messageStatusUpdate", {
					messageId: data.messageId,
					status: "delivered"
				});
			}
		});

		socket.on("messageRead", (data) => {
			const senderSocketId = getReceiverSocketId(data.senderId);
			if (senderSocketId) {
				io.to(senderSocketId).emit("messageStatusUpdate", {
					messageId: data.messageId,
					status: "read"
				});
			}
		});

		// ✅ REALTIME REACTIONS: Handle instant reaction updates via socket
		socket.on("messageReaction", async ({ messageId, emoji, receiverId }) => {
			try {
				const senderId = socket.userId;
				if (!senderId || !receiverId || !messageId || !emoji) {
					console.error('❌ Invalid reaction data:', { senderId, receiverId, messageId, emoji });
					return;
				}

				console.log(`😊 REALTIME: ${senderId} reacted ${emoji} to message ${messageId}`);

				// Get the message to verify ownership
				const message = await prisma.message.findUnique({
					where: { id: messageId }
				});

				if (!message) {
					console.error('❌ Message not found for reaction:', messageId);
					return;
				}

				// Verify user is part of this conversation
				if (message.senderId !== senderId && message.receiverId !== senderId) {
					console.error('❌ User not authorized to react to this message');
					return;
				}

				// Get current reactions and update
				let reactions = [];
				try {
					reactions = message.reactions ? JSON.parse(message.reactions) : [];
				} catch (error) {
					reactions = [];
				}

				// Remove existing reaction from this user
				reactions = reactions.filter(r => r.userId !== senderId);
				
				// Add new reaction
				reactions.push({
					userId: senderId,
					emoji: emoji,
					createdAt: new Date().toISOString()
				});

				// Update in database
				await prisma.message.update({
					where: { id: messageId },
					data: { reactions: JSON.stringify(reactions) }
				});

				// ✅ INSTANT: Notify receiver immediately via socket
				const receiverSocketId = getReceiverSocketId(receiverId);
				if (receiverSocketId) {
					io.to(receiverSocketId).emit("messageReaction", {
						messageId,
						reactions
					});
					console.log(`⚡ INSTANT: Reaction sent to receiver ${receiverId}`);
				}

				// ✅ INSTANT: Confirm to sender
				socket.emit("messageReaction", {
					messageId,
					reactions
				});
				console.log(`⚡ INSTANT: Reaction confirmed to sender ${senderId}`);

			} catch (error) {
				console.error('❌ Socket messageReaction error:', error);
			}
		});

		// ✅ REALTIME REACTION REMOVAL: Handle instant reaction removal via socket
		socket.on("messageReactionRemove", async ({ messageId, receiverId }) => {
			try {
				const senderId = socket.userId;
				if (!senderId || !receiverId || !messageId) {
					console.error('❌ Invalid reaction removal data:', { senderId, receiverId, messageId });
					return;
				}

				console.log(`🗑️ REALTIME: ${senderId} removed reaction from message ${messageId}`);

				// Get the message to verify ownership
				const message = await prisma.message.findUnique({
					where: { id: messageId }
				});

				if (!message) {
					console.error('❌ Message not found for reaction removal:', messageId);
					return;
				}

				// Verify user is part of this conversation
				if (message.senderId !== senderId && message.receiverId !== senderId) {
					console.error('❌ User not authorized to remove reaction from this message');
					return;
				}

				// Get current reactions and remove user's reaction
				let reactions = [];
				try {
					reactions = message.reactions ? JSON.parse(message.reactions) : [];
				} catch (error) {
					reactions = [];
				}

				// Remove reaction from this user
				reactions = reactions.filter(r => r.userId !== senderId);

				// Update in database
				await prisma.message.update({
					where: { id: messageId },
					data: { reactions: JSON.stringify(reactions) }
				});

				// ✅ INSTANT: Notify receiver immediately via socket
				const receiverSocketId = getReceiverSocketId(receiverId);
				if (receiverSocketId) {
					io.to(receiverSocketId).emit("messageReaction", {
						messageId,
						reactions
					});
					console.log(`⚡ INSTANT: Reaction removal sent to receiver ${receiverId}`);
				}

				// ✅ INSTANT: Confirm to sender
				socket.emit("messageReaction", {
					messageId,
					reactions
				});
				console.log(`⚡ INSTANT: Reaction removal confirmed to sender ${senderId}`);

			} catch (error) {
				console.error('❌ Socket messageReactionRemove error:', error);
			}
		});

		// === PRIVATE CALL EVENTS ===
		socket.on("private:start-call", (data) => {
			const { receiverId, callType, callerInfo } = data;
			const receiverSocketId = getReceiverSocketId(receiverId);
			
			if (receiverSocketId) {
				console.log(`📞 Private call from ${socket.userId} to ${receiverId} (${callType})`);
				io.to(receiverSocketId).emit("private:incoming-call", {
					callerId: socket.userId,
					callerInfo,
					callType
				});
			} else {
				console.log(`❌ User ${receiverId} not online for call`);
				socket.emit("private:call-failed", { reason: "User not online" });
			}
		});

		socket.on("private:initiate-call", (data) => {
			const { receiverId, callerInfo, callType } = data;
			const receiverSocketId = getReceiverSocketId(receiverId);
			
			if (receiverSocketId) {
				console.log(`📞 Initiating private call from ${socket.userId} to ${receiverId}`);
				io.to(receiverSocketId).emit("private:incoming-call", {
					callerId: socket.userId,
					callerInfo,
					callType
				});
			}
		});

		socket.on("private:accept-call", (data) => {
			const { callerId } = data;
			const callerSocketId = getReceiverSocketId(callerId);
			
			if (callerSocketId) {
				console.log(`✅ Call accepted by ${socket.userId} from ${callerId}`);
				io.to(callerSocketId).emit("private:call-accepted", {
					acceptorId: socket.userId,
					acceptorInfo: data.acceptorInfo
				});
			}
		});

		socket.on("private:call-accepted", (data) => {
			const { callerId } = data;
			const callerSocketId = getReceiverSocketId(callerId);
			
			if (callerSocketId) {
				console.log(`✅ Call accepted by ${socket.userId} from ${callerId}`);
				io.to(callerSocketId).emit("private:call-accepted", {
					acceptorId: socket.userId,
					acceptorInfo: data.acceptorInfo
				});
			}
		});

		socket.on("private:reject-call", (data) => {
			const { callerId, reason } = data;
			const callerSocketId = getReceiverSocketId(callerId);
			
			if (callerSocketId) {
				console.log(`🚫 Call rejected by ${socket.userId} from ${callerId}, reason: ${reason || 'declined'}`);
				io.to(callerSocketId).emit("private:call-rejected", {
					rejectorId: socket.userId,
					reason: reason || 'declined'
				});
			}
		});

		socket.on("private:end-call", (data) => {
			const { targetUserId } = data;
			const targetSocketId = getReceiverSocketId(targetUserId);
			
			if (targetSocketId) {
				console.log(`🔚 Call ended by ${socket.userId} to ${targetUserId}`);
				io.to(targetSocketId).emit("private:call-ended", {
					enderId: socket.userId
				});
			}
		});

		// WebRTC signaling for private calls
		socket.on("private:offer", (data) => {
			const { receiverId, sdp } = data;
			const receiverSocketId = getReceiverSocketId(receiverId);
			
			if (receiverSocketId) {
				console.log(`📤 WebRTC offer from ${socket.userId} to ${receiverId}`);
				io.to(receiverSocketId).emit("private:offer", {
					callerId: socket.userId,
					sdp
				});
			}
		});

		socket.on("private:answer", (data) => {
			const { callerId, sdp } = data;
			const callerSocketId = getReceiverSocketId(callerId);
			
			if (callerSocketId) {
				console.log(`📤 WebRTC answer from ${socket.userId} to ${callerId}`);
				io.to(callerSocketId).emit("private:answer", {
					answererId: socket.userId,
					sdp
				});
			}
		});

		socket.on("private:ice-candidate", (data) => {
			const { targetUserId, candidate } = data;
			const targetSocketId = getReceiverSocketId(targetUserId);
			
			if (targetSocketId) {
				console.log(`🧊 ICE candidate from ${socket.userId} to ${targetUserId}`);
				io.to(targetSocketId).emit("private:ice-candidate", {
					senderId: socket.userId,
					candidate
				});
			}
		});

		// Handle disconnect
		socket.on("disconnect", (reason) => {
			console.log(`🔌 Socket disconnected: ${socket.id}, reason: ${reason}`);
			const disconnectedUserId = socket.userId || getUserIdFromSocketId(socket.id);

			// Clean up stranger chat
			const partnerSocket = cleanupMatch(socket, io);
			if (partnerSocket) {
				partnerSocket.emit("stranger:disconnected");
			}

			// Clean up private chat
			if (disconnectedUserId) {
				console.log(`❌ User ${disconnectedUserId} disconnected fully.`);
				delete userSocketMap[disconnectedUserId];
				
				// Update user's online status and last seen in database
				prisma.user.update({
					where: { id: disconnectedUserId },
					data: { 
						isOnline: false,
						lastSeen: new Date()
					}
				})
					.then(user => {
						if (user) {
							console.log(`✅ User ${disconnectedUserId} marked as offline`);
							// Emit updated online users to ALL clients
							const onlineUserIds = Object.keys(userSocketMap);
							console.log(`📡 Broadcasting online users: ${onlineUserIds.length} users online`);
							io.emit("getOnlineUsers", onlineUserIds);
						}
					})
					.catch(err => console.error('Failed to update offline status:', err));
			}
		});
	});
}