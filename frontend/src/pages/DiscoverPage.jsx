import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { axiosInstance } from "../lib/axios.js";
import { Search, Loader2, UserPlus, Users, Bell, UserCheck, CheckCircle, XCircle, BadgeCheck, Mail, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import VerifiedBadge from "../components/VerifiedBadge";
import { useFriendStore } from "../store/useFriendStore";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";

// Admin Notifications List Component
const AdminNotificationsList = () => {
	const { notifications, addNotification, clearNotification } = useNotificationStore();
	const [adminNotifications, setAdminNotifications] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	// Load notifications from backend on mount
	useEffect(() => {
		const loadNotifications = async () => {
			try {
				const res = await axiosInstance.get("/users/notifications");
				const dbNotifications = res.data || [];
				console.log(`📥 Loaded ${dbNotifications.length} notifications from DB`);
				
				// Add each notification to the store
				dbNotifications.forEach(notif => {
					addNotification({
						type: notif.isBroadcast ? 'admin_broadcast' : 'admin',
						title: notif.title,
						message: notif.message,
						color: notif.color,
						notificationType: notif.type,
						createdAt: notif.createdAt,
						id: notif._id, // Use _id as the main ID
						dbId: notif._id, // Also store as dbId for deletion
						_id: notif._id, // Keep original _id
					});
				});
			} catch (error) {
				console.error("Error loading notifications:", error);
			} finally {
				setIsLoading(false);
			}
		};
		
		loadNotifications();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// Filter admin notifications
	useEffect(() => {
		const adminNotes = notifications.filter(n => n.type === 'admin' || n.type === 'admin_broadcast');
		setAdminNotifications(adminNotes);
	}, [notifications]);

	const getBorderColor = (color) => {
		const colorMap = {
			green: 'border-success',
			red: 'border-error',
			blue: 'border-info',
			yellow: 'border-warning',
			orange: 'border-orange-500',
		};
		return colorMap[color] || 'border-info';
	};

	const getTextColor = (color) => {
		const colorMap = {
			green: 'text-success',
			red: 'text-error',
			blue: 'text-info',
			yellow: 'text-warning',
			orange: 'text-orange-500',
		};
		return colorMap[color] || 'text-info';
	};

	const getIcon = (type) => {
		switch(type) {
			case 'success':
				return <CheckCircle className="w-5 h-5" />;
			case 'error':
				return <XCircle className="w-5 h-5" />;
			case 'warning':
				return <Bell className="w-5 h-5" />;
			case 'info':
			default:
				return <Mail className="w-5 h-5" />;
		}
	};

	const handleDelete = async (notification) => {
		try {
			console.log("Deleting notification:", notification);
			// Delete from backend if it has a DB ID
			if (notification.dbId) {
				console.log(`Calling DELETE /users/notifications/${notification.dbId}`);
				await axiosInstance.delete(`/users/notifications/${notification.dbId}`);
				console.log("Backend deletion successful");
			}
			// Remove from local store
			clearNotification(notification.id);
			toast.success("Notification deleted");
		} catch (error) {
			console.error("Error deleting notification:", error);
			console.error("Error response:", error.response?.data);
			toast.error(error.response?.data?.error || "Failed to delete notification");
		}
	};

	if (isLoading) {
		return (
			<div className="flex justify-center py-4">
				<Loader2 className="w-6 h-6 animate-spin text-primary" />
			</div>
		);
	}

	if (adminNotifications.length === 0) return null;

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 mb-2">
				<Mail className="w-5 h-5 text-primary" />
				<h3 className="font-semibold text-base">Admin Messages</h3>
			</div>
			{adminNotifications.map((notification) => (
				<div
					key={notification.id}
					className={`bg-base-100 border-2 ${getBorderColor(notification.color)} rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-all`}
				>
					<div className="flex items-start gap-3">
						<div className={`flex-shrink-0 ${getTextColor(notification.color)}`}>
							{getIcon(notification.notificationType)}
						</div>
						<div className="flex-1 min-w-0">
							<h4 className={`font-bold text-sm sm:text-base ${getTextColor(notification.color)} mb-1`}>
								{notification.title}
							</h4>
							<p className="text-xs sm:text-sm text-base-content/80">
								{notification.message}
							</p>
							{notification.createdAt && (
								<p className="text-xs text-base-content/50 mt-2">
									{new Date(notification.createdAt).toLocaleString()}
								</p>
							)}
						</div>
						<button
							onClick={() => handleDelete(notification)}
							className="btn btn-ghost btn-circle btn-xs flex-shrink-0 hover:bg-error/10 hover:text-error"
							title="Delete notification"
						>
							<Trash2 className="w-4 h-4" />
						</button>
					</div>
				</div>
			))}
		</div>
	);
};

const DiscoverPage = () => {
	const [activeTab, setActiveTab] = useState("discover"); // discover, requests, notifications
	const { clearBadge } = useNotificationStore();
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [isLoadingSearch, setIsLoadingSearch] = useState(false);
	const [suggestedUsers, setSuggestedUsers] = useState([]);
	const [isLoadingSuggested, setIsLoadingSuggested] = useState(true);
	const [loadingRequestId, setLoadingRequestId] = useState(null);

	const { pendingReceived, acceptRequest, rejectRequest, fetchFriendData } = useFriendStore();
	const { authUser } = useAuthStore();
	const { notifications } = useNotificationStore();

	// Calculate notification counts for each tab
	const adminNotifications = notifications.filter(n => n.type === 'admin' || n.type === 'admin_broadcast');
	const hasVerificationUpdate = authUser?.verificationRequest?.status && authUser.verificationRequest.status !== "none";
	const notificationCount = adminNotifications.length + (hasVerificationUpdate ? 1 : 0) + (authUser?.isSuspended ? 1 : 0);

	// Fetch friend data on mount
	useEffect(() => {
		fetchFriendData();
	}, [fetchFriendData]);

	// Fetch suggested users on mount
	useEffect(() => {
		if (activeTab === "discover") {
			fetchSuggestedUsers();
		}
	}, [activeTab]);

	const fetchSuggestedUsers = async () => {
		// Check cache first
		const cached = sessionStorage.getItem('suggestedUsers');
		const cacheTime = sessionStorage.getItem('suggestedUsersTime');
		const now = Date.now();
		
		// Use cache if less than 5 minutes old
		if (cached && cacheTime && (now - parseInt(cacheTime)) < 300000) {
			setSuggestedUsers(JSON.parse(cached));
			setIsLoadingSuggested(false);
			return;
		}
		
		setIsLoadingSuggested(true);
		try {
			const res = await axiosInstance.get("/users/suggested");
			const users = res.data || [];
			setSuggestedUsers(users);
			// Cache for 5 minutes
			sessionStorage.setItem('suggestedUsers', JSON.stringify(users));
			sessionStorage.setItem('suggestedUsersTime', now.toString());
		} catch (error) {
			console.error("Error fetching suggested users:", error);
		} finally {
			setIsLoadingSuggested(false);
		}
	};

	// Debounced search
	useEffect(() => {
		if (activeTab !== "discover") return;
		
		if (!searchQuery.trim()) {
			setSearchResults([]);
			return;
		}
		setIsLoadingSearch(true);
		const timerId = setTimeout(() => {
			const fetchUsers = async () => {
				try {
					const res = await axiosInstance.get(`/users/search?q=${searchQuery}`);
					setSearchResults(res.data);
				} catch (error) {
					console.error("Search error:", error);
					toast.error("Failed to search users");
				} finally {
					setIsLoadingSearch(false);
				}
			};
			fetchUsers();
		}, 300);
		return () => clearTimeout(timerId);
	}, [searchQuery, activeTab]);

	const handleAccept = async (id) => {
		setLoadingRequestId(id);
		await acceptRequest(id);
		setLoadingRequestId(null);
	};

	const handleReject = async (id) => {
		setLoadingRequestId(id);
		await rejectRequest(id);
		setLoadingRequestId(null);
	};

	const displayUsers = searchQuery.trim() ? searchResults : suggestedUsers;
	const isLoading = searchQuery.trim() ? isLoadingSearch : isLoadingSuggested;

	return (
		<div className="min-h-screen pt-14 xs:pt-16 sm:pt-18 md:pt-20 pb-16 xs:pb-18 sm:pb-20 md:pb-10 px-2 xs:px-3 sm:px-4 bg-base-200">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="bg-base-100 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
					<div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
						<Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
						<h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Social Hub</h1>
					</div>
					<p className="text-sm sm:text-base text-base-content/70">
						Discover users, manage requests, and stay updated
					</p>
				</div>

				{/* Tabs */}
				<div className="bg-base-100 rounded-lg sm:rounded-xl shadow-lg mb-4 sm:mb-6 overflow-hidden">
					<div className="flex border-b border-base-300 relative">
						{/* Animated underline */}
						<div 
							className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300 ease-out"
							style={{
								width: '33.333%',
								transform: `translateX(${activeTab === 'discover' ? '0%' : activeTab === 'requests' ? '100%' : '200%'})`
							}}
						/>
						
						<button
							onClick={() => setActiveTab("discover")}
							className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-4 font-semibold transition-all duration-300 text-xs sm:text-base relative ${
								activeTab === "discover"
									? "text-primary scale-105"
									: "text-base-content/60 hover:text-base-content hover:bg-base-200/50"
							}`}
						>
							<Search className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${activeTab === "discover" ? "scale-110" : ""}`} />
							<span>Discover</span>
						</button>
						<button
							onClick={() => setActiveTab("requests")}
							className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-4 font-semibold transition-all duration-300 relative text-xs sm:text-base ${
								activeTab === "requests"
									? "text-primary scale-105"
									: "text-base-content/60 hover:text-base-content hover:bg-base-200/50"
							}`}
						>
							<UserCheck className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${activeTab === "requests" ? "scale-110" : ""}`} />
							<span>Requests</span>
							{pendingReceived.length > 0 && (
								<span className="absolute top-1 right-1 sm:relative sm:top-0 sm:right-0 badge badge-error badge-xs sm:badge-sm animate-pulse">
									{pendingReceived.length}
								</span>
							)}
						</button>
						<button
							onClick={() => {
								setActiveTab("notifications");
								clearBadge(); // Clear badge when opening notifications
							}}
							className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-4 font-semibold transition-all duration-300 relative text-xs sm:text-base ${
								activeTab === "notifications"
									? "text-primary scale-105"
									: "text-base-content/60 hover:text-base-content hover:bg-base-200/50"
							}`}
						>
							<Bell className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${activeTab === "notifications" ? "scale-110" : ""}`} />
							<span>Notifications</span>
							{notificationCount > 0 && (
								<span className="absolute top-1 right-1 sm:relative sm:top-0 sm:right-0 badge badge-error badge-xs sm:badge-sm animate-pulse">
									{notificationCount > 9 ? "9+" : notificationCount}
								</span>
							)}
						</button>
					</div>
				</div>

				{/* Tab Content with fade-in animation */}
				{activeTab === "discover" && (
					<div className="animate-fade-in">
						{/* Search Bar */}
						<div className="bg-base-100 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-6">
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
									<Search className="h-4 w-4 sm:h-5 sm:w-5 text-base-content/60" />
								</div>
								<input
									type="text"
									placeholder="Search username..."
									className="input input-bordered w-full pl-10 sm:pl-12 pr-3 sm:pr-4 text-sm sm:text-base h-10 sm:h-12"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
						</div>

						{/* Results Section */}
						<div className="bg-base-100 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-6">
							<h2 className="text-base sm:text-xl font-semibold mb-3 sm:mb-4">
								{searchQuery.trim() ? "Search Results" : "Suggested Users"}
							</h2>

							{isLoading ? (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
									{[...Array(6)].map((_, i) => (
										<div key={i} className="card bg-base-200 border border-base-300 animate-pulse">
											<div className="card-body p-3 sm:p-4">
												<div className="flex items-start gap-3 sm:gap-4">
													<div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-base-300"></div>
													<div className="flex-1 space-y-2">
														<div className="h-4 bg-base-300 rounded w-3/4"></div>
														<div className="h-3 bg-base-300 rounded w-1/2"></div>
														<div className="h-8 bg-base-300 rounded w-full mt-2"></div>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							) : displayUsers.length === 0 ? (
								<div className="text-center py-8 sm:py-12">
									<Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-base-content/30" />
									<p className="text-sm sm:text-base text-base-content/60 px-4">
										{searchQuery.trim()
											? `No users found for "${searchQuery}"`
											: "No suggested users available"}
									</p>
								</div>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
									{displayUsers.map((user) => (
										<div
											key={user._id}
											className="card bg-base-200 hover:bg-base-300 transition-all duration-200 border border-base-300"
										>
											<div className="card-body p-3 sm:p-4">
												<div className="flex items-start gap-3 sm:gap-4">
													<Link to={`/profile/${user.username}`} className="flex-shrink-0">
														<div className="avatar">
															<div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full ring-2 ring-primary ring-offset-base-100 ring-offset-1 sm:ring-offset-2">
																<img
																	src={user.profilePic || "/default-avatar.png"}
																	alt={user.username}
																/>
															</div>
														</div>
													</Link>

													<div className="flex-1 min-w-0">
														<Link to={`/profile/${user.username}`}>
															<div className="flex items-center gap-1 mb-1">
																<h3 className="font-semibold text-sm sm:text-lg truncate">
																	{user.nickname || user.username}
																</h3>
																{user.isVerified && <VerifiedBadge size="xs" />}
															</div>
															<p className="text-xs sm:text-sm text-base-content/70 mb-2">
																@{user.username}
															</p>
														</Link>

														{user.bio && (
															<p className="text-xs sm:text-sm text-base-content/80 line-clamp-2 mb-2 sm:mb-3">
																{user.bio}
															</p>
														)}

														<div className="flex gap-2">
															<Link
																to={`/profile/${user.username}`}
																className="btn btn-primary btn-xs sm:btn-sm flex-1 hover:scale-105 active:scale-95 transition-transform duration-200"
															>
																<UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
																<span className="text-xs sm:text-sm">View Profile</span>
															</Link>
														</div>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				)}

				{activeTab === "requests" && (
					<div className="animate-fade-in">
					<div className="bg-base-100 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-6">
						<h2 className="text-base sm:text-xl font-semibold mb-3 sm:mb-4">Friend Requests</h2>
						
						{pendingReceived.length === 0 ? (
							<div className="text-center py-8 sm:py-12">
								<UserCheck className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-base-content/30" />
								<p className="text-sm sm:text-base text-base-content/60">No pending friend requests</p>
							</div>
						) : (
							<div className="space-y-3 sm:space-y-4">
								{pendingReceived.map((user) => (
									<div
										key={user._id}
										className="card bg-base-200 border border-base-300 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
									>
										<div className="card-body p-3 sm:p-4">
											<div className="flex items-center gap-3 sm:gap-4">
												<Link to={`/profile/${user.username}`} className="flex-shrink-0">
													<div className="avatar">
														<div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full ring-2 ring-primary ring-offset-base-100 ring-offset-1 sm:ring-offset-2">
															<img
																src={user.profilePic || "/default-avatar.png"}
																alt={user.username}
															/>
														</div>
													</div>
												</Link>

												<div className="flex-1 min-w-0">
													<Link to={`/profile/${user.username}`}>
														<div className="flex items-center gap-1 mb-1">
															<h3 className="font-semibold text-sm sm:text-lg truncate">
																{user.nickname || user.username}
															</h3>
															{user.isVerified && <VerifiedBadge size="xs" />}
														</div>
														<p className="text-xs sm:text-sm text-base-content/70">
															@{user.username}
														</p>
													</Link>
												</div>

												<div className="flex flex-col sm:flex-row gap-2">
													<button
														onClick={() => handleAccept(user._id)}
														disabled={loadingRequestId === user._id}
														className="btn btn-success btn-xs sm:btn-sm hover:scale-105 active:scale-95 transition-transform duration-200"
													>
														{loadingRequestId === user._id ? (
															<Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
														) : (
															<>
																<CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
																<span className="text-xs sm:text-sm">Accept</span>
															</>
														)}
													</button>
													<button
														onClick={() => handleReject(user._id)}
														disabled={loadingRequestId === user._id}
														className="btn btn-ghost btn-xs sm:btn-sm hover:scale-105 active:scale-95 transition-transform duration-200"
													>
														{loadingRequestId === user._id ? (
															<Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
														) : (
															<>
																<XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
																<span className="text-xs sm:text-sm">Reject</span>
															</>
														)}
													</button>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
					</div>
				)}

				{activeTab === "notifications" && (
					<div className="animate-fade-in">
					<div className="bg-base-100 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-6">
						<h2 className="text-base sm:text-xl font-semibold mb-3 sm:mb-4">Notifications</h2>
						
						<div className="space-y-3 sm:space-y-4">
							{/* Verification Status */}
							{authUser?.verificationRequest?.status && authUser.verificationRequest.status !== "none" && (
								<div className={`alert text-sm sm:text-base ${
									authUser.verificationRequest.status === "pending" ? "alert-warning" :
									authUser.verificationRequest.status === "approved" ? "alert-success" :
									"alert-error"
								}`}>
									<BadgeCheck className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
									<div className="flex-1 min-w-0">
										<h3 className="font-bold text-sm sm:text-base">Verification Request</h3>
										<p className="text-xs sm:text-sm mt-1">
											Status: <span className="font-semibold capitalize">{authUser.verificationRequest.status}</span>
										</p>
										{authUser.verificationRequest.status === "pending" && (
											<p className="text-xs sm:text-sm mt-2 opacity-90">
												⏳ Your verification request is being reviewed by our admin team.
											</p>
										)}
										{authUser.verificationRequest.status === "approved" && (
											<p className="text-xs sm:text-sm mt-2 opacity-90">
												🎉 Congratulations! Your account has been verified. You now have a verified badge on your profile.
											</p>
										)}
										{authUser.verificationRequest.status === "rejected" && (
											<div className="mt-2">
												<p className="text-xs sm:text-sm font-semibold mb-1">❌ Request Rejected</p>
												{authUser.verificationRequest.adminNote ? (
													<div className="bg-base-100/50 p-2 sm:p-3 rounded-lg mt-2">
														<p className="text-xs font-semibold mb-1">Admin's Response:</p>
														<p className="text-xs sm:text-sm">{authUser.verificationRequest.adminNote}</p>
													</div>
												) : (
													<p className="text-xs sm:text-sm opacity-90">Your request does not meet verification criteria.</p>
												)}
												<p className="text-xs mt-2 opacity-75">
													You can submit a new request after addressing the issues mentioned above.
												</p>
											</div>
										)}
										{authUser.verificationRequest.requestedAt && (
											<p className="text-xs mt-2 opacity-60">
												Requested: {new Date(authUser.verificationRequest.requestedAt).toLocaleDateString()}
											</p>
										)}
									</div>
								</div>
							)}

							{/* Account Status */}
							{authUser?.isSuspended && (
								<div className="alert alert-error text-sm sm:text-base">
									<XCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
									<div className="flex-1 min-w-0">
										<h3 className="font-bold text-sm sm:text-base">⚠️ Account Suspended</h3>
										<p className="text-xs sm:text-sm mt-1">
											Suspended Until: <span className="font-semibold">{new Date(authUser.suspendedUntil).toLocaleString()}</span>
										</p>
										{authUser.suspensionReason && (
											<div className="bg-base-100/50 p-2 sm:p-3 rounded-lg mt-2">
												<p className="text-xs font-semibold mb-1">Admin's Reason:</p>
												<p className="text-xs sm:text-sm">{authUser.suspensionReason}</p>
											</div>
										)}
										<p className="text-xs mt-2 opacity-75">
											You will be able to access your account again after the suspension period ends.
										</p>
									</div>
								</div>
							)}

							{/* Admin Notifications */}
							<AdminNotificationsList />

							{/* Welcome Message */}
							{!authUser?.verificationRequest?.status && !authUser?.isSuspended && (
								<div className="text-center py-8 sm:py-12">
									<Bell className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-base-content/30" />
									<p className="text-sm sm:text-base text-base-content/60">No notifications at the moment</p>
									<p className="text-xs sm:text-sm text-base-content/50 mt-2 px-4">
										You'll see important updates and messages here
									</p>
								</div>
							)}
						</div>
					</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default DiscoverPage;
