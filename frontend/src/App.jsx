import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useCallback, lazy, Suspense, useState } from "react";
import { Toaster, toast } from "react-hot-toast";

// ✅ CRITICAL IMPORTS: Import essential components directly to prevent loading errors
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import SetupProfilePage from "./pages/SetupProfilePage";
import Navbar from "./components/Navbar";
import PermissionHandler from "./components/PermissionHandler";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy load non-critical pages for performance
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ChangePasswordPage = lazy(() => import("./pages/ChangePasswordPage"));
const MyProfilePage = lazy(() => import("./pages/ProfilePage"));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage"));
const StrangerChatPage = lazy(() => import("./pages/StrangerChatPage"));
const StrangerChatSettings = lazy(() => import("./pages/StrangerChatSettings"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage"));
const SuspendedPage = lazy(() => import("./pages/SuspendedPage"));
const BlockedPage = lazy(() => import("./pages/BlockedPage"));
const GoodbyePage = lazy(() => import("./pages/GoodbyePage"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const DebugPage = lazy(() => import("./pages/DebugPage"));
const MessageDiagnosticPage = lazy(() => import("./pages/MessageDiagnosticPage"));

import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { initSmoothScroll, destroySmoothScroll } from "./utils/smoothScroll";
import { useFriendStore } from "./store/useFriendStore"; // ✅ 1. Import Friend Store
import { useChatStore } from "./store/useChatStore"; // 🔥 Import Chat Store for global message handling
import { useSettingsStore } from "./store/useSettingsStore"; // ✅ Import Settings Store
import { useProductionOptimizations } from "./utils/performanceOptimizer.production"; // ✅ Restore missing import

const App = () => {
	const { authUser, checkAuth, isCheckingAuth, socket, setAuthUser } = useAuthStore();
	const { theme } = useThemeStore();
	const { settings, fetchSettings } = useSettingsStore(); // ✅ Get settings
	// ✅ 2. Get the action to update the pending received requests
	const addPendingReceived = useFriendStore((state) => state.addPendingReceived);
	const fetchFriendData = useFriendStore((state) => state.fetchFriendData);
	const navigate = useNavigate();

	// ✅ Fetch global settings on mount
	useEffect(() => {
		fetchSettings();
	}, [fetchSettings]);

	// ✅ Determine effective theme (Seasonal > Local > Global Default)
	// ✅ Determine effective theme (Seasonal > Local > Global Default)
	const effectiveTheme = settings?.isSeasonalMode && settings?.seasonalTheme
		? settings.seasonalTheme
		: theme !== "dark" && theme !== "light" && localStorage.getItem("chat-theme") // Use specific user choice if it exists
			? theme
			: settings?.defaultTheme || theme; // Fallback to global default or store default

	// ✅ Sync theme to HTML tag (Critical for background color on mobile overscroll)
	useEffect(() => {
		document.documentElement.setAttribute("data-theme", effectiveTheme);
	}, [effectiveTheme]);


	const forceLogout = useCallback(
		(message, redirect = "/login") => {
			setAuthUser(null);
			toast.error(message);
			navigate(redirect);
		},
		[navigate, setAuthUser]
	);

	useEffect(() => {
		checkAuth();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// 🚀 PRODUCTION OPTIMIZATIONS
	useProductionOptimizations();

	// Performance optimizations are now built-in to components

	// Initialize Lenis smooth scrolling
	useEffect(() => {
		const lenis = initSmoothScroll();
		return () => destroySmoothScroll();
	}, []);

	// Fetch friend data when user is authenticated
	useEffect(() => {
		if (authUser?.id) {
			fetchFriendData();
		}
	}, [authUser?.id, fetchFriendData]);

	useEffect(() => {
		if (authUser?.isSuspended && window.location.pathname !== "/suspended") {
			navigate("/suspended");
		}
	}, [authUser, navigate]);

	// --- MAIN SOCKET LISTENER EFFECT ---
	// ✅ FIXED: Only register once when socket connects
	useEffect(() => {
		if (!socket || !authUser?.id) return;

		// Register user on connect
		const handleConnect = () => {
			console.log('🔌 Socket connected, registering user:', authUser.id);
			socket.emit("register-user", authUser.id);
		};

		// Register immediately if already connected
		if (socket.connected) {
			handleConnect();
		}

		// Listen for reconnections
		socket.on('connect', handleConnect);

		// ✅ NEW: Setup real-time listeners for friend store
		const { setupRealtimeListeners } = useFriendStore.getState();
		setupRealtimeListeners();

		// 1. User/Admin actions listener
		socket.on("user-action", ({ type, reason, until }) => {
			switch (type) {
				case "suspended":
					forceLogout(
						`⛔ Suspended until ${new Date(until).toLocaleString()}. Reason: ${reason}`,
						"/suspended"
					);
					break;
				case "unsuspended":
					toast.success("✅ Suspension lifted. Please log in again.");
					navigate("/login");
					break;
				case "blocked":
					forceLogout("🚫 You have been blocked by admin.", "/blocked");
					break;
				case "unblocked":
					toast.success("✅ You’ve been unblocked. Please log in again.");
					navigate("/login");
					break;
				case "deleted":
					forceLogout("❌ Your account has been deleted.", "/goodbye");
					break;
				default:
					break;
			}
		});

		// 2. Message listener - ✅ FIX: Add to notification store
		socket.on("message-received", ({ sender, text }) => {
			if (sender?.id !== authUser?.id) {
				// Show toast
				showMessageToast({
					senderName: sender?.name || "Unknown",
					senderAvatar: sender?.profilePic || "/default-avatar.png",
					messageText: text || "",
					theme: effectiveTheme, // ✅ Update to use effectiveTheme
				});

				// ✅ FIX: Add to notification store for persistence
				const { addNotification } = useNotificationStore.getState();
				addNotification({
					type: 'message',
					title: sender?.name || sender?.nickname || "New Message",
					message: text || "Sent you a message",
					senderId: sender?.id,
					senderAvatar: sender?.profilePic,
					createdAt: new Date().toISOString(),
					id: `msg-${Date.now()}-${sender?.id}`
				});
			}
		});

		// 🔥 GLOBAL: Additional message listener to catch all real-time messages
		socket.on("newMessage", (messageData) => {
			console.log('🌍 GLOBAL: newMessage received in App.jsx:', messageData);

			// Force chat store to handle this message if it's not already handled
			const { messages, selectedUser } = useChatStore.getState();
			const authUserId = authUser?.id;
			const msgSenderId = messageData.senderId?.toString();
			const msgReceiverId = messageData.receiverId?.toString();

			// If this is for the current chat and not from me, ensure it's added
			if (selectedUser && msgSenderId !== authUserId &&
				(msgSenderId === selectedUser.id || msgReceiverId === selectedUser.id)) {

				const messageExists = messages.some(m => m.id === messageData.id);
				if (!messageExists) {
					console.log('🔥 GLOBAL: Adding missed message to chat store');
					const updatedMessages = [...messages, messageData];
					useChatStore.setState({ messages: updatedMessages });
				}
			}
		});

		// 3. Friend request listeners
		socket.on("friendRequest:received", (senderProfileData) => {
			addPendingReceived(senderProfileData);
		});

		socket.on("friendRequest:accepted", ({ user, message }) => {
			console.log("🎉 Friend request accepted event received:", user);
			toast.success(message || `${user.nickname || user.username} accepted your friend request!`);
			console.log("🔄 Fetching updated friend data...");
			useFriendStore.getState().fetchFriendData();
		});

		socket.on("friendRequest:rejected", ({ message }) => {
			toast.error(message || "Your friend request was declined");
			useFriendStore.getState().fetchFriendData();
		});

		// Admin notification listeners
		socket.on("admin-notification", (notification) => {
			toast(notification.message, {
				icon: notification.type === 'success' ? '✅' :
					notification.type === 'error' ? '❌' :
						notification.type === 'warning' ? '⚠️' : 'ℹ️',
				duration: 5000,
			});
			// Store notification for Social Hub
			const { addNotification } = useNotificationStore.getState();
			addNotification({
				type: 'admin',
				title: notification.title,
				message: notification.message,
				color: notification.color,
				notificationType: notification.type,
				createdAt: notification.createdAt,
				id: notification.id,
				dbId: notification.id,
			});
		});

		socket.on("admin-broadcast", (notification) => {
			toast(notification.message, {
				icon: notification.type === 'success' ? '✅' :
					notification.type === 'error' ? '❌' :
						notification.type === 'warning' ? '⚠️' : 'ℹ️',
				duration: 5000,
			});
			// Store notification for Social Hub
			const { addNotification } = useNotificationStore.getState();
			addNotification({
				type: 'admin_broadcast',
				title: notification.title,
				message: notification.message,
				color: notification.color,
				notificationType: notification.type,
				createdAt: notification.createdAt,
				id: notification.id,
				dbId: notification.id,
			});
		});

		// 4. Verification notifications
		socket.on("verification-approved", ({ message }) => {
			toast.success(message || "Your verification request has been approved!");
			// ✅ FIXED: Update localStorage first to prevent race condition
			const updatedUser = {
				...authUser,
				isVerified: true,
				verificationRequest: {
					...authUser.verificationRequest,
					status: "approved",
					reviewedAt: new Date()
				}
			};
			localStorage.setItem("authUser", JSON.stringify(updatedUser));
			setAuthUser(updatedUser);
		});

		socket.on("verification-rejected", ({ message, reason }) => {
			toast.error(message || "Your verification request has been rejected");
			if (reason) {
				toast.error(`Reason: ${reason}`, { duration: 5000 });
			}
			// ✅ FIXED: Update localStorage first to prevent race condition
			const updatedUser = {
				...authUser,
				isVerified: false,
				verificationRequest: {
					...authUser.verificationRequest,
					status: "rejected",
					adminNote: reason || "Does not meet verification criteria",
					reviewedAt: new Date()
				}
			};
			localStorage.setItem("authUser", JSON.stringify(updatedUser));
			setAuthUser(updatedUser);
		});

		// 5. Report status notifications (FIXED: removed duplicate)
		socket.on("report-status-updated", ({ title, message, status, actionTaken, reportedUser }) => {
			// Show toast notification
			if (status === "action_taken") {
				toast.success(`${title}: ${message}`, { duration: 6000 });
			} else {
				toast(message, { icon: "📋", duration: 5000 });
			}

			// Add to notification store
			const { addNotification } = useNotificationStore.getState();
			addNotification({
				type: "report_update",
				title,
				message,
				status,
				actionTaken,
				reportedUser,
			});
		});

		// 6. Cleanup
		return () => {
			socket.off('connect', handleConnect); // ✅ FIXED: Cleanup connect listener
			socket.off("user-action");
			socket.off("message-received");
			socket.off("friendRequest:received");
			socket.off("friendRequest:accepted");
			socket.off("friendRequest:rejected");
			socket.off("verification-approved");
			socket.off("verification-rejected");
			socket.off("report-status-updated");
			socket.off("admin-notification");
			socket.off("admin-broadcast");
		};
		// ✅ FIXED: Only depend on socket and authUser.id to prevent duplicate listeners
	}, [socket, authUser?.id, navigate, forceLogout, effectiveTheme, addPendingReceived, setAuthUser]); // ✅ Depend on effectiveTheme

	const hasCompletedProfile = authUser?.hasCompletedProfile;

	// ✅ FIXED: Loading screen uses theme background color (same as navbar)
	const LoadingScreen = () => (
		<div className="fixed inset-0 flex items-center justify-center bg-base-100">
			<div className="flex flex-col items-center gap-3">
				<div style={{
					width: '50px',
					height: '50px',
					border: '3px solid rgba(255, 153, 51, 0.2)',
					borderTopColor: '#FF9933',
					borderRadius: '50%',
					animation: 'spin 0.8s linear infinite'
				}}></div>
				<p className="text-base-content/70 text-sm">Loading...</p>
			</div>
			<style>{`
				@keyframes spin {
					to { transform: rotate(360deg); }
				}
			`}</style>
		</div>
	);

	// Show loading spinner while checking auth to prevent flash
	if (isCheckingAuth) {
		return <LoadingScreen />;
	}

	// ✅ FIXED: Pages where Navbar should be hidden
	const hideNavbarPaths = ["/stranger", "/suspended", "/blocked", "/goodbye"];
	const shouldShowNavbar = hasCompletedProfile && !hideNavbarPaths.includes(window.location.pathname);

	return (
		<div data-theme={effectiveTheme} className={`min-h-screen bg-base-100 ${shouldShowNavbar ? "pt-14 md:pt-16" : ""}`}>
			<ErrorBoundary>
				{authUser && hasCompletedProfile && <PermissionHandler />}
				{shouldShowNavbar && <Navbar />}
			</ErrorBoundary>

			<Suspense fallback={<LoadingScreen />}>
				<ErrorBoundary>
					<Routes location={location} key={location.pathname}>
						{/* --- Auth Routes --- */}
						<Route
							path="/signup"
							element={!authUser ? <SignUpPage /> : <Navigate to="/" />}
						/>
						<Route
							path="/login"
							element={!authUser ? <LoginPage /> : <Navigate to="/" />}
						/>
						<Route
							path="/forgot-password"
							element={!authUser ? <ForgotPassword /> : <Navigate to="/" />}
						/>
						<Route
							path="/reset-password/:token"
							element={!authUser ? <ResetPassword /> : <Navigate to="/" />}
						/>

						{/* --- Onboarding Route --- */}
						<Route
							path="/setup-profile"
							element={
								!authUser ? (
									<Navigate to="/login" />
								) : hasCompletedProfile ? (
									<Navigate to="/" />
								) : (
									<SetupProfilePage />
								)
							}
						/>

						{/* --- Protected Routes --- */}
						<Route
							path="/"
							element={
								!authUser ? (
									<Navigate to="/login" />
								) : !hasCompletedProfile ? (
									<Navigate to="/setup-profile" />
								) : (
									<HomePage />
								)
							}
						/>
						<Route
							path="/settings"
							element={
								!authUser ? (
									<Navigate to="/login" />
								) : !hasCompletedProfile ? (
									<Navigate to="/setup-profile" />
								) : (
									<SettingsPage />
								)
							}
						/>
						<Route
							path="/change-password"
							element={
								!authUser ? (
									<Navigate to="/login" />
								) : !hasCompletedProfile ? (
									<Navigate to="/setup-profile" />
								) : (
									<ChangePasswordPage />
								)
							}
						/>
						<Route
							path="/profile/:username"
							element={
								!authUser ? (
									<Navigate to="/login" />
								) : !hasCompletedProfile ? (
									<Navigate to="/setup-profile" />
								) : (
									<PublicProfilePage />
								)
							}
						/>
						<Route
							path="/profile"
							element={
								!authUser ? (
									<Navigate to="/login" />
								) : !hasCompletedProfile ? (
									<Navigate to="/setup-profile" />
								) : (
									<MyProfilePage />
								)
							}
						/>
						<Route
							path="/admin"
							element={
								!authUser ? (
									<Navigate to="/login" />
								) : !hasCompletedProfile ? (
									<Navigate to="/setup-profile" />
								) : authUser.isAdmin ? (
									<AdminDashboard />
								) : (
									<Navigate to="/" />
								)
							}
						/>

						{/* Discover Users Page */}
						<Route
							path="/discover"
							element={
								!authUser ? (
									<Navigate to="/login" />
								) : !hasCompletedProfile ? (
									<Navigate to="/setup-profile" />
								) : (
									<DiscoverPage />
								)
							}
						/>

						{/* Stranger Chat Settings route */}
						<Route
							path="/stranger-settings"
							element={
								!authUser ? (
									<Navigate to="/login" />
								) : !hasCompletedProfile ? (
									<Navigate to="/setup-profile" />
								) : (
									<StrangerChatSettings />
								)
							}
						/>

						{/* Stranger Chat route */}
						<Route
							path="/stranger"
							element={
								!authUser ? (
									<Navigate to="/login" />
								) : !hasCompletedProfile ? (
									<Navigate to="/setup-profile" />
								) : (
									<StrangerChatPage />
								)
							}
						/>

						{/* --- Special Pages --- */}
						<Route path="/suspended" element={<SuspendedPage />} />
						<Route path="/goodbye" element={<GoodbyePage />} />
						<Route path="/blocked" element={<BlockedPage />} /> {/* ✅ FIXED: Use BlockedPage */}
						<Route path="/debug" element={<DebugPage />} />
						<Route path="/message-diagnostic" element={<MessageDiagnosticPage />} />
					</Routes>
				</ErrorBoundary>
			</Suspense>

			<Toaster position="top-center" toastOptions={{
				duration: 3000,
				style: {
					maxWidth: '500px',
				},
			}} />
		</div>
	);
};

export default App;
