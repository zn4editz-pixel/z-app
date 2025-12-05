import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { 
	ExternalLink, Eye, CheckCircle, XCircle, BadgeCheck, 
	Users, UserCheck, AlertTriangle, Shield, TrendingUp,
	Clock, Ban, FileText
} from "lucide-react";
import VerifiedBadge from "../components/VerifiedBadge";
import AdminNotifications from "../components/AdminNotifications";

const AdminDashboard = () => {
	// --- Stats State ---
	const [stats, setStats] = useState(null);
	const [loadingStats, setLoadingStats] = useState(true);

	// --- User State ---
	const [users, setUsers] = useState([]);
	const [loadingUsers, setLoadingUsers] = useState(true);

	// --- Report State ---
	const [reports, setReports] = useState([]);
	const [loadingReports, setLoadingReports] = useState(true);

	// --- AI Moderation State ---
	const [aiReports, setAIReports] = useState([]);
	const [aiStats, setAIStats] = useState(null);
	const [loadingAIReports, setLoadingAIReports] = useState(true);

	// --- Verification Requests State ---
	const [verificationRequests, setVerificationRequests] = useState([]);
	const [loadingVerifications, setLoadingVerifications] = useState(true);

	// --- Modal States ---
	const [suspendModal, setSuspendModal] = useState({ show: false, userId: null });
	const [suspendReason, setSuspendReason] = useState("");
	const [suspendDuration, setSuspendDuration] = useState("1d");
	
	const [verifyModal, setVerifyModal] = useState({ show: false, user: null, action: null });
	const [rejectReason, setRejectReason] = useState("");

	// --- Fetch All Data ---
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
			console.error("Error fetching stats", err);
			toast.error("Failed to load statistics");
		} finally {
			setLoadingStats(false);
		}
	};

	const fetchUsers = async () => {
		setLoadingUsers(true);
		try {
			const res = await axiosInstance.get("/admin/users");
			setUsers(Array.isArray(res.data) ? res.data : []);
		} catch (err) {
			console.error("Error fetching users", err);
			toast.error("Failed to load users");
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
			console.error("Error fetching reports", err);
			toast.error("Failed to load reports");
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
			console.error("Error fetching AI reports", err);
			toast.error("Failed to load AI moderation data");
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
			console.error("Error fetching verification requests", err);
			toast.error("Failed to load verification requests");
			setVerificationRequests([]);
		} finally {
			setLoadingVerifications(false);
		}
	};

	// --- Action Handlers ---
	const handleAction = async (userId, action, payload = {}) => {
		try {
			if (action === "suspend") {
				setSuspendModal({ show: true, userId });
				return;
			}

			const actionMap = {
				'toggleVerification': 'verify',
				'unsuspend': 'unsuspend',
				'block': 'block',
				'unblock': 'unblock',
				'delete': 'delete'
			};

			const endpoint = actionMap[action] || action;
			const url = `/admin/${endpoint}/${userId}`;
			const method = action === 'delete' ? 'delete' : 'put';
			const res = await axiosInstance[method](url, payload);

			toast.success(res.data.message || `${action} success`);
			fetchUsers();
			fetchStats();
		} catch (err) {
			console.error("Error in handleAction:", err);
			toast.error(err.response?.data?.message || "Action failed");
		}
	};

	const confirmSuspend = async () => {
		if (!suspendReason) {
			toast.error("Please provide a reason for suspension.");
			return;
		}

		const payload = {
			reason: suspendReason,
			until: getFutureDate(suspendDuration)
		};
		const userId = suspendModal.userId;

		try {
			const res = await axiosInstance.put(`/admin/suspend/${userId}`, payload);
			toast.success(res.data.message || "User suspended successfully");
			fetchUsers();
			fetchStats();
			setSuspendModal({ show: false, userId: null });
			setSuspendReason("");
			setSuspendDuration("1d");
		} catch (err) {
			console.error("Failed to suspend user:", err);
			toast.error(err.response?.data?.message || "Failed to suspend user");
		}
	};

	const handleVerificationAction = (user, action) => {
		setVerifyModal({ show: true, user, action });
		setRejectReason("");
	};

	const confirmVerificationAction = async () => {
		const { user, action } = verifyModal;
		
		try {
			if (action === "approve") {
				const res = await axiosInstance.put(`/admin/verification/approve/${user._id}`);
				toast.success(res.data.message || "Verification approved");
			} else if (action === "reject") {
				if (!rejectReason) {
					toast.error("Please provide a reason for rejection");
					return;
				}
				const res = await axiosInstance.put(`/admin/verification/reject/${user._id}`, {
					reason: rejectReason
				});
				toast.success(res.data.message || "Verification rejected");
			}
			
			fetchVerificationRequests();
			fetchUsers();
			fetchStats();
			setVerifyModal({ show: false, user: null, action: null });
			setRejectReason("");
		} catch (err) {
			console.error("Verification action error:", err);
			toast.error(err.response?.data?.message || "Action failed");
		}
	};

	const getFutureDate = (durationStr) => {
		const now = new Date();
		const num = parseInt(durationStr);
		const unit = durationStr.replace(num, "");
		if (unit === "d" || unit === "") now.setDate(now.getDate() + num);
		else if (unit === "w") now.setDate(now.getDate() + num * 7);
		else if (unit === "m") now.setDate(now.getDate() + num * 30);
		return now.toISOString();
	};

	const handleDelete = async (userId) => {
		await handleAction(userId, 'delete');
	};

	const handleReportStatus = async (reportId, newStatus, adminNotes = "") => {
		try {
			const res = await axiosInstance.put(`/admin/reports/${reportId}/status`, {
				status: newStatus,
				adminNotes
			});
			
			toast.success(res.data.message || "Report status updated");
			fetchReports();
			fetchAIReports(); // Also refresh AI reports
			fetchStats();
		} catch (err) {
			console.error("Error updating report status:", err);
			toast.error(err.response?.data?.message || "Failed to update report");
		}
	};

	const handleDeleteReport = async (reportId) => {
		if (!confirm("Are you sure you want to delete this report?")) return;
		
		try {
			await axiosInstance.delete(`/admin/reports/${reportId}`);
			toast.success("Report deleted successfully");
			fetchReports();
			fetchStats();
		} catch (err) {
			console.error("Error deleting report:", err);
			toast.error("Failed to delete report");
		}
	};

	const pendingVerifications = verificationRequests.filter(
		req => req.verificationRequest?.status === "pending"
	);

	return (
		<div className="min-h-screen pt-14 xs:pt-16 sm:pt-18 md:pt-20 px-2 xs:px-3 sm:px-4 lg:px-6 bg-base-200 pb-16 xs:pb-18 sm:pb-20 md:pb-10">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-center">Admin Dashboard</h1>

				{/* Statistics Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
					{loadingStats ? (
						<div className="col-span-1 sm:col-span-2 lg:col-span-4 text-center py-8">
							<span className="loading loading-spinner loading-lg"></span>
						</div>
					) : stats && (
						<>
							<div className="stat bg-base-100 rounded-xl shadow-lg p-4 sm:p-6">
								<div className="stat-figure text-primary hidden sm:block">
									<Users className="w-6 h-6 sm:w-8 sm:h-8" />
								</div>
								<div className="stat-title text-xs sm:text-sm">Total Users</div>
								<div className="stat-value text-primary text-2xl sm:text-3xl">{stats.totalUsers}</div>
								<div className="stat-desc text-xs">{stats.recentUsers} new this week</div>
							</div>

							<div className="stat bg-base-100 rounded-xl shadow-lg p-4 sm:p-6">
								<div className="stat-figure text-success hidden sm:block">
									<UserCheck className="w-6 h-6 sm:w-8 sm:h-8" />
								</div>
								<div className="stat-title text-xs sm:text-sm">Online Now</div>
								<div className="stat-value text-success text-2xl sm:text-3xl">{stats.onlineUsers}</div>
								<div className="stat-desc text-xs">{stats.verifiedUsers} verified</div>
							</div>

							<div className="stat bg-base-100 rounded-xl shadow-lg p-4 sm:p-6">
								<div className="stat-figure text-warning hidden sm:block">
									<Clock className="w-6 h-6 sm:w-8 sm:h-8" />
								</div>
								<div className="stat-title text-xs sm:text-sm">Pending Verifications</div>
								<div className="stat-value text-warning text-2xl sm:text-3xl">{stats.pendingVerifications}</div>
								<div className="stat-desc text-xs">{stats.approvedVerifications} approved</div>
							</div>

							<div className="stat bg-base-100 rounded-xl shadow-lg p-4 sm:p-6">
								<div className="stat-figure text-error hidden sm:block">
									<AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8" />
								</div>
								<div className="stat-title text-xs sm:text-sm">Pending Reports</div>
								<div className="stat-value text-error text-2xl sm:text-3xl">{stats.pendingReports}</div>
								<div className="stat-desc text-xs">{stats.totalReports} total reports</div>
							</div>
						</>
					)}
				</div>

				{/* Verification Requests Section */}
				<section className="mb-6 sm:mb-8">
					<div className="bg-base-100 rounded-xl shadow-lg p-3 sm:p-4 lg:p-6">
						<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4">
							<h2 className="text-lg sm:text-xl lg:text-2xl font-semibold flex items-center gap-2">
								<BadgeCheck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
								Verification Requests
							</h2>
							<span className="badge badge-warning badge-sm sm:badge-md lg:badge-lg">
								{pendingVerifications.length} Pending
							</span>
						</div>

						{loadingVerifications ? (
							<div className="text-center py-8">
								<span className="loading loading-spinner loading-lg"></span>
							</div>
						) : pendingVerifications.length === 0 ? (
							<div className="text-center py-8 text-base-content/60">
								<BadgeCheck className="w-16 h-16 mx-auto mb-4 opacity-30" />
								<p>No pending verification requests</p>
							</div>
						) : (
							<div className="space-y-4">
								{pendingVerifications.map((user) => (
									<div
										key={user._id}
										className="card bg-base-200 border border-base-300"
									>
										<div className="card-body p-4">
											<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
												{/* User Info */}
												<div className="flex items-center gap-4 flex-1">
													<div className="avatar">
														<div className="w-16 h-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
															<img
																src={user.profilePic || "/default-avatar.png"}
																alt={user.username}
															/>
														</div>
													</div>
													<div>
														<h3 className="font-semibold text-lg">
															{user.nickname || user.username}
														</h3>
														<p className="text-sm text-base-content/70">
															@{user.username}
														</p>
														<p className="text-xs text-base-content/60">
															{user.email}
														</p>
													</div>
												</div>

												{/* Request Details */}
												<div className="flex-1">
													<p className="text-sm font-semibold mb-1">Reason:</p>
													<p className="text-sm text-base-content/80 mb-2">
														{user.verificationRequest?.reason || "No reason provided"}
													</p>
													{user.verificationRequest?.idProof && (
														<a
															href={user.verificationRequest.idProof}
															target="_blank"
															rel="noopener noreferrer"
															className="btn btn-ghost btn-xs"
														>
															<ExternalLink size={14} /> View ID Proof
														</a>
													)}
												</div>

												{/* Actions */}
												<div className="flex gap-2">
													<button
														onClick={() => handleVerificationAction(user, "approve")}
														className="btn btn-success btn-sm"
													>
														<CheckCircle className="w-4 h-4" />
														Approve
													</button>
													<button
														onClick={() => handleVerificationAction(user, "reject")}
														className="btn btn-error btn-sm"
													>
														<XCircle className="w-4 h-4" />
														Reject
													</button>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</section>

				{/* Users Table Section */}
				<section className="mb-6 sm:mb-8">
					<div className="bg-base-100 rounded-xl shadow-lg p-3 sm:p-4 lg:p-6">
						<h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4">User Management</h2>
						{loadingUsers ? (
							<div className="text-center py-8">
								<span className="loading loading-spinner loading-lg"></span>
							</div>
						) : users.length === 0 ? (
							<div className="text-center text-error">No users found.</div>
						) : (
							<div className="overflow-x-auto">
								<table className="table w-full table-zebra table-sm sm:table-md">
									<thead>
										<tr className="text-xs sm:text-sm text-center">
											<th>#</th>
											<th>Name</th>
											<th>Email</th>
											<th>Status</th>
											<th>Verified</th>
											<th>Suspended</th>
											<th>Blocked</th>
											<th>Actions</th>
										</tr>
									</thead>
									<tbody>
										{users.map((user, idx) => (
											<tr key={user._id} className="text-center text-xs sm:text-sm">
												<td>{idx + 1}</td>
												<td className="flex items-center gap-1 sm:gap-2 justify-center">
													<div className="avatar avatar-xs sm:avatar-sm mr-1">
														<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full">
															<img
																src={user.profilePic || '/default-avatar.png'}
																alt={user.nickname || user.username}
															/>
														</div>
													</div>
													{user.nickname || user.username}
												</td>
												<td className="truncate max-w-[100px] sm:max-w-xs">{user.email}</td>
												<td>{user.isOnline ? "🟢 Online" : "⚪ Offline"}</td>
												<td>{user.isVerified ? "✅" : "❌"}</td>
												<td>{user.isSuspended ? "⏸️" : "—"}</td>
												<td>{user.isBlocked ? "🚫" : "—"}</td>
												<td>
													<div className="flex flex-wrap justify-center gap-1">
														<button
															onClick={() => handleAction(user._id, user.isSuspended ? "unsuspend" : "suspend")}
															className="btn btn-warning btn-xs"
														>
															{user.isSuspended ? "Unsuspend" : "Suspend"}
														</button>
														<button
															onClick={() => handleAction(user._id, user.isBlocked ? "unblock" : "block")}
															className={`btn btn-xs ${user.isBlocked ? "btn-outline btn-neutral" : "btn-error"}`}
														>
															{user.isBlocked ? "Unblock" : "Block"}
														</button>
														<button
															onClick={() => handleAction(user._id, "toggleVerification")}
															className={`btn btn-xs ${user.isVerified ? "btn-outline btn-info" : "btn-success"}`}
														>
															{user.isVerified ? "Unverify" : "Verify"}
														</button>
														<button
															onClick={() => handleDelete(user._id)}
															className="btn btn-outline btn-error btn-xs"
														>
															Delete
														</button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</section>

				{/* AI Moderation Section */}
				<section className="mb-6 sm:mb-8">
					<div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl shadow-lg p-4 sm:p-6 border-2 border-purple-500/20">
						<div className="flex items-center gap-3 mb-4">
							<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
								<Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
							</div>
							<div>
								<h2 className="text-xl sm:text-2xl font-semibold">AI Content Moderation</h2>
								<p className="text-xs sm:text-sm text-base-content/60">Automatically detected violations</p>
							</div>
						</div>

						{loadingAIReports ? (
							<div className="text-center py-8">
								<span className="loading loading-spinner loading-lg text-purple-500"></span>
							</div>
						) : (
							<>
								{/* AI Stats Cards */}
								{aiStats && (
									<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
										<div className="bg-base-100 rounded-lg p-3 text-center">
											<div className="text-2xl font-bold text-purple-500">{aiStats.total}</div>
											<div className="text-xs text-base-content/60">Total AI Reports</div>
										</div>
										<div className="bg-base-100 rounded-lg p-3 text-center">
											<div className="text-2xl font-bold text-warning">{aiStats.pending}</div>
											<div className="text-xs text-base-content/60">Pending</div>
										</div>
										<div className="bg-base-100 rounded-lg p-3 text-center">
											<div className="text-2xl font-bold text-info">{aiStats.reviewed}</div>
											<div className="text-xs text-base-content/60">Reviewed</div>
										</div>
										<div className="bg-base-100 rounded-lg p-3 text-center">
											<div className="text-2xl font-bold text-success">{aiStats.actionTaken}</div>
											<div className="text-xs text-base-content/60">Action Taken</div>
										</div>
										<div className="bg-base-100 rounded-lg p-3 text-center">
											<div className="text-2xl font-bold text-neutral">{aiStats.dismissed}</div>
											<div className="text-xs text-base-content/60">Dismissed</div>
										</div>
										<div className="bg-base-100 rounded-lg p-3 text-center">
											<div className="text-2xl font-bold text-purple-500">{(aiStats.avgConfidence * 100).toFixed(0)}%</div>
											<div className="text-xs text-base-content/60">Avg Confidence</div>
										</div>
									</div>
								)}

								{/* AI Reports Table */}
								{aiReports.length === 0 ? (
									<div className="text-center text-success py-8">
										<Shield className="w-12 h-12 mx-auto mb-2 text-success" />
										<p className="font-semibold">No AI-detected violations!</p>
										<p className="text-sm text-base-content/60">The system is monitoring content in real-time</p>
									</div>
								) : (
									<div className="overflow-x-auto">
										<table className="table w-full table-zebra table-sm sm:table-md">
											<thead>
												<tr className="text-xs sm:text-sm text-center">
													<th>Date</th>
													<th>Reported User</th>
													<th>AI Category</th>
													<th>Confidence</th>
													<th>Screenshot</th>
													<th>Status</th>
													<th>Actions</th>
												</tr>
											</thead>
											<tbody>
												{aiReports.map((report) => (
													<tr key={report._id} className="text-center text-xs sm:text-sm">
														<td>{new Date(report.createdAt).toLocaleString()}</td>
														<td>
															<div className="flex items-center justify-center gap-2">
																<img 
																	src={report.reportedUser?.profilePic || '/avatar.png'} 
																	alt="" 
																	className="w-6 h-6 rounded-full"
																/>
																<span>{report.reportedUser?.nickname || report.reportedUser?.username || 'N/A'}</span>
															</div>
														</td>
														<td>
															<span className="badge badge-error badge-sm">
																{report.aiCategory || 'Unknown'}
															</span>
														</td>
														<td>
															<div className="flex items-center justify-center gap-1">
																<div className="w-16 bg-base-300 rounded-full h-2">
																	<div 
																		className="bg-purple-500 h-2 rounded-full" 
																		style={{ width: `${(report.aiConfidence * 100).toFixed(0)}%` }}
																	></div>
																</div>
																<span className="text-xs font-bold">{(report.aiConfidence * 100).toFixed(0)}%</span>
															</div>
														</td>
														<td>
															<a
																href={report.screenshot}
																target="_blank"
																rel="noopener noreferrer"
																className="btn btn-ghost btn-xs"
															>
																<ExternalLink size={14} /> View
															</a>
														</td>
														<td>
															<span className={`badge badge-sm ${
																report.status === 'pending' ? 'badge-warning' :
																report.status === 'reviewed' ? 'badge-info' :
																report.status === 'action_taken' ? 'badge-success' :
																report.status === 'dismissed' ? 'badge-neutral' : ''
															}`}>
																{report.status}
															</span>
														</td>
														<td>
															<div className="flex flex-wrap justify-center gap-1">
																{report.status === 'pending' && (
																	<button
																		onClick={() => handleReportStatus(report._id, 'reviewed')}
																		className="btn btn-info btn-xs"
																	>
																		<Eye size={12} /> Review
																	</button>
																)}
																{report.status === 'reviewed' && (
																	<>
																		<button
																			onClick={() => handleReportStatus(report._id, 'action_taken')}
																			className="btn btn-success btn-xs"
																		>
																			<CheckCircle size={12} /> Action
																		</button>
																		<button
																			onClick={() => handleReportStatus(report._id, 'dismissed')}
																			className="btn btn-neutral btn-xs"
																		>
																			<XCircle size={12} /> Dismiss
																		</button>
																	</>
																)}
															</div>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}
							</>
						)}
					</div>
				</section>

				{/* Reports Section */}
				<section>
					<div className="bg-base-100 rounded-xl shadow-lg p-4 sm:p-6">
						<h2 className="text-xl sm:text-2xl font-semibold mb-4">User-Submitted Reports</h2>
						{loadingReports ? (
							<div className="text-center py-8">
								<span className="loading loading-spinner loading-lg"></span>
							</div>
						) : reports.length === 0 ? (
							<div className="text-center text-info">No pending reports found.</div>
						) : (
							<div className="overflow-x-auto">
								<table className="table w-full table-zebra table-sm sm:table-md">
									<thead>
										<tr className="text-xs sm:text-sm text-center">
											<th>Date</th>
											<th>Reporter</th>
											<th>Reported User</th>
											<th>Reason</th>
											<th>Screenshot</th>
											<th>Status</th>
											<th>Actions</th>
										</tr>
									</thead>
									<tbody>
										{reports.map((report) => (
											<tr key={report._id} className="text-center text-xs sm:text-sm">
												<td>{new Date(report.createdAt).toLocaleString()}</td>
												<td>
													{report.isAIDetected ? (
														<span className="badge badge-purple badge-xs">AI Auto-Report</span>
													) : (
														report.reporter?.nickname || report.reporter?.username || 'N/A'
													)}
												</td>
												<td>{report.reportedUser?.nickname || report.reportedUser?.username || 'N/A'}</td>
												<td>
													{report.reason}
													{report.isAIDetected && (
														<span className="badge badge-purple badge-xs ml-1">AI</span>
													)}
												</td>
												<td>
													<a
														href={report.screenshot}
														target="_blank"
														rel="noopener noreferrer"
														className="btn btn-ghost btn-xs"
													>
														<ExternalLink size={14} /> View
													</a>
												</td>
												<td>
													<span className={`badge ${
														report.status === 'pending' ? 'badge-warning' :
														report.status === 'reviewed' ? 'badge-info' :
														report.status === 'action_taken' ? 'badge-success' :
														report.status === 'dismissed' ? 'badge-neutral' : ''
													}`}>
														{report.status}
													</span>
												</td>
												<td>
													<div className="flex flex-wrap justify-center gap-1">
														{report.status === 'pending' && (
															<button
																onClick={() => handleReportStatus(report._id, 'reviewed')}
																className="btn btn-info btn-xs"
															>
																<Eye size={12} /> Review
															</button>
														)}
														{report.status === 'reviewed' && (
															<>
																<button
																	onClick={() => handleReportStatus(report._id, 'action_taken')}
																	className="btn btn-success btn-xs"
																>
																	<CheckCircle size={12} /> Action
																</button>
																<button
																	onClick={() => handleReportStatus(report._id, 'dismissed')}
																	className="btn btn-neutral btn-xs"
																>
																	<XCircle size={12} /> Dismiss
																</button>
															</>
														)}
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</section>
			</div>

			{/* Suspend Modal */}
			{suspendModal.show && (
				<div className="modal modal-open">
					<div className="modal-box max-w-md">
						<h3 className="font-bold text-lg">Suspend User</h3>
						<div className="form-control">
							<label className="label">Reason for suspension</label>
							<textarea
								className="textarea textarea-bordered"
								value={suspendReason}
								onChange={(e) => setSuspendReason(e.target.value)}
								placeholder="Enter reason..."
							/>
							<label className="label">Duration</label>
							<select
								className="select select-bordered"
								value={suspendDuration}
								onChange={(e) => setSuspendDuration(e.target.value)}
							>
								<option value="1d">1 Day</option>
								<option value="7d">7 Days</option>
								<option value="30d">30 Days</option>
							</select>
						</div>
						<div className="modal-action">
							<button className="btn btn-error" onClick={confirmSuspend}>
								Suspend
							</button>
							<button
								className="btn"
								onClick={() => setSuspendModal({ show: false, userId: null })}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Verification Action Modal */}
			{verifyModal.show && (
				<div className="modal modal-open">
					<div className="modal-box max-w-md">
						<h3 className="font-bold text-lg">
							{verifyModal.action === "approve" ? "Approve Verification" : "Reject Verification"}
						</h3>
						<div className="py-4">
							<div className="flex items-center gap-4 mb-4">
								<div className="avatar">
									<div className="w-16 h-16 rounded-full">
										<img
											src={verifyModal.user?.profilePic || "/default-avatar.png"}
											alt={verifyModal.user?.username}
										/>
									</div>
								</div>
								<div>
									<p className="font-semibold">{verifyModal.user?.nickname || verifyModal.user?.username}</p>
									<p className="text-sm text-base-content/70">@{verifyModal.user?.username}</p>
								</div>
							</div>

							{verifyModal.action === "approve" ? (
								<p className="text-sm">
									Are you sure you want to approve this verification request? The user will receive a verified badge.
								</p>
							) : (
								<div className="form-control">
									<label className="label">Reason for rejection</label>
									<textarea
										className="textarea textarea-bordered"
										value={rejectReason}
										onChange={(e) => setRejectReason(e.target.value)}
										placeholder="Enter reason for rejection..."
									/>
								</div>
							)}
						</div>
						<div className="modal-action">
							<button
								className={`btn ${verifyModal.action === "approve" ? "btn-success" : "btn-error"}`}
								onClick={confirmVerificationAction}
							>
								{verifyModal.action === "approve" ? "Approve" : "Reject"}
							</button>
							<button
								className="btn"
								onClick={() => setVerifyModal({ show: false, user: null, action: null })}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Admin Notifications Section */}
			<section className="mb-6 sm:mb-8">
				<AdminNotifications users={users} />
			</section>
		</div>
	);
};

export default AdminDashboard;
