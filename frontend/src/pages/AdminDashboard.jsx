import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { 
	Users, UserCheck, AlertTriangle, Shield, TrendingUp,
	BadgeCheck, FileText
} from "lucide-react";
import "../styles/admin-custom.css";

// Import tab components
import DashboardOverview from "../components/admin/DashboardOverview";
import UserManagement from "../components/admin/UserManagement";
import AIModerationPanel from "../components/admin/AIModerationPanel";
import ReportsManagement from "../components/admin/ReportsManagement";
import VerificationRequests from "../components/admin/VerificationRequests";
import NotificationsPanel from "../components/admin/NotificationsPanel";

const AdminDashboard = () => {
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
			setUsers(Array.isArray(res.data) ? res.data : []);
			console.log(`Fetched ${res.data?.length || 0} users${forceRefresh ? ' (force refresh)' : ''}`);
		} catch (err) {
			console.error("Error fetching users:", err.response?.data || err.message);
			if (err.response?.status === 403) {
				toast.error("Access denied. Admin privileges required.");
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
			setVerificationRequests(Array.isArray(res.data) ? res.data : []);
		} catch (err) {
			console.error("Error fetching verification requests:", err.response?.data || err.message);
			if (err.response?.status === 403) {
				toast.error("Access denied. Admin privileges required.");
			} else {
				toast.error(err.response?.data?.error || "Failed to load verification requests");
			}
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
					user._id === userId 
						? { 
							...user, 
							isSuspended: true, 
							suspendedUntil: response.data.user?.suspendedUntil, 
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
					user._id === userId 
						? { 
							...user, 
							isSuspended: false, 
							suspendedUntil: null, 
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
			setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
			
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
					user._id === userId 
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
			await axiosInstance.put(`/admin/reports/${reportId}/status`, {
				status: newStatus
			});
			toast.success("Report status updated");
			fetchReports();
			fetchAIReports();
			fetchStats();
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to update report");
		}
	};

	const handleDeleteReport = async (reportId) => {
		if (!confirm("Are you sure you want to delete this report?")) return;
		try {
			await axiosInstance.delete(`/admin/reports/${reportId}`);
			toast.success("Report deleted");
			fetchReports();
			fetchStats();
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to delete report");
		}
	};

	const handleApproveVerification = async (userId) => {
		try {
			await axiosInstance.put(`/admin/verification/approve/${userId}`);
			toast.success("Verification approved");
			fetchVerificationRequests();
			fetchUsers();
			fetchStats();
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to approve verification");
		}
	};

	const handleRejectVerification = async (userId) => {
		const reason = prompt("Enter rejection reason:");
		if (!reason) return;
		try {
			await axiosInstance.put(`/admin/verification/reject/${userId}`, { reason });
			toast.success("Verification rejected");
			fetchVerificationRequests();
			fetchStats();
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to reject verification");
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
		<div className="min-h-screen pt-14 xs:pt-16 sm:pt-18 md:pt-20 px-2 xs:px-3 sm:px-4 lg:px-6 bg-gradient-to-br from-base-200 via-base-300 to-base-200 pb-16 xs:pb-18 sm:pb-20 md:pb-10">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-6 sm:mb-8">
					<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
						Admin Panel
					</h1>
					<p className="text-sm sm:text-base text-base-content/70">
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
											? "bg-gradient-to-r from-primary/90 to-secondary/90 text-primary-content shadow-lg scale-105"
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
				<div className="animate-fadeIn">
					{renderActiveTab()}
				</div>
			</div>
		</div>
	);
};

export default AdminDashboard;
