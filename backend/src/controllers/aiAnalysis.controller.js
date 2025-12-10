import prisma from "../lib/prisma.js";
import os from "os";

// Store previous metrics for comparison
let previousMetrics = null;
let analysisHistory = [];

export const getAIAnalysis = async (req, res) => {
	try {
		const currentMetrics = await collectMetrics();
		const analysis = await analyzeMetrics(currentMetrics, previousMetrics);
		
		previousMetrics = currentMetrics;
		
		// Store in history
		analysisHistory.push({
			timestamp: new Date().toISOString(),
			...analysis
		});
		if (analysisHistory.length > 100) {
			analysisHistory.shift();
		}
		
		res.status(200).json(analysis);
	} catch (err) {
		console.error("AI Analysis error:", err);
		res.status(500).json({ error: "Failed to perform AI analysis" });
	}
};

async function collectMetrics() {
	const { userSocketMap } = await import("../lib/socket.js");
	
	const [
		totalUsers,
		onlineUsers,
		totalMessages,
		recentMessages,
		totalReports,
		pendingReports,
		suspendedUsers
	] = await Promise.all([
		prisma.user.count(),
		Promise.resolve(Object.keys(userSocketMap).length),
		prisma.message.count(),
		prisma.message.count({
			where: {
				createdAt: {
					gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
				}
			}
		}),
		prisma.report.count(),
		prisma.report.count({ where: { status: 'pending' } }),
		prisma.user.count({ where: { isSuspended: true } })
	]);
	
	const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
	const cpuUsage = os.loadavg()[0]; // 1-minute load average
	
	return {
		totalUsers,
		onlineUsers,
		totalMessages,
		recentMessages,
		totalReports,
		pendingReports,
		suspendedUsers,
		memoryUsage,
		cpuUsage,
		timestamp: Date.now()
	};
}

async function analyzeMetrics(current, previous) {
	const positiveInsights = [];
	const issues = [];
	let score = 100;
	
	// Compare with previous if available
	if (previous) {
		// User growth
		if (current.totalUsers > previous.totalUsers) {
			positiveInsights.push({
				title: "User Growth Detected",
				description: `${current.totalUsers - previous.totalUsers} new users joined recently`,
				metric: `+${current.totalUsers - previous.totalUsers} users`,
				impact: "positive"
			});
		}
		
		// Activity increase
		if (current.recentMessages > previous.recentMessages * 1.2) {
			positiveInsights.push({
				title: "Increased User Activity",
				description: "Message activity is up by 20% in the last hour",
				metric: `${current.recentMessages} messages/hour`,
				impact: "positive"
			});
		}
		
		// Online users increase
		if (current.onlineUsers > previous.onlineUsers) {
			positiveInsights.push({
				title: "More Users Online",
				description: `${current.onlineUsers - previous.onlineUsers} more users came online`,
				metric: `${current.onlineUsers} online now`,
				impact: "positive"
			});
		}
		
		// Memory decrease
		if (current.memoryUsage < previous.memoryUsage * 0.9) {
			positiveInsights.push({
				title: "Memory Optimization",
				description: "Memory usage decreased by 10%",
				metric: `${current.memoryUsage.toFixed(2)} MB`,
				impact: "positive"
			});
		}
		
		// Reports decrease
		if (current.pendingReports < previous.pendingReports) {
			positiveInsights.push({
				title: "Reports Being Handled",
				description: `${previous.pendingReports - current.pendingReports} reports resolved`,
				metric: `${current.pendingReports} pending`,
				impact: "positive"
			});
		}
	}
	
	// Check for issues
	
	// High memory usage
	if (current.memoryUsage > 500) {
		issues.push({
			title: "High Memory Usage",
			description: `Backend is using ${current.memoryUsage.toFixed(2)} MB of memory`,
			metric: `${current.memoryUsage.toFixed(2)} MB`,
			severity: "high"
		});
		score -= 15;
	}
	
	// Too many pending reports
	if (current.pendingReports > 10) {
		issues.push({
			title: "Many Pending Reports",
			description: `${current.pendingReports} reports need admin attention`,
			metric: `${current.pendingReports} pending`,
			severity: "medium"
		});
		score -= 10;
	}
	
	// Low online users (if total users > 10)
	if (current.totalUsers > 10 && current.onlineUsers < current.totalUsers * 0.05) {
		issues.push({
			title: "Low User Engagement",
			description: "Less than 5% of users are currently online",
			metric: `${((current.onlineUsers / current.totalUsers) * 100).toFixed(1)}% online`,
			severity: "low"
		});
		score -= 5;
	}
	
	// Suspended users
	if (current.suspendedUsers > 0) {
		issues.push({
			title: "Suspended Users",
			description: `${current.suspendedUsers} users are currently suspended`,
			metric: `${current.suspendedUsers} suspended`,
			severity: "info"
		});
	}
	
	// Generate AI report
	const report = {
		type: issues.length > 0 ? "⚠️ Issues Detected" : "✅ All Clear",
		message: generateReportMessage(positiveInsights, issues, current),
		timestamp: new Date().toLocaleTimeString(),
		score
	};
	
	return {
		positiveInsights,
		issues,
		score: Math.max(0, Math.min(100, score)),
		report,
		metrics: current
	};
}

function generateReportMessage(positives, issues, metrics) {
	if (issues.length === 0 && positives.length > 0) {
		return `System is performing excellently! ${positives.length} positive trends detected. ${metrics.onlineUsers} users online.`;
	} else if (issues.length > 0 && positives.length > 0) {
		return `Mixed status: ${positives.length} improvements, ${issues.length} issues need attention.`;
	} else if (issues.length > 0) {
		return `${issues.length} issues detected. Immediate attention recommended.`;
	} else {
		return `System stable. ${metrics.onlineUsers} users online, ${metrics.recentMessages} messages in last hour.`;
	}
}

export const getAnalysisHistory = async (req, res) => {
	try {
		res.status(200).json(analysisHistory.slice(-50));
	} catch (err) {
		res.status(500).json({ error: "Failed to fetch analysis history" });
	}
};

export const triggerAnalysis = async (req, res) => {
	try {
		// Force a new analysis
		const currentMetrics = await collectMetrics();
		const analysis = await analyzeMetrics(currentMetrics, previousMetrics);
		
		previousMetrics = currentMetrics;
		
		// Store in history
		analysisHistory.push({
			timestamp: new Date().toISOString(),
			...analysis
		});
		if (analysisHistory.length > 100) {
			analysisHistory.shift();
		}
		
		res.status(200).json({ 
			message: "Analysis triggered successfully",
			analysis 
		});
	} catch (err) {
		console.error("Trigger analysis error:", err);
		res.status(500).json({ error: "Failed to trigger analysis" });
	}
};
