import prisma from "../lib/db.js";
import { emitToUser } from "../lib/socketHandlers.js";
import {
  sendVerificationApprovedEmail,
  sendVerificationRejectedEmail,
  sendReportStatusEmail,
  sendAccountSuspendedEmail
} from "../lib/email.js";

// --- Stats ---
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isOnline: true } });
    const totalMessages = await prisma.message.count();
    const pendingReports = await prisma.report.count({ where: { status: "pending" } });

    // New users today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const newUsersToday = await prisma.user.count({ where: { createdAt: { gte: startOfDay } } });

    res.status(200).json({
      totalUsers,
      activeUsers,
      totalMessages,
      pendingReports,
      newUsersToday
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getSystemStats = async (req, res) => {
  // Placeholder for system stats (CPU, Memory, etc.) - could delegate to health controller logic or return basic DB info
  try {
    const userCount = await prisma.user.count();
    const messageCount = await prisma.message.count();
    res.status(200).json({
      database: { users: userCount, messages: messageCount },
      uptime: process.uptime()
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch system stats" });
  }
};

export const getGameStats = async (req, res) => {
  // Placeholder
  res.status(200).json({ activeGames: 0, totalGamesPlayed: 0 });
};

// --- User Management ---
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, fullName: true, email: true, username: true, profilePic: true,
        isOnline: true, isVerified: true, role: true, status: true, createdAt: true,
        reportsReceived: { select: { id: true } }
      },
    });

    // Sync with socket map if possible
    let onlineUserIds = [];
    try {
      const { userSocketMap } = await import("../lib/socketHandlers.js");
      onlineUserIds = Object.keys(userSocketMap);
    } catch (e) { }

    const formattedUsers = users.map((user) => ({
      ...user,
      isOnline: onlineUserIds.includes(String(user.id)) || user.isOnline,
      reportCount: user.reportsReceived.length,
    }));
    res.status(200).json(formattedUsers);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateUserStatus = async (userId, status, banReason = null) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status, banReason: status === 'active' ? null : banReason },
  });
  // Notify via email
  if (status !== 'active') {
    const action = status === 'banned' ? 'Playing Account Banned' : 'Account Suspended';
    sendAccountSuspendedEmail(updatedUser.email, updatedUser.fullName, action, banReason);
  }
  // Force disconnect
  try {
    const { getReceiverSocketId, getIO } = await import("../lib/socketHandlers.js");
    const socketId = getReceiverSocketId(userId);
    const io = getIO();
    if (socketId && io) {
      io.to(socketId).emit("forceLogout", { reason: `Your account has been ${status}.` });
      io.sockets.sockets.get(socketId)?.disconnect(true);
    }
  } catch (e) { }
  return updatedUser;
};

export const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    await updateUserStatus(userId, 'suspended', reason);
    res.status(200).json({ message: "User suspended" });
  } catch (err) { res.status(500).json({ error: "Failed to suspend user" }); }
};

export const unsuspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await updateUserStatus(userId, 'active');
    res.status(200).json({ message: "User unsuspended" });
  } catch (err) { res.status(500).json({ error: "Failed to unsuspend user" }); }
};

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    await updateUserStatus(userId, 'banned', reason);
    res.status(200).json({ message: "User blocked" });
  } catch (err) { res.status(500).json({ error: "Failed to block user" }); }
};

export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await updateUserStatus(userId, 'active');
    res.status(200).json({ message: "User unblocked" });
  } catch (err) { res.status(500).json({ error: "Failed to unblock user" }); }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await prisma.user.delete({ where: { id: userId } });
    res.status(200).json({ message: "User deleted" });
  } catch (err) { res.status(500).json({ error: "Failed to delete user" }); }
};

export const toggleVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const newStatus = !user.isVerified;
    await prisma.user.update({ where: { id: userId }, data: { isVerified: newStatus } });
    res.status(200).json({ message: `User verification ${newStatus ? 'enabled' : 'disabled'}` });
  } catch (err) { res.status(500).json({ error: "Failed to toggle verification" }); }
};

// --- Verification Requests ---
export const getVerificationRequests = async (req, res) => {
  try {
    const requests = await prisma.verificationRequest.findMany({
      where: { status: 'pending' },
      include: { user: { select: { id: true, fullName: true, username: true, email: true, profilePic: true } } }
    });
    res.status(200).json(requests);
  } catch (error) { res.status(500).json({ message: "Error fetching requests" }); }
};

export const approveVerification = async (req, res) => {
  const { id } = req.params; // Expects userId based on route usage in corrupted file, but typically route uses request ID? 
  // Route is /approve/:userId in admin.route.js. So id is userId.
  try {
    // Find request for this user
    const request = await prisma.verificationRequest.findFirst({ where: { userId: id, status: 'pending' } });
    if (!request) return res.status(404).json({ message: "Request not found" });

    await prisma.$transaction([
      prisma.verificationRequest.update({ where: { id: request.id }, data: { status: 'approved' } }),
      prisma.user.update({ where: { id }, data: { isVerified: true } })
    ]);
    const user = await prisma.user.findUnique({ where: { id } });
    sendVerificationApprovedEmail(user.email, user.fullName);
    res.status(200).json({ message: "Verification approved" });
  } catch (error) { res.status(500).json({ message: "Error approving" }); }
};

export const rejectVerification = async (req, res) => {
  const { id } = req.params; // userId
  const { reason } = req.body;
  try {
    const request = await prisma.verificationRequest.findFirst({ where: { userId: id, status: 'pending' } });
    if (!request) return res.status(404).json({ message: "Request not found" });

    await prisma.verificationRequest.update({
      where: { id: request.id },
      data: { status: 'rejected', rejectionReason: reason }
    });
    const user = await prisma.user.findUnique({ where: { id } });
    sendVerificationRejectedEmail(user.email, user.fullName, reason);
    res.status(200).json({ message: "Verification rejected" });
  } catch (error) { res.status(500).json({ message: "Error rejecting" }); }
};

// --- Reports ---
export const getReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, username: true, email: true } },
        reportedUser: { select: { id: true, username: true, email: true, profilePic: true, status: true } }
      }
    });
    res.status(200).json(reports);
  } catch (error) { res.status(500).json({ message: "Error fetching reports" }); }
};

export const getAIReports = async (req, res) => {
  // Placeholder - filter by source='AI' if schema supports it, or just return all for now
  res.status(200).json([]);
};

export const updateReportStatus = async (req, res) => {
  const { reportId } = req.params;
  const { status, actionTaken } = req.body;
  try {
    const report = await prisma.report.update({
      where: { id: reportId },
      data: { status, actionTaken }
    });
    res.status(200).json(report);
  } catch (error) { res.status(500).json({ message: "Error updating report" }); }
};

export const deleteReport = async (req, res) => {
  const { reportId } = req.params;
  try {
    await prisma.report.delete({ where: { id: reportId } });
    res.status(200).json({ message: "Report deleted" });
  } catch (err) { res.status(500).json({ error: "Failed to delete report" }); }
};

// --- Notifications ---
export const sendPersonalNotification = async (req, res) => {
  const { userId } = req.params;
  const { message, type } = req.body;
  try {
    const notification = await prisma.notification.create({
      data: { userId, message, type: type || 'admin_message' }
    });
    emitToUser(userId, "notification", notification);
    res.status(200).json(notification);
  } catch (err) { res.status(500).json({ error: 'Failed to send notification' }); }
};

export const sendBroadcastNotification = async (req, res) => {
  const { message, type } = req.body;
  try {
    // Inefficient for massive user base, but functional for now
    const users = await prisma.user.findMany({ select: { id: true } });
    // Create notifications? Or just emit? Ideally create DB records.
    // Batch create might fail if too large. For now just emit.
    // Use a system notification mechanism ideally.
    const { getIO } = await import("../lib/socketHandlers.js");
    getIO().emit("broadcast_notification", { message, type });
    res.status(200).json({ message: "Broadcast sent" });
  } catch (err) { res.status(500).json({ error: 'Failed to broadcast' }); }
};

export const getUserNotifications = async (req, res) => {
  const userId = req.user?.id ? req.user.id : req.query.userId;
  if (!userId) return res.status(400).json({ error: "User ID required" });
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(notifications);
  } catch (err) { res.status(500).json({ error: "Failed to fetch notifications" }); }
};

export const markNotificationRead = async (req, res) => {
  const { notificationId } = req.params;
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
    res.status(200).json({ message: "Marked as read" });
  } catch (err) { res.status(500).json({ error: "Failed to update notification" }); }
};

export const deleteNotification = async (req, res) => {
  const { notificationId } = req.params; // This matches route definition :notificationId
  try {
    await prisma.notification.delete({ where: { id: notificationId } });
    res.status(200).json({ message: "Notification deleted" });
  } catch (err) { res.status(500).json({ error: "Failed to delete notification" }); }
};

// --- Manual Reports ---
export const submitManualReport = async (req, res) => {
  // Admin submitting a report manually?
  res.status(200).json({ message: "Not implemented" });
};

export const getManualReports = async (req, res) => {
  res.status(200).json([]);
};
