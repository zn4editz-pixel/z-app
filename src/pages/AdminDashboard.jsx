import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import { 
	Users, AlertTriangle, Shield, TrendingUp,
	BadgeCheck, FileText, Activity, Brain
} from "lucide-react";
import "../styles/admin-custom.css";
import "../styles/admin-golden-animations.css";
import "../styles/admin-particles-animation.css";
import "../styles/admin-performance-optimized.css";
import "../styles/admin-smooth-gradients.css";
import "../styles/admin-enhanced-background.css";
import GoldenParticles from "../components/admin/GoldenParticles";

// Import tab components
import DashboardOverview from "../components/admin/DashboardOverview";
import UserManagement from "../components/admin/UserManagement";
import AIModerationPanel from "../components/admin/AIModerationPanel";
import ReportsManagement from "../components/admin/ReportsManagement";
import VerificationRequests from "../components/admin/VerificationRequests";
import NotificationsPanel from "../components/admin/NotificationsPanel";
import ServerIntelligenceCenter from "../components/admin/ServerIntelligenceCenter";
import AIAnalysisAgent from "../components/admin/AIAnalysisAgent";

const AdminDashboard = () => {
	const { socket } = useAuthStore();
	
	// Active Tab State
	const [activeTab, setActiveTab] = useState("dashboard");

	// Data States
	const [stats, setStats] = useState(null);
	const [users, setUsers] = useState([]);
	const [reports, setReports] = useState([]);
	const [aiReports, setAIReports] = useState([]);
	const [aiStats, setAIStats] = useState(null);
	const [verificationRequests, setVerificationRequests] = useState([]);

	// Loading States
	const [loadingStats, setLoadingStats] = useState(true);
	const [loadingUsers, setLoadingUsers] = useState(true);
	const [loadingReports, setLoadingReports] = useState(true);
	const [loadingAIReports, setLoadingAIReports] = useState(true);
	const [loadingVerifications, setLoadingVerifications] = useState(true);

	// Tab Configuration
	const tabs = [
		{ id: "dashboard", label: "Dashboard", icon: TrendingUp },
		{ id: "server-intelligence", label: "Server Intelligence", icon: Activity },
		{ id: "ai-analysis", label: "AI Analysis", icon: Brain },
		{ id: "users", label: "Users", icon: Users },
		{ id: "ai-moderation", label: "AI Moderation", icon: Shield },
		{ id: "reports", label: "Reports", icon: AlertTriangle },
		{ id: "verifications", label: "Verifications", icon: BadgeCheck },
		{ id: "notifications", label: "Notifications", icon: FileText },
	];



	// Fetch Data
	useEffect(() => {
		fetchStats();
		fetchUsers();
		fetchReports();
		fetchAIReports();
		fetchVerificationRequests();
	}, []);
	
	// Real-time socket listeners for online status updates
	useEffect(() => {
		if (!socket) return;
		
		const handleUserOnline = ({ userId }) => {
			console.log(`📡 Admin: User ${userId} is now online`);
			setUsers(prevUsers => 
				prevUsers.map(user => 
					user.id === userId ? { ...user, isOnline: true } : user
				)
			);
			// Update stats
			setStats(prevStats => prevStats ? {
				...prevStats,
				onlineUsers: prevStats.onlineUsers + 1
			} : null);
		};
		
		const handleUserOffline = ({ userId, lastSeen }) => {
			console.log(`📡 Admin: User ${userId} is now offline`);
			setUsers(prevUsers => 
				prevUsers.map(user => 
					user.id === userId ? { ...user, isOnline: false, lastSeen } : user
				)
			);
			// Update stats
			setStats(prevStats => prevStats ? {
				...prevStats,
				onlineUsers: Math.max(0, prevStats.onlineUsers - 1)
			} : null);
		};
		
		// Listen for global online users updates
		const handleOnlineUsers = (onlineUserIds) => {
			console.log(`📡 Admin: Online users updated - ${onlineUserIds.length} users online`);
			setUsers(prevUsers => 
				prevUsers.map(user => ({
					...user,
					isOnline: onlineUserIds.includes(user.id)
				}))
			);
			// Update stats with accurate count
			setStats(prevStats => prevStats ? {
				...prevStats,
				onlineUsers: onlineUserIds.length
			} : null);
		};
		
		socket.on("admin:userOnline", handleUserOnline);
		socket.on("admin:userOffline", handleUserOffline);
		socket.on("getOnlineUsers", handleOnlineUsers); // Sync with global online users
		
		return () => {
			socket.off("admin:userOnline", handleUserOnline);
			socket.off("admin:userOffline", handleUserOffline);
			socket.off("getOnlineUsers", handleOnlineUsers);
		};
	}, [socket]);
	
	// Periodic refresh to ensure accuracy (every 2 minutes to reduce disruption)
	useEffect(() => {
		const interval = setInterval(() => {
			// Only refresh if we're not already in an error state and user is on relevant tabs
			if ((activeTab === "users" || activeTab === "dashboard") && !loadingUsers) {
				fetchUsers(true); // Force refresh with cache bypass
			}
		}, 120000); // Every 2 minutes instead of 30 seconds
		
		return () => clearInterval(interval);
	}, [activeTab, loadingUsers]);

	const fetchStats = async () => {
		setLoadingStats(true);
		try {
			const res = await axiosInstance.get("/admin/stats");
			setStats(res.data);
		} catch (err) {
			console.error("Error fetching stats:", err.response?.data || err.message);
			if (err.response?.status === 403) {
				toast.error("Access denied. Admin privileges required.");
			} else {
				toast.error(err.response?.data?.error || "Failed to load statistics");
			}
		} finally {
			setLoadingStats(false);
		}
	};

	const fetchUsers = async (forceRefresh = false) => {
		setLoadingUsers(true);
		try {
			// Add timestamp to bypass cache if force refresh
			const url = forceRefresh ? `/admin/users?t=${Date.now()}` : "/admin/users";
			const res = await axiosInstance.get(url);
			const userData = Array.isArray(res.data) ? res.data : [];
			setUsers(userData);
			console.log(`Fetched ${userData.length} users${forceRefresh ? ' (force refresh)' : ''}`);
		} catch (err) {
			console.error("Error fetching users:", err.response?.data || err.message);
			if (err.response?.status === 403) {
				toast.error("Access denied. Admin privileges required.");
			} else if (err.response?.status === 500) {
				toast.error("Server error. Please try again later.");
			} else {
				toast.error(err.response?.data?.error || "Failed to load users");
			}
			setUsers([]);
		} finally {
			setLoadingUsers(false);
		}
	};

	const fetchReports = async () => {
		setLoadingReports(true);
		try {
			const res = await axiosInstance.get("/admin/reports");
			setReports(Array.isArray(res.data) ? res.data : []);
		} catch (err) {
			console.error("Error fetching reports:", err.response?.data || err.message);
			if (err.response?.status === 403) {
				toast.error("Access denied. Admin privileges required.");
			} else {
				toast.error(err.response?.data?.error || "Failed to load reports");
			}
			setReports([]);
		} finally {
			setLoadingReports(false);
		}
	};

	const fetchAIReports = async () => {
		setLoadingAIReports(true);
		try {
			const res = await axiosInstance.get("/admin/reports/ai");
			setAIReports(Array.isArray(res.data.reports) ? res.data.reports : []);
			setAIStats(res.data.stats || null);
		} catch (err) {
			console.error("Error fetching AI reports:", err.response?.data || err.message);
			if (err.response?.status === 403) {
				toast.error("Access denied. Admin privileges required.");
			} else {
				toast.error(err.response?.data?.error || "Failed to load AI moderation data");
			}
			setAIReports([]);
			setAIStats(null);
		} finally {
			setLoadingAIReports(false);
		}
	};

	const fetchVerificationRequests = async () => {
		setLoadingVerifications(true);
		try {
			const res = await axiosInstance.get("/admin/verification-requests");
			const data = Array.isArray(res.data) ? res.data : [];
			setVerificationRequests(data);
			console.log(`✅ Loaded ${data.length} verification requests`);
		} catch (err) {
			console.error("❌ Error fetching verification requests:", err.response?.data || err.message);
			// Don't show error toast if it's just an empty result
			if (err.response?.status === 403) {
				toast.error("Access denied. Admin privileges required.");
			} else if (err.response?.status !== 200) {
				console.warn("Verification requests endpoint returned non-200 status");
			}
			// Always set to empty array on error
			setVerificationRequests([]);
		} finally {
			setLoadingVerifications(false);
		}
	};

	// Action Handlers
	const handleSuspendUser = async (userId, reason, duration) => {
		try {
			const response = await axiosInstance.put(`/admin/suspend/${userId}`, {
				reason: reason || "Violation of terms",
				duration: duration || "7d"
			});
			
			console.log("Suspend response:", response.data);
			
			// Immediately update the local state with response data
			setUsers(prevUsers => {
				const updated = prevUsers.map(user => 
					user.id === userId 
						? { 
							...user, 
							isSuspended: true, 
							suspensionEndTime: response.data.user?.suspensionEndTime, 
							suspensionReason: response.data.user?.suspensionReason 
						}
						: user
				);
				console.log("Updated users state after suspend");
				return updated;
			});
			
			toast.success("User suspended successfully");
			
			// Force refresh after a short delay with cache bypass
			setTimeout(() => {
				console.log("Fetching fresh user data...");
				fetchUsers(true); // Force refresh to bypass cache
				fetchStats();
			}, 300);
		} catch (err) {
			console.error("Suspend error:", err);
			toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to suspend user");
			fetchUsers();
		}
	};

	const handleUnsuspendUser = async (userId) => {
		try {
			const response = await axiosInstance.put(`/admin/unsuspend/${userId}`);
			
			console.log("Unsuspend response:", response.data);
			
			// Immediately update the local state with response data
			setUsers(prevUsers => {
				const updated = prevUsers.map(user => 
					user.id === userId 
						? { 
							...user, 
							isSuspended: false, 
							suspensionEndTime: null, 
							suspensionReason: null 
						}
						: user
				);
				console.log("Updated users state after unsuspend");
				return updated;
			});
			
			toast.success("User unsuspended successfully");
			
			// Force refresh after a short delay with cache bypass
			setTimeout(() => {
				console.log("Fetching fresh user data...");
				fetchUsers(true); // Force refresh to bypass cache
				fetchStats();
			}, 300);
		} catch (err) {
			console.error("Unsuspend error:", err);
			toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to unsuspend user");
			fetchUsers();
		}
	};

	const handleDeleteUser = async (userId) => {
		if (!confirm("Are you sure you want to permanently delete this user? This will delete all their messages, friend requests, and related data. This action cannot be undone.")) return;
		try {
			const response = await axiosInstance.delete(`/admin/delete/${userId}`);
			
			// Immediately remove from local state
			setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
			
			toast.success(response.data?.message || "User deleted successfully");
			
			// Refresh stats
			fetchStats();
		} catch (err) {
			console.error("Delete error:", err);
			toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to delete user");
		}
	};

	const handleToggleVerification = async (userId) => {
		try {
			const response = await axiosInstance.put(`/admin/verify/${userId}`);
			
			// Immediately update the local state
			setUsers(prevUsers => 
				prevUsers.map(user => 
					user.id === userId 
						? { ...user, isVerified: !user.isVerified }
						: user
				)
			);
			
			toast.success(response.data?.message || "Verification status updated successfully");
			
			// Refresh data from server
			fetchUsers();
			fetchStats();
		} catch (err) {
			console.error("Toggle verification error:", err);
			toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to update verification");
		}
	};

	const handleUpdateReportStatus = async (reportId, newStatus) => {
		try {
			console.log(`Updating report ${reportId} to status: ${newStatus}`);
			const response = await axiosInstance.put(`/admin/reports/${reportId}/status`, {
				status: newStatus
			});
			console.log('Update response:', response.data);
			toast.success("Report status updated successfully");
			// Refresh all data
			await Promise.all([
				fetchReports(),
				fetchAIReports(),
				fetchStats()
			]);
		} catch (err) {
			console.error('Update report status error:', err);
			toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to update report");
		}
	};

	const handleDeleteReport = async (reportId) => {
		if (!confirm("Are you sure you want to permanently delete this report? This action cannot be undone.")) return;
		try {
			console.log(`Deleting report ${reportId}`);
			await axiosInstance.delete(`/admin/reports/${reportId}`);
			toast.success("Report deleted successfully");
			// Refresh all data
			await Promise.all([
				fetchReports(),
				fetchAIReports(),
				fetchStats()
			]);
		} catch (err) {
			console.error('Delete report error:', err);
			toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to delete report");
		}
	};

	const handleRefreshAIReports = async () => {
		toast.loading("Refreshing AI reports...", { id: "refresh" });
		try {
			await fetchAIReports();
			toast.success("AI reports refreshed", { id: "refresh" });
		} catch (err) {
			toast.error("Failed to refresh", { id: "refresh" });
		}
	};

	const handleApproveVerification = async (userId) => {
		// ✅ FIX: Optimistic update
		setVerificationRequests(prev => prev.filter(req => req.id !== userId));
		
		try {
			await axiosInstance.put(`/admin/verification/approve/${userId}`);
			toast.success("Verification approved");
			// Refetch to ensure consistency
			await Promise.all([
				fetchVerificationRequests(),
				fetchUsers(),
				fetchStats()
			]);
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to approve verification");
			// Revert optimistic update on error
			fetchVerificationRequests();
		}
	};

	const handleRejectVerification = async (userId) => {
		const reason = prompt("Enter rejection reason:");
		if (!reason) return;
		
		// ✅ FIX: Optimistic update
		setVerificationRequests(prev => prev.filter(req => req.id !== userId));
		
		try {
			await axiosInstance.put(`/admin/verification/reject/${userId}`, { reason });
			toast.success("Verification rejected");
			// Refetch to ensure consistency
			await Promise.all([
				fetchVerificationRequests(),
				fetchStats()
			]);
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to reject verification");
			// Revert optimistic update on error
			fetchVerificationRequests();
		}
	};

	const handleSendNotification = async ({ type, title, message, userId }) => {
		try {
			if (type === "broadcast") {
				await axiosInstance.post("/admin/notifications/broadcast", { title, message });
				toast.success("Broadcast notification sent");
			} else {
				await axiosInstance.post(`/admin/notifications/personal/${userId}`, { title, message });
				toast.success("Personal notification sent");
			}
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to send notification");
		}
	};

	// Render Active Tab
	const renderActiveTab = () => {
		switch (activeTab) {
			case "dashboard":
				return <DashboardOverview stats={stats} loadingStats={loadingStats} users={users} />;
			case "server-intelligence":
				return <ServerIntelligenceCenter />;
			case "ai-analysis":
				return <AIAnalysisAgent />;
			case "users":
				return (
					<UserManagement
						users={users}
						loadingUsers={loadingUsers}
						onSuspend={handleSuspendUser}
						onUnsuspend={handleUnsuspendUser}
						onDelete={handleDeleteUser}
						onToggleVerification={handleToggleVerification}
					/>
				);
			case "ai-moderation":
				return (
					<AIModerationPanel
						aiReports={aiReports}
						aiStats={aiStats}
						loadingAIReports={loadingAIReports}
						onUpdateReportStatus={handleUpdateReportStatus}
						onDeleteReport={handleDeleteReport}
						onRefresh={handleRefreshAIReports}
					/>
				);
			case "reports":
				return (
					<ReportsManagement
						reports={reports}
						loadingReports={loadingReports}
						onUpdateReportStatus={handleUpdateReportStatus}
						onDeleteReport={handleDeleteReport}
					/>
				);
			case "verifications":
				return (
					<VerificationRequests
						verificationRequests={verificationRequests}
						loadingVerifications={loadingVerifications}
						onApprove={handleApproveVerification}
						onReject={handleRejectVerification}
					/>
				);
			case "notifications":
				return <NotificationsPanel onSendNotification={handleSendNotification} />;
			default:
				return <DashboardOverview stats={stats} loadingStats={loadingStats} users={users} />;
		}
	};

	return (
		<div className="min-h-screen pt-14 xs:pt-16 sm:pt-18 md:pt-20 px-2 xs:px-3 sm:px-4 lg:px-6 bg-gradient-to-br from-base-200 via-base-300 to-base-200 pb-16 xs:pb-18 sm:pb-20 md:pb-10 relative admin-performance-mode">
			{/* Enhanced Background Animation */}
			<div className="admin-enhanced-background">
				{/* Floating Geometric Shapes */}
				<div className="admin-floating-shapes">
					<div className="admin-shape admin-shape-1"></div>
					<div className="admin-shape admin-shape-2"></div>
					<div className="admin-shape admin-shape-3"></div>
					<div className="admin-shape admin-shape-4"></div>
				</div>
				
				{/* Animated Grid Overlay */}
				<div className="admin-grid-overlay"></div>
				
				{/* Status Connection Lines */}
				<div className="admin-status-lines">
					<div className="status-line status-line-1 status-healthy"></div>
					<div className="status-line status-line-2 status-warning"></div>
					<div className="status-line status-line-3 status-info"></div>
					<div className="status-line status-line-4 status-critical"></div>
					
					{/* Vertical Lines */}
					<div className="vertical-status-line vertical-line-1 status-healthy"></div>
					<div className="vertical-status-line vertical-line-2 status-warning"></div>
					<div className="vertical-status-line vertical-line-3 status-info"></div>
					<div className="vertical-status-line vertical-line-4 status-critical"></div>
				</div>
				
				{/* Status Nodes */}
				<div className="status-nodes">
					<div className="status-node node-backend status-healthy" title="Backend - Healthy"></div>
					<div className="status-node node-frontend status-info" title="Frontend - Info"></div>
					<div className="status-node node-database status-warning" title="Database - Warning"></div>
					<div className="status-node node-websocket status-critical" title="WebSocket - Critical"></div>
				</div>
			</div>
			
			{/* Golden Particles Background */}
			<GoldenParticles particleCount={8} intensity="minimal" />
			
			<div className="max-w-7xl mx-auto relative z-10">
				{/* Header */}
				<div className="mb-6 sm:mb-8">
					<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 admin-panel-gradient-wave">
						Admin Panel
					</h1>
					<p className="text-sm sm:text-base text-base-content opacity-80">
						Manage users, content, and platform settings
					</p>
				</div>

				{/* Tab Navigation */}
				<div className="bg-base-100/80 backdrop-blur-sm rounded-2xl shadow-xl p-2 mb-6 sm:mb-8 overflow-x-auto border border-base-300">
					<div className="flex gap-1 sm:gap-2 min-w-max sm:min-w-0">
						{tabs.map((tab) => {
							const Icon = tab.icon;
							return (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-300 whitespace-nowrap font-medium ${
										activeTab === tab.id
											? "bg-gradient-to-r from-warning/20 via-base-content/10 to-warning/20 text-base-content shadow-lg scale-105 border border-warning/30"
											: "hover:bg-base-200 text-base-content/70 hover:text-base-content hover:scale-102"
									}`}
								>
									<Icon className="w-4 h-4 sm:w-5 sm:h-5" />
									<span className="text-xs sm:text-sm">{tab.label}</span>
								</button>
							);
						})}
					</div>
				</div>

				{/* Tab Content */}
				<div className="animate-fadeIn relative">
					{renderActiveTab()}
				</div>
			</div>
		</div>
	);
};

export default AdminDashboard;