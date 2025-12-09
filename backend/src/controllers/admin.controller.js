import prisma from "../lib/prisma.js";
import { 
	sendVerificationApprovedEmail, 
	sendVerificationRejectedEmail,
	sendReportStatusEmail,
	sendAccountSuspendedEmail 
} from "../lib/email.js";

const emitToUser = (io, userId, event, data) => {
	if (!io || !userId) return false;
	const userIdStr = userId.toString();
	const sockets = io.sockets.sockets;
	for (const [socketId, socket] of sockets) {
		if (socket.userId && socket.userId.toString() === userIdStr) {
			io.to(socketId).emit(event, data);
			return true;
		}
	}
	return false;
};

let adminUsersCache = null;
let adminUsersCacheTime = 0;
const ADMIN_USERS_CACHE_TTL = 2000; // Reduced to 2 seconds for real-time online status

const clearAdminUsersCache = () => {
	adminUsersCache = null;
	adminUsersCacheTime = 0;
};

export const getAllUsers = async (req, res) => {
	try {
		// ALWAYS get fresh online status from socket connections (source of truth)
		const { userSocketMap } = await import("../lib/socket.js");
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
	if (!reason) return res.status(400).json({ error: "Reason is required" });
	try {
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) return res.status(404).json({ error: "User not found" });
		let suspendUntilDate;
		if (until) {
			suspendUntilDate = new Date(until);
		} else if (duration) {
			const now = new Date();
			const match = duration.match(/^(\d+)([dhm])$/);
			if (match) {
				const value = parseInt(match[1]);
				const unit = match[2];
				const multipliers = { d: 24*60*60*1000, h: 60*60*1000, m: 60*1000 };
				suspendUntilDate = new Date(now.getTime() + value * multipliers[unit]);
			} else {
				return res.status(400).json({ error: "Invalid duration format" });
			}
		} else {
			return res.status(400).json({ error: "Either until or duration is required" });
		}
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { isSuspended: true, suspensionEndTime: suspendUntilDate, suspensionReason: reason }
		});
		clearAdminUsersCache();
		const io = req.app.get("io");
		emitToUser(io, userId, "user-action", { type: "suspended", reason, until: suspendUntilDate });
		try {
			await sendAccountSuspendedEmail(user.email, user.nickname || user.username, reason, suspendUntilDate);
		} catch (emailErr) {
			console.error("Failed to send suspension email:", emailErr);
		}
		res.status(200).json({ message: "User suspended successfully", user: updatedUser });
	} catch (err) {
		console.error("suspendUser error:", err);
		res.status(500).json({ error: "Failed to suspend user" });
	}
};

export const unsuspendUser = async (req, res) => {
	try {
		const updatedUser = await prisma.user.update({
			where: { id: req.params.userId },
			data: { isSuspended: false, suspensionEndTime: null, suspensionReason: null }
		});
		clearAdminUsersCache();
		emitToUser(req.app.get("io"), req.params.userId, "user-action", { type: "unsuspended" });
		res.status(200).json({ message: "User unsuspended successfully", user: updatedUser });
	} catch (err) {
		res.status(500).json({ error: "Failed to unsuspend user" });
	}
};

export const blockUser = async (req, res) => {
	try {
		const updatedUser = await prisma.user.update({
			where: { id: req.params.userId },
			data: { isBlocked: true }
		});
		emitToUser(req.app.get("io"), req.params.userId, "user-action", { type: "blocked" });
		res.status(200).json({ message: "User blocked successfully", user: updatedUser });
	} catch (err) {
		res.status(500).json({ error: "Failed to block user" });
	}
};

export const unblockUser = async (req, res) => {
	try {
		const updatedUser = await prisma.user.update({
			where: { id: req.params.userId },
			data: { isBlocked: false }
		});
		emitToUser(req.app.get("io"), req.params.userId, "user-action", { type: "unblocked" });
		res.status(200).json({ message: "User unblocked successfully", user: updatedUser });
	} catch (err) {
		res.status(500).json({ error: "Failed to unblock user" });
	}
};

export const deleteUser = async (req, res) => {
	try {
		await prisma.$transaction(async (tx) => {
			await tx.message.deleteMany({ OR: [{ senderId: req.params.userId }, { receiverId: req.params.userId }] });
			await tx.user.delete({ where: { id: req.params.userId } });
		});
		emitToUser(req.app.get("io"), req.params.userId, "admin-action", { action: "account-deleted" });
		res.status(200).json({ message: "User deleted successfully" });
	} catch (err) {
		res.status(500).json({ error: "Failed to delete user" });
	}
};

export const toggleVerification = async (req, res) => {
	try {
		const user = await prisma.user.findUnique({ where: { id: req.params.userId } });
		const updatedUser = await prisma.user.update({
			where: { id: req.params.userId },
			data: { isVerified: !user.isVerified }
		});
		emitToUser(req.app.get("io"), req.params.userId, "verification-status-changed", { isVerified: updatedUser.isVerified });
		res.status(200).json({ message: "Verification toggled", user: updatedUser });
	} catch (err) {
		res.status(500).json({ error: "Failed to toggle verification" });
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
		emitToUser(req.app.get("io"), req.params.userId, "verification-approved", { message: "Verification approved!" });
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
		emitToUser(req.app.get("io"), req.params.userId, "verification-rejected", { message: "Verification rejected", reason: user.verificationAdminNote });
		await sendVerificationRejectedEmail(user.email, user.nickname || user.username, user.verificationAdminNote);
		res.status(200).json({ message: "Verification rejected", user });
	} catch (err) {
		res.status(500).json({ error: "Failed to reject verification" });
	}
};

export const getAdminStats = async (req, res) => {
	try {
		const { userSocketMap } = await import("../lib/socket.js");
		const [totalUsers, verifiedUsers, suspendedUsers, blockedUsers, pendingVerifications, pendingReports, totalReports, recentUsers] = await Promise.all([
			prisma.user.count(),
			prisma.user.count({ where: { isVerified: true } }),
			prisma.user.count({ where: { isSuspended: true } }),
			prisma.user.count({ where: { isBlocked: true } }),
			prisma.user.count({ where: { verificationStatus: "pending" } }),
			prisma.report.count({ where: { status: "pending" } }),
			prisma.report.count(),
			prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7*24*60*60*1000) } } })
		]);
		res.status(200).json({
			totalUsers, verifiedUsers, onlineUsers: Object.keys(userSocketMap).length,
			suspendedUsers, blockedUsers, pendingVerifications, pendingReports, totalReports, recentUsers
		});
	} catch (err) {
		res.status(500).json({ error: "Failed to fetch admin statistics" });
	}
};

export const getDashboardStats = async (req, res) => {
	try {
		const { userSocketMap } = await import("../lib/socket.js");
		const [totalUsers, verifiedUsers, suspendedUsers, blockedUsers, pendingVerifications, pendingReports, newUsersThisWeek, newUsersThisMonth] = await Promise.all([
			prisma.user.count(),
			prisma.user.count({ where: { isVerified: true } }),
			prisma.user.count({ where: { isSuspended: true } }),
			prisma.user.count({ where: { isBlocked: true } }),
			prisma.user.count({ where: { verificationStatus: "pending" } }),
			prisma.report.count({ where: { status: "pending" } }),
			prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7*24*60*60*1000) } } }),
			prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 30*24*60*60*1000) } } })
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
