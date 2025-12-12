import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { axiosInstance } from "../lib/axios.js";
import { Search, Loader2, UserPlus, Users, Bell, UserCheck, CheckCircle, XCircle, BadgeCheck, Mail, Trash2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import VerifiedBadge from "../components/VerifiedBadge";
import CountryFlag from "../components/CountryFlag";
import { useFriendStore } from "../store/useFriendStore";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { getId } from "../utils/idHelper";

// Admin Notifications List Component
const AdminNotificationsList = () => {
	const { notifications, addNotification, clearNotification } = useNotificationStore();
	const [adminNotifications, setAdminNotifications] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	// Load notifications from backend on mount - OPTIMIZED with cache
	useEffect(() => {
		const loadNotifications = async () => {
			// Check cache first for instant load
			const cached = sessionStorage.getItem('adminNotifications');
			const cacheTime = sessionStorage.getItem('adminNotificationsTime');
			const now = Date.now();
			
			if (cached && cacheTime && (now - parseInt(cacheTime)) < 60000) {
				// Use cached data if less than 1 minute old
				const cachedNotifs = JSON.parse(cached);
				cachedNotifs.forEach(notif => {
					addNotification(notif);
				});
				setIsLoading(false);
				return;
			}
			
			try {
				const res = await axiosInstance.get("/users/notifications");
				const dbNotifications = res.data || [];
				if (import.meta.env.DEV) console.log(`📥 Loaded ${dbNotifications.length} notifications from DB`);
				
				const notificationsToAdd = [];
				// Add each notification to the store
				dbNotifications.forEach(notif => {
					const notifData = {
						type: notif.isBroadcast ? 'admin_broadcast' : 'admin',
						title: notif.title,
						message: notif.message,
						color: notif.color,
						notificationType: notif.type,
						createdAt: notif.createdAt,
						id: notif.id,
						dbId: notif.id,
					};
					addNotification(notifData);
					notificationsToAdd.push(notifData);
				});
				
				// Cache for 1 minute
				sessionStorage.setItem('adminNotifications', JSON.stringify(notificationsToAdd));
				sessionStorage.setItem('adminNotificationsTime', now.toString());
			} catch (error) {
				if (import.meta.env.DEV) console.error("Error loading notifications:", error);
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
			blue: 'border-base-content/20',
			yellow: 'border-warning',
			orange: 'border-warning',
		};
		return colorMap[color] || 'border-base-content/20';
	};

	const getTextColor = (color) => {
		const colorMap = {
			green: 'text-success',
			red: 'text-error',
			blue: 'text-base-content',
			yellow: 'text-warning',
			orange: 'text-warning',
		};
		return colorMap[color] || 'text-base-content';
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
			if (import.meta.env.DEV) console.log("Deleting notification:", notification);
			// Delete from backend if it has a DB ID
			if (notification.dbId) {
				if (import.meta.env.DEV) console.log(`Calling DELETE /users/notifications/${notification.dbId}`);
				await axiosInstance.delete(`/users/notifications/${notification.dbId}`);
				if (import.meta.env.DEV) console.log("Backend deletion successful");
			}
			// Remove from local store
			clearNotification(notification.id);
			toast.success("Notification deleted");
		} catch (error) {
			if (import.meta.env.DEV) {
				console.error("Error deleting notification:", error);
				console.error("Error response:", error.response?.data);
			}
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
	const { viewNotifications, getUnreadAdminCount } = useNotificationStore();
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [isLoadingSearch, setIsLoadingSearch] = useState(false);
	const [suggestedUsers, setSuggestedUsers] = useState([]);
	const [isLoadingSuggested, setIsLoadingSuggested] = useState(true);
	const [loadingRequestId, setLoadingRequestId] = useState(null);
	const [recentlyClicked, setRecentlyClicked] = useState(new Set());
	const [isProcessingRequest, setIsProcessingRequest] = useState(false);
	const [buttonStates, setButtonStates] = useState(new Map());
	

	const { pendingReceived, acceptRequest, rejectRequest, fetchFriendData, sendFriendRequest, getFriendshipStatus } = useFriendStore();
	const { authUser } = useAuthStore();
	const { notifications } = useNotificationStore();

	// Debug logging (development only)
	useEffect(() => {
		if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_DISCOVER) {
			console.log('🔍 DiscoverPage mounted');
			console.log('Auth user:', authUser);
			console.log('Suggested users:', suggestedUsers);
			console.log('Is loading:', isLoadingSuggested);
		}
	}, [authUser, suggestedUsers, isLoadingSuggested]);

	// Calculate notification counts for each tab (only unread)
	const unreadAdminCount = getUnreadAdminCount();
	const hasVerificationUpdate = authUser?.verificationRequest?.status && authUser.verificationRequest.status !== "none";
	const notificationCount = unreadAdminCount + (hasVerificationUpdate ? 1 : 0) + (authUser?.isSuspended ? 1 : 0);

	// Auto-mark notifications as read when viewing notifications tab
	useEffect(() => {
		if (activeTab === "notifications") {
			// Mark all as read after a short delay (Instagram-style)
			const timer = setTimeout(() => {
				viewNotifications();
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [activeTab, viewNotifications]);

	// Fetch friend data on mount - OPTIMIZED: only once
	useEffect(() => {
		fetchFriendData();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// Fetch suggested users on mount
	useEffect(() => {
		if (activeTab === "discover" && authUser?.id) {
			fetchSuggestedUsers();
		}
	}, [activeTab, authUser?.id]);

	const fetchSuggestedUsers = async () => {
		if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_DISCOVER) {
			console.log('📥 Fetching suggested users...');
		}
		// Check cache first
		const cached = sessionStorage.getItem('suggestedUsers');
		const cacheTime = sessionStorage.getItem('suggestedUsersTime');
		const now = Date.now();
		
		// Show cached data immediately (stale-while-revalidate pattern)
		if (cached) {
			if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_DISCOVER) {
				console.log('✅ Using cached suggested users');
			}
			try {
				const cachedUsers = JSON.parse(cached);
				// Filter out current user from cached data too
				const filteredCachedUsers = cachedUsers.filter(user => getId(user) !== authUser?.id);
				setSuggestedUsers(filteredCachedUsers);
				setIsLoadingSuggested(false);
			} catch (e) {
				console.error('Error parsing cached data:', e);
				sessionStorage.removeItem('suggestedUsers');
			}
			
			// If cache is fresh (< 2 min), don't refetch
			if (cacheTime && (now - parseInt(cacheTime)) < 120000) {
				if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_DISCOVER) {
					console.log('✅ Cache is fresh, skipping fetch');
				}
				return;
			}
		} else {
			setIsLoadingSuggested(true);
		}
		
		// Fetch fresh data in background
		try {
			if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_DISCOVER) {
				console.log('🌐 Fetching from API...');
			}
			const res = await axiosInstance.get("/users/suggested");
			const users = res.data || [];
			// Filter out the current user from suggestions
			const filteredUsers = users.filter(user => getId(user) !== authUser?.id);
			
			if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_DISCOVER) {
				console.log(`✅ Received ${users.length} suggested users, filtered to ${filteredUsers.length}:`, filteredUsers);
			}
			setSuggestedUsers(filteredUsers);
			// Cache for 2 minutes (matches backend cache)
			sessionStorage.setItem('suggestedUsers', JSON.stringify(filteredUsers));
			sessionStorage.setItem('suggestedUsersTime', now.toString());
		} catch (error) {
			console.error("❌ Error fetching suggested users:", error);
			console.error("Error response:", error.response?.data);
			// Keep showing cached data on error
			if (!cached) {
				toast.error("Failed to load suggested users");
			}
		} finally {
			setIsLoadingSuggested(false);
		}
	};

	// Handle sending friend request with proper event isolation and state management
	const handleSendFriendRequest = useCallback(async (userId, event) => {
		// Prevent event propagation and default behavior
		if (event) {
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
		}

		// Check if this specific button is already processing
		const currentButtonState = buttonStates.get(userId);
		if (currentButtonState?.isProcessing) {
			if (import.meta.env.DEV) console.log("🚫 Button-specific lock: Request already in progress for user:", userId);
			return;
		}

		// Global lock to prevent any friend request while one is processing
		if (isProcessingRequest) {
			if (import.meta.env.DEV) console.log("🚫 Global lock: Another friend request is already being processed");
			return;
		}

		// Prevent multiple requests for the same user
		if (loadingRequestId === userId || recentlyClicked.has(userId)) {
			if (import.meta.env.DEV) console.log("🚫 User-specific lock: Request already in progress or recently clicked for user:", userId);
			return;
		}

		try {
			if (import.meta.env.DEV) console.log("✅ Sending friend request to user:", userId);
			
			// Set button-specific state
			setButtonStates(prev => new Map(prev.set(userId, { isProcessing: true, timestamp: Date.now() })));
			
			// Set global lock immediately
			setIsProcessingRequest(true);
			
			// Add to recently clicked set to prevent rapid clicks
			setRecentlyClicked(prev => new Set([...prev, userId]));
			setLoadingRequestId(userId);
			
			// Send the friend request (toast is handled in the store)
			const success = await sendFriendRequest(userId);
			
		} catch (error) {
			console.error("❌ Error sending friend request:", error);
			toast.error("Failed to send friend request");
			
			// Remove from recently clicked on error
			setRecentlyClicked(prev => {
				const newSet = new Set(prev);
				newSet.delete(userId);
				return newSet;
			});
		} finally {
			// Clear button-specific state
			setButtonStates(prev => {
				const newMap = new Map(prev);
				newMap.delete(userId);
				return newMap;
			});
			
			// Always clear the loading state for this specific user
			setLoadingRequestId(null);
			
			// Release global lock after a short delay to prevent rapid successive clicks
			setTimeout(() => {
				setIsProcessingRequest(false);
			}, 300);
			
			// Remove from recently clicked after a longer delay
			setTimeout(() => {
				setRecentlyClicked(prev => {
					const newSet = new Set(prev);
					newSet.delete(userId);
					return newSet;
				});
			}, 2000);
		}
	}, [isProcessingRequest, loadingRequestId, recentlyClicked, sendFriendRequest, buttonStates]);

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

	// Get button configuration based on friendship status - Memoized for performance
	const getButtonConfig = useCallback((userId) => {
		const friendshipStatus = getFriendshipStatus(userId);
		const isCurrentUserLoading = loadingRequestId === userId;
		const isButtonProcessing = buttonStates.get(userId)?.isProcessing;
		const isRecentlyClicked = recentlyClicked.has(userId);
		
		switch (friendshipStatus) {
			case "FRIENDS":
				return {
					text: "Friends",
					icon: UserCheck,
					className: "btn-success",
					disabled: true,
					onClick: null
				};
			case "REQUEST_SENT":
				return {
					text: "Request Sent",
					icon: UserCheck,
					className: "btn-outline",
					disabled: true,
					onClick: null
				};
			case "REQUEST_RECEIVED":
				return {
					text: "Accept Request",
					icon: UserCheck,
					className: "btn-success",
					disabled: isCurrentUserLoading || isProcessingRequest,
					onClick: (e) => {
						e.preventDefault();
						e.stopPropagation();
						handleAccept(userId);
					}
				};
			case "NOT_FRIENDS":
			default:
				return {
					text: isCurrentUserLoading ? "Sending..." : "Add Friend",
					icon: isCurrentUserLoading ? Loader2 : UserPlus,
					className: "btn-primary",
					disabled: isProcessingRequest || isCurrentUserLoading || isRecentlyClicked || isButtonProcessing,
					onClick: (e) => handleSendFriendRequest(userId, e)
				};
		}
	}, [getFriendshipStatus, loadingRequestId, buttonStates, recentlyClicked, isProcessingRequest, handleSendFriendRequest, handleAccept]);

	return (
		<div className="min-h-screen pt-14 xs:pt-16 sm:pt-18 md:pt-20 pb-16 xs:pb-18 sm:pb-20 md:pb-10 px-2 xs:px-3 sm:px-4 bg-base-200">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="bg-base-100 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
					<div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
						<Users className="w-6 h-6 sm:w-8 sm:h-8 text-base-content flex-shrink-0" />
						<h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-base-content via-warning to-base-content bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">Social Hub</h1>
					</div>
					<p className="text-sm sm:text-base text-base-content/70">
						Discover users, manage requests, and stay updated
					</p>
				</div>

				{/* Tabs */}
				<div className="bg-base-100 rounded-lg sm:rounded-xl shadow-lg mb-4 sm:mb-6 overflow-hidden">
					<div className="flex border-b border-base-300 relative">
						{/* Animated underline - uses theme primary color */}
						<div 
							className="absolute bottom-0 h-0.5 transition-all duration-300 ease-out"
							style={{
								width: '33.333%',
								transform: `translateX(${activeTab === 'discover' ? '0%' : activeTab === 'requests' ? '100%' : '200%'})`,
								backgroundColor: 'hsl(var(--p))'
							}}
						/>
						
						<button
							onClick={() => setActiveTab("discover")}
							className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-4 font-semibold transition-all duration-300 text-xs sm:text-base relative ${
								activeTab === "discover"
									? "text-base-content scale-105"
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
									? "text-base-content scale-105"
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
							onClick={() => setActiveTab("notifications")}
							className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-4 font-semibold transition-all duration-300 relative text-xs sm:text-base ${
								activeTab === "notifications"
									? "text-base-content scale-105"
									: "text-base-content/60 hover:text-base-content hover:bg-base-200/50"
							}`}
						>
							<Bell className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${activeTab === "notifications" ? "scale-110" : ""}`} />
							<span>Notifications</span>
							{notificationCount > 0 && activeTab !== "notifications" && (
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
									{[...Array(4)].map((_, i) => (
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
									{displayUsers.map((user) => {
										const userId = getId(user);
										return (
										<div
											key={userId}
											className="card bg-base-200 hover:bg-base-300 transition-all duration-200 border border-base-300"
										>
											<div className="card-body p-3 sm:p-4">
												<div className="flex items-start gap-3 sm:gap-4">
													<Link to={`/profile/${user.username}`} className="flex-shrink-0 relative">
														<div className="avatar">
															<div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full ring-2 ring-primary ring-offset-base-100 ring-offset-1 sm:ring-offset-2">
																<img
																	src={user.profilePic || "/default-avatar.png"}
																	alt={user.username}
																/>
															</div>
														</div>
														{user.isOnline && (
															<span className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-success rounded-full ring-2 ring-base-100 animate-pulse" />
														)}
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
																<Eye className="w-3 h-3 sm:w-4 sm:h-4" />
																<span className="text-xs sm:text-sm">View Profile</span>
															</Link>
														</div>
													</div>
												</div>
											</div>
										</div>
										);
									})}
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
										key={getId(user)}
										className="card bg-base-200 border border-base-300 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
									>
										<div className="card-body p-3 sm:p-4">
											<div className="flex items-center gap-3 sm:gap-4">
												<Link to={`/profile/${user.username}`} className="flex-shrink-0 relative">
													<div className="avatar">
														<div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full ring-2 ring-primary ring-offset-base-100 ring-offset-1 sm:ring-offset-2">
															<img
																src={user.profilePic || "/default-avatar.png"}
																alt={user.username}
															/>
														</div>
													</div>
													{user.isOnline && (
														<span className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-success rounded-full ring-2 ring-base-100 animate-pulse" />
													)}
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
														onClick={() => handleAccept(getId(user))}
														disabled={loadingRequestId === getId(user)}
														className="btn btn-success btn-xs sm:btn-sm hover:scale-105 active:scale-95 transition-transform duration-200"
													>
														{loadingRequestId === getId(user) ? (
															<Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
														) : (
															<>
																<CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
																<span className="text-xs sm:text-sm">Accept</span>
															</>
														)}
													</button>
													<button
														onClick={() => handleReject(getId(user))}
														disabled={loadingRequestId === getId(user)}
														className="btn btn-ghost btn-xs sm:btn-sm hover:scale-105 active:scale-95 transition-transform duration-200"
													>
														{loadingRequestId === getId(user) ? (
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
											Suspended Until: <span className="font-semibold">{new Date(authUser.suspensionEndTime).toLocaleString()}</span>
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
