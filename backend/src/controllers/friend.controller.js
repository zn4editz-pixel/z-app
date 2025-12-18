// Simplified Friend Controller for SQLite compatibility
import prisma from "../lib/db.js";
import { emitToUser } from "../lib/socketHandlers.js";

// Cache for friends data (5 minutes TTL)
const friendsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const clearFriendsCache = (userId) => {
	friendsCache.delete(userId);
};

// Send Friend Request
export const sendFriendRequest = async (req, res) => {
	try {
		const { receiverId } = req.params; // Get from URL params, not body
		const senderId = req.user.id;
		if (senderId === receiverId) {
			return res.status(400).json({ message: "You cannot send a friend request to yourself." });
		}
		// Check if request already exists
		const existingRequest = await prisma.friendRequest.findUnique({
			where: {
				senderId_receiverId: {
					senderId,
					receiverId
				}
			}
		});
		if (existingRequest) {
			return res.status(400).json({ message: "Friend request already sent." });
		}
		// Check if reverse request exists (they're already friends)
		const reverseRequest = await prisma.friendRequest.findUnique({
			where: {
				senderId_receiverId: {
					senderId: receiverId,
					receiverId: senderId
				}
			}
		});
		if (reverseRequest) {
			return res.status(400).json({ message: "You are already friends with this user." });
		}
		// Create friend request
		const friendRequest = await prisma.friendRequest.create({
			data: {
				senderId,
				receiverId
			},
			include: {
				sender: {
					select: {
						id: true,
						fullName: true,
						username: true,
						nickname: true,
						profilePic: true,
						isVerified: true
					}
				}
			}
		});
		// Clear cache
		clearFriendsCache(senderId);
		clearFriendsCache(receiverId);
		// 🔥 REAL-TIME: Emit friend request to receiver
		emitToUser(receiverId, "friendRequestReceived", {
			...friendRequest.sender,
			requestId: friendRequest.id
		});
		res.status(200).json({ message: "Friend request sent successfully." });
	} catch (error) {
		res.status(500).json({ message: "Failed to send friend request." });
	}
};

// Accept Friend Request
export const acceptFriendRequest = async (req, res) => {
	try {
		const { senderId } = req.params; // Get from URL params, not body
		const receiverId = req.user.id;
		// Find the friend request
		const friendRequest = await prisma.friendRequest.findUnique({
			where: {
				senderId_receiverId: {
					senderId,
					receiverId
				}
			}
		});
		if (!friendRequest) {
			return res.status(404).json({ message: "Friend request not found." });
		}
		if (friendRequest.status === "accepted") {
			return res.status(400).json({ message: "Friend request already accepted." });
		}
		// Update the friend request status to accepted
		await prisma.friendRequest.update({
			where: {
				senderId_receiverId: {
					senderId,
					receiverId
				}
			},
			data: {
				status: "accepted"
			}
		});
		// Get user details for real-time update
		const acceptedUser = await prisma.user.findUnique({
			where: { id: receiverId },
			select: {
				id: true,
				fullName: true,
				username: true,
				nickname: true,
				profilePic: true,
				isOnline: true,
				lastSeen: true,
				isVerified: true
			}
		});
		// Clear cache
		clearFriendsCache(senderId);
		clearFriendsCache(receiverId);
		// 🔥 REAL-TIME: Emit friend request accepted to sender
		emitToUser(senderId, "friendRequestAccepted", {
			friendData: acceptedUser,
			acceptedBy: receiverId
		});
		res.status(200).json({ message: "Friend request accepted." });
	} catch (error) {
		res.status(500).json({ message: "Failed to accept friend request." });
	}
};

// Reject Friend Request
export const rejectFriendRequest = async (req, res) => {
	try {
		const { userId } = req.params; // Get from URL params, not body
		const receiverId = req.user.id;
		// Update the friend request status to rejected (or delete it)
		await prisma.friendRequest.deleteMany({
			where: {
				OR: [
					{ senderId: userId, receiverId },
					{ senderId: receiverId, receiverId: userId }
				]
			}
		});
		// Clear cache
		clearFriendsCache(userId);
		clearFriendsCache(receiverId);
		res.status(200).json({ message: "Friend request rejected." });
	} catch (error) {
		res.status(500).json({ message: "Failed to reject friend request." });
	}
};

// Unfriend User
export const unfriendUser = async (req, res) => {
	try {
		const { friendId } = req.params;
		const userId = req.user.id;
		// Delete the accepted friendship record
		await prisma.friendRequest.deleteMany({
			where: {
				AND: [
					{
						OR: [
							{ senderId: userId, receiverId: friendId },
							{ senderId: friendId, receiverId: userId }
						]
					},
					{ status: "accepted" }
				]
			}
		});
		// Clear cache
		clearFriendsCache(userId);
		clearFriendsCache(friendId);
		res.status(200).json({ message: "User unfriended successfully." });
	} catch (error) {
		res.status(500).json({ message: "Failed to unfriend user." });
	}
};

// Get Friends
export const getFriends = async (req, res) => {
	try {
		const userId = req.user.id;
		// Check cache first
		const cached = friendsCache.get(userId);
		if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
			return res.status(200).json(cached.data);
		}
		// Get all accepted friend requests where user is involved
		const friendRequests = await prisma.friendRequest.findMany({
			where: {
				AND: [
					{
						OR: [
							{ senderId: userId },
							{ receiverId: userId }
						]
					},
					{ status: "accepted" }
				]
			},
			include: {
				sender: {
					select: {
						id: true,
						fullName: true,
						username: true,
						nickname: true,
						profilePic: true,
						isOnline: true,
						lastSeen: true,
						isVerified: true
					}
				},
				receiver: {
					select: {
						id: true,
						fullName: true,
						username: true,
						nickname: true,
						profilePic: true,
						isOnline: true,
						lastSeen: true,
						isVerified: true
					}
				}
			}
		});
		// 🔥 ULTRA-OPTIMIZATION: Batch fetch all last messages
		const friendIds = friendRequests.map(r => r.senderId === userId ? r.receiverId : r.senderId);
		let lastMessagesMap = {};
		if (friendIds.length > 0) {
			// Fetch last messages for ALL friends in one go
			// Strategy: Get latest message where (sender=me AND receiver=friend) OR (sender=friend AND receiver=me)
			// Since Prisma doesn't support "distinct on" easily with complex ORs in findMany for this specific case without raw query,
			// we will fetch the most recent messages for these pairs.
			// Optimization: We'll fetch the last 100 messages involving the user, and filter in memory (fast in JS vs slow DB RTT)
			const recentMessages = await prisma.message.findMany({
				where: {
					OR: [
						{ senderId: userId, receiverId: { in: friendIds } },
						{ senderId: { in: friendIds }, receiverId: userId }
					],
					isDeleted: false
				},
				orderBy: { createdAt: 'desc' },
				// Fetch reasonable amount to cover recent convos. 
				// If a user has 1000s of friends, we might miss very old ones, but for "Sidebar" this is usually sufficient and drastically faster.
				take: 200,
				select: {
					id: true,
					text: true,
					image: true,
					voice: true,
					voiceDuration: true,
					senderId: true,
					receiverId: true,
					createdAt: true,
					status: true,
					deliveredAt: true,
					readAt: true,
					reactions: true,
					isCallLog: true,
					callType: true,
					callStatus: true,
					callDuration: true
				}
			});
			// Map latest message per friend
			recentMessages.forEach(msg => {
				const friendId = msg.senderId === userId ? msg.receiverId : msg.senderId;
				// Since ordered by desc, the first one we find for a friend is the latest
				if (!lastMessagesMap[friendId]) {
					lastMessagesMap[friendId] = msg;
				}
			});
		}
		// Extract friends and attach last message from map
		const friendsWithLastMessage = friendRequests.map((request) => {
			const friend = request.senderId === userId ? request.receiver : request.sender;
			const lastMessage = lastMessagesMap[friend.id] || null;
			return {
				...friend,
				lastMessage: lastMessage ? {
					...lastMessage,
					timestamp: lastMessage.createdAt
				} : null
			};
		});
		// Cache result
		friendsCache.set(userId, {
			data: friendsWithLastMessage,
			timestamp: Date.now()
		});
		res.status(200).json(friendsWithLastMessage);
	} catch (error) {
		res.status(500).json({ message: "Failed to get friends." });
	}
};

// Get Pending Requests
export const getPendingRequests = async (req, res) => {
	try {
		const userId = req.user.id;
		// Get received requests (pending for this user to accept/reject)
		const receivedRequests = await prisma.friendRequest.findMany({
			where: {
				receiverId: userId,
				status: "pending"
			},
			include: {
				sender: {
					select: {
						id: true,
						fullName: true,
						username: true,
						nickname: true,
						profilePic: true,
						isVerified: true
					}
				}
			}
		});
		// Get sent requests (waiting for others to accept/reject)
		const sentRequests = await prisma.friendRequest.findMany({
			where: {
				senderId: userId,
				status: "pending"
			},
			include: {
				receiver: {
					select: {
						id: true,
						fullName: true,
						username: true,
						nickname: true,
						profilePic: true,
						isVerified: true
					}
				}
			}
		});
		res.status(200).json({
			received: receivedRequests.map(req => req.sender),
			sent: sentRequests.map(req => req.receiver)
		});
	} catch (error) {
		res.status(500).json({ message: "Failed to get pending requests." });
	}
};