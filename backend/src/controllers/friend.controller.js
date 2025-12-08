import User from "../models/user.model.js";
import FriendRequest from "../models/friendRequest.model.js";
import mongoose from "mongoose";

// ─── Send Friend Request ───────────────────────────────────
export const sendFriendRequest = async (req, res) => {
	const { receiverId } = req.params;
	const senderId = req.user._id;

	// Use a session for a transaction
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		// 1. Check if receiver exists
		const receiver = await User.findById(receiverId).session(session);
		if (!receiver) {
			await session.abortTransaction();
			return res.status(404).json({ message: "User not found." });
		}

		// 2. Check if sender exists (should be guaranteed by protectRoute, but good practice)
		const sender = await User.findById(senderId).session(session);
		if (!sender) {
			await session.abortTransaction();
			return res.status(404).json({ message: "Sender not found." });
		}

		// 3. Check for various error conditions
		if (receiverId === senderId.toString()) {
			await session.abortTransaction();
			return res.status(400).json({ message: "You cannot send a friend request to yourself." });
		}
		if (sender.friends.some((id) => id.toString() === receiverId.toString())) {
			await session.abortTransaction();
			return res.status(400).json({ message: "You are already friends with this user." });
		}
		if (sender.friendRequestsSent.some((id) => id.toString() === receiverId.toString())) {
			await session.abortTransaction();
			return res.status(400).json({ message: "Friend request already sent." });
		}
		if (sender.friendRequestsReceived.some((id) => id.toString() === receiverId.toString())) {
			// This means the other user already sent *us* a request.
			// Let's just accept their request instead.
			await session.abortTransaction();
			// We can't call acceptFriendRequest directly here easily,
			// so we'll just tell the user what to do.
			return res.status(400).json({
				message: "This user has already sent you a friend request. Please accept their request.",
			});
		}

		// 4. Create FriendRequest document
		const friendRequest = new FriendRequest({
			sender: senderId,
			receiver: receiverId,
		});
		await friendRequest.save({ session });

		// 5. Update both users
		sender.friendRequestsSent.push(receiverId);
		receiver.friendRequestsReceived.push(senderId);

		await sender.save({ session });
		await receiver.save({ session });

		// 6. Commit the transaction
		await session.commitTransaction();
		session.endSession();

		// 7. Notify receiver via socket
		const io = req.app.get("io");
		if (io) {
			const senderInfo = await User.findById(senderId).select("_id username nickname profilePic isVerified");
			const sockets = io.sockets.sockets;
			for (const [socketId, socket] of sockets) {
				if (socket.userId && socket.userId.toString() === receiverId.toString()) {
					socket.emit("friendRequest:received", senderInfo);
					break;
				}
			}
		}

		res.status(200).json({ message: "Friend request sent successfully." });
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		console.error("Send friend request error:", error);
		res.status(500).json({ message: "Server error while sending friend request." });
	}
};

// ─── Accept Friend Request ───────────────────────────────────
export const acceptFriendRequest = async (req, res) => {
	const { senderId } = req.params;
	const receiverId = req.user._id; // The logged-in user

	console.log(`🤝 Accept friend request: ${receiverId} accepting request from ${senderId}`);

	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const sender = await User.findById(senderId).session(session);
		const receiver = await User.findById(receiverId).session(session);

		if (!sender || !receiver) {
			console.error("❌ User not found - Sender:", !!sender, "Receiver:", !!receiver);
			await session.abortTransaction();
			return res.status(404).json({ message: "User not found." });
		}

		// 1. Check if the request actually exists
		const hasRequest = receiver.friendRequestsReceived.some(
			(id) => id.toString() === senderId.toString()
		);
		if (!hasRequest) {
			console.error("❌ No friend request found from", senderId, "to", receiverId);
			console.log("Receiver's pending requests:", receiver.friendRequestsReceived);
			await session.abortTransaction();
			return res.status(400).json({ message: "No friend request found from this user." });
		}

		console.log("✅ Friend request found, proceeding with acceptance");

		// 2. Update both users' arrays atomically
		// Add to friends lists
		receiver.friends.push(senderId);
		sender.friends.push(receiverId);

		// Remove from request lists
		receiver.friendRequestsReceived = receiver.friendRequestsReceived.filter(
			(id) => id.toString() !== senderId
		);
		sender.friendRequestsSent = sender.friendRequestsSent.filter(
			(id) => id.toString() !== receiverId.toString()
		);

		await receiver.save({ session });
		await sender.save({ session });

		// 2.5. Delete the FriendRequest document from database
		await FriendRequest.findOneAndDelete({
			sender: senderId,
			receiver: receiverId
		}).session(session);

		// 3. Commit transaction
		await session.commitTransaction();
		session.endSession();
		console.log("✅ Transaction committed successfully");

		// 4. Notify the sender via socket that their request was accepted
		const io = req.app.get("io");
		if (io) {
			// Get receiver's info to send to sender
			const receiverInfo = {
				_id: receiver._id,
				username: receiver.username,
				nickname: receiver.nickname,
				profilePic: receiver.profilePic,
				isVerified: receiver.isVerified
			};
			
			console.log("📡 Looking for sender's socket...");
			// Emit to sender
			const sockets = io.sockets.sockets;
			let socketFound = false;
			for (const [socketId, socket] of sockets) {
				if (socket.userId && socket.userId.toString() === senderId.toString()) {
					console.log(`✅ Found sender's socket ${socketId}, emitting friendRequest:accepted`);
					socket.emit("friendRequest:accepted", {
						user: receiverInfo,
						message: `${receiver.nickname || receiver.username} accepted your friend request!`
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
				_id: sender._id,
				username: sender.username,
				nickname: sender.nickname,
				profilePic: sender.profilePic,
				isVerified: sender.isVerified
			}
		});
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		console.error("Accept friend request error:", error);
		res.status(500).json({ message: "Server error while accepting friend request." });
	}
};

// ─── Reject Friend Request ───────────────────────────────────
// This function can also be used by the SENDER to CANCEL a sent request
export const rejectFriendRequest = async (req, res) => {
	const { userId } = req.params; // This can be either the sender or receiver
	const loggedInUserId = req.user._id;

	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const userToReject = await User.findById(userId).session(session);
		const loggedInUser = await User.findById(loggedInUserId).session(session);

		if (!userToReject || !loggedInUser) {
			await session.abortTransaction();
			return res.status(404).json({ message: "User not found." });
		}

		let updateMade = false;

		// Case 1: Logged-in user is REJECTING a received request
		if (loggedInUser.friendRequestsReceived.some((id) => id.toString() === userId.toString())) {
			loggedInUser.friendRequestsReceived = loggedInUser.friendRequestsReceived.filter(
				(id) => id.toString() !== userId.toString()
			);
			userToReject.friendRequestsSent = userToReject.friendRequestsSent.filter(
				(id) => id.toString() !== loggedInUserId.toString()
			);
			updateMade = true;
		}
		// Case 2: Logged-in user is CANCELING a sent request
		else if (loggedInUser.friendRequestsSent.some((id) => id.toString() === userId.toString())) {
			loggedInUser.friendRequestsSent = loggedInUser.friendRequestsSent.filter(
				(id) => id.toString() !== userId.toString()
			);
			userToReject.friendRequestsReceived = userToReject.friendRequestsReceived.filter(
				(id) => id.toString() !== loggedInUserId.toString()
			);
			updateMade = true;
		}

		if (!updateMade) {
			await session.abortTransaction();
			return res.status(400).json({ message: "No friend request to reject or cancel." });
		}

		await loggedInUser.save({ session });
		await userToReject.save({ session });

		// Delete the FriendRequest document from database
		// Try both directions since we don't know who sent the request
		await FriendRequest.findOneAndDelete({
			$or: [
				{ sender: userId, receiver: loggedInUserId },
				{ sender: loggedInUserId, receiver: userId }
			]
		}).session(session);

		await session.commitTransaction();
		session.endSession();

		// Notify via socket if this was a rejection (not a cancellation)
		const io = req.app.get("io");
		if (io && loggedInUser.friendRequestsReceived.length < userToReject.friendRequestsSent.length) {
			// This means logged-in user rejected a received request
			const sockets = io.sockets.sockets;
			for (const [socketId, socket] of sockets) {
				if (socket.userId && socket.userId.toString() === userId.toString()) {
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
		await session.abortTransaction();
		session.endSession();
		console.error("Reject friend request error:", error);
		res.status(500).json({ message: "Server error while rejecting friend request." });
	}
};

// ─── Unfriend User ──────────────────────────────────────────
export const unfriendUser = async (req, res) => {
	const { friendId } = req.params;
	const loggedInUserId = req.user._id;

	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const friend = await User.findById(friendId).session(session);
		const loggedInUser = await User.findById(loggedInUserId).session(session);

		if (!friend || !loggedInUser) {
			await session.abortTransaction();
			return res.status(404).json({ message: "User not found." });
		}

		// 1. Check if they are actually friends
		const areFriends = loggedInUser.friends.some((id) => id.toString() === friendId.toString());
		if (!areFriends) {
			await session.abortTransaction();
			return res.status(400).json({ message: "You are not friends with this user." });
		}

		// 2. Remove from both users' friends lists
		loggedInUser.friends = loggedInUser.friends.filter((id) => id.toString() !== friendId);
		friend.friends = friend.friends.filter((id) => id.toString() !== loggedInUserId.toString());

		await loggedInUser.save({ session });
		await friend.save({ session });

		await session.commitTransaction();
		session.endSession();

		res.status(200).json({ message: "User unfriended successfully." });
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		console.error("Unfriend user error:", error);
		res.status(500).json({ message: "Server error while unfriending user." });
	}
};

// ─── Get All Friends ────────────────────────────────────────
// Cache for friends list (60 seconds TTL for better performance)
let friendsCache = new Map();
const FRIENDS_CACHE_TTL = 60000; // Increased to 60 seconds

export const getFriends = async (req, res) => {
	try {
		const userId = req.user._id.toString();
		const now = Date.now();
		
		// Check cache
		const cached = friendsCache.get(userId);
		if (cached && (now - cached.timestamp) < FRIENDS_CACHE_TTL) {
			return res.status(200).json(cached.data);
		}
		
		// OPTIMIZED: Use lean() and limit fields for 3x faster query
		const user = await User.findById(req.user._id)
			.select("friends")
			.lean();

		if (!user) return res.status(404).json({ message: "User not found." });

		// OPTIMIZED: Manual populate with specific fields only
		const friends = await User.find({ _id: { $in: user.friends } })
			.select("username nickname profilePic isOnline isVerified")
			.lean();

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
const REQUESTS_CACHE_TTL = 30000; // Increased to 30 seconds

export const getPendingRequests = async (req, res) => {
	try {
		const userId = req.user._id.toString();
		const now = Date.now();
		
		// Check cache
		const cached = requestsCache.get(userId);
		if (cached && (now - cached.timestamp) < REQUESTS_CACHE_TTL) {
			return res.status(200).json(cached.data);
		}
		
		// OPTIMIZED: Use lean() and manual populate for 3x faster query
		const user = await User.findById(req.user._id)
			.select("friendRequestsSent friendRequestsReceived")
			.lean();

		if (!user) return res.status(404).json({ message: "User not found." });

		// OPTIMIZED: Manual populate with specific fields only
		const [sentUsers, receivedUsers] = await Promise.all([
			User.find({ _id: { $in: user.friendRequestsSent } })
				.select("username nickname profilePic isVerified")
				.lean(),
			User.find({ _id: { $in: user.friendRequestsReceived } })
				.select("username nickname profilePic isVerified")
				.lean()
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