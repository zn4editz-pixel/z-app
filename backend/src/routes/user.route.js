import express from "express";
import {
	getAllUsers,
	getUserById,
	getUserProfile,
	updateUserProfile,
	deleteMyAccount,
	deleteUser,
	searchUsers,
	getSuggestedUsers,
	getUserByUsername,
	checkUsernameAvailability,
	getUsernameChangeInfo,
} from "../controllers/user.controller.js";

import {
	getUserNotifications,
	markNotificationRead,
	deleteNotification,
} from "../controllers/admin.controller.js";

import { protectRoute, isAdmin } from "../middleware/protectRoute.js";
import User from "../models/user.model.js";

const router = express.Router();

// 🔒 All routes below require authentication
router.use(protectRoute);

// ✅ Search users by username (for search overlay)
router.get("/search", searchUsers);

// ✅ Get suggested users for discovery page
router.get("/suggested", getSuggestedUsers);

// ✅ Check username availability
router.get("/check-username/:username", checkUsernameAvailability);

// ✅ Get username change info
router.get("/username-change-info", getUsernameChangeInfo);

// ✅ Admin only - fetch all users
router.get("/", isAdmin, getAllUsers);

// ✅ Get your own profile
router.get("/me", getUserProfile);

// ✅ Update your own profile
router.put("/me", updateUserProfile);

// ✅ Request verification badge
router.post("/request-verification", async (req, res) => {
	try {
		const { reason, idProof } = req.body;
		const userId = req.user._id;

		if (!reason || !idProof) {
			return res.status(400).json({ message: "Reason and ID proof are required" });
		}

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		if (user.isVerified) {
			return res.status(400).json({ message: "You are already verified" });
		}

		if (user.verificationRequest?.status === "pending") {
			return res.status(400).json({ message: "You already have a pending verification request" });
		}

		user.verificationRequest = {
			status: "pending",
			reason,
			idProof,
			requestedAt: new Date(),
		};

		await user.save();

		res.status(200).json({ message: "Verification request submitted successfully" });
	} catch (error) {
		console.error("Verification request error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
});

// ✅ Delete your own account
router.delete("/me", deleteMyAccount);

// ✅ Admin Notifications for Users
router.get("/notifications", getUserNotifications);
router.put("/notifications/:notificationId/read", markNotificationRead);
router.delete("/notifications/:notificationId", deleteNotification);

// ✅ --- NEW: Get a user's public profile by their USERNAME
// This MUST be before the '/:id' route
router.get("/profile/:username", getUserByUsername);

// ✅ Admin only - delete any user by ID
router.delete("/:userId", isAdmin, deleteUser);

// ✅ Get user by ID (for admin or public profile view)
router.get("/:id", getUserById);

export default router;