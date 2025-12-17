import prisma from "../lib/db.js";
import { emitToUser } from "../lib/socketHandlers.js";
import {
	sendVerificationApprovedEmail,
	sendVerificationRejectedEmail,
	sendReportStatusEmail,
	sendAccountSuspendedEmail
} from "../lib/email.js";
import { adminErrorHandler } from "../middleware/adminErrorHandler.js";



let adminUsersCache = null;
let adminUsersCacheTime = 0;
const ADMIN_USERS_CACHE_TTL = 2000; // Reduced to 2 seconds for real-time online status

const clearAdminUsersCache = () => {
	adminUsersCache = null;
	adminUsersCacheTime = 0;
};

const clearAdminStatsCache = () => {
	adminStatsCache = null;
	adminStatsCacheTime = 0;
};

export const getAllUsers = async (req, res) => {
	try {
		// ALWAYS get fresh online status from socket connections (source of truth)
		const { userSocketMap } = await import("../lib/socketHandlers.js");
		const onlineUserIds = Object.keys(userSocketMap);

		console.log(`📊 Admin: Fetching users. ${onlineUserIds.length} users currently online`);

		// Fetch fresh user data from database (no caching for admin to ensure accuracy)
		const users = await prisma.user.findMany({
			select: {
				id: true, username: true, nickname: true, email: true,
				profilePic: true, isVerified: true, isOnline: true,
				isSuspended: true, suspensionEndTime: true, suspensionReason: true,
				lastSeen: true, createdAt: true, country: true, countryCode: true,
				city: true, region: true, timezone: true, isVPN: true, lastIP: true
			},
			orderBy: { createdAt: "desc" },
			take: 100
		});

		// ALWAYS override database isOnline with socket map (socket is source of truth)
		const usersWithAccurateOnlineStatus = users.map(user => ({
			...user,
			isOnline: onlineUserIds.includes(user.id) // Socket map is the truth
		}));

		console.log(`✅ Admin: Returning ${usersWithAccurateOnlineStatus.length} users with accurate online status`);
		res.status(200).json(usersWithAccurateOnlineStatus);
	} catch (err) {
		console.error("getAllUsers error:", err);
		res.status(500).json({ error: "Failed to fetch users" });
	}
};

export const suspendUser = async (req, res) => {
	const { userId } = req.params;
	const { until, duration, reason } = req.body;
	
	if (!reason) {
		return res.status(400).json({ error: "Reason is required" });
	}
	
	try {
		// Check if user exists
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Check if user is already suspended
		if (user.isSuspended) {
			return res.status(400).json({ error: "User is already suspended" });
		}

		console.log(`⚠️ Admin: Suspending user ${userId} (${user.username}) for: ${reason}`);

		let suspendUntilDate;
		if (until) {
			suspendUntilDate = new Date(until);
			if (isNaN(suspendUntilDate.getTime())) {
				return res.status(400).json({ error: "Invalid date format" });
			}
		} else if (duration) {
			const now = new Date();
			const match = duration.match(/^(\d+)([dhm])$/);
			if (match) {
				const value = parseInt(match[1]);
				const unit = match[2];
				const multipliers = { 
					d: 24 * 60 * 60 * 1000, 
					h: 60 * 60 * 1000, 
					m: 60 * 1000 
				};
				suspendUntilDate = new Date(now.getTime() + value * multipliers[unit]);
			} else {
				return res.status(400).json({ error: "Invalid duration format. Use format like '7d', '24h', '30m'" });
			}
		} else {
			return res.status(400).json({ error: "Either until or duration is required" });
		}

		// Update user suspension status
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { 
				isSuspended: true, 
				suspensionEndTime: suspendUntilDate, 
				suspensionReason: reason,
				suspensionStartTime: new Date()
			}
		});

		// Clear admin caches
		clearAdminUsersCache();
		clearAdminStatsCache();

		// Notify user via socket
		try {
			emitToUser(userId, "user-action", { 
				type: "suspended", 
				reason, 
				until: suspendUntilDate 
			});
		} catch (socketErr) {
			console.log("User not connected for suspension notification");
		}

		// Send suspension email
		try {
			await sendAccountSuspendedEmail(
				user.email, 
				user.nickname || user.username, 
				reason, 
				suspendUntilDate
			);
		} catch (emailErr) {
			console.error("Failed to send suspension email:", emailErr);
		}

		console.log(`✅ Admin: User ${userId} suspended until ${suspendUntilDate}`);

		res.status(200).json({ 
			message: "User suspended successfully", 
			user: {
				id: updatedUser.id,
				username: updatedUser.username,
				isSuspended: updatedUser.isSuspended,
				suspensionReason: updatedUser.suspensionReason,
				suspensionEndTime: updatedUser.suspensionEndTime
			}
		});
	} catch (err) {
		console.error("suspendUser error:", err);
		res.status(500).json({ 
			error: "Failed to suspend user", 
			details: process.env.NODE_ENV === 'development' ? err.message : undefined
		});
	}
};

export const unsuspendUser = async (req, res) => {
	try {
		const { userId } = req.params;
		
		// Check if user exists
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		console.log(`✅ Admin: Unsuspending user ${userId} (${user.username})`);

		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { 
				isSuspended: false, 
				suspensionEndTime: null, 
				suspensionReason: null,
				suspensionStartTime: null
			}
		});
		
		clearAdminUsersCache();
		clearAdminStatsCache();
		
		// Notify user via socket
		try {
			emitToUser(userId, "user-action", {
				type: "unsuspended"
			});
		} catch (socketErr) {
			console.log("User not connected for unsuspension notification");
		}
		
		res.status(200).json({ 
			message: "User unsuspended successfully", 
			user: {
				id: updatedUser.id,
				username: updatedUser.username,
				isSuspended: updatedUser.isSuspended
			}
		});
	} catch (err) {
		console.error("unsuspendUser error:", err);
		res.status(500).json({ 
			error: "Failed to unsuspend user", 
			details: err.message 
		});
	}
};

export const blockUser = async (req, res) => {
	try {
		const { userId } = req.params;
		
		// Check if user exists
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Check if user is already blocked
		if (user.isBlocked) {
			return res.status(400).json({ error: "User is already blocked" });
		}

		console.log(`🚫 Admin: Blocking user ${userId} (${user.username})`);

		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { isBlocked: true }
		});
		
		clearAdminUsersCache();
		clearAdminStatsCache();
		
		// Notify user via socket
		try {
			emitToUser(userId, "user-action", {
				type: "blocked"
			});
		} catch (socketErr) {
			console.log("User not connected for block notification");
		}
		
		res.status(200).json({ 
			message: "User blocked successfully", 
			user: {
				id: updatedUser.id,
				username: updatedUser.username,
				isBlocked: updatedUser.isBlocked
			}
		});
	} catch (err) {
		console.error("blockUser error:", err);
		res.status(500).json({ 
			error: "Failed to block user", 
			details: err.message 
		});
	}
};

export const unblockUser = async (req, res) => {
	try {
		const { userId } = req.params;
		
		// Check if user exists
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Check if user is actually blocked
		if (!user.isBlocked) {
			return res.status(400).json({ error: "User is not blocked" });
		}

		console.log(`✅ Admin: Unblocking user ${userId} (${user.username})`);

		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { isBlocked: false }
		});
		
		clearAdminUsersCache();
		clearAdminStatsCache();
		
		// Notify user via socket
		try {
			emitToUser(userId, "user-action", { type: "unblocked" });
		} catch (socketErr) {
			console.log("User not connected for unblock notification");
		}
		
		res.status(200).json({ 
			message: "User unblocked successfully", 
			user: {
				id: updatedUser.id,
				username: updatedUser.username,
				isBlocked: updatedUser.isBlocked
			}
		});
	} catch (err) {
		console.error("unblockUser error:", err);
		res.status(500).json({ 
			error: "Failed to unblock user", 
			details: err.message 
		});
	}
};

export const deleteUser = async (req, res) => {
	try {
		const { userId } = req.params;
		
		// Check if user exists
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		console.log(`🗑️ Admin: Deleting user ${userId} (${user.username})`);

		// Use transaction to ensure all related data is deleted properly
		const result = await prisma.$transaction(async (tx) => {
			// Delete all messages (both sent and received)
			const deletedMessages = await tx.message.deleteMany({ 
				OR: [
					{ senderId: userId }, 
					{ receiverId: userId }
				] 
			});
			console.log(`🗑️ Deleted ${deletedMessages.count} messages`);

			// Delete all friend requests (both sent and received)
			const deletedFriendRequests = await tx.friendRequest.deleteMany({ 
				OR: [
					{ senderId: userId }, 
					{ receiverId: userId }
				] 
			});
			console.log(`🗑️ Deleted ${deletedFriendRequests.count} friend requests`);

			// Delete all reports (both made by user and against user)
			const deletedReports = await tx.report.deleteMany({ 
				OR: [
					{ reporterId: userId }, 
					{ reportedUserId: userId }
				] 
			});
			console.log(`🗑️ Deleted ${deletedReports.count} reports`);

			// Delete any admin notifications related to this user (skip if table doesn't exist)
			try {
				const deletedNotifications = await tx.adminNotification.deleteMany({
					OR: [
						{ message: { contains: userId } },
						{ title: { contains: user.username } },
						{ link: { contains: userId } }
					]
				});
				console.log(`🗑️ Deleted ${deletedNotifications.count} admin notifications`);
			} catch (notificationErr) {
				console.log("No admin notifications to delete or table doesn't exist");
			}

			// Finally delete the user
			const deletedUser = await tx.user.delete({ where: { id: userId } });
			console.log(`🗑️ User ${userId} deleted successfully`);
			
			return {
				deletedMessages: deletedMessages.count,
				deletedFriendRequests: deletedFriendRequests.count,
				deletedReports: deletedReports.count,
				deletedUser
			};
		}, {
			timeout: 30000, // 30 second timeout for large deletions
			maxWait: 5000,  // Don't wait more than 5 seconds to start the transaction
		});

		// Clear admin caches
		clearAdminUsersCache();
		clearAdminStatsCache();

		// Notify user (if still connected)
		try {
			emitToUser(userId, "admin-action", { action: "account-deleted" });
		} catch (socketErr) {
			console.log("User not connected for deletion notification");
		}

		res.status(200).json({ 
			message: "User and all related data deleted successfully",
			deletedUser: {
				id: userId,
				username: user.username,
				email: user.email
			},
			deletionStats: {
				messages: result.deletedMessages,
				friendRequests: result.deletedFriendRequests,
				reports: result.deletedReports
			}
		});
	} catch (err) {
		console.error("deleteUser error:", err);
		
		// Provide more specific error messages
		let errorMessage = "Failed to delete user";
		let statusCode = 500;
		
		if (err.code === 'P2003') {
			errorMessage = "Cannot delete user due to foreign key constraints";
			statusCode = 400;
		} else if (err.code === 'P2025') {
			errorMessage = "User not found or already deleted";
			statusCode = 404;
		} else if (err.message && err.message.includes('timeout')) {
			errorMessage = "Deletion timeout - user has too much data";
			statusCode = 408;
		} else if (err.code === 'P2034') {
			errorMessage = "Transaction conflict - please try again";
			statusCode = 409;
		}
		
		res.status(statusCode).json({ 
			error: errorMessage, 
			details: process.env.NODE_ENV === 'development' ? err.message : undefined,
			code: err.code || 'UNKNOWN'
		});
	}
};

export const toggleVerification = async (req, res) => {
	try {
		const { userId } = req.params;
		
		// Check if user exists
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const newVerificationStatus = !user.isVerified;
		console.log(`${newVerificationStatus ? '✅' : '❌'} Admin: ${newVerificationStatus ? 'Verifying' : 'Unverifying'} user ${userId} (${user.username})`);

		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { 
				isVerified: newVerificationStatus,
				verificationStatus: newVerificationStatus ? "approved" : "none",
				verificationReviewedAt: new Date(),
				verificationReviewedBy: req.user?.id || "admin"
			}
		});
		
		clearAdminUsersCache();
		clearAdminStatsCache();
		
		// Notify user via socket
		try {
			emitToUser(userId, "verification-status-changed", { 
				isVerified: updatedUser.isVerified,
				message: newVerificationStatus ? "Account verified!" : "Verification removed"
			});
		} catch (socketErr) {
			console.log("User not connected for verification notification");
		}
		
		res.status(200).json({ 
			message: `User ${newVerificationStatus ? 'verified' : 'unverified'} successfully`, 
			user: {
				id: updatedUser.id,
				username: updatedUser.username,
				isVerified: updatedUser.isVerified,
				verificationStatus: updatedUser.verificationStatus
			}
		});
	} catch (err) {
		console.error("toggleVerification error:", err);
		res.status(500).json({ 
			error: "Failed to toggle verification", 
			details: err.message 
		});
	}
};

export const getReports = async (req, res) => {
	try {
		const reports = await prisma.report.findMany({
			orderBy: { createdAt: "desc" },
			take: 100,
			include: {
				reporter: { select: { username: true, nickname: true, profilePic: true, email: true } },
				reportedUser: { select: { username: true, nickname: true, profilePic: true, email: true } }
			}
		});
		res.status(200).json(reports);
	} catch (err) {
		res.status(500).json({ error: "Failed to fetch reports" });
	}
};

export const getAIReports = async (req, res) => {
	try {
		const aiReports = await prisma.report.findMany({
			where: { isAIDetected: true },
			orderBy: { createdAt: "desc" },
			include: {
				reporter: { select: { username: true, nickname: true, profilePic: true, email: true } },
				reportedUser: { select: { username: true, nickname: true, profilePic: true, email: true } }
			}
		});

		// ✅ FIX: Calculate average confidence
		const totalConfidence = aiReports.reduce((sum, r) => sum + (r.aiConfidence || 0), 0);
		const avgConfidence = aiReports.length > 0 ? totalConfidence / aiReports.length : 0;

		const stats = {
			total: aiReports.length,
			pending: aiReports.filter(r => r.status === "pending").length,
			reviewed: aiReports.filter(r => r.status === "reviewed").length,
			actionTaken: aiReports.filter(r => r.status === "action_taken").length,
			dismissed: aiReports.filter(r => r.status === "dismissed").length,
			avgConfidence: avgConfidence // ✅ FIX: Add average confidence
		};
		res.status(200).json({ reports: aiReports, stats });
	} catch (err) {
		console.error("Error fetching AI reports:", err);
		res.status(500).json({ error: "Failed to fetch AI reports" });
	}
};

export const updateReportStatus = async (req, res) => {
	const { reportId } = req.params;
	const { status, adminNotes, actionTaken } = req.body;
	try {
		const report = await prisma.report.findUnique({
			where: { id: reportId },
			include: {
				reporter: { select: { id: true, username: true, nickname: true, email: true } },
				reportedUser: { select: { username: true, nickname: true } }
			}
		});
		if (!report) return res.status(404).json({ error: "Report not found" });
		const updatedReport = await prisma.report.update({
			where: { id: reportId },
			data: {
				status,
				adminNotes: adminNotes || report.adminNotes,
				actionTaken: actionTaken || report.actionTaken,
				reviewedBy: req.user.id,
				reviewedAt: new Date()
			}
		});
		res.status(200).json({ message: `Report marked as ${status}`, report: updatedReport });
	} catch (err) {
		res.status(500).json({ error: "Failed to update report status" });
	}
};

export const deleteReport = async (req, res) => {
	try {
		await prisma.report.delete({ where: { id: req.params.reportId } });
		res.status(200).json({ message: "Report deleted successfully" });
	} catch (err) {
		res.status(500).json({ error: "Failed to delete report" });
	}
};

export const getVerificationRequests = async (req, res) => {
	try {
		const users = await prisma.user.findMany({
			where: { verificationStatus: "pending" },
			select: {
				id: true, username: true, nickname: true, profilePic: true,
				email: true, verificationStatus: true, verificationReason: true,
				verificationIdProof: true, verificationRequestedAt: true,
				isVerified: true, createdAt: true
			},
			take: 50,
			orderBy: { verificationRequestedAt: "desc" }
		});
		res.status(200).json(users);
	} catch (err) {
		res.status(200).json([]);
	}
};

export const approveVerification = async (req, res) => {
	try {
		const user = await prisma.user.update({
			where: { id: req.params.userId },
			data: {
				isVerified: true,
				verificationStatus: "approved",
				verificationReviewedAt: new Date(),
				verificationReviewedBy: req.user.id
			}
		});
		emitToUser(req.params.userId, "verification-approved", { message: "Verification approved!" });
		await sendVerificationApprovedEmail(user.email, user.nickname || user.username);
		res.status(200).json({ message: "Verification approved", user });
	} catch (err) {
		res.status(500).json({ error: "Failed to approve verification" });
	}
};

export const rejectVerification = async (req, res) => {
	try {
		const user = await prisma.user.update({
			where: { id: req.params.userId },
			data: {
				isVerified: false,
				verificationStatus: "rejected",
				verificationAdminNote: req.body.reason || "Does not meet criteria",
				verificationReviewedAt: new Date(),
				verificationReviewedBy: req.user.id
			}
		});
		emitToUser(req.params.userId, "verification-rejected", { message: "Verification rejected", reason: user.verificationAdminNote });
		await sendVerificationRejectedEmail(user.email, user.nickname || user.username, user.verificationAdminNote);
		res.status(200).json({ message: "Verification rejected", user });
	} catch (err) {
		res.status(500).json({ error: "Failed to reject verification" });
	}
};

// Cache for admin stats
let adminStatsCache = null;
let adminStatsCacheTime = 0;
const ADMIN_STATS_CACHE_TTL = 30000; // 30 seconds cache

export const getAdminStats = async (req, res) => {
	try {
		const now = Date.now();

		// Return cached data if still valid
		if (adminStatsCache && (now - adminStatsCacheTime) < ADMIN_STATS_CACHE_TTL) {
			// Always get fresh online count from socket
			const { userSocketMap } = await import("../lib/socketHandlers.js");
			const freshStats = {
				...adminStatsCache,
				onlineUsers: Object.keys(userSocketMap).length
			};
			return res.status(200).json(freshStats);
		}

		const { userSocketMap } = await import("../lib/socketHandlers.js");

		// Optimized parallel queries
		const [
			totalUsers,
			verifiedUsers,
			suspendedUsers,
			pendingVerifications,
			pendingReports,
			totalReports,
			recentUsers,
			approvedVerifications
		] = await Promise.all([
			prisma.user.count(),
			prisma.user.count({ where: { isVerified: true } }),
			prisma.user.count({ where: { isSuspended: true } }),
			prisma.user.count({ where: { verificationStatus: "pending" } }),
			prisma.report.count({ where: { status: "pending" } }),
			prisma.report.count(),
			prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
			prisma.user.count({ where: { verificationStatus: "approved" } })
		]);

		const stats = {
			totalUsers,
			verifiedUsers,
			onlineUsers: Object.keys(userSocketMap).length,
			suspendedUsers,
			pendingVerifications,
			pendingReports,
			totalReports,
			recentUsers,
			approvedVerifications
		};

		// Cache the stats (except online users which changes frequently)
		adminStatsCache = { ...stats };
		adminStatsCacheTime = now;

		res.status(200).json(stats);
	} catch (err) {
		console.error("getAdminStats error:", err);
		res.status(500).json({ error: "Failed to fetch admin statistics" });
	}
};

export const getDashboardStats = async (req, res) => {
	try {
		const { userSocketMap } = await import("../lib/socketHandlers.js");
		const [totalUsers, verifiedUsers, suspendedUsers, blockedUsers, pendingVerifications, pendingReports, newUsersThisWeek, newUsersThisMonth] = await Promise.all([
			prisma.user.count(),
			prisma.user.count({ where: { isVerified: true } }),
			prisma.user.count({ where: { isSuspended: true } }),
			prisma.user.count({ where: { isBlocked: true } }),
			prisma.user.count({ where: { verificationStatus: "pending" } }),
			prisma.report.count({ where: { status: "pending" } }),
			prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
			prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } })
		]);
		res.status(200).json({
			totalUsers, verifiedUsers, onlineUsers: Object.keys(userSocketMap).length,
			suspendedUsers, blockedUsers, pendingVerifications, pendingReports, newUsersThisWeek, newUsersThisMonth
		});
	} catch (err) {
		res.status(500).json({ error: "Failed to fetch dashboard statistics" });
	}
};

export const sendPersonalNotification = async (req, res) => {
	try {
		const { title, message } = req.body;
		if (!title || !message) return res.status(400).json({ error: "Title and message required" });
		const notification = await prisma.adminNotification.create({
			data: { type: "info", title, message }
		});
		res.status(200).json({ message: "Notification sent", notification });
	} catch (err) {
		res.status(500).json({ error: "Failed to send notification" });
	}
};

export const sendBroadcastNotification = async (req, res) => {
	try {
		const { title, message } = req.body;
		if (!title || !message) return res.status(400).json({ error: "Title and message required" });
		const notification = await prisma.adminNotification.create({
			data: { type: "broadcast", title, message }
		});
		req.app.get("io")?.emit("admin-broadcast", { title, message, createdAt: new Date() });
		res.status(200).json({ message: "Broadcast sent", notification });
	} catch (err) {
		res.status(500).json({ error: "Failed to send broadcast" });
	}
};

export const getUserNotifications = async (req, res) => {
	try {
		const notifications = await prisma.adminNotification.findMany({
			orderBy: { createdAt: "desc" },
			take: 50
		});
		res.status(200).json(notifications);
	} catch (err) {
		res.status(500).json({ error: "Failed to fetch notifications" });
	}
};

export const markNotificationRead = async (req, res) => {
	try {
		await prisma.adminNotification.update({
			where: { id: req.params.notificationId },
			data: { isRead: true }
		});
		res.status(200).json({ message: "Notification marked as read" });
	} catch (err) {
		res.status(500).json({ error: "Failed to mark notification as read" });
	}
};

export const deleteNotification = async (req, res) => {
	try {
		await prisma.adminNotification.delete({
			where: { id: req.params.notificationId }
		});
		res.status(200).json({ message: "Notification deleted" });
	} catch (err) {
		res.status(500).json({ error: "Failed to delete notification" });
	}
};

export const submitManualReport = async (req, res) => {
	try {
		const { title, description, severity } = req.body;
		let screenshotUrl = null;

		// Handle screenshot upload if provided
		if (req.file) {
			// Upload to Cloudinary or your storage
			const cloudinary = await import("../lib/cloudinary.js");
			const result = await cloudinary.default.uploader.upload(req.file.path, {
				folder: "manual-reports"
			});
			screenshotUrl = result.secure_url;
		}

		// Create manual report in database
		const report = await prisma.manualReport.create({
			data: {
				title,
				description,
				severity,
				screenshot: screenshotUrl,
				reportedBy: req.user.id,
				status: "pending"
			}
		});

		res.status(200).json({ message: "Report submitted successfully", report });
	} catch (err) {
		console.error("Submit manual report error:", err);
		res.status(500).json({ error: "Failed to submit report" });
	}
};

export const getManualReports = async (req, res) => {
	try {
		const reports = await prisma.manualReport.findMany({
			orderBy: { createdAt: "desc" },
			take: 50,
			include: {
				reporter: {
					select: { username: true, nickname: true, profilePic: true }
				}
			}
		});
		res.status(200).json(reports);
	} catch (err) {
		console.error("Get manual reports error:", err);
		res.status(500).json({ error: "Failed to fetch manual reports" });
	}
};
export const getSystemStats = async (req, res) => {
	try {
		const { default: os } = await import("os");

		// Check DB latency
		const start = Date.now();
		await prisma.$queryRaw`SELECT 1`;
		const dbLatency = Date.now() - start;

		const totalMem = os.totalmem();
		const freeMem = os.freemem();
		const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

		const stats = {
			uptime: os.uptime(),
			loadAvg: os.loadavg(),
			totalMem,
			freeMem,
			memoryUsage, // Percentage
			platform: os.platform(),
			cpuCount: os.cpus().length,
			dbStatus: "connected",
			dbLatency: dbLatency
		};
		res.status(200).json(stats);
	} catch (err) {
		console.error("System stats error:", err);
		res.status(500).json({ error: "Failed to fetch system stats", dbStatus: "disconnected" });
	}
};

export const getGameStats = async (req, res) => {
	try {
		const { gameManager } = await import("../lib/gameManager.js");

		const activeGames = gameManager.games.size;
		let totalPlayers = 0;
		let waitingGames = 0;
		let playingGames = 0;

		for (const game of gameManager.games.values()) {
			totalPlayers += game.playerIds.length;
			if (game.status === 'waiting') waitingGames++;
			if (game.status === 'playing') playingGames++;
		}

		// Fetch persisted game stats only if you have a Game model
		// For now, we return active in-memory stats
		const stats = {
			activeGames,
			totalPlayers,
			waitingGames,
			playingGames
		};

		res.status(200).json(stats);
	} catch (err) {
		console.error("Game stats error:", err);
		res.status(500).json({ error: "Failed to fetch game stats" });
	}
};
