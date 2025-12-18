import jwt from "jsonwebtoken";
import prisma from "./db.js";

// === PRIVATE CHAT LOGIC ===
export const userSocketMap = {}; // { userId: socketId }

const getUserIdFromSocketId = (socketId) => {
	return Object.keys(userSocketMap).find(
		(key) => userSocketMap[key] === socketId
	);
};

export const getReceiverSocketId = (userId) => userSocketMap[userId];

// Store io instance for use in emitToUser
let ioInstance = null;
export const getIO = () => ioInstance;

export const emitToUser = (userId, event, data) => {
	const stringId = String(userId);
	const socketId = userSocketMap[stringId];
	if (socketId && ioInstance) {
		ioInstance.to(socketId).emit(event, data);
		return true;
	} else {
		return false;
	}
};

// === STRANGER CHAT LOGIC ===
let waitingQueue = [];
const matchedPairs = new Map(); // socketId -> partnerSocketId
const recentMatches = new Map(); // socketId -> Set of recent partner socketIds

// Find and match strangers
const findMatch = (socket, io) => {
	// Check if this socket is already matched
	if (matchedPairs.has(socket.id)) {
		return;
	}
	// Remove self from queue to prevent matching with self
	waitingQueue = waitingQueue.filter(id => id !== socket.id);

	if (waitingQueue.length > 0) {
		// Find first compatible partner in queue
		let partnerSocketId = null;
		let partnerSocket = null;
		let partnerIndex = -1;
		const myRecentMatches = recentMatches.get(socket.id) || new Set();

		// Iterate through queue without removing items yet
		for (let i = 0; i < waitingQueue.length; i++) {
			const candidateId = waitingQueue[i];
			// Skip if candidate is already matched (shouldn't be in queue, but safety check)
			if (matchedPairs.has(candidateId)) {
				continue;
			}
			// Skip if this was a recent match (ANTI-SPAM / DIVERSITY)
			if (myRecentMatches.has(candidateId)) {
				continue;
			}

			const candidateSocket = io.sockets.sockets.get(candidateId);
			if (candidateSocket) {
				// Found valid partner!
				partnerSocketId = candidateId;
				partnerSocket = candidateSocket;
				partnerIndex = i;
				break;
			} else {
				// Socket dead?
			}
		}

		if (partnerSocket && partnerSocketId) {
			// Remove partner from queue since they are now matched
			if (partnerIndex > -1) {
				waitingQueue.splice(partnerIndex, 1);
			}
			// Create match
			matchedPairs.set(socket.id, partnerSocketId);
			matchedPairs.set(partnerSocketId, socket.id);

			// Add to recent matches
			if (!recentMatches.has(socket.id)) recentMatches.set(socket.id, new Set());
			if (!recentMatches.has(partnerSocketId)) recentMatches.set(partnerSocketId, new Set());
			recentMatches.get(socket.id).add(partnerSocketId);
			recentMatches.get(partnerSocketId).add(socket.id);

			// Limit recent matches (keep last 5)
			if (recentMatches.get(socket.id).size > 5) {
				const [first] = recentMatches.get(socket.id);
				recentMatches.get(socket.id).delete(first);
			}
			if (recentMatches.get(partnerSocketId).size > 5) {
				const [first] = recentMatches.get(partnerSocketId);
				recentMatches.get(partnerSocketId).delete(first);
			}

			// REDUCED COOLDOWN: Clear recent match after 5 seconds
			setTimeout(() => {
				if (recentMatches.has(socket.id)) recentMatches.get(socket.id).delete(partnerSocketId);
				if (recentMatches.has(partnerSocketId)) recentMatches.get(partnerSocketId).delete(socket.id);
			}, 5000);

			// Send match data
			const partnerDisplayData = {
				userId: partnerSocket.strangerData?.userId,
				displayName: partnerSocket.strangerData?.username || partnerSocket.strangerData?.nickname || "Stranger",
				profilePic: partnerSocket.strangerData?.profilePic || null,
				isVerified: partnerSocket.strangerData?.isVerified || false,
				allowFriendRequests: partnerSocket.strangerData?.allowFriendRequests !== false
			};
			const myDisplayData = {
				userId: socket.strangerData?.userId,
				displayName: socket.strangerData?.username || socket.strangerData?.nickname || "Stranger",
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
			// No valid partner found, add self to queue
			waitingQueue.push(socket.id);
			socket.emit("stranger:waiting");
		}
	} else {
		// Queue empty, just add self
		waitingQueue.push(socket.id);
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
		if (partnerSocket) {
			return partnerSocket;
		}
	}
	// Remove from waiting queue
	waitingQueue = waitingQueue.filter(id => id !== socket.id);
	return null;
};

export function initializeSocketHandlers(io) {
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
			}
			next();
		} catch (error) {
			// Allow connection even without token for backward compatibility
			next();
		}
	});

	io.on("connection", (socket) => {
		// Register user for private chat
		if (socket.userId) {
			const stringUserId = String(socket.userId);
			userSocketMap[stringUserId] = socket.id;

			// Update user's online status in database
			prisma.user.update({
				where: { id: stringUserId },
				data: { isOnline: true }
			})
				.then(async user => {
					if (user) {
						// Emit online users to ALL clients
						const onlineUserIds = Object.keys(userSocketMap);
						io.emit("getOnlineUsers", onlineUserIds);

						// 🔥 REALTIME DELIVERY: Mark 'sent' messages as 'delivered' when user comes online
						try {
							const pendingMessages = await prisma.message.findMany({
								where: {
									receiverId: socket.userId,
									status: 'sent'
								},
								select: { id: true, senderId: true }
							});

							if (pendingMessages.length > 0) {
								// Update in DB
								await prisma.message.updateMany({
									where: {
										id: { in: pendingMessages.map(m => m.id) }
									},
									data: {
										status: 'delivered',
										deliveredAt: new Date()
									}
								});

								// 🔥 REALTIME: Emit delivery status to senders immediately
								const senderIds = [...new Set(pendingMessages.map(m => m.senderId))];
								senderIds.forEach(senderId => {
									const senderSocketId = userSocketMap[senderId];
									if (senderSocketId) {
										// Send bulk delivery notification
										const messagesForSender = pendingMessages.filter(m => m.senderId === senderId);
										io.to(senderSocketId).emit("messagesDelivered", {
											receiverId: socket.userId,
											messageIds: messagesForSender.map(m => m.id),
											deliveredAt: new Date()
										});
									}
								});
							}
						} catch (error) {
							// Ignore error during delivery status update
						}
					}
				})
				.catch(err => {
					console.error("Error updating user online status:", err);
				});
		}

		// Handle manual user registration (for compatibility)
		socket.on("register-user", (userId) => {
			if (userId) {
				userSocketMap[userId] = socket.id;
				socket.userId = userId;

				// Update user's online status in database
				prisma.user.update({
					where: { id: userId },
					data: { isOnline: true }
				})
					.then(user => {
						if (user) {

							const onlineUserIds = Object.keys(userSocketMap);
							io.emit("getOnlineUsers", onlineUserIds);
						}
					})
					.catch(err => {
						console.error("Error updating user status manual:", err);
					});
			}
		});

		// === STRANGER CHAT EVENTS ===
		socket.on("stranger:joinQueue", (payload) => {
			socket.strangerData = payload; // Store user data on socket
			findMatch(socket, io);
		});

		socket.on("stranger:skip", () => {
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
					partnerSocket.emit("stranger:reaction", { emoji });
				}
			}
		});

		// Report handler
		socket.on("stranger:report", async (payload) => {
			try {
				const { reporterId, reportedUserId, reason, description, screenshot, category, isAIDetected } = payload;
				let finalScreenshotUrl = null;

				if (!reporterId || !reportedUserId || !reason) {
					return;
				}

				// Upload evidence to Cloudinary if present
				if (screenshot && screenshot.startsWith('data:image')) {
					try {
						const { default: cloudinary } = await import("./cloudinary.js");
						const uploadRes = await cloudinary.uploader.upload(screenshot, {
							folder: "stranger-chat-reports",
							resource_type: "image"
						});
						finalScreenshotUrl = uploadRes.secure_url;
					} catch (uploadError) {
						// Fallback
						finalScreenshotUrl = null;
					}
				} else {
					finalScreenshotUrl = screenshot; // Assume it's already a URL if not data URI
				}

				// Create report in database
				const report = await prisma.report.create({
					data: {
						reporterId,
						reportedUserId,
						reason,
						description,
						screenshot: finalScreenshotUrl,
						category: category || 'stranger_chat',
						isAIDetected: isAIDetected || false,
						status: 'pending'
					}
				});

				// Create Admin Notification
				await prisma.adminNotification.create({
					data: {
						type: 'report',
						title: `New ${isAIDetected ? 'AI ' : ''}Report: ${reason}`,
						message: `User ${reporterId} reported ${reportedUserId} for ${reason}`,
						link: `/admin/reports/${report.id}`
					}
				});

				// Acknowledge success to reporter
				socket.emit("stranger:report_success", { reportId: report.id });

				// 🔥 Notify admins via socket for real-time dashboard updates
				io.emit("admin:newReport", report);
			} catch (error) {
				socket.emit("stranger:report_error", { message: "Failed to save report: " + error.message });
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
				if (!senderId || !receiverId) {
					throw new Error('Sender or receiver ID missing');
				}

				// ⚡ CREATE MESSAGE WITH REPLY SUPPORT (ULTRA-FAST)
				const newMessage = await prisma.message.create({
					data: {
						senderId: senderId,
						receiverId: receiverId,
						text: text || null,
						image: image || null,
						voice: voice || null,
						voiceDuration: voiceDuration || null,
						replyToId: replyTo || null, // ✅ ADD REPLY SUPPORT
						status: 'sent' // ✅ Set status immediately
					}
				});

				// 🔥 ULTRA-FAST: Fetch replyTo separately if needed (non-blocking)
				let replyToMessage = null;
				if (replyTo) {
					try {
						replyToMessage = await prisma.message.findUnique({
							where: { id: replyTo },
							select: {
								id: true,
								senderId: true,
								text: true,
								image: true,
								voice: true,
								createdAt: true
							}
						});
					} catch (error) {
						// Ignore reply fetch error
					}
				}

				// Add replyTo to message object
				const messageWithReply = {
					...newMessage,
					replyTo: replyToMessage
				};

				// ⚡ OPTIMIZATION: Send to sockets IMMEDIATELY (don't wait for cache clear)
				const receiverSocketId = getReceiverSocketId(receiverId);
				if (receiverSocketId) {
					// 🔥 REALTIME FIX: Mark as delivered IMMEDIATELY if user is online
					// Don't wait for client ACK - this ensures instant double-ticks
					await prisma.message.update({
						where: { id: newMessage.id },
						data: {
							status: 'delivered',
							deliveredAt: new Date()
						}
					});

					// Update local object to send correct status to receiver
					messageWithReply.status = 'delivered';
					messageWithReply.deliveredAt = new Date();

					io.to(receiverSocketId).emit("newMessage", messageWithReply);
					// 🔥 Notify sender immediately of delivery
					socket.emit("messageDelivered", {
						messageId: newMessage.id,
						receiverId: receiverId,
						deliveredAt: new Date()
					});
				} else {
					// User offline
				}

				// ⚡ INSTANT: Send back to sender (replace optimistic message)
				socket.emit("newMessage", messageWithReply);
			} catch (error) {
				socket.emit("messageError", { error: error.message, tempId });
			}
		});

		// Friend request events
		socket.on("friendRequestSent", (data) => {
			const receiverSocketId = getReceiverSocketId(data.receiverId);
			if (receiverSocketId) {
				io.to(receiverSocketId).emit("friendRequestReceived", data);
			}
		});

		socket.on("friendRequestAccepted", (data) => {
			const senderSocketId = getReceiverSocketId(data.senderId);
			if (senderSocketId) {
				io.to(senderSocketId).emit("friendRequestAccepted", data);
			}
		});

		// Typing indicators (Updated for consistency)
		socket.on("typing", (data) => {
			try {
				if (!data) return;
				const receiverId = data.receiverId;
				const senderId = socket.userId || data.senderId; // Robust fallback
				if (!senderId) return;

				const receiverSocketId = getReceiverSocketId(receiverId);
				if (receiverSocketId) {
					io.to(receiverSocketId).emit("typing", {
						senderId: senderId,
						isTyping: true
					});
				}
			} catch (error) {
				// Ignore
			}
		});

		// === SOS GAME EVENTS ===
		socket.on("game:invite", (data) => {
			const { receiverId } = data;
			const senderId = socket.userId;
			const senderName = data.senderName || "Unknown";
			const senderPic = data.senderPic || null;

			// Use provided gameId or generate one
			const gameId = data.gameId || `game_${Date.now()}_${senderId}_${receiverId}`;

			// Create game in memory
			import("./gameManager.js").then(({ gameManager }) => {
				const onExpire = (expiredGameId) => {
					const receiverSocketId = getReceiverSocketId(receiverId);
					const senderSocketId = getReceiverSocketId(senderId);
					if (senderSocketId) io.to(senderSocketId).emit("game:expired", { gameId: expiredGameId });
					if (receiverSocketId) io.to(receiverSocketId).emit("game:expired", { gameId: expiredGameId });
				};

				const onTurnTimeout = (gameId) => {
					const game = gameManager.switchTurn(gameId);
					if (game) {
						const publicGame = gameManager.getPublicState(game.id);
						// Broadcast update
						game.playerIds.forEach(pid => {
							const sockId = getReceiverSocketId(pid);
							if (sockId) {
								if (game.status === 'finished') {
									io.to(sockId).emit("game:end", { winner: game.winner, game: publicGame });
								} else {
									io.to(sockId).emit("game:update", {
										game: publicGame,
										message: "Turn timed out! Switching turns."
									});
								}
							}
						});
					}
				};
				const game = gameManager.createGame(gameId, senderId, senderName, senderPic, onExpire, onTurnTimeout);

				// Notify receiver
				const receiverSocketId = getReceiverSocketId(receiverId);
				if (receiverSocketId) {
					io.to(receiverSocketId).emit("game:invite", {
						gameId,
						senderId,
						senderName,
						senderPic,
						inviteId: data.inviteId
					});
				}
			}).catch(err => {
				socket.emit("game:error", { message: "Internal server error creating game." });
			});
		});

		// ✅ RE-ADDED MISSING HANDLERS
		socket.on("game:join", async ({ gameId, myName, myPic }) => {
			try {
				// Dynamic import to avoid circular dependencies if any
				const { gameManager } = await import("./gameManager.js");
				const result = await gameManager.joinGame(gameId, socket.userId, myName, myPic);

				if (result.error) {
					socket.emit("game:error", { message: result.error });
					return;
				}
				const game = result.game;
				const publicGame = gameManager.getPublicState(game.id);

				// Notify both players
				game.playerIds.forEach(pid => {
					const sockId = getReceiverSocketId(pid);
					if (sockId) {
						io.to(sockId).emit("game:start", { game: publicGame });
					} else {
						// Player offline
					}
				});
			} catch (error) {
				socket.emit("game:error", { message: error.message });
			}
		});

		socket.on("game:move", async ({ gameId, row, col, letter }) => {
			try {
				const { gameManager } = await import("./gameManager.js");
				const result = gameManager.makeMove(gameId, socket.userId, row, col, letter);
				if (result) {
					const game = gameManager.getGame(gameId);
					const publicGame = gameManager.getPublicState(gameId);
					// Broadcast update/end
					game.playerIds.forEach(pid => {
						const sockId = getReceiverSocketId(pid);
						if (sockId) {
							if (game.status === 'finished') {
								io.to(sockId).emit("game:end", { winner: game.winner, game: publicGame });
							} else {
								io.to(sockId).emit("game:update", { game: publicGame, lastMove: { row, col, letter, playerId: socket.userId } });
							}
						}
					});
				}
			} catch (error) {
				// Ignore
			}
		});

		socket.on("stopTyping", (data) => {
			try {
				if (!data) return;
				const receiverId = data.receiverId;
				const senderId = socket.userId || data.senderId; // Robust fallback
				if (!senderId) return;

				const receiverSocketId = getReceiverSocketId(receiverId);
				if (receiverSocketId) {
					io.to(receiverSocketId).emit("stopTyping", {
						senderId: senderId,
						isTyping: false
					});
				}
			} catch (error) {
				// Ignore
			}
		});

		// Message status updates
		socket.on("messageDelivered", (data) => {
			const senderSocketId = getReceiverSocketId(data.senderId);
			if (senderSocketId) {
				io.to(senderSocketId).emit("messageDelivered", {
					messageId: data.messageId,
					deliveredAt: new Date()
				});
			}
		});

		socket.on("messageRead", async (data) => {
			try {
				const { messageId, senderId } = data;
				const readerId = socket.userId;
				// Update message status in database
				await prisma.message.update({
					where: { id: messageId },
					data: {
						status: 'read',
						readAt: new Date()
					}
				});

				// Notify sender that message was read
				const senderSocketId = getReceiverSocketId(senderId);
				if (senderSocketId) {
					io.to(senderSocketId).emit("messagesRead", {
						receiverId: readerId,
						messageIds: [messageId]
					});
				}
			} catch (error) {
				// Ignore
			}
		});

		// ✅ REALTIME REACTIONS: Handle instant reaction updates via socket
		socket.on("messageReaction", async ({ messageId, emoji, receiverId }) => {
			try {
				const senderId = socket.userId;
				if (!senderId || !receiverId || !messageId || !emoji) {
					return;
				}
				// Get the message to verify ownership
				const message = await prisma.message.findUnique({
					where: { id: messageId }
				});
				if (!message) {
					return;
				}
				// Verify user is part of this conversation
				if (message.senderId !== senderId && message.receiverId !== senderId) {
					return;
				}

				// Get current reactions and update - PostgreSQL JSON field
				let reactions = [];
				if (message.reactions) {
					if (typeof message.reactions === 'string') {
						try {
							reactions = JSON.parse(message.reactions);
						} catch (error) {
							reactions = [];
						}
					} else if (Array.isArray(message.reactions)) {
						reactions = message.reactions;
					} else {
						reactions = [];
					}
				}

				// Remove existing reaction from this user
				reactions = reactions.filter(r => r.userId !== senderId);
				// Add new reaction
				reactions.push({
					userId: senderId,
					emoji: emoji,
					createdAt: new Date().toISOString()
				});

				// Update in database - store as JSON
				await prisma.message.update({
					where: { id: messageId },
					data: { reactions: reactions }
				});

				// ✅ INSTANT: Notify receiver immediately via socket
				const receiverSocketId = getReceiverSocketId(receiverId);
				if (receiverSocketId) {
					io.to(receiverSocketId).emit("messageReaction", {
						messageId,
						reactions
					});
				}
				// ✅ INSTANT: Confirm to sender
				socket.emit("messageReaction", {
					messageId,
					reactions
				});
			} catch (error) {
				// Ignore
			}
		});

		// ✅ REALTIME REACTION REMOVAL: Handle instant reaction removal via socket
		socket.on("messageReactionRemove", async ({ messageId, receiverId }) => {
			try {
				const senderId = socket.userId;
				if (!senderId || !receiverId || !messageId) {
					return;
				}
				// Get the message to verify ownership
				const message = await prisma.message.findUnique({
					where: { id: messageId }
				});
				if (!message) {
					return;
				}
				// Verify user is part of this conversation
				if (message.senderId !== senderId && message.receiverId !== senderId) {
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
				}
				// ✅ INSTANT: Confirm to sender
				socket.emit("messageReaction", {
					messageId,
					reactions
				});
			} catch (error) {
				// Ignore
			}
		});

		// === PRIVATE CALL EVENTS ===
		socket.on("private:start-call", (data) => {
			const { receiverId, callType, callerInfo } = data;
			const receiverSocketId = getReceiverSocketId(receiverId);
			if (receiverSocketId) {
				io.to(receiverSocketId).emit("private:incoming-call", {
					callerId: socket.userId,
					callerInfo,
					callType
				});
			} else {
				// Create Missed Call Log
				prisma.message.create({
					data: {
						senderId: socket.userId,
						receiverId: receiverId,
						isCallLog: true,
						callType: callType,
						callDuration: 0,
						callStatus: 'missed',
						callInitiator: socket.userId,
						status: 'sent'
					}
				}).then(msg => {
					// Emit to sender so they see it in chat
					socket.emit("newMessage", msg);
				}).catch(err => {
					console.error("Failed to create missed call log:", err);
				});
				socket.emit("private:call-failed", { reason: "User not online" });
			}
		});

		socket.on("private:initiate-call", (data) => {
			const { receiverId, callerInfo, callType } = data;
			const receiverSocketId = getReceiverSocketId(receiverId);
			if (receiverSocketId) {
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
				io.to(callerSocketId).emit("private:call-rejected", {
					rejectorId: socket.userId,
					reason: reason || 'declined'
				});

				// Create Declined Call Log
				prisma.message.create({
					data: {
						senderId: callerId, // Caller initiated
						receiverId: socket.userId, // Current user rejected
						isCallLog: true,
						callType: 'audio', // Fallback default
						callDuration: 0,
						callStatus: 'declined',
						callInitiator: callerId,
						status: 'read'
					}
				}).then(msg => {
					// Emit to both
					io.to(callerSocketId).emit("newMessage", msg);
					socket.emit("newMessage", msg);
				}).catch(err => {
					// Ignore error
				});
			}
		});

		socket.on("private:end-call", (data) => {
			const { targetUserId } = data;
			const targetSocketId = getReceiverSocketId(targetUserId);
			if (targetSocketId) {
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
				io.to(targetSocketId).emit("private:ice-candidate", {
					senderId: socket.userId,
					candidate
				});
			}
		});

		// Handle disconnect
		socket.on("disconnect", (reason) => {
			const disconnectedUserId = socket.userId || getUserIdFromSocketId(socket.id);
			// Clean up stranger chat
			const partnerSocket = cleanupMatch(socket, io);
			if (partnerSocket) {
				partnerSocket.emit("stranger:disconnected");
			}

			// Clean up SOS Game (Forfeit)
			if (disconnectedUserId) {
				import("./gameManager.js").then(({ gameManager }) => {
					const activeGame = gameManager.findGameByPlayerId(disconnectedUserId);
					if (activeGame) {
						// Determine winner (the other player)
						const winnerId = activeGame.playerIds.find(pid => pid !== disconnectedUserId);
						if (winnerId) {
							activeGame.status = 'finished';
							activeGame.winner = winnerId;
							const remainingSocketId = getReceiverSocketId(winnerId);
							if (remainingSocketId) {
								const publicGame = gameManager.getPublicState(activeGame.id);
								io.to(remainingSocketId).emit("game:end", {
									winner: winnerId,
									game: publicGame,
									reason: "opponent_disconnected"
								});
							}
						}
						// Clear game timer
						if (activeGame.turnTimer) clearTimeout(activeGame.turnTimer);
					}
				}).catch(err => {
					// Ignore
				});
			}

			// Clean up private chat
			if (disconnectedUserId) {
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
							// Emit updated online users to ALL clients
							const onlineUserIds = Object.keys(userSocketMap);
							io.emit("getOnlineUsers", onlineUserIds);
						}
					})
					.catch(err => {
						console.error("Error clearing user online status:", err);
					});
			}
		});
	});

}
