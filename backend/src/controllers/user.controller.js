import prisma from "../lib/prisma.js";

// ─── Get All Users (Admin Only) ──────────────────────────────
export const getAllUsers = async (req, res) => {
	try {
		const users = await prisma.user.findMany({
			select: {
				id: true,
				fullName: true,
				email: true,
				username: true,
				nickname: true,
				bio: true,
				profilePic: true,
				isVerified: true,
				hasCompletedProfile: true,
				country: true,
				countryCode: true,
				city: true,
				isOnline: true,
				lastSeen: true,
				createdAt: true,
				updatedAt: true
			}
		});
		res.status(200).json(users);
	} catch (err) {
		console.error("Get all users error:", err);
		res.status(500).json({ error: "Failed to fetch users" });
	}
};

// ─── Get Specific User by ID (for Admin or general use) ────────
export const getUserById = async (req, res) => {
	try {
		const userId = req.params.id;
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				fullName: true,
				email: true,
				username: true,
				nickname: true,
				bio: true,
				profilePic: true,
				isVerified: true,
				hasCompletedProfile: true,
				country: true,
				countryCode: true,
				city: true,
				isOnline: true,
				lastSeen: true,
				createdAt: true,
				updatedAt: true
			}
		});

		if (!user) return res.status(404).json({ error: "User not found" });

		res.status(200).json(user);
	} catch (err) {
		console.error("Get user by ID error:", err);
		res.status(500).json({ error: "Failed to fetch user" });
	}
};

// ─── Get Logged-in User Profile ───────────────────────────────
export const getUserProfile = async (req, res) => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: req.user.id },
			select: {
				id: true,
				fullName: true,
				email: true,
				username: true,
				nickname: true,
				bio: true,
				profilePic: true,
				isVerified: true,
				hasCompletedProfile: true,
				country: true,
				countryCode: true,
				city: true,
				isOnline: true,
				lastSeen: true,
				createdAt: true,
				updatedAt: true
			}
		});

		if (!user) return res.status(404).json({ error: "User not found" });

		res.status(200).json(user);
	} catch (err) {
		console.error("Get user profile error:", err);
		res.status(500).json({ error: "Failed to fetch profile" });
	}
};

// ─── Get Public Profile by Username ───────────────────
export const getUserByUsername = async (req, res) => {
	try {
		const { username } = req.params;

		// Find the user by their username (Prisma usernames are stored lowercase)
		const user = await prisma.user.findUnique({
			where: { username: username.toLowerCase() },
			select: {
				id: true,
				fullName: true,
				email: true,
				username: true,
				nickname: true,
				bio: true,
				profilePic: true,
				isVerified: true,
				hasCompletedProfile: true,
				country: true,
				countryCode: true,
				city: true,
				isOnline: true,
				lastSeen: true,
				// friends: true, // Removed - not supported in SQLite
				// friendRequestsSent: true, // Removed - not supported in SQLite
				// friendRequestsReceived: true, // Removed - not supported in SQLite
				createdAt: true,
				updatedAt: true
			}
		});

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// We will add friend status logic here later
		res.status(200).json(user);

	} catch (err) {
		console.error("Get user by username error:", err);
		res.status(500).json({ error: "Failed to fetch user profile" });
	}
};

// ─── Update Logged-in User Profile ────────────────────────────
export const updateUserProfile = async (req, res) => {
	try {
		const { nickname, bio, profilePic, username, fullName } = req.body;
		const userId = req.user.id;

		const user = await prisma.user.findUnique({
			where: { id: userId }
		});
		if (!user) return res.status(404).json({ error: "User not found" });

		const updateData = {};

		// Handle full name update if provided
		if (fullName !== undefined && fullName !== user.fullName) {
			if (!fullName || fullName.trim().length < 2) {
				return res.status(400).json({ error: "Full name must be at least 2 characters" });
			}
			updateData.fullName = fullName.trim();
		}

		// Handle username change if provided
		if (username && username !== user.username) {
			// Check if username is available
			const existingUser = await prisma.user.findUnique({ 
				where: { username: username.toLowerCase() } 
			});
			if (existingUser) {
				return res.status(400).json({ error: "Username already taken" });
			}

			// Check username change limits
			const now = new Date();
			const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));
			const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

			// Reset weekly counter if a week has passed
			if (!user.weekStartDate || user.weekStartDate < oneWeekAgo) {
				updateData.usernameChangesThisWeek = 0;
				updateData.weekStartDate = now;
			}

			// Check if user has exceeded weekly limit
			const changesThisWeek = updateData.usernameChangesThisWeek ?? user.usernameChangesThisWeek;
			if (changesThisWeek >= 2) {
				return res.status(400).json({ 
					error: "You can only change your username 2 times per week",
					nextChangeDate: new Date(user.weekStartDate.getTime() + (7 * 24 * 60 * 60 * 1000))
				});
			}

			// Check if 2 days have passed since last change
			if (user.lastUsernameChange && user.lastUsernameChange > twoDaysAgo) {
				const nextChangeDate = new Date(user.lastUsernameChange.getTime() + (2 * 24 * 60 * 60 * 1000));
				return res.status(400).json({ 
					error: "You must wait 2 days between username changes",
					nextChangeDate
				});
			}

			// Update username
			const newHistory = user.usernameChangeHistory || [];
			newHistory.push({
				oldUsername: user.username,
				newUsername: username.toLowerCase(),
				changedAt: now
			});
			
			updateData.usernameChangeHistory = newHistory;
			updateData.username = username.toLowerCase();
			updateData.lastUsernameChange = now;
			updateData.usernameChangesThisWeek = (updateData.usernameChangesThisWeek ?? user.usernameChangesThisWeek) + 1;
		}

		if (nickname !== undefined) updateData.nickname = nickname;
		if (bio !== undefined) updateData.bio = bio;
		if (profilePic !== undefined) updateData.profilePic = profilePic;

		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: updateData,
			select: {
				id: true,
				fullName: true,
				email: true,
				username: true,
				nickname: true,
				bio: true,
				profilePic: true,
				isVerified: true,
				hasCompletedProfile: true,
				country: true,
				countryCode: true,
				city: true,
				isOnline: true,
				lastSeen: true,
				createdAt: true,
				updatedAt: true
			}
		});

		res.status(200).json(updatedUser);
	} catch (err) {
		console.error("Update profile error:", err);
		res.status(500).json({ error: "Failed to update profile" });
	}
};

// ─── Check Username Availability ────────────────────────────
export const checkUsernameAvailability = async (req, res) => {
	try {
		const { username } = req.params;
		const userId = req.user.id;

		// Check if it's the user's current username
		const currentUser = await prisma.user.findUnique({
			where: { id: userId }
		});
		if (currentUser.username === username.toLowerCase()) {
			return res.status(200).json({ available: true, current: true });
		}

		// Check if username exists
		const existingUser = await prisma.user.findUnique({ 
			where: { username: username.toLowerCase() } 
		});
		
		res.status(200).json({ 
			available: !existingUser,
			current: false
		});
	} catch (err) {
		console.error("Check username error:", err);
		res.status(500).json({ error: "Failed to check username" });
	}
};

// ─── Get Username Change Info ────────────────────────────
export const getUsernameChangeInfo = async (req, res) => {
	try {
		const userId = req.user.id;
		const user = await prisma.user.findUnique({
			where: { id: userId }
		});

		if (!user) return res.status(404).json({ error: "User not found" });

		const now = new Date();
		const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));
		const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

		// Reset weekly counter if needed
		let changesThisWeek = user.usernameChangesThisWeek;
		if (!user.weekStartDate || user.weekStartDate < oneWeekAgo) {
			changesThisWeek = 0;
		}

		const canChange = changesThisWeek < 2 && 
			(!user.lastUsernameChange || user.lastUsernameChange < twoDaysAgo);

		let nextChangeDate = null;
		if (user.lastUsernameChange && user.lastUsernameChange >= twoDaysAgo) {
			nextChangeDate = new Date(user.lastUsernameChange.getTime() + (2 * 24 * 60 * 60 * 1000));
		}

		res.status(200).json({
			canChange,
			changesThisWeek,
			maxChangesPerWeek: 2,
			lastChange: user.lastUsernameChange,
			nextChangeDate,
			history: (user.usernameChangeHistory || []).slice(-5) // Last 5 changes
		});
	} catch (err) {
		console.error("Get username change info error:", err);
		res.status(500).json({ error: "Failed to get username change info" });
	}
};

// ─── Delete My Account (User) ────────────────────────────────
export const deleteMyAccount = async (req, res) => {
	try {
		await prisma.user.delete({
			where: { id: req.user.id }
		});
		res.clearCookie("jwt");
		res.status(200).json({ message: "Account deleted successfully" });
	} catch (err) {
		console.error("Delete account error:", err);
		res.status(500).json({ error: "Failed to delete account" });
	}
};

// ─── Delete User by ID (Admin Only) ───────────────────────────
export const deleteUser = async (req, res) => {
	try {
		const userId = req.params.userId;
		const deletedUser = await prisma.user.delete({
			where: { id: userId }
		});

		if (!deletedUser) return res.status(404).json({ error: "User not found" });

		res.status(200).json({ message: "User deleted successfully" });
	} catch (err) {
		console.error("Delete user error:", err);
		res.status(500).json({ error: "Failed to delete user" });
	}
};

// ─── Search Users by Username ───────────────────────────────
export const searchUsers = async (req, res) => {
	try {
		const query = req.query.q || "";
		const loggedInUserId = req.user.id;

		if (!query.trim()) {
			return res.status(200).json([]);
		}

		// Prisma search with contains (case-insensitive)
		const users = await prisma.user.findMany({
			where: {
				AND: [
					{
						OR: [
							{ username: { contains: query.toLowerCase() } },
							{ nickname: { contains: query, mode: 'insensitive' } }
						]
					},
					{ NOT: { id: loggedInUserId } }
				]
			},
			select: {
				id: true,
				username: true,
				profilePic: true,
				nickname: true,
				bio: true,
				isVerified: true,
				country: true,
				countryCode: true,
				city: true,
				isOnline: true,
				lastSeen: true
			},
			orderBy: [
				{ isOnline: 'desc' },
				{ isVerified: 'desc' }
			],
			take: 10
		});

		res.status(200).json(users);
	} catch (err) {
		console.error("Search users error:", err);
		res.status(500).json({ error: "Failed to search users" });
	}
};

// ─── Get Suggested Users ───────────────────────────────────
// In-memory cache for suggested users (refreshes every 2 minutes)
let suggestedUsersCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export const getSuggestedUsers = async (req, res) => {
	try {
		const loggedInUserId = req.user.id;
		const now = Date.now();

		// Return cached data if available and fresh
		if (suggestedUsersCache && (now - cacheTimestamp) < CACHE_DURATION) {
			// Filter out the logged-in user from cached results
			const filteredUsers = suggestedUsersCache.filter(u => u.id !== loggedInUserId);
			return res.status(200).json(filteredUsers.slice(0, 8));
		}

		// Fetch fresh data with ultra-optimized query
		const users = await prisma.user.findMany({
			where: {
				hasCompletedProfile: true
			},
			select: {
				id: true,
				username: true,
				nickname: true,
				profilePic: true,
				isVerified: true,
				bio: true,
				country: true,
				countryCode: true,
				city: true,
				isOnline: true,
				lastSeen: true
			},
			orderBy: [
				{ isOnline: 'desc' },
				{ isVerified: 'desc' },
				{ createdAt: 'desc' }
			],
			take: 20 // Fetch more for cache, filter logged-in user later
		});

		// Update cache
		suggestedUsersCache = users;
		cacheTimestamp = now;

		// Filter out logged-in user and return
		const filteredUsers = users.filter(u => u.id !== loggedInUserId);
		res.status(200).json(filteredUsers.slice(0, 8));
	} catch (err) {
		console.error("Get suggested users error:", err);
		res.status(500).json({ error: "Failed to fetch suggested users" });
	}
};
