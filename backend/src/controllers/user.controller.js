import User from "../models/user.model.js";

// ─── Get All Users (Admin Only) ──────────────────────────────
export const getAllUsers = async (req, res) => {
	try {
		const users = await User.find().select("-password");
		res.status(200).json(users);
	} catch (err) {
		console.error("Get all users error:", err);
		res.status(500).json({ error: "Failed to fetch users" });
	}
};

// ─── Get Specific User by ID (for Admin or general use) ────────
// ─── Get Specific User by ID (for Admin or general use) ────────
export const getUserById = async (req, res) => {
	try { // ✅ --- YOU WERE MISSING THIS 'try' ---
		const userId = req.params.id;
		const user = await User.findById(userId).select("-password");

		if (!user) return res.status(404).json({ error: "User not found" });

		res.status(200).json(user);
	} catch (err) { // ✅ --- This 'catch' is now correct ---
		console.error("Get user by ID error:", err);
		res.status(500).json({ error: "Failed to fetch user" });
	}
};
// ─── Get Logged-in User Profile ───────────────────────────────
export const getUserProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select("-password");

		if (!user) return res.status(404).json({ error: "User not found" });

		res.status(200).json(user);
	} catch (err) {
		console.error("Get user profile error:", err);
		res.status(500).json({ error: "Failed to fetch profile" });
	}
};

// ✅ --- NEW: Get Public Profile by Username ───────────────────
export const getUserByUsername = async (req, res) => {
	try {
		const { username } = req.params;

		// Find the user by their username, case-insensitive
		const user = await User.findOne({ 
			username: { $regex: new RegExp(`^${username}$`, "i") } 
		}).select("-password -resetPasswordToken -resetPasswordExpire"); // Exclude sensitive info

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
// ✅ --- END NEW FUNCTION ─────────────────────────────────────

// ─── Update Logged-in User Profile ────────────────────────────
export const updateUserProfile = async (req, res) => {
	try {
		const { nickname, bio, profilePic, username, fullName } = req.body;
		const userId = req.user._id;

		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		// Handle full name update if provided
		if (fullName !== undefined && fullName !== user.fullName) {
			if (!fullName || fullName.trim().length < 2) {
				return res.status(400).json({ error: "Full name must be at least 2 characters" });
			}
			user.fullName = fullName.trim();
		}

		// Handle username change if provided
		if (username && username !== user.username) {
			// Check if username is available
			const existingUser = await User.findOne({ username: username.toLowerCase() });
			if (existingUser) {
				return res.status(400).json({ error: "Username already taken" });
			}

			// Check username change limits
			const now = new Date();
			const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));
			const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

			// Reset weekly counter if a week has passed
			if (!user.weekStartDate || user.weekStartDate < oneWeekAgo) {
				user.usernameChangesThisWeek = 0;
				user.weekStartDate = now;
			}

			// Check if user has exceeded weekly limit
			if (user.usernameChangesThisWeek >= 2) {
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
			user.usernameChangeHistory.push({
				oldUsername: user.username,
				newUsername: username.toLowerCase(),
				changedAt: now
			});
			user.username = username.toLowerCase();
			user.lastUsernameChange = now;
			user.usernameChangesThisWeek += 1;
		}

		user.nickname = nickname ?? user.nickname;
		user.bio = bio ?? user.bio;
		user.profilePic = profilePic ?? user.profilePic;

		const updatedUser = await user.save();
		
		const userObject = updatedUser.toObject();
		delete userObject.password;

		res.status(200).json(userObject);
	} catch (err) {
		console.error("Update profile error:", err);
		res.status(500).json({ error: "Failed to update profile" });
	}
};

// ─── Check Username Availability ────────────────────────────
export const checkUsernameAvailability = async (req, res) => {
	try {
		const { username } = req.params;
		const userId = req.user._id;

		// Check if it's the user's current username
		const currentUser = await User.findById(userId);
		if (currentUser.username === username.toLowerCase()) {
			return res.status(200).json({ available: true, current: true });
		}

		// Check if username exists
		const existingUser = await User.findOne({ username: username.toLowerCase() });
		
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
		const userId = req.user._id;
		const user = await User.findById(userId);

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
			history: user.usernameChangeHistory.slice(-5) // Last 5 changes
		});
	} catch (err) {
		console.error("Get username change info error:", err);
		res.status(500).json({ error: "Failed to get username change info" });
	}
};

// ─── Delete My Account (User) ────────────────────────────────
export const deleteMyAccount = async (req, res) => {
	try {
		await User.findByIdAndDelete(req.user._id);
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
		const deletedUser = await User.findByIdAndDelete(userId);

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
		const loggedInUserId = req.user._id;

		if (!query.trim()) {
			return res.status(200).json([]);
		}

		const users = await User.find(
			{
				$or: [
					{ username: { $regex: query, $options: "i" } },
					{ nickname: { $regex: query, $options: "i" } }
				],
				_id: { $ne: loggedInUserId },
			},
			"username profilePic nickname bio isVerified"
		).limit(10);

		res.status(200).json(users);
	} catch (err) {
		console.error("Search users error:", err);
		res.status(500).json({ error: "Failed to search users" });
	}
};

// ─── Get Suggested Users ───────────────────────────────────
export const getSuggestedUsers = async (req, res) => {
	try {
		const loggedInUserId = req.user._id;

		// Ultra-optimized query - only 8 users, minimal fields
		const users = await User.find({
			_id: { $ne: loggedInUserId },
			hasCompletedProfile: true
		})
		.select('username nickname profilePic isVerified bio') // Only essential fields
		.sort({ isVerified: -1, createdAt: -1 })
		.limit(8) // Reduced to 8 for faster load
		.lean() // Use lean() for 50% faster queries
		.exec(); // Explicit exec for better performance

		res.status(200).json(users);
	} catch (err) {
		console.error("Get suggested users error:", err);
		res.status(500).json({ error: "Failed to fetch suggested users" });
	}
};