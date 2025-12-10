import { useEffect, useState, useRef } from "react";
import { 
	Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
	Zap, Users, Database, Activity, Eye, Sparkles, X, Info
} from "lucide-react";
import { axiosInstance } from "../../lib/axios";

const AIAnalysisAgent = () => {
	const [analysis, setAnalysis] = useState(null);
	const [reports, setReports] = useState([]);
	const [isAnalyzing, setIsAnalyzing] = useState(true);
	const [selectedIssue, setSelectedIssue] = useState(null);
	const [seenIssues, setSeenIssues] = useState(new Set());
	const intervalRef = useRef(null);

	useEffect(() => {
		fetchAnalysis();
		// Reduced to 30 seconds for better performance
		intervalRef.current = setInterval(fetchAnalysis, 30000);
		return () => clearInterval(intervalRef.current);
	}, []);

	const fetchAnalysis = async () => {
		setIsAnalyzing(true);
		try {
			const res = await axiosInstance.get("/admin/ai-analysis");
			
			// Filter unique issues
			const uniquePositive = filterUniqueInsights(res.data.positiveInsights || [], seenIssues);
			const uniqueIssues = filterUniqueInsights(res.data.issues || [], seenIssues);
			
			setAnalysis({
				...res.data,
				positiveInsights: uniquePositive,
				issues: uniqueIssues
			});
			
			// Add new report to history
			if (res.data.report) {
				setReports(prev => {
					const isDuplicate = prev.some(r => r.message === res.data.report.message);
					if (!isDuplicate) {
						return [res.data.report, ...prev].slice(0, 10);
					}
					return prev;
				});
			}
		} catch (err) {
			console.error("AI Analysis error:", err);
		} finally {
			// Faster animation end
			setTimeout(() => setIsAnalyzing(false), 500);
		}
	};

	const filterUniqueInsights = (insights, seen) => {
		const unique = [];
		insights.forEach(insight => {
			const key = `${insight.title}-${insight.description}`;
			if (!seen.has(key)) {
				seen.add(key);
				unique.push(insight);
			}
		});
		return unique;
	};

	return (
		<div className="space-y-6">
			{/* Issue Detail Modal */}
			{selectedIssue && (
				<IssueDetailModal 
					issue={selectedIssue} 
					onClose={() => setSelectedIssue(null)} 
				/>
			)}

			{/* AI Agent Header */}
			<div className="relative bg-gradient-to-br from-black via-yellow-900/30 to-black p-8 rounded-3xl border-2 border-yellow-500/50 shadow-2xl overflow-hidden">
				{/* Lightweight Animated Background */}
				<div className="absolute inset-0 pointer-events-none overflow-hidden">
					{/* Simple gradient shimmer */}
					<div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent" 
						style={{ animation: 'shimmer 3s ease-in-out infinite' }} />
					
					{/* Minimal glowing orbs (only 2) */}
					<div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl" 
						style={{ animation: 'pulse 4s ease-in-out infinite' }} />
					<div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-600/10 rounded-full blur-3xl" 
						style={{ animation: 'pulse 4s ease-in-out infinite', animationDelay: '2s' }} />
					
					{/* Single scanning line */}
					{isAnalyzing && (
						<div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"
							style={{ animation: 'scan 2s ease-in-out infinite' }} />
					)}
				</div>

				<div className="relative z-10 flex items-center gap-6">
					{/* AI Brain Animation */}
					<div className="relative">
						<div className="w-24 h-24 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center relative overflow-hidden">
							<Brain className="w-12 h-12 text-black animate-pulse" />
							{/* Scanning effect */}
							<div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-transparent animate-scan-progress" />
							{/* Radar rings */}
							<div className="absolute inset-0 border-2 border-yellow-300/50 rounded-2xl animate-radar-ping" />
							<div className="absolute inset-0 border-2 border-yellow-300/30 rounded-2xl animate-radar-ping" style={{ animationDelay: '0.5s' }} />
						</div>
						{/* Status indicator */}
						<div className="absolute -bottom-2 -right-2 px-3 py-1 bg-green-500 rounded-full border-2 border-black flex items-center gap-1">
							<span className="w-2 h-2 bg-white rounded-full animate-pulse" />
							<span className="text-xs font-bold text-black">ACTIVE</span>
						</div>
					</div>

					{/* AI Info */}
					<div className="flex-1">
						<h2 className="text-4xl font-bold text-yellow-500 mb-2 flex items-center gap-3">
							<Sparkles className="w-8 h-8 animate-pulse" />
							AI Analysis Agent
						</h2>
						<p className="text-yellow-200/80 text-lg mb-3">
							24/7 Intelligent System Monitoring & Performance Analysis
						</p>
						<div className="flex items-center gap-4 text-sm">
							<div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 rounded-full border border-yellow-500/30">
								<Eye className="w-4 h-4 text-yellow-400" />
								<span className="text-yellow-300">
									{isAnalyzing ? "Analyzing..." : "Monitoring"}
								</span>
							</div>
							<div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
								<Activity className="w-4 h-4 text-green-400 animate-pulse" />
								<span className="text-green-300">Real-Time</span>
							</div>
							<div className="text-yellow-400/70">
								Last scan: {new Date().toLocaleTimeString()}
							</div>
						</div>
					</div>

					{/* Analysis Stats */}
					<div className="grid grid-cols-2 gap-4">
						<div className="text-center p-4 bg-black/50 rounded-xl border border-yellow-500/30">
							<div className="text-3xl font-bold text-yellow-500">{reports.length}</div>
							<div className="text-xs text-yellow-300/70">Reports</div>
						</div>
						<div className="text-center p-4 bg-black/50 rounded-xl border border-yellow-500/30">
							<div className="text-3xl font-bold text-green-500">{analysis?.score || 0}%</div>
							<div className="text-xs text-yellow-300/70">Health</div>
						</div>
					</div>
				</div>
			</div>

			{/* Live Analysis Display */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Positive Insights */}
				<div className="bg-gradient-to-br from-green-950/50 to-black p-6 rounded-2xl border-2 border-green-500/30 relative overflow-hidden">
					<div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent animate-shimmer pointer-events-none" />
					<div className="relative z-10">
						<div className="flex items-center gap-3 mb-4">
							<TrendingUp className="w-6 h-6 text-green-500" />
							<h3 className="text-xl font-bold text-green-400">Positive Insights</h3>
						</div>
						<div className="space-y-3">
							{analysis?.positiveInsights?.map((insight, idx) => (
								<InsightCard 
									key={idx} 
									insight={insight} 
									type="positive" 
									index={idx}
									onClick={() => setSelectedIssue({ ...insight, type: 'positive' })}
								/>
							)) || <EmptyState type="positive" />}
						</div>
					</div>
				</div>

				{/* Issues & Warnings */}
				<div className="bg-gradient-to-br from-red-950/50 to-black p-6 rounded-2xl border-2 border-red-500/30 relative overflow-hidden">
					<div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent animate-shimmer pointer-events-none" />
					<div className="relative z-10">
						<div className="flex items-center gap-3 mb-4">
							<AlertTriangle className="w-6 h-6 text-red-500" />
							<h3 className="text-xl font-bold text-red-400">Issues & Warnings</h3>
						</div>
						<div className="space-y-3">
							{analysis?.issues?.map((issue, idx) => (
								<InsightCard 
									key={idx} 
									insight={issue} 
									type="negative" 
									index={idx}
									onClick={() => setSelectedIssue({ ...issue, type: 'negative' })}
								/>
							)) || <EmptyState type="negative" />}
						</div>
					</div>
				</div>
			</div>

			{/* Analysis Timeline */}
			<div className="bg-gradient-to-br from-black via-yellow-900/20 to-black p-6 rounded-2xl border-2 border-yellow-500/30">
				<div className="flex items-center gap-3 mb-6">
					<Activity className="w-6 h-6 text-yellow-500" />
					<h3 className="text-xl font-bold text-yellow-400">Analysis Timeline</h3>
					<div className="flex-1 h-px bg-gradient-to-r from-yellow-500/50 to-transparent" />
				</div>
				<div className="space-y-4">
					{reports.map((report, idx) => (
						<TimelineReport key={idx} report={report} index={idx} />
					))}
				</div>
			</div>
		</div>
	);
};

const InsightCard = ({ insight, type, index, onClick }) => {
	const colors = {
		positive: {
			bg: "bg-green-500/10",
			border: "border-green-500/30",
			text: "text-green-400",
			icon: "text-green-500",
			hover: "hover:bg-green-500/20 hover:border-green-500/50"
		},
		negative: {
			bg: "bg-red-500/10",
			border: "border-red-500/30",
			text: "text-red-400",
			icon: "text-red-500",
			hover: "hover:bg-red-500/20 hover:border-red-500/50"
		}
	};

	const color = colors[type];

	return (
		<div 
			onClick={onClick}
			className={`p-4 rounded-xl border ${color.bg} ${color.border} ${color.hover} transform transition-all hover:scale-105 animate-slide-in cursor-pointer group relative overflow-hidden`}
			style={{ animationDelay: `${index * 0.1}s` }}
		>
			{/* Hover effect */}
			<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
			
			<div className="flex items-start gap-3 relative z-10">
				{type === 'positive' ? (
					<CheckCircle className={`w-5 h-5 ${color.icon} flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform`} />
				) : (
					<AlertTriangle className={`w-5 h-5 ${color.icon} flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform animate-pulse`} />
				)}
				<div className="flex-1">
					<h4 className={`font-semibold ${color.text} mb-1 group-hover:text-white transition-colors`}>
						{insight.title}
					</h4>
					<p className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
						{insight.description}
					</p>
					{insight.metric && (
						<div className="mt-2 flex items-center gap-2">
							<span className="text-xs px-2 py-1 bg-black/50 rounded-full border border-yellow-500/30 text-yellow-400">
								{insight.metric}
							</span>
						</div>
					)}
				</div>
				<Info className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors flex-shrink-0" />
			</div>
		</div>
	);
};

const IssueDetailModal = ({ issue, onClose }) => {
	const colors = {
		positive: {
			bg: "from-green-950/90 to-black/90",
			border: "border-green-500/50",
			text: "text-green-400",
			icon: "text-green-500"
		},
		negative: {
			bg: "from-red-950/90 to-black/90",
			border: "border-red-500/50",
			text: "text-red-400",
			icon: "text-red-500"
		}
	};

	const color = colors[issue.type];

	const getSeverity = (issue) => {
		if (issue.title.includes("High Memory") || issue.title.includes("Critical")) return "🔴 Critical";
		if (issue.title.includes("Many") || issue.title.includes("Warning")) return "🟠 High";
		if (issue.title.includes("Low") || issue.title.includes("Moderate")) return "🟡 Medium";
		return issue.type === 'positive' ? "✅ Informational" : "⚠️ Requires Attention";
	};

	const getImpact = (issue) => {
		if (issue.type === 'positive') return "Positive - System performing well";
		if (issue.title.includes("Memory")) return "High - May affect performance";
		if (issue.title.includes("Reports")) return "Medium - Requires admin action";
		if (issue.title.includes("Users")) return "Low - Informational";
		return "Medium - Monitor closely";
	};

	const getSolutions = (issue) => {
		// AI-Generated detailed solutions based on issue type
		
		// High Memory Usage
		if (issue.title.includes("High Memory") || issue.title.includes("Memory")) {
			return {
				aiAnalysis: "The system is experiencing elevated memory consumption. This typically occurs due to memory leaks, inefficient caching, or high concurrent user load. Immediate action is recommended to prevent service degradation.",
				rootCause: [
					"Memory leaks in Node.js event listeners",
					"Unoptimized database query results being cached",
					"Large file uploads not being properly garbage collected",
					"WebSocket connections not being cleaned up",
					"Redis cache growing without TTL limits"
				],
				steps: [
					"Immediately restart the backend server to free memory: pm2 restart backend",
					"Check memory usage trends: pm2 monit",
					"Identify memory-intensive processes: node --inspect and use Chrome DevTools",
					"Review recent code changes for potential memory leaks",
					"Implement memory profiling: npm install -g clinic && clinic doctor -- node server.js",
					"Add memory limits to PM2: pm2 start server.js --max-memory-restart 500M",
					"Clear Redis cache if applicable: redis-cli FLUSHDB"
				],
				command: "pm2 restart backend && pm2 logs --lines 100",
				technicalDetails: {
					threshold: "Memory usage > 500MB",
					currentImpact: "High - May cause slow responses or crashes",
					estimatedTime: "15-30 minutes to resolve",
					complexity: "Medium"
				},
				prevention: [
					"Set up automated memory monitoring with alerts at 400MB",
					"Implement proper garbage collection: node --max-old-space-size=512",
					"Use WeakMap for caching to allow garbage collection",
					"Add connection pooling limits: max 20 connections",
					"Schedule automatic server restarts during low-traffic: 3 AM daily",
					"Implement memory leak detection in CI/CD pipeline"
				],
				resources: [
					"Node.js Memory Management: https://nodejs.org/en/docs/guides/simple-profiling/",
					"PM2 Memory Monitoring: https://pm2.keymetrics.io/docs/usage/monitoring/",
					"Memory Leak Detection: https://github.com/node-inspector/node-inspector"
				]
			};
		}

		// Many Pending Reports
		if (issue.title.includes("Pending Reports") || issue.title.includes("Many") || issue.title.includes("Reports")) {
			return {
				aiAnalysis: "A backlog of user reports has accumulated, indicating either increased user activity or insufficient moderation resources. Timely report processing is crucial for maintaining platform safety and user trust.",
				rootCause: [
					"Insufficient moderator availability",
					"Increased user reporting activity",
					"No automated report triage system",
					"Reports not being prioritized by severity",
					"Lack of notification system for new reports"
				],
				steps: [
					"Navigate to Admin Dashboard → Reports Management tab",
					"Sort reports by date and severity (critical first)",
					"Process high-priority reports immediately (threats, harassment)",
					"Batch-process similar reports together for efficiency",
					"Assign reports to available moderators if team exists",
					"Set up email notifications for new critical reports",
					"Consider implementing AI-assisted report categorization"
				],
				command: "Navigate to: /admin → Reports tab",
				technicalDetails: {
					threshold: "Pending reports > 10",
					currentImpact: "Medium - User safety concerns",
					estimatedTime: "1-2 hours for initial triage",
					complexity: "Low"
				},
				prevention: [
					"Enable real-time email notifications for new reports",
					"Set up daily report review schedule (9 AM, 5 PM)",
					"Implement automated report categorization by keywords",
					"Train additional moderators or hire moderation team",
					"Add report aging alerts (reports > 48 hours old)",
					"Create report processing SOP document",
					"Implement AI-powered spam report filtering"
				],
				resources: [
					"Content Moderation Best Practices",
					"Report Management Workflow Guide",
					"AI Moderation Tools Integration"
				]
			};
		}

		// Low Activity
		if (issue.title.includes("Low Activity") || issue.title.includes("Inactive") || issue.title.includes("Activity")) {
			return {
				aiAnalysis: "User engagement has decreased below normal levels. This could indicate technical issues, poor user experience, or external factors affecting user behavior. Investigation is needed to identify the root cause.",
				rootCause: [
					"Recent system outages or performance issues",
					"Broken notification system",
					"Poor user experience or bugs",
					"Seasonal user behavior changes",
					"Increased competition from other platforms"
				],
				steps: [
					"Check system uptime and recent outages: pm2 logs",
					"Verify notification system is working: test email/push notifications",
					"Review user feedback and support tickets for complaints",
					"Analyze user retention metrics and churn rate",
					"Check for recent code deployments that may have introduced bugs",
					"Send re-engagement email campaign to inactive users",
					"Consider running a user survey to gather feedback"
				],
				command: "tail -f backend/logs/app.log | grep ERROR",
				technicalDetails: {
					threshold: "Activity < 50% of normal",
					currentImpact: "Low - Informational",
					estimatedTime: "2-3 days for analysis",
					complexity: "High"
				},
				prevention: [
					"Implement comprehensive user engagement tracking",
					"Set up automated re-engagement email campaigns",
					"Monitor daily/weekly active user metrics",
					"Regular feature updates and improvements",
					"A/B test new features before full rollout",
					"Maintain active social media presence",
					"Implement user feedback collection system"
				],
				resources: [
					"User Engagement Metrics Guide",
					"Re-engagement Campaign Strategies",
					"User Retention Best Practices"
				]
			};
		}

		// Suspended Users
		if (issue.title.includes("Suspended") || issue.title.includes("Suspension")) {
			return {
				aiAnalysis: "Expired user suspensions have not been automatically cleared, preventing legitimate users from accessing the platform. This requires immediate database cleanup to restore user access.",
				rootCause: [
					"No automated suspension expiry check",
					"Database cleanup script not running",
					"Middleware not checking suspension status",
					"Cron job for suspension management disabled",
					"Manual suspension management process"
				],
				steps: [
					"Run database cleanup script immediately: cd backend && node src/scripts/cleanup-database.js",
					"Verify suspensions were cleared: check database",
					"Set up automated cron job for daily checks",
					"Add middleware to check suspension expiry on login",
					"Notify affected users that their suspension has ended",
					"Review suspension policies and durations",
					"Implement automated suspension expiry notifications"
				],
				command: "cd backend && node src/scripts/cleanup-database.js",
				technicalDetails: {
					threshold: "Expired suspensions > 0",
					currentImpact: "Medium - Affects user access",
					estimatedTime: "10-15 minutes",
					complexity: "Low"
				},
				prevention: [
					"Set up daily cron job: 0 2 * * * node cleanup-database.js",
					"Add suspension expiry check in authentication middleware",
					"Implement automated email notifications 24h before expiry",
					"Create admin dashboard alert for expired suspensions",
					"Add database trigger for automatic suspension cleanup",
					"Document suspension management procedures"
				],
				resources: [
					"Cron Job Setup Guide",
					"Database Cleanup Best Practices",
					"User Suspension Management"
				]
			};
		}

		// Default AI-generated solution
		return {
			aiAnalysis: "An issue has been detected that requires investigation. The AI system has identified an anomaly in system behavior that deviates from normal patterns. Further analysis is recommended to determine the root cause and appropriate resolution.",
			rootCause: [
				"Unexpected system behavior detected",
				"Deviation from normal operational patterns",
				"Potential configuration issue",
				"Recent changes may have introduced instability"
			],
			steps: [
				"Review system logs for error messages and warnings",
				"Check recent code deployments and configuration changes",
				"Monitor system metrics for additional anomalies",
				"Verify all services are running correctly",
				"Test critical user flows to identify issues",
				"Consult with development team if issue persists"
			],
			command: "tail -f backend/logs/error.log",
			technicalDetails: {
				threshold: "Anomaly detected",
				currentImpact: "Unknown - Requires investigation",
				estimatedTime: "30-60 minutes",
				complexity: "Medium"
			},
			prevention: [
				"Implement comprehensive system monitoring",
				"Set up automated alerting for anomalies",
				"Regular system health checks",
				"Maintain detailed change logs",
				"Implement rollback procedures",
				"Document troubleshooting procedures"
			],
			resources: [
				"System Monitoring Best Practices",
				"Troubleshooting Guide",
				"Incident Response Procedures"
			]
		};
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
			<div 
				className={`relative max-w-2xl w-full bg-gradient-to-br ${color.bg} border-2 ${color.border} rounded-2xl shadow-2xl overflow-hidden animate-scale-in`}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Animated background */}
				<div className="absolute inset-0 pointer-events-none">
					<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
				</div>

				{/* Close button */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
				>
					<X className="w-5 h-5 text-white" />
				</button>

				{/* Content */}
				<div className="relative z-10 p-8">
					<div className="flex items-start gap-4 mb-6">
						{issue.type === 'positive' ? (
							<div className="p-3 bg-green-500/20 rounded-xl">
								<CheckCircle className={`w-8 h-8 ${color.icon}`} />
							</div>
						) : (
							<div className="p-3 bg-red-500/20 rounded-xl">
								<AlertTriangle className={`w-8 h-8 ${color.icon} animate-pulse`} />
							</div>
						)}
						<div className="flex-1">
							<h3 className={`text-2xl font-bold ${color.text} mb-2`}>
								{issue.title}
							</h3>
							<p className="text-white/70">
								{issue.type === 'positive' ? 'Positive Insight' : 'Issue Detected'}
							</p>
						</div>
					</div>

					<div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
						{/* AI Analysis Section */}
						{issue.type === 'negative' && getSolutions(issue).aiAnalysis && (
							<div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
								<h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
									<Brain className="w-4 h-4" />
									AI Analysis
								</h4>
								<p className="text-sm text-white/90 leading-relaxed">
									{getSolutions(issue).aiAnalysis}
								</p>
							</div>
						)}

						{/* Description */}
						<div className="p-4 bg-black/30 rounded-xl border border-white/10">
							<h4 className="text-sm font-semibold text-white/60 mb-2">Description</h4>
							<p className="text-white/90">{issue.description}</p>
						</div>

						{/* Metric */}
						{issue.metric && (
							<div className="p-4 bg-black/30 rounded-xl border border-white/10">
								<h4 className="text-sm font-semibold text-white/60 mb-2">Current Metric</h4>
								<p className="text-yellow-400 font-mono text-lg">{issue.metric}</p>
							</div>
						)}

						{/* Technical Details */}
						{issue.type === 'negative' && getSolutions(issue).technicalDetails && (
							<div className="p-4 bg-black/30 rounded-xl border border-white/10">
								<h4 className="text-sm font-semibold text-white/60 mb-3">Technical Details</h4>
								<div className="grid grid-cols-2 gap-3 text-sm">
									<div>
										<span className="text-white/50">Threshold:</span>
										<p className="text-white/90 font-medium">{getSolutions(issue).technicalDetails.threshold}</p>
									</div>
									<div>
										<span className="text-white/50">Impact:</span>
										<p className="text-white/90 font-medium">{getSolutions(issue).technicalDetails.currentImpact}</p>
									</div>
									<div>
										<span className="text-white/50">Est. Time:</span>
										<p className="text-white/90 font-medium">{getSolutions(issue).technicalDetails.estimatedTime}</p>
									</div>
									<div>
										<span className="text-white/50">Complexity:</span>
										<p className="text-white/90 font-medium">{getSolutions(issue).technicalDetails.complexity}</p>
									</div>
								</div>
							</div>
						)}

						{/* Root Cause Analysis */}
						{issue.type === 'negative' && getSolutions(issue).rootCause && (
							<div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
								<h4 className="text-sm font-semibold text-purple-400 mb-2">Possible Root Causes</h4>
								<ul className="space-y-1 text-sm text-white/80">
									{getSolutions(issue).rootCause.map((cause, idx) => (
										<li key={idx} className="flex gap-2">
											<span className="text-purple-400">•</span>
											<span>{cause}</span>
										</li>
									))}
								</ul>
							</div>
						)}

						{/* Recommended Actions */}
						{issue.type === 'negative' && (
							<div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30">
								<h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
									<AlertTriangle className="w-4 h-4" />
									Step-by-Step Solution
								</h4>
								<ol className="space-y-2 text-sm text-white/90">
									{getSolutions(issue).steps.map((step, idx) => (
										<li key={idx} className="flex gap-3 p-2 bg-black/20 rounded">
											<span className="font-bold text-red-400 flex-shrink-0">{idx + 1}.</span>
											<span>{step}</span>
										</li>
									))}
								</ol>
							</div>
						)}

						{/* Quick Fix Command */}
						{issue.type === 'negative' && getSolutions(issue).command && (
							<div className="p-4 bg-black/50 rounded-xl border border-yellow-500/30">
								<h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
									<Zap className="w-4 h-4" />
									Quick Fix Command
								</h4>
								<code className="block p-3 bg-black/70 rounded text-green-400 font-mono text-sm break-all">
									{getSolutions(issue).command}
								</code>
								<p className="mt-2 text-xs text-white/60">
									💡 Copy and run this command in your terminal
								</p>
							</div>
						)}

						{/* Prevention Tips */}
						{issue.type === 'negative' && getSolutions(issue).prevention && (
							<div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/30">
								<h4 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
									<CheckCircle className="w-4 h-4" />
									Prevention & Best Practices
								</h4>
								<ul className="space-y-2 text-sm text-white/80">
									{getSolutions(issue).prevention.map((tip, idx) => (
										<li key={idx} className="flex gap-2">
											<span className="text-orange-400">✓</span>
											<span>{tip}</span>
										</li>
									))}
								</ul>
							</div>
						)}

						{/* Resources */}
						{issue.type === 'negative' && getSolutions(issue).resources && (
							<div className="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
								<h4 className="text-sm font-semibold text-cyan-400 mb-2">Additional Resources</h4>
								<ul className="space-y-1 text-sm text-white/80">
									{getSolutions(issue).resources.map((resource, idx) => (
										<li key={idx} className="flex gap-2">
											<span className="text-cyan-400">📚</span>
											<span>{resource}</span>
										</li>
									))}
								</ul>
							</div>
						)}

						{/* Positive Insight */}
						{issue.type === 'positive' && (
							<div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
								<h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
									<CheckCircle className="w-4 h-4" />
									Keep It Up!
								</h4>
								<p className="text-sm text-white/80 leading-relaxed">
									This positive trend indicates healthy system performance. Continue monitoring to maintain this level. Consider documenting what's working well to replicate success in other areas.
								</p>
							</div>
						)}
					</div>

					<div className="mt-6 flex justify-end">
						<button
							onClick={onClose}
							className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors"
						>
							Close
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

const TimelineReport = ({ report, index }) => {
	return (
		<div 
			className="flex items-start gap-4 p-4 bg-black/30 rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 transition-all animate-slide-in"
			style={{ animationDelay: `${index * 0.05}s` }}
		>
			<div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 animate-pulse" />
			<div className="flex-1">
				<div className="flex items-center gap-2 mb-1">
					<span className="text-sm font-semibold text-yellow-400">{report.type}</span>
					<span className="text-xs text-yellow-600">•</span>
					<span className="text-xs text-yellow-600">{report.timestamp}</span>
				</div>
				<p className="text-sm text-white/80">{report.message}</p>
			</div>
		</div>
	);
};

const EmptyState = ({ type }) => {
	return (
		<div className="text-center py-8 text-white/50">
			<p className="text-sm">
				{type === 'positive' 
					? "AI is analyzing for positive trends..." 
					: "No issues detected. System running smoothly."}
			</p>
		</div>
	);
};

export default AIAnalysisAgent;
