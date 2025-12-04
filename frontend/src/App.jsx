import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useCallback } from "react";
import { Loader } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

import Navbar from "./components/Navbar";
import OfflineIndicator from "./components/OfflineIndicator";
import PermissionHandler from "./components/PermissionHandler";

// Pages
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SetupProfilePage from "./pages/SetupProfilePage";
import SettingsPage from "./pages/SettingsPage";
import MyProfilePage from "./pages/ProfilePage";
import PublicProfilePage from "./pages/PublicProfilePage";
import StrangerChatPage from "./pages/StrangerChatPage"; 
import AdminDashboard from "./pages/AdminDashboard";
import DiscoverPage from "./pages/DiscoverPage";
import SuspendedPage from "./pages/SuspendedPage";
import GoodbyePage from "./pages/GoodbyePage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
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
	const navigate = useNavigate();

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
	}, [checkAuth]);
	
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
			console.log("📥 Received friendRequest:received event:", senderProfileData);
			console.log("Current pendingReceived before add:", useFriendStore.getState().pendingReceived);
			addPendingReceived(senderProfileData);
			console.log("Current pendingReceived after add:", useFriendStore.getState().pendingReceived);
		});

		socket.on("friendRequest:accepted", ({ user, message }) => {
			console.log("✅ Friend request accepted:", user);
			toast.success(message || `${user.nickname || user.username} accepted your friend request!`);
			// Refresh friend data to update sidebar
			useFriendStore.getState().fetchFriendData();
		});

		socket.on("friendRequest:rejected", ({ message }) => {
			console.log("❌ Friend request rejected");
			toast.error(message || "Your friend request was declined");
			// Refresh friend data to update sent requests
			useFriendStore.getState().fetchFriendData();
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
		};
	// Added addPendingReceived to dependencies
	}, [socket, authUser, navigate, forceLogout, theme, addPendingReceived]); 

	// Show loader while checking auth
	if (isCheckingAuth) {
		return (
			<div className="flex items-center justify-center h-screen">
				<Loader className="size-10 animate-spin" />
			</div>
		);
	}

	const hasCompletedProfile = authUser?.hasCompletedProfile;

	return (
		<div data-theme={theme} className="pt-14 md:pt-16">
			{/* Offline Indicator */}
			<OfflineIndicator />
			
			{/* Permission Handler for Camera/Mic */}
			{authUser && hasCompletedProfile && <PermissionHandler />}
			
			{/* Navbar */}
			{hasCompletedProfile && window.location.pathname !== "/stranger" && <Navbar />}

			<Routes>
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

				{/* --- Protected Routes (unchanged) --- */}
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
			</Routes>

			<Toaster position="top-center" />
		</div>
	);
};

export default App;
