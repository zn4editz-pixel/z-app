import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import cloudinary from "./cloudinary.js";
import Report from "../models/report.model.js";
import User from "../models/user.model.js"; // <-- ADDED
import FriendRequest from "../models/friendRequest.model.js"; // <-- ADDED
import Message from "../models/message.model.js";

const app = express();
const server = http.createServer(app);

// Setup Socket.IO server with authentication middleware
const io = new Server(server, {
	cors: {
		origin: [
			"http://localhost:5173",
			"https://z-app-frontend-2-0.onrender.com",
			"https://z-pp-main-com.onrender.com", // Added this from your server.js
		],
		credentials: true,
	},
});

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

// === PRIVATE CHAT LOGIC ===
const userSocketMap = {}; // { userId: socketId }

const getUserIdFromSocketId = (socketId) => {
	return Object.keys(userSocketMap).find(
		(key) => userSocketMap[key] === socketId
	);
};

export const getReceiverSocketId = (userId) => userSocketMap[userId];

export const emitToUser = (userId, event, data) => {
	const socketId = userSocketMap[userId];
	if (socketId) {
		console.log(`Emitting ['${event}'] to user ${userId} (socket ${socketId})`);
		io.to(socketId).emit(event, data);
	} else {
		console.log(`Could not find socket for user ${userId} to emit ['${event}']`);
	}
};

// Mark pending messages as delivered when user comes online
const markPendingMessagesAsDelivered = async (userId) => {
	try {
		// Find all messages sent to this user that are still in 'sent' status
		const pendingMessages = await Message.find({
			receiverId: userId,
			status: 'sent'
		});

		if (pendingMessages.length > 0) {
			const deliveredAt = new Date();
			
			// Update all pending messages to delivered
			await Message.updateMany(
				{ receiverId: userId, status: 'sent' },
				{ 
					$set: { 
						status: 'delivered',
						deliveredAt: deliveredAt
					}
				}
			);

			console.log(`✓✓ Marked ${pendingMessages.length} messages as delivered for user ${userId}`);

			// Notify each sender that their messages were delivered
			const senderIds = [...new Set(pendingMessages.map(msg => msg.senderId.toString()))];
			
			for (const senderId of senderIds) {
				const senderMessages = pendingMessages.filter(msg => msg.senderId.toString() === senderId);
				emitToUser(senderId, "messagesDelivered", {
					receiverId: userId,
					messageIds: senderMessages.map(msg => msg._id),
					deliveredAt: deliveredAt
				});
			}
		}
	} catch (error) {
		console.error("Error marking messages as delivered:", error);
	}
};
// === END PRIVATE CHAT LOGIC ===

// === STRANGER CHAT LOGIC ===
let waitingQueue = [];
const matchedPairs = new Map(); // socketId -> partnerSocketId

// ✅ Find and match strangers
const findMatch = (socket) => {
	console.log(`🔍 Finding match for ${socket.id}. Queue size: ${waitingQueue.length}`);
	
	// Remove current socket from queue if present
	waitingQueue = waitingQueue.filter(id => id !== socket.id);
	
	if (waitingQueue.length > 0) {
		// Match with first person in queue
		const partnerSocketId = waitingQueue.shift();
		const partnerSocket = io.sockets.sockets.get(partnerSocketId);
		
		if (partnerSocket) {
			// Create match
			matchedPairs.set(socket.id, partnerSocketId);
			matchedPairs.set(partnerSocketId, socket.id);
			
			console.log(`✅ Matched ${socket.id} with ${partnerSocketId}`);
			
			// Notify both users with socket IDs AND user IDs
			socket.emit("stranger:matched", { 
				partnerId: partnerSocketId,
				partnerUserId: partnerSocket.strangerData?.userId 
			});
			partnerSocket.emit("stranger:matched", { 
				partnerId: socket.id,
				partnerUserId: socket.strangerData?.userId 
			});
		} else {
			// Partner socket no longer exists, try again
			console.log(`⚠️ Partner socket ${partnerSocketId} not found, retrying...`);
			findMatch(socket);
		}
	} else {
		// Add to queue
		waitingQueue.push(socket.id);
		console.log(`⏳ Added ${socket.id} to queue. Queue size: ${waitingQueue.length}`);
		socket.emit("stranger:waiting");
	}
};

// ✅ Clean up matches when user disconnects or skips
const cleanupMatch = (socket) => {
	const partnerSocketId = matchedPairs.get(socket.id);
	
	if (partnerSocketId) {
		const partnerSocket = io.sockets.sockets.get(partnerSocketId);
		
		// Remove both from matched pairs
		matchedPairs.delete(socket.id);
		matchedPairs.delete(partnerSocketId);
		
		console.log(`🧹 Cleaned up match: ${socket.id} <-> ${partnerSocketId}`);
		
		if (partnerSocket) {
			// Notify partner that stranger disconnected
			partnerSocket.emit("stranger:disconnected");
			return partnerSocket;
		}
	}
	
	// Also remove from waiting queue
	waitingQueue = waitingQueue.filter(id => id !== socket.id);
	
	return null;
};
// === END STRANGER CHAT LOGIC ===

// Socket.IO connection logic
io.on("connection", (socket) => {
	console.log("✅ User connected:", socket.id);
	
	const initialUserId = socket.handshake.query.userId;
	if (initialUserId && initialUserId !== 'undefined') {
		console.log(`User ${initialUserId} connected with socket ${socket.id}`);
		userSocketMap[initialUserId] = socket.id;
		socket.userId = initialUserId;
		io.emit("getOnlineUsers", Object.keys(userSocketMap));
		
		// Mark pending messages as delivered when user comes online
		markPendingMessagesAsDelivered(initialUserId);
	}

	// === PRIVATE CHAT (FRIENDS) EVENTS ===
	socket.on("register-user", (userId) => {
		if (userId) {
			userSocketMap[userId] = socket.id;
			socket.userId = userId;
			console.log(`✅ Registered user ${userId} → socket ${socket.id}`);
			io.emit("getOnlineUsers", Object.keys(userSocketMap));
		}
	});

	socket.on("admin-action", ({ targetUserId, action, payload }) => {
		console.log(`👮 Admin action: ${action} for user ${targetUserId}`);
		emitToUser(targetUserId, "admin-action", { action, payload });
	});
	// === END PRIVATE CHAT EVENTS ===

	// === STRANGER CHAT (OMEGLE) EVENTS ===
	socket.on("stranger:joinQueue", (payload) => {
		console.log(`🚀 ${socket.id} joining stranger queue`, payload);
		socket.strangerData = payload; // Store user data on socket
		findMatch(socket);
	});

	socket.on("stranger:skip", () => {
		console.log(`⏭️ ${socket.id} skipping stranger`);
		const partnerSocket = cleanupMatch(socket);
		
		// Notify partner if they exist
		if (partnerSocket) {
			partnerSocket.emit("stranger:disconnected");
		}
		
		// Re-queue the user who skipped
		findMatch(socket);
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

    // --- *** THIS FUNCTION IS NOW FIXED *** ---
	socket.on("stranger:addFriend", async () => {
		const partnerSocketId = matchedPairs.get(socket.id);
		if (!partnerSocketId) return;

		const partnerSocket = io.sockets.sockets.get(partnerSocketId);
		if (!partnerSocket) return;

		try {
			// 1. Get both User IDs
			const senderId = socket.strangerData?.userId;
			const receiverId = partnerSocket.strangerData?.userId;

			if (!senderId || !receiverId) {
				throw new Error("User data not found for friend request.");
			}

			if (senderId === receiverId) {
				throw new Error("Cannot add yourself as a friend.");
			}

			// 2. Check if they are already friends or a request exists
			const [sender, receiver, existingRequest, reverseRequest] = await Promise.all([
				User.findById(senderId),
				User.findById(receiverId),
				FriendRequest.findOne({ sender: senderId, receiver: receiverId }),
				FriendRequest.findOne({ sender: receiverId, receiver: senderId })
			]);

			if (!sender || !receiver) throw new Error("User not found.");

			if (sender.friends.includes(receiverId)) {
				throw new Error("You are already friends.");
			}

			if (existingRequest) {
				throw new Error("Friend request already sent.");
			}

			if (reverseRequest) {
                // If a request already exists from the other person, notify sender
                socket.emit("stranger:addFriendError", { 
                    error: "This user has already sent you a friend request. Check your Social Hub!" 
                });
                throw new Error("This user has already sent you a friend request.");
			} else {
                // 3. Create new friend request and update User arrays
                const newRequest = new FriendRequest({
                    sender: senderId,
                    receiver: receiverId,
                });
                await newRequest.save();

                // Update User model arrays so acceptFriendRequest can find the request
                sender.friendRequestsSent.push(receiverId);
                receiver.friendRequestsReceived.push(senderId);
                await Promise.all([sender.save(), receiver.save()]);

                // 4. Emit success events
                console.log(`👥 Friend request from ${senderId} to ${receiverId} created`);
                
                // Emit to stranger chat UI
                partnerSocket.emit("stranger:friendRequest", { // Notify receiver
                    userData: socket.strangerData,
                    fromSocketId: socket.id
                });
                
                socket.emit("stranger:friendRequestSent", { // Confirm to sender
                    userData: partnerSocket.strangerData
                });
                
                // Also emit to Social Hub (for pending requests)
                const senderProfile = await User.findById(senderId).select("_id username nickname profilePic isVerified");
                console.log(`📤 Emitting friendRequest:received to ${receiverId} with profile:`, senderProfile);
                partnerSocket.emit("friendRequest:received", senderProfile);
                console.log(`✅ Friend request event emitted successfully`);
            }

		} catch (error) {
			console.error("Error creating friend request:", error.message);
			// Notify sender of the error
			socket.emit("stranger:addFriendError", { error: error.message });
		}
	});
    // --- *** END OF FIXED FUNCTION *** ---

    // --- *** THIS FUNCTION IS ALSO FIXED *** ---
	socket.on("stranger:report", async (payload) => {
        // FIX 1: Destructure 'screenshot' from the payload
		const { reporterId, reason, description, category, screenshot } = payload;
		const partnerSocketId = matchedPairs.get(socket.id);
		
		if (partnerSocketId) {
			const partnerSocket = io.sockets.sockets.get(partnerSocketId);
			
			if (partnerSocket && partnerSocket.userId) {
				try {
                    // FIX 2: Validate that the screenshot exists
                    if (!screenshot) {
                        throw new Error("A screenshot is required as proof.");
                    }

                    // FIX 3: Upload the screenshot to Cloudinary
                    const uploadResponse = await cloudinary.uploader.upload(screenshot, {
                        resource_type: "image",
                        folder: "reports",
                    });
                    const screenshotUrl = uploadResponse.secure_url;

                    if (!screenshotUrl) {
                        throw new Error("Failed to upload screenshot.");
                    }

                    // FIX 4: Save the report WITH the new screenshotUrl
					const report = new Report({
						reporter: reporterId,
						reportedUser: partnerSocket.userId,
						reason,
						description,
						category: category || "stranger_chat",
                        screenshot: screenshotUrl, // <-- Added the URL
						context: {
							chatType: "stranger",
							socketIds: [socket.id, partnerSocketId]
						}
					});
					
					await report.save();
					console.log(`🚨 Report saved: ${reporterId} reported ${partnerSocket.userId}`);
					
					socket.emit("stranger:reportSuccess", { message: "Report submitted" });
				} catch (error) {
                    // Send the specific validation error message back to the user
                    const errorMessage = error.errors?.screenshot?.message || error.message || "Failed to submit report";
					console.error("Error saving report:", errorMessage);
					socket.emit("stranger:reportError", { error: errorMessage });
				}
			}
		}
	});
    // --- *** END OF FIXED FUNCTION *** ---

	// === WEBRTC SIGNALING (STRANGER CHAT) ===
	socket.on("webrtc:offer", (payload) => {
		const { sdp } = payload;
		const partnerSocketId = matchedPairs.get(socket.id);
		
		if (partnerSocketId) {
			const partnerSocket = io.sockets.sockets.get(partnerSocketId);
			if (partnerSocket) {
				console.log(`📹 WebRTC offer from ${socket.id} to ${partnerSocketId}`);
				partnerSocket.emit("webrtc:offer", { sdp, from: socket.id });
			}
		}
	});

	socket.on("webrtc:answer", (payload) => {
		const { sdp } = payload;
		const partnerSocketId = matchedPairs.get(socket.id);
		
		if (partnerSocketId) {
			const partnerSocket = io.sockets.sockets.get(partnerSocketId);
			if (partnerSocket) {
				console.log(`📹 WebRTC answer from ${socket.id} to ${partnerSocketId}`);
				partnerSocket.emit("webrtc:answer", { sdp, from: socket.id });
			}
		}
	});

	socket.on("webrtc:ice-candidate", (payload) => {
		const { candidate } = payload;
		const partnerSocketId = matchedPairs.get(socket.id);
		
		if (partnerSocketId) {
			const partnerSocket = io.sockets.sockets.get(partnerSocketId);
			if (partnerSocket) {
				partnerSocket.emit("webrtc:ice-candidate", { candidate, from: socket.id });
			}
		}
	});
	// === END STRANGER WEBRTC ===

	// === PRIVATE CALL (FRIENDS) EVENTS ===
	// ... (your private call code remains unchanged) ...
	socket.on("private:initiate-call", (payload) => {
		const { receiverId, callerInfo, callType } = payload;
		const callerId = socket.userId;
		console.log(`📞 Call initiated from ${callerId} to ${receiverId} (Type: ${callType})`);
		
		if (callerId) {
			emitToUser(receiverId, "private:incoming-call", {
				callerId,
				callerInfo,
				callType,
			});
		} else {
			console.error("Cannot initiate call: callerId not found on socket.");
		}
	});

	socket.on("private:call-accepted", (payload) => {
		const { callerId, acceptorInfo } = payload;
		const acceptorId = socket.userId;
		console.log(`✅ Call accepted by ${acceptorId} for caller ${callerId}`);
		
		if (acceptorId) {
			emitToUser(callerId, "private:call-accepted", {
				acceptorId,
				acceptorInfo,
			});
		} else {
			console.error("Cannot accept call: acceptorId not found on socket.");
		}
	});

	// Removed duplicate private:call-rejected handler to prevent echo/loop
	// Only private:reject-call should be used by clients

	socket.on("private:reject-call", (payload) => {
		const { callerId } = payload;
		const rejectorId = socket.userId;
		console.log(`❌ Call rejected by ${rejectorId} for caller ${callerId}`);
		
		if (rejectorId) {
			emitToUser(callerId, "private:call-rejected", {
				rejectorId,
				reason: "Call declined",
			});
		} else {
			console.error("Cannot reject call: rejectorId not found on socket.");
		}
	});

	socket.on("private:offer", (payload) => {
		const { receiverId, sdp } = payload;
		const callerId = socket.userId;
		console.log(`🔒 private:offer from ${callerId} to ${receiverId}`);
		
		if (callerId) {
			emitToUser(receiverId, "private:offer", { callerId, sdp });
		} else {
			console.error("Cannot send offer: callerId not found on socket.");
		}
	});

	socket.on("private:answer", (payload) => {
		const { callerId, sdp } = payload;
		const acceptorId = socket.userId;
		console.log(`🔒 private:answer from ${acceptorId} to ${callerId}`);
		
		if (acceptorId) {
			emitToUser(callerId, "private:answer", { acceptorId, sdp });
		} else {
			console.error("Cannot send answer: acceptorId not found on socket.");
		}
	});

	socket.on("private:ice-candidate", (payload) => {
		const { targetUserId, candidate } = payload;
		const senderId = socket.userId;
		
		if (senderId) {
			emitToUser(targetUserId, "private:ice-candidate", { senderId, candidate });
		} else {
			console.error("Cannot send ICE candidate: senderId not found on socket.");
		}
	});

	socket.on("private:end-call", (payload) => {
		const { targetUserId } = payload;
		const userId = socket.userId;
		console.log(`📞 Ending call between ${userId} and ${targetUserId}`);
		
		if (userId) {
			emitToUser(targetUserId, "private:call-ended", { userId });
		} else {
			console.error("Cannot end call: userId not found on socket.");
		}
	});
	// === END PRIVATE CALL EVENTS ===

	// === TYPING INDICATOR ===
	socket.on("typing", (payload) => {
		const { receiverId } = payload;
		const senderId = socket.userId;
		
		if (senderId) {
			emitToUser(receiverId, "typing", { senderId });
		}
	});

	socket.on("stopTyping", (payload) => {
		const { receiverId } = payload;
		const senderId = socket.userId;
		
		if (senderId) {
			emitToUser(receiverId, "stopTyping", { senderId });
		}
	});
	// === END TYPING INDICATOR ===

	// Handle disconnects
	socket.on("disconnect", () => {
		console.log("❌ User disconnected:", socket.id);
		const disconnectedUserId = socket.userId || getUserIdFromSocketId(socket.id);

		// Cleanup Stranger Chat
		waitingQueue = waitingQueue.filter((id) => id !== socket.id);
		const partnerSocket = cleanupMatch(socket);
		if (partnerSocket) {
			partnerSocket.emit("stranger:disconnected");
			findMatch(partnerSocket);
		}

		// Cleanup Private Chat
		if (disconnectedUserId) {
			console.log(`User ${disconnectedUserId} disconnected fully.`);
			delete userSocketMap[disconnectedUserId];
			io.emit("getOnlineUsers", Object.keys(userSocketMap));
		}
	});
});

// Make io accessible globally for admin controller
app.set("io", io);

// Export for index.js
export { io, server, app, userSocketMap };
