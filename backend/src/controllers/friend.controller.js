import prisma from "../lib/prisma.js";

// ─── Send Friend Request ───────────────────────────────────
export const sendFriendRequest = async (req, res) => {
	const { receiverId } = req.params;
	const senderId = req.user.id;

	try {
		// Use Prisma transaction
		const result = await prisma.$transaction(async (tx) => {
			// 1. Check if receiver exists
			const receiver = await tx.user.findUnique({
				where: { id: receiverId },
				select: { id: true, friendRequestsReceived: true }
			});
			if (!receiver) {
				throw new Error("USER_NOT_FOUND");
			}

			// 2. Check if sender exists
			const sender = await tx.user.findUnique({
				where: { id: senderId },
				select: { 
					id: true, 
					friends: true, 
					friendRequestsSent: true, 
					friendRequestsReceived: true 
				}
			});
			if (!sender) {
				throw new Error("SENDER_NOT_FOUND");
			}

			// 3. Check for various error conditions
			if (receiverId === senderId) {
				throw new Error("CANNOT_FRIEND_SELF");
			}
			if (sender.friends.includes(receiverId)) {
				throw new Error("ALREADY_FRIENDS");
			}
			if (sender.friendRequestsSent.includes(receiverId)) {
				throw new Error("REQUEST_ALREADY_SENT");
			}
			if (sender.friendRequestsReceived.includes(receiverId)) {
				throw new Error("REQUEST_ALREADY_RECEIVED");
			}

			// 4. Update both users
			await tx.user.update({
				where: { id: senderId },
				data: {
					friendRequestsSent: {
						push: receiverId
					}
				}
			});

			await tx.user.update({
				where: { id: receiverId },
				data: {
					friendRequestsReceived: {
						push: senderId
					}
				}
			});

			return { success: true };
		});

		// 5. Notify receiver via socket
		const io = req.app.get("io");
		if (io) {
			const senderInfo = await prisma.user.findUnique({
				where: { id: senderId },
				select: {
					id: true,
					username: true,
					nickname: true,
					profilePic: true,
					isVerified: true
				}
			});
			const sockets = io.sockets.sockets;
			for (const [socketId, socket] of sockets) {
				if (socket.userId && socket.userId === receiverId) {
					socket.emit("friendRequest:received", senderInfo);
					break;
				}
			}
		}

		res.status(200).json({ message: "Friend request sent successfully." });
	} catch (error) {
		console.error("Send friend request error:", error);
		
		// Handle custom errors
		if (error.message === "USER_NOT_FOUND") {
			return res.status(404).json({ message: "User not found." });
		}
		if (error.message === "SENDER_NOT_FOUND") {
			return res.status(404).json({ message: "Sender not found." });
		}
		if (error.message === "CANNOT_FRIEND_SELF") {
			return res.status(400).json({ message: "You cannot send a friend request to yourself." });
		}
		if (error.message === "ALREADY_FRIENDS") {
			return res.status(400).json({ message: "You are already friends with this user." });
		}
		if (error.message === "REQUEST_ALREADY_SENT") {
			return res.status(400).json({ message: "Friend request already sent." });
		}
		if (error.message === "REQUEST_ALREADY_RECEIVED") {
			return res.status(400).json({
				message: "This user has already sent you a friend request. Please accept their request.",
			});
		}
		
		res.status(500).json({ message: "Server error while sending friend request." });
	}
};

// ─── Accept Friend Request ───────────────────────────────────
export const acceptFriendRequest = async (req, res) => {
	const { senderId } = req.params;
	const receiverId = req.user.id;

	console.log(`🤝 Accept friend request: ${receiverId} accepting request from ${senderId}`);

	try {
		const result = await prisma.$transaction(async (tx) => {
			const sender = await tx.user.findUnique({
				where: { id: senderId },
				select: {
					id: true,
					username: true,
					nickname: true,
					profilePic: true,
					isVerified: true,
					friends: true,
					friendRequestsSent: true
				}
			});

			const receiver = await tx.user.findUnique({
				where: { id: receiverId },
				select: {
					id: true,
					username: true,
					nickname: true,
					profilePic: true,
					isVerified: true,
					friends: true,
					friendRequestsReceived: true
				}
			});

			if (!sender || !receiver) {
				console.error("❌ User not found - Sender:", !!sender, "Receiver:", !!receiver);
				throw new Error("USER_NOT_FOUND");
			}

			// 1. Check if the request actually exists
			if (!receiver.friendRequestsReceived.includes(senderId)) {
				console.error("❌ No friend request found from", senderId, "to", receiverId);
				throw new Error("NO_REQUEST_FOUND");
			}

			console.log("✅ Friend request found, proceeding with acceptance");

			// 2. Update both users' arrays
			const newReceiverFriends = [...receiver.friends, senderId];
			const newSenderFriends = [...sender.friends, receiverId];
			const newReceiverRequests = receiver.friendRequestsReceived.filter(id => id !== senderId);
			const newSenderRequests = sender.friendRequestsSent.filter(id => id !== receiverId);

			await tx.user.update({
				where: { id: receiverId },
				data: {
					friends: newReceiverFriends,
					friendRequestsReceived: newReceiverRequests
				}
			});

			await tx.user.update({
				where: { id: senderId },
				data: {
					friends: newSenderFriends,
					friendRequestsSent: newSenderRequests
				}
			});

			return { sender, receiver };
		});

		console.log("✅ Transaction committed successfully");

		// 3. Notify the sender via socket that their request was accepted
		const io = req.app.get("io");
		if (io) {
			const receiverInfo = {
				id: result.receiver.id,
				username: result.receiver.username,
				nickname: result.receiver.nickname,
				profilePic: result.receiver.profilePic,
				isVerified: result.receiver.isVerified
			};
			
			console.log("📡 Looking for sender's socket...");
			const sockets = io.sockets.sockets;
			let socketFound = false;
			for (const [socketId, socket] of sockets) {
				if (socket.userId && socket.userId === senderId) {
					console.log(`✅ Found sender's socket ${socketId}, emitting friendRequest:accepted`);
					socket.emit("friendRequest:accepted", {
						user: receiverInfo,
						message: `${result.receiver.nickname || result.receiver.username} accepted your friend request!`
					});
					socketFound = true;
					break;
				}
			}
			if (!socketFound) {
				console.log(`⚠️ Sender ${senderId} is not currently connected`);
			}
		} else {
			console.error("❌ Socket.io instance not found!");
		}

		console.log("✅ Friend request accepted successfully");
		res.status(200).json({ 
			message: "Friend request accepted.",
			friend: {
				id: result.sender.id,
				username: result.sender.username,
				nickname: result.sender.nickname,
				profilePic: result.sender.profilePic,
				isVerified: result.sender.isVerified
			}
		});

	} catch (error) {
		console.error("Accept friend request error:", error);
		
		if (error.message === "USER_NOT_FOUND") {
			return res.status(404).json({ message: "User not found." });
		}
		if (error.message === "NO_REQUEST_FOUND") {
			return res.status(400).json({ message: "No friend request found from this user." });
		}
		
		res.status(500).json({ message: "Server error while accepting friend request." });
	}
};

// ─── Reject Friend Request ───────────────────────────────────
export const rejectFriendRequest = async (req, res) => {
	const { userId } = req.params;
	const loggedInUserId = req.user.id;

	try {
		await prisma.$transaction(async (tx) => {
			const userToReject = await tx.user.findUnique({
				where: { id: userId },
				select: {
					id: true,
					friendRequestsSent: true,
					friendRequestsReceived: true
				}
			});

			const loggedInUser = await tx.user.findUnique({
				where: { id: loggedInUserId },
				select: {
					id: true,
					friendRequestsSent: true,
					friendRequestsReceived: true
				}
			});

			if (!userToReject || !loggedInUser) {
				throw new Error("USER_NOT_FOUND");
			}

			let updateMade = false;

			// Case 1: Logged-in user is REJECTING a received request
			if (loggedInUser.friendRequestsReceived.includes(userId)) {
				const newReceivedRequests = loggedInUser.friendRequestsReceived.filter(id => id !== userId);
				const newSentRequests = userToReject.friendRequestsSent.filter(id => id !== loggedInUserId);

				await tx.user.update({
					where: { id: loggedInUserId },
					data: { friendRequestsReceived: newReceivedRequests }
				});

				await tx.user.update({
					where: { id: userId },
					data: { friendRequestsSent: newSentRequests }
				});

				updateMade = true;
			}
			// Case 2: Logged-in user is CANCELING a sent request
			else if (loggedInUser.friendRequestsSent.includes(userId)) {
				const newSentRequests = loggedInUser.friendRequestsSent.filter(id => id !== userId);
				const newReceivedRequests = userToReject.friendRequestsReceived.filter(id => id !== loggedInUserId);

				await tx.user.update({
					where: { id: loggedInUserId },
					data: { friendRequestsSent: newSentRequests }
				});

				await tx.user.update({
					where: { id: userId },
					data: { friendRequestsReceived: newReceivedRequests }
				});

				updateMade = true;
			}

			if (!updateMade) {
				throw new Error("NO_REQUEST_FOUND");
			}
		});

		// Notify via socket if this was a rejection
		const io = req.app.get("io");
		if (io) {
			const sockets = io.sockets.sockets;
			for (const [socketId, socket] of sockets) {
				if (socket.userId && socket.userId === userId) {
					console.log(`❌ Notifying ${userId} that ${loggedInUserId} rejected their friend request`);
					socket.emit("friendRequest:rejected", {
						userId: loggedInUserId,
						message: "Your friend request was declined"
					});
					break;
				}
			}
		}

		res.status(200).json({ message: "Friend request rejected." });
	} catch (error) {
		console.error("Reject friend request error:", error);
		
		if (error.message === "USER_NOT_FOUND") {
			return res.status(404).json({ message: "User not found." });
		}
		if (error.message === "NO_REQUEST_FOUND") {
			return res.status(400).json({ message: "No friend request to reject or cancel." });
		}
		
		res.status(500).json({ message: "Server error while rejecting friend request." });
	}
};

// ─── Unfriend User ──────────────────────────────────────────
export const unfriendUser = async (req, res) => {
	const { friendId } = req.params;
	const loggedInUserId = req.user.id;

	try {
		await prisma.$transaction(async (tx) => {
			const friend = await tx.user.findUnique({
				where: { id: friendId },
				select: { id: true, friends: true }
			});

			const loggedInUser = await tx.user.findUnique({
				where: { id: loggedInUserId },
				select: { id: true, friends: true }
			});

			if (!friend || !loggedInUser) {
				throw new Error("USER_NOT_FOUND");
			}

			// 1. Check if they are actually friends
			if (!loggedInUser.friends.includes(friendId)) {
				throw new Error("NOT_FRIENDS");
			}

			// 2. Remove from both users' friends lists
			const newLoggedInFriends = loggedInUser.friends.filter(id => id !== friendId);
			const newFriendFriends = friend.friends.filter(id => id !== loggedInUserId);

			await tx.user.update({
				where: { id: loggedInUserId },
				data: { friends: newLoggedInFriends }
			});

			await tx.user.update({
				where: { id: friendId },
				data: { friends: newFriendFriends }
			});
		});

		res.status(200).json({ message: "User unfriended successfully." });
	} catch (error) {
		console.error("Unfriend user error:", error);
		
		if (error.message === "USER_NOT_FOUND") {
			return res.status(404).json({ message: "User not found." });
		}
		if (error.message === "NOT_FRIENDS") {
			return res.status(400).json({ message: "You are not friends with this user." });
		}
		
		res.status(500).json({ message: "Server error while unfriending user." });
	}
};

// ─── Get All Friends ────────────────────────────────────────
// Cache for friends list (60 seconds TTL for better performance)
let friendsCache = new Map();
const FRIENDS_CACHE_TTL = 60000;

export const getFriends = async (req, res) => {
	try {
		const userId = req.user.id;
		const now = Date.now();
		
		// Check cache
		const cached = friendsCache.get(userId);
		if (cached && (now - cached.timestamp) < FRIENDS_CACHE_TTL) {
			return res.status(200).json(cached.data);
		}
		
		// Get user's friends list
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { friends: true }
		});

		if (!user) return res.status(404).json({ message: "User not found." });

		// Get friends details
		const friends = await prisma.user.findMany({
			where: {
				id: { in: user.friends }
			},
			select: {
				id: true,
				username: true,
				nickname: true,
				profilePic: true,
				isOnline: true,
				isVerified: true
			}
		});

		// Cache result
		friendsCache.set(userId, {
			data: friends,
			timestamp: now
		});

		res.status(200).json(friends);
	} catch (error) {
		console.error("Get friends error:", error);
		res.status(500).json({ message: "Server error while fetching friends." });
	}
};

// ─── Get Pending Requests (Sent & Received) ──────────────────
// Cache for pending requests (30 seconds TTL for better performance)
let requestsCache = new Map();
const REQUESTS_CACHE_TTL = 30000;

export const getPendingRequests = async (req, res) => {
	try {
		const userId = req.user.id;
		const now = Date.now();
		
		// Check cache
		const cached = requestsCache.get(userId);
		if (cached && (now - cached.timestamp) < REQUESTS_CACHE_TTL) {
			return res.status(200).json(cached.data);
		}
		
		// Get user's request lists
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				friendRequestsSent: true,
				friendRequestsReceived: true
			}
		});

		if (!user) return res.status(404).json({ message: "User not found." });

		// Get details for sent and received requests
		const [sentUsers, receivedUsers] = await Promise.all([
			prisma.user.findMany({
				where: { id: { in: user.friendRequestsSent } },
				select: {
					id: true,
					username: true,
					nickname: true,
					profilePic: true,
					isVerified: true
				}
			}),
			prisma.user.findMany({
				where: { id: { in: user.friendRequestsReceived } },
				select: {
					id: true,
					username: true,
					nickname: true,
					profilePic: true,
					isVerified: true
				}
			})
		]);

		const result = {
			sent: sentUsers,
			received: receivedUsers,
		};
		
		// Cache result
		requestsCache.set(userId, {
			data: result,
			timestamp: now
		});

		res.status(200).json(result);
	} catch (error) {
		console.error("Get pending requests error:", error);
		res.status(500).json({ message: "Server error while fetching pending requests." });
	}
};
