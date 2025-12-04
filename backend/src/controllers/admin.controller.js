import User from "../models/user.model.js";
import Report from "../models/report.model.js";
import { 
	sendVerificationApprovedEmail, 
	sendVerificationRejectedEmail,
	sendReportStatusEmail,
	sendAccountSuspendedEmail 
} from "../lib/email.js";

// ✅ Safe Socket Emit Utility
const emitToUser = (io, userId, event, data) => {
	if (!io || !userId) return;
	
	// Get socket ID from io.sockets
	const sockets = io.sockets.sockets;
	let targetSocketId = null;
	
	// Find the socket for this user
	for (const [socketId, socket] of sockets) {
		if (socket.userId === userId || socket.userId === userId.toString()) {
			targetSocketId = socketId;
			break;
		}
	}
	
	if (targetSocketId) {
		console.log(`📤 Emitting '${event}' to user ${userId} (socket ${targetSocketId})`);
		io.to(targetSocketId).emit(event, data);
	} else {
		console.log(`⚠️ User ${userId} not connected, cannot emit '${event}'`);
	}
};

// --- User Management Functions (no changes) ---
export const getAllUsers = async (req, res) => {
	// Your existing getAllUsers function...
	try {
		const users = await User.find().select("-password");
		res.status(200).json(users);
	} catch (err) {
		console.error("getAllUsers error:", err);
		res.status(500).json({ error: "Failed to fetch users" });
	}
};
export const suspendUser = async (req, res) => {
	// Your existing suspendUser function...
	const { userId } = req.params;
	const { until, reason } = req.body;
	if (!until || !reason) return res.status(400).json({ error: "Reason and duration required" });
	try {
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });
		const suspendUntilDate = new Date(until);
		if (isNaN(suspendUntilDate.getTime())) return res.status(400).json({ error: "Invalid date" });
		user.isSuspended = true; user.suspendedUntil = suspendUntilDate; user.suspensionReason = reason;
		await user.save();
		const io = req.app.get("io");
		emitToUser(io, userId, "user-action", { type: "suspended", reason, until: suspendUntilDate });
		
		// Send email notification
		await sendAccountSuspendedEmail(
			user.email,
			user.nickname || user.username,
			reason,
			suspendUntilDate
		);
		
		res.status(200).json({ message: "User suspended", user });
	} catch (err) { console.error("suspendUser error:", err); res.status(500).json({ error: "Failed" }); }
};
export const unsuspendUser = async (req, res) => {
	// Your existing unsuspendUser function...
	const { userId } = req.params;
	try {
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });
		user.isSuspended = false; user.suspendedUntil = null; user.suspensionReason = null;
		await user.save();
		const io = req.app.get("io");
		emitToUser(io, userId, "user-action", { type: "unsuspended" });
		res.status(200).json({ message: "User unsuspended", user });
	} catch (err) { console.error("unsuspendUser error:", err); res.status(500).json({ error: "Failed" }); }
};
export const blockUser = async (req, res) => {
	// Your existing blockUser function...
	const { userId } = req.params;
	try {
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });
		user.isBlocked = true; await user.save();
		const io = req.app.get("io");
		emitToUser(io, userId, "user-action", { type: "blocked" });
		res.status(200).json({ message: "User blocked", user });
	} catch (err) { console.error("blockUser error:", err); res.status(500).json({ error: "Failed" }); }
};
export const unblockUser = async (req, res) => {
	// Your existing unblockUser function...
	const { userId } = req.params;
	try {
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });
		user.isBlocked = false; await user.save();
		const io = req.app.get("io");
		emitToUser(io, userId, "user-action", { type: "unblocked" });
		res.status(200).json({ message: "User unblocked", user });
	} catch (err) { console.error("unblockUser error:", err); res.status(500).json({ error: "Failed" }); }
};
export const deleteUser = async (req, res) => {
	// Your existing deleteUser function...
	const { userId } = req.params;
	try {
		const user = await User.findByIdAndDelete(userId);
		if (!user) return res.status(404).json({ error: "User not found" });
		const io = req.app.get("io");
		emitToUser(io, userId, "user-action", { type: "deleted" });
		res.status(200).json({ message: "User deleted" });
	} catch (err) { console.error("deleteUser error:", err); res.status(500).json({ error: "Failed" }); }
};
export const toggleVerification = async (req, res) => {
	// Your existing toggleVerification function...
	const { userId } = req.params;
	try {
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });
		user.isVerified = !user.isVerified; await user.save();
		res.status(200).json({ message: `Verify ${user.isVerified ? "enabled" : "disabled"}`, user });
	} catch (err) { console.error("toggleVerify error:", err); res.status(500).json({ error: "Failed" }); }
};
// --- End User Management ---


// ✅ --- Get Reports ---
export const getReports = async (req, res) => {
	try {
		const reports = await Report.find()
			.sort({ createdAt: -1 })
			.populate("reporter", "username nickname profilePic email")
			.populate("reportedUser", "username nickname profilePic email");

		res.status(200).json(reports);
	} catch (err) {
		console.error("getReports error:", err);
		res.status(500).json({ error: "Failed to fetch reports" });
	}
};

// ✅ --- Update Report Status ---
export const updateReportStatus = async (req, res) => {
	const { reportId } = req.params;
	const { status, adminNotes, actionTaken } = req.body;

	try {
		const report = await Report.findById(reportId)
			.populate("reporter", "username nickname profilePic email")
			.populate("reportedUser", "username nickname profilePic email");
			
		if (!report) {
			return res.status(404).json({ error: "Report not found" });
		}

		// Validate status
		const validStatuses = ["pending", "reviewed", "action_taken", "dismissed"];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({ error: "Invalid status" });
		}

		// Update report
		report.status = status;
		if (adminNotes) {
			report.adminNotes = adminNotes;
		}
		if (actionTaken) {
			report.actionTaken = actionTaken;
		}
		report.reviewedBy = req.user._id;
		report.reviewedAt = new Date();
		report.reporterNotified = true;

		await report.save();

		// Prepare notification message
		let notificationMessage = "";
		let notificationTitle = "";
		
		if (status === "reviewed") {
			notificationTitle = "Report Reviewed";
			notificationMessage = `Your report against ${report.reportedUser?.nickname || report.reportedUser?.username} has been reviewed by our team.`;
		} else if (status === "action_taken") {
			notificationTitle = "Action Taken";
			if (actionTaken === "warning") {
				notificationMessage = `We've issued a warning to ${report.reportedUser?.nickname || report.reportedUser?.username} based on your report.`;
			} else if (actionTaken === "suspended") {
				notificationMessage = `${report.reportedUser?.nickname || report.reportedUser?.username} has been suspended based on your report. Thank you for keeping our community safe.`;
			} else if (actionTaken === "banned") {
				notificationMessage = `${report.reportedUser?.nickname || report.reportedUser?.username} has been permanently banned based on your report. Thank you for keeping our community safe.`;
			} else {
				notificationMessage = `Action has been taken on your report against ${report.reportedUser?.nickname || report.reportedUser?.username}.`;
			}
		} else if (status === "dismissed") {
			notificationTitle = "Report Reviewed";
			notificationMessage = `Your report has been reviewed. After investigation, no policy violation was found.`;
		}

		// Send socket notification to reporter
		const io = req.app.get("io");
		if (io && report.reporter) {
			emitToUser(io, report.reporter._id, "report-status-updated", {
				reportId: report._id,
				status,
				actionTaken: actionTaken || "none",
				reportedUser: report.reportedUser?.nickname || report.reportedUser?.username,
				title: notificationTitle,
				message: notificationMessage,
				timestamp: new Date()
			});
		}

		// Send email notification to reporter
		if (report.reporter && report.reporter.email) {
			await sendReportStatusEmail(
				report.reporter.email,
				report.reporter.nickname || report.reporter.username,
				status,
				report.reportedUser?.nickname || report.reportedUser?.username || 'Unknown'
			);
		}

		res.status(200).json({ 
			message: `Report marked as ${status}`, 
			report 
		});
	} catch (err) {
		console.error("updateReportStatus error:", err);
		res.status(500).json({ error: "Failed to update report status" });
	}
};

// ✅ --- Delete Report ---
export const deleteReport = async (req, res) => {
	const { reportId } = req.params;

	try {
		const report = await Report.findByIdAndDelete(reportId);
		if (!report) {
			return res.status(404).json({ error: "Report not found" });
		}

		res.status(200).json({ message: "Report deleted successfully" });
	} catch (err) {
		console.error("deleteReport error:", err);
		res.status(500).json({ error: "Failed to delete report" });
	}
};

// ✅ --- Get Verification Requests ---
export const getVerificationRequests = async (req, res) => {
	try {
		const users = await User.find({
			"verificationRequest.status": { $exists: true, $ne: null }
		})
		.select("username nickname profilePic email verificationRequest isVerified")
		.sort({ "verificationRequest.requestedAt": -1 });

		res.status(200).json(users);
	} catch (err) {
		console.error("getVerificationRequests error:", err);
		res.status(500).json({ error: "Failed to fetch verification requests" });
	}
};

// ✅ --- Approve Verification Request ---
export const approveVerification = async (req, res) => {
	const { userId } = req.params;
	try {
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		user.isVerified = true;
		user.verificationRequest.status = "approved";
		user.verificationRequest.reviewedAt = new Date();
		user.verificationRequest.reviewedBy = req.user._id;

		await user.save();

		const io = req.app.get("io");
		emitToUser(io, userId, "verification-approved", { 
			message: "Your verification request has been approved!" 
		});

		// Send email notification
		await sendVerificationApprovedEmail(
			user.email,
			user.nickname || user.username
		);

		res.status(200).json({ message: "Verification approved", user });
	} catch (err) {
		console.error("approveVerification error:", err);
		res.status(500).json({ error: "Failed to approve verification" });
	}
};

// ✅ --- Reject Verification Request ---
export const rejectVerification = async (req, res) => {
	const { userId } = req.params;
	const { reason } = req.body;

	try {
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		user.isVerified = false;
		user.verificationRequest.status = "rejected";
		user.verificationRequest.adminNote = reason || "Does not meet verification criteria";
		user.verificationRequest.reviewedAt = new Date();
		user.verificationRequest.reviewedBy = req.user._id;

		await user.save();

		const io = req.app.get("io");
		emitToUser(io, userId, "verification-rejected", { 
			message: "Your verification request has been rejected",
			reason: user.verificationRequest.adminNote
		});

		// Send email notification
		await sendVerificationRejectedEmail(
			user.email,
			user.nickname || user.username,
			user.verificationRequest.adminNote
		);

		res.status(200).json({ message: "Verification rejected", user });
	} catch (err) {
		console.error("rejectVerification error:", err);
		res.status(500).json({ error: "Failed to reject verification" });
	}
};

// ✅ --- Get Admin Statistics ---
export const getAdminStats = async (req, res) => {
	try {
		const totalUsers = await User.countDocuments();
		const verifiedUsers = await User.countDocuments({ isVerified: true });
		const onlineUsers = await User.countDocuments({ isOnline: true });
		const suspendedUsers = await User.countDocuments({ isSuspended: true });
		const blockedUsers = await User.countDocuments({ isBlocked: true });
		
		const pendingVerifications = await User.countDocuments({
			"verificationRequest.status": "pending"
		});
		
		const approvedVerifications = await User.countDocuments({
			"verificationRequest.status": "approved"
		});
		
		const rejectedVerifications = await User.countDocuments({
			"verificationRequest.status": "rejected"
		});

		const pendingReports = await Report.countDocuments({ status: "pending" });
		const totalReports = await Report.countDocuments();

		// Get user growth data (last 7 days)
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
		
		const recentUsers = await User.countDocuments({
			createdAt: { $gte: sevenDaysAgo }
		});

		res.status(200).json({
			totalUsers,
			verifiedUsers,
			onlineUsers,
			suspendedUsers,
			blockedUsers,
			pendingVerifications,
			approvedVerifications,
			rejectedVerifications,
			pendingReports,
			totalReports,
			recentUsers
		});
	} catch (err) {
		console.error("getAdminStats error:", err);
		res.status(500).json({ error: "Failed to fetch admin statistics" });
	}
};

// ✅ --- Get Dashboard Statistics ---
export const getDashboardStats = async (req, res) => {
	try {
		const totalUsers = await User.countDocuments();
		const verifiedUsers = await User.countDocuments({ isVerified: true });
		const onlineUsers = await User.countDocuments({ isOnline: true });
		const suspendedUsers = await User.countDocuments({ isSuspended: true });
		const blockedUsers = await User.countDocuments({ isBlocked: true });
		
		const pendingVerifications = await User.countDocuments({
			"verificationRequest.status": "pending"
		});
		
		const pendingReports = await Report.countDocuments({ status: "pending" });
		
		// Users registered in last 7 days
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
		const newUsersThisWeek = await User.countDocuments({
			createdAt: { $gte: sevenDaysAgo }
		});
		
		// Users registered in last 30 days
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		const newUsersThisMonth = await User.countDocuments({
			createdAt: { $gte: thirtyDaysAgo }
		});

		res.status(200).json({
			totalUsers,
			verifiedUsers,
			onlineUsers,
			suspendedUsers,
			blockedUsers,
			pendingVerifications,
			pendingReports,
			newUsersThisWeek,
			newUsersThisMonth,
		});
	} catch (err) {
		console.error("getDashboardStats error:", err);
		res.status(500).json({ error: "Failed to fetch dashboard statistics" });
	}
};