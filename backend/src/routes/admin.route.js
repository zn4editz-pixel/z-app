import express from "express";
import {
	getAllUsers,
	suspendUser,
	unsuspendUser,
	blockUser,
	unblockUser,
	deleteUser,
	toggleVerification,
	getReports,
	getAIReports,
	updateReportStatus,
	deleteReport,
	getVerificationRequests,
	approveVerification,
	rejectVerification,
	getAdminStats,
	sendPersonalNotification,
	sendBroadcastNotification,
	getUserNotifications,
	markNotificationRead,
	deleteNotification,
	submitManualReport,
	getManualReports
} from "../controllers/admin.controller.js";

import {
	getServerMetrics,
	getMetricsHistory,
	clearMetricsHistory
} from "../controllers/serverMetrics.controller.js";

import {
	getAIAnalysis,
	getAnalysisHistory,
	triggerAnalysis
} from "../controllers/aiAnalysis.controller.js";

// Make sure these middleware paths are correct
import { protectRoute } from "../middleware/protectRoute.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

// 🛡️ Protect all routes and require admin
router.use(protectRoute, isAdmin);

// --- Dashboard Statistics ---
router.get("/stats", getAdminStats);

// --- User Management ---
router.get("/users", getAllUsers);
router.put("/suspend/:userId", suspendUser);
router.put("/unsuspend/:userId", unsuspendUser);
router.put("/block/:userId", blockUser);
router.put("/unblock/:userId", unblockUser);
router.delete("/delete/:userId", deleteUser);
router.put("/verify/:userId", toggleVerification);

// --- Moderation ---
router.get("/reports", getReports);
router.get("/reports/ai", getAIReports);
router.put("/reports/:reportId/status", updateReportStatus);
router.delete("/reports/:reportId", deleteReport);

// --- Verification Management ---
router.get("/verification-requests", getVerificationRequests);
router.put("/verification/approve/:userId", approveVerification);
router.put("/verification/reject/:userId", rejectVerification);

// --- Admin Notifications ---
router.post("/notifications/personal/:userId", sendPersonalNotification);
router.post("/notifications/broadcast", sendBroadcastNotification);

// --- Server Intelligence Center ---
router.get("/server-metrics", getServerMetrics);
router.get("/metrics-history", getMetricsHistory);
router.delete("/metrics-history", clearMetricsHistory);

// --- Manual Reports ---
router.post("/manual-report", submitManualReport);
router.get("/manual-reports", getManualReports);

// --- AI Analysis Agent ---
router.get("/ai-analysis", getAIAnalysis);
router.get("/ai-analysis/history", getAnalysisHistory);
router.post("/ai-analysis/trigger", triggerAnalysis);

export default router;