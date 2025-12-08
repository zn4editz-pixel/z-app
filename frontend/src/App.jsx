import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useCallback, lazy, Suspense } from "react";
import { Toaster, toast } from "react-hot-toast";

// Lazy load ALL pages for faster initial load
const HomePage = lazy(() => import("./pages/HomePage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SetupProfilePage = lazy(() => import("./pages/SetupProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ChangePasswordPage = lazy(() => import("./pages/ChangePasswordPage"));
const MyProfilePage = lazy(() => import("./pages/ProfilePage"));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage"));
const StrangerChatPage = lazy(() => import("./pages/StrangerChatPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage"));
const SuspendedPage = lazy(() => import("./pages/SuspendedPage"));
const GoodbyePage = lazy(() => import("./pages/GoodbyePage"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const DebugPage = lazy(() => import("./pages/DebugPage"));

// Lazy load components
const Navbar = lazy(() => import("./components/Navbar"));
const OfflineIndicator = lazy(() => import("./components/OfflineIndicator"));
const PermissionHandler = lazy(() => import("./components/PermissionHandler"));
const ConnectionStatus = lazy(() => import("./components/ConnectionStatus"));

import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { initSmoothScroll, destroySmoothScroll } from "./utils/smoothScroll";
import { useFriendStore } from "./store/useFriendStore"; // ✅ 1. Import Friend Store
import { useNotificationStore } from "./store/useNotificationStore";

// Toast UI (no changes)
const showMessageToast = ({ senderName, senderAvatar, messageText, theme }) => {
	toast.custom(
		(t) => (
			<div
				className={`flex items-center gap-3 p-3 rounded-xl shadow-lg transition-all duration-300
         ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"}
         ${t.visible ? "opacity-100" : "opacity-0"}
        `}
			>
				<img
					src={senderAvatar}
					alt={senderName}
					className="w-10 h-10 rounded-full object-cover border border-gray-300"
				/>
				<div className="flex flex-col max-w-[200px]">
					<span className="font-semibold truncate">{senderName}</span>
					<span className="text-sm opacity-80 truncate">{messageText}</span>
				</div>
			</div>
		),
		{
			id: `msg-${Date.now()}`,
			duration: 4000,
		}
	);
};

const App = () => {
	const { authUser, checkAuth, isCheckingAuth, socket, setAuthUser } = useAuthStore();
	const { theme } = useThemeStore();
	// ✅ 2. Get the action to update the pending received requests
	const addPendingReceived = useFriendStore((state) => state.addPendingReceived);
	const fetchFriendData = useFriendStore((state) => state.fetchFriendData);
	const navigate = useNavigate();
	const location = useLocation();

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
	
	// Initialize Lenis smooth scrolling
	useEffect(() => {
		const lenis = initSmoothScroll();
		return () => destroySmoothScroll();
	}, []);
	
	// Fetch friend data when user is authenticated
	useEffect(() => {
		if (authUser?._id) {
			fetchFriendData();
		}
	}, [authUser?._id, fetchFriendData]);
	
	useEffect(() => {
		if (authUser?.isSuspended && window.location.pathname !== "/suspended") {
			navigate("/suspended");
		}
	}, [authUser, navigate]);
	
	// --- MAIN SOCKET LISTENER EFFECT ---
	useEffect(() => {
		if (!socket || !authUser?._id) return;

		// Initial registration
		socket.emit("register-user", authUser._id);

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

		// 2. Message listener
		socket.on("message-received", ({ sender, text }) => {
			if (sender?._id !== authUser?._id) {
				showMessageToast({
					senderName: sender?.name || "Unknown",
					senderAvatar: sender?.profilePic || "/default-avatar.png",
					messageText: text || "",
					theme,
				});
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
				id: notification._id || notification.id, // Use DB ID
				dbId: notification._id || notification.id, // Store for deletion
				_id: notification._id || notification.id,
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
				id: notification._id || notification.id, // Use DB ID
				dbId: notification._id || notification.id, // Store for deletion
				_id: notification._id || notification.id,
			});
		});

		// 4. Verification notifications
		socket.on("verification-approved", ({ message }) => {
			toast.success(message || "Your verification request has been approved!");
			// Update authUser state immediately
			const updatedUser = {
				...authUser,
				isVerified: true,
				verificationRequest: {
					...authUser.verificationRequest,
					status: "approved",
					reviewedAt: new Date()
				}
			};
			setAuthUser(updatedUser);
			// Also update localStorage to persist the change
			localStorage.setItem("authUser", JSON.stringify(updatedUser));
		});

		socket.on("verification-rejected", ({ message, reason }) => {
			toast.error(message || "Your verification request has been rejected");
			if (reason) {
				toast.error(`Reason: ${reason}`, { duration: 5000 });
			}
			// Update authUser state immediately
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
			setAuthUser(updatedUser);
			// Also update localStorage to persist the change
			localStorage.setItem("authUser", JSON.stringify(updatedUser));
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
	// Added addPendingReceived to dependencies
	}, [socket, authUser, navigate, forceLogout, theme, addPendingReceived]); 

	// Show loading spinner while checking auth to prevent flash
	if (isCheckingAuth) {
		return (
			<div style={{
				position: 'fixed',
				inset: 0,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: '#1a1a1a'
			}}>
				<div className="spinner" style={{
					width: '50px',
					height: '50px',
					border: '3px solid rgba(255, 153, 51, 0.2)',
					borderTopColor: '#FF9933',
					borderRadius: '50%',
					animation: 'spin 0.8s linear infinite'
				}}></div>
				<style>{`
					@keyframes spin {
						to { transform: rotate(360deg); }
					}
				`}</style>
			</div>
		);
	}

	const hasCompletedProfile = authUser?.hasCompletedProfile;

	// Minimal loading fallback
	const PageLoader = () => (
		<div className="flex items-center justify-center h-screen bg-base-200">
			<div className="flex flex-col items-center gap-3">
				<div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
				<p className="text-sm text-base-content/60">Loading...</p>
			</div>
		</div>
	);

	return (
		<div data-theme={theme} className="pt-14 md:pt-16">
			<Suspense fallback={null}>
				<ConnectionStatus />
				<OfflineIndicator />
				{authUser && hasCompletedProfile && <PermissionHandler />}
				{hasCompletedProfile && window.location.pathname !== "/stranger" && <Navbar />}
			</Suspense>

			<Suspense fallback={<PageLoader />}>
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
				
				{/* Stranger Chat route (unchanged) */}
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

				{/* --- Special Pages (unchanged) --- */}
				<Route path="/suspended" element={<SuspendedPage />} />
				<Route path="/goodbye" element={<GoodbyePage />} />
				<Route path="/blocked" element={<GoodbyePage />} />
				<Route path="/debug" element={<DebugPage />} />
					</Routes>
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
