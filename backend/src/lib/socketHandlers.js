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
	console.log(`🚀 emitToUser: Checking socket for User: ${stringId} (Original: ${userId})`);
	if (socketId && ioInstance) {
		console.log(`✅ FOUND SOCKET ${socketId} for user ${stringId}. Emitting [${event}]`);
		ioInstance.to(socketId).emit(event, data);
		return true;
	} else {
		console.log(`❌ NO SOCKET FOUND for user ${stringId}. Cannot emit [${event}]`);
		console.log(`   -> Current userSocketMap keys: ${Object.keys(userSocketMap).join(", ")}`);
		return false;
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
				console.log(`🔄 Skipping recent match: ${candidateId}`);
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
				console.log(`👻 Cleanup dead socket from queue: ${candidateId}`);
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

			// REDUCED COOLDOWN: Clear recent match after 5 seconds (better for testing/small pool)
			// User requested "omegle like", allowing quick reconnections if wanted
			setTimeout(() => {
				if (recentMatches.has(socket.id)) recentMatches.get(socket.id).delete(partnerSocketId);
				if (recentMatches.has(partnerSocketId)) recentMatches.get(partnerSocketId).delete(socket.id);
			}, 5000); // Changed from 30s to 5s

			console.log(`✅ Matched ${socket.id} with ${partnerSocketId}`);

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
			console.log(`⏳ Added ${socket.id} to queue (no valid partner). Queue size: ${waitingQueue.length}`);
			socket.emit("stranger:waiting");
		}
	} else {
		// Queue empty, just add self
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
			const stringUserId = String(socket.userId);
			userSocketMap[stringUserId] = socket.id;
			console.log(`👤 User ${stringUserId} registered with socket ${socket.id}`);

			// Update user's online status in database
			prisma.user.update({
				where: { id: stringUserId },
				data: { isOnline: true }
			})
				.then(async user => {
					if (user) {
						console.log(`✅ User ${socket.userId} marked as online in database`);
						// Emit online users to ALL clients
						const onlineUserIds = Object.keys(userSocketMap);
						console.log(`📡 Broadcasting online users: ${onlineUserIds.length} users online`);
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
								console.log(`📩 REALTIME: Found ${pendingMessages.length} pending messages for ${socket.userId}, marking as delivered...`);

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
										console.log(`📡 REALTIME: Notifying sender ${senderId} of ${messagesForSender.length} delivered messages`);

										io.to(senderSocketId).emit("messagesDelivered", {
											receiverId: socket.userId,
											messageIds: messagesForSender.map(m => m.id),
											deliveredAt: new Date()
										});
									}
								});
								console.log(`✅ REALTIME: Marked ${pendingMessages.length} messages as delivered with instant notifications.`);
							}
						} catch (error) {
							console.error('❌ Failed to update pending messages:', error);
						}
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
							if (process.env.NODE_ENV === 'development') console.log(`✅ User ${userId} marked as online in database`);
							const onlineUserIds = Object.keys(userSocketMap);
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

		// Report handler
		socket.on("stranger:report", async (payload) => {
			console.log(`🚨 Report received from ${socket.id}`, { ...payload, screenshot: payload.screenshot ? 'BASE64_HIDDEN' : null });

			try {
				const { reporterId, reportedUserId, reason, description, screenshot, category, isAIDetected } = payload;
				let finalScreenshotUrl = null;

				if (!reporterId || !reportedUserId || !reason) {
					console.error("❌ Invalid report data:", payload);
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
						console.log(`☁️ Evidence uploaded to Cloudinary: ${finalScreenshotUrl}`);
					} catch (uploadError) {
						console.error("❌ Cloudinary upload failed:", uploadError);
						// Fallback: Store base64 if small enough, or skip
						// For now, we'll try to store just a placeholder or the base64 if user really wants, 
						// but typically base64 is too big for TEXT columns. 
						// We will set it to null to avoid DB crash if upload fails.
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

				console.log(`✅ Report created: ${report.id}`);

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
				console.error("❌ Failed to process report:", error);
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
				console.log(`📤 SOCKET MESSAGE RECEIVED:`);
				console.log(`   From: ${senderId} (socket: ${socket.id})`);
				console.log(`   To: ${receiverId}`);
				console.log(`   Text: ${text?.substring(0, 50)}...`);
				console.log(`   TempId: ${tempId}`);

				if (!senderId || !receiverId) {
					console.error('❌ Missing sender or receiver ID:', { senderId, receiverId });
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
						console.warn('⚠️ Could not fetch reply-to message:', error.message);
					}
				}

				// Add replyTo to message object
				const messageWithReply = {
					...newMessage,
					replyTo: replyToMessage
				};

				console.log(`⚡ Message saved in database: ${newMessage.id}`);

				// ⚡ OPTIMIZATION: Send to sockets IMMEDIATELY (don't wait for cache clear)
				const receiverSocketId = getReceiverSocketId(receiverId);
				console.log(`📊 Looking for receiver ${receiverId} in userSocketMap...`);
				console.log(`📊 Current userSocketMap:`, Object.keys(userSocketMap));
				console.log(`📊 Receiver socket ID: ${receiverSocketId}`);

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
					console.log(`⚡ SUCCESS: Message sent to receiver ${receiverId} (socket: ${receiverSocketId})`);

					// 🔥 Notify sender immediately of delivery
					socket.emit("messageDelivered", {
						messageId: newMessage.id,
						receiverId: receiverId,
						deliveredAt: new Date()
					});
				} else {
					console.log(`⚠️ OFFLINE: Receiver ${receiverId} not online - message saved but not delivered`);
				}

				// ⚡ INSTANT: Send back to sender (replace optimistic message)
				socket.emit("newMessage", messageWithReply);
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
				console.error("❌ Error in typing handler:", error);
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
					console.log(`⌛ Game ${expiredGameId} expired due to timeout.`);
					const receiverSocketId = getReceiverSocketId(receiverId);
					const senderSocketId = getReceiverSocketId(senderId);

					if (senderSocketId) io.to(senderSocketId).emit("game:expired", { gameId: expiredGameId });
					if (receiverSocketId) io.to(receiverSocketId).emit("game:expired", { gameId: expiredGameId });
				};

				const onTurnTimeout = (gameId) => {
					console.log(`⏱️ Turn timeout for game ${gameId}`);
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
					console.log(`🎮 Game Invite sent from ${senderId} to ${receiverId} (GameID: ${gameId})`);
				}
			}).catch(err => {
				console.error("❌ Error in game:invite handler:", err);
				socket.emit("game:error", { message: "Internal server error creating game." });
			});
		});

		// ✅ RE-ADDED MISSING HANDLERS
		socket.on("game:join", async ({ gameId, myName, myPic }) => {
			console.log(`🎮 game:join request from ${socket.userId} for game ${gameId}`);
			try {
				// Dynamic import to avoid circular dependencies if any
				const { gameManager } = await import("./gameManager.js");

				const result = await gameManager.joinGame(gameId, socket.userId, myName, myPic);

				if (result.error) {
					console.error(`❌ Join failed: ${result.error}`);
					socket.emit("game:error", { message: result.error });
					return;
				}

				const game = result.game;
				const publicGame = gameManager.getPublicState(game.id);

				console.log(`✅ Game Joined! Players: ${JSON.stringify(game.playerIds)}`);

				// Notify both players
				game.playerIds.forEach(pid => {
					const sockId = getReceiverSocketId(pid);
					console.log(`📤 Sending game:start to Player ${pid} (Socket: ${sockId})`);
					if (sockId) {
						io.to(sockId).emit("game:start", { game: publicGame });
					} else {
						console.warn(`⚠️ Socket not found for player ${pid}`);
					}
				});
			} catch (error) {
				console.error("❌ Error in game:join:", error);
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
					console.log("📏 Backend - Lines to send:", publicGame?.lines);
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
				console.error("❌ Error in game:move:", error);
			}
		});

		socket.on("stopTyping", (data) => {
			try {
				if (!data) return;
				const receiverId = data.receiverId;
				const senderId = socket.userId || data.senderId;

				if (!senderId) return;

				const receiverSocketId = getReceiverSocketId(receiverId);
				if (receiverSocketId) {
					io.to(receiverSocketId).emit("stopTyping", {
						senderId: senderId,
						isTyping: false
					});
				}
			} catch (error) {
				console.error("❌ Error in stopTyping handler:", error);
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

				console.log(`👀 REALTIME: Message ${messageId} read by ${readerId} from ${senderId}`);

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
					console.log(`📡 REALTIME: Notifying sender ${senderId} that message ${messageId} was read`);
					io.to(senderSocketId).emit("messagesRead", {
						receiverId: readerId,
						messageIds: [messageId]
					});
				}
			} catch (error) {
				console.error('❌ Error marking message as read:', error);
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
					console.log("✅ Created missed call log for offline user");
					// Emit to sender so they see it in chat
					socket.emit("newMessage", msg);
				}).catch(err => console.error("Failed to create missed call log:", err));

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

				// Create Declined Call Log
				prisma.message.create({
					data: {
						senderId: callerId, // Caller initiated
						receiverId: socket.userId, // Current user rejected
						isCallLog: true,
						callType: 'audio', // Default or need to pass it? We don't have callType here cleanly unless passed.
						// Actually, better to assume generic or pass it from client. 
						// For now, let's omit callType if possible or default to 'audio'. 
						// Wait, schema might require it. Let's check schema/previous usage.
						// Previous usage in createCallLog used 'audio' or 'video'.
						// The 'private:reject-call' event payload only has callerId and reason.
						// We should probably rely on the existing client logic? 
						// No, client logic didn't post for rejection.
						// Let's just create it with 'audio' as fallback or 'unknown'.
						// Actually, let's mark it as 'missed' or 'declined'.
						callType: 'audio', // Fallback
						callDuration: 0,
						callStatus: 'declined',
						callInitiator: callerId,
						status: 'read' // Because they saw it to reject it
					}
				}).then(msg => {
					console.log("✅ Created declined call log");
					// Emit to both
					io.to(callerSocketId).emit("newMessage", msg);
					socket.emit("newMessage", msg);
				}).catch(err => console.error("Failed to create declined call log:", err));
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


		// ✅ Explicitly register user if handshake misses it
		socket.on("register-user", (userId) => {
			if (userId) {
				userSocketMap[userId] = socket.id;
				io.emit("getOnlineUsers", Object.keys(userSocketMap));
				console.log(`✅ User registered explicitly: ${userId} -> ${socket.id}`);
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

			// Clean up SOS Game (Forfeit)
			if (disconnectedUserId) {
				import("./gameManager.js").then(({ gameManager }) => {
					const activeGame = gameManager.findGameByPlayerId(disconnectedUserId);
					if (activeGame) {
						console.log(`🎮 User ${disconnectedUserId} disconnected during active game ${activeGame.id}. Forfeiting...`);

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
								console.log(`🏆 Game ${activeGame.id} awarded to ${winnerId} due to disconnect.`);
							}
						}
						// Clear game timer
						if (activeGame.turnTimer) clearTimeout(activeGame.turnTimer);
					}
				}).catch(err => console.error("Error handling game disconnect:", err));
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