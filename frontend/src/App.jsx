import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useEffect, useCallback, lazy, Suspense, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
// 🔧 CRITICAL FIX: Import message status visibility CSS
import "./styles/message-status-fix.css";
// ✅ CRITICAL IMPORTS: Import essential components directly to prevent loading errors
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import SetupProfilePage from "./pages/SetupProfilePage";
import Navbar from "./components/Navbar";
// PermissionHandler removed as per user request to only ask on feature usage
import ErrorBoundary from "./components/ErrorBoundary";
import SOSBoard from "./components/game/SOSBoard"; // ✅ Game Board Overlay
import GlobalCallUI from "./components/GlobalCallUI"; // ✅ Global Call UI Manager
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
const MessageDiagnosticPage = lazy(
  () => import("./pages/MessageDiagnosticPage"),
);
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useNotificationStore } from "./store/useNotificationStore"; // ✅ FIX: Add missing import
import { showMessageToast } from "./components/ToastNotification"; // ✅ FIX: Add missing import
import { initSmoothScroll, destroySmoothScroll } from "./utils/smoothScroll";
import { useFriendStore } from "./store/useFriendStore"; // ✅ 1. Import Friend Store
import { useChatStore } from "./store/useChatStore"; // 🔥 Import Chat Store for global message handling
import { useSettingsStore } from "./store/useSettingsStore"; // ✅ Import Settings Store
import { useProductionOptimizations } from "./utils/performanceOptimizer.production"; // ✅ Restore missing import
import { useSocketListeners } from "./hooks/useSocketListeners"; // ✅ NEW: Centralized socket listeners hook
import { initMobileEnhancements } from "./utils/mobileEnhancements"; // ✅ NEW: Mobile enhancements
const App = () => {
  const {
    authUser,
    checkAuth,
    isCheckingAuth,
    onlineUsers,
    initNetworkListeners,
    socket,
    setAuthUser,
  } = useAuthStore();
  const { theme } = useThemeStore();
  const { settings, fetchSettings } = useSettingsStore(); // ✅ Get settings
  // ✅ 2. Get the action to update the pending received requests
  const addPendingReceived = useFriendStore(
    (state) => state.addPendingReceived,
  );
  const fetchFriendData = useFriendStore((state) => state.fetchFriendData);
  const navigate = useNavigate();
  const location = useLocation();
  // ✅ CRITICAL FIX: Move all useState hooks to the top to fix React Hooks order
  const [isMobile, setIsMobile] = useState(false);
  const { selectedUser } = useChatStore();
  // ✅ Fetch global settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
  // ✅ Determine effective theme (Seasonal > Local > Global Default)
  // ✅ Determine effective theme (Seasonal > Local > Global Default)
  const effectiveTheme =
    settings?.isSeasonalMode && settings?.seasonalTheme
      ? settings.seasonalTheme
      : theme !== "dark" &&
        theme !== "light" &&
        localStorage.getItem("chat-theme") // Use specific user choice if it exists
        ? theme
        : settings?.defaultTheme || theme; // Fallback to global default or store default
  // ✅ Sync theme to HTML tag (Critical for background color on mobile overscroll)
  useEffect(() => {
    // Only update if theme actually changed to prevent flash
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme !== effectiveTheme) {
      document.documentElement.setAttribute("data-theme", effectiveTheme);
    }
  }, [effectiveTheme]);
  const forceLogout = useCallback(
    (message, redirect = "/login") => {
      setAuthUser(null);
      toast.error(message);
      navigate(redirect);
    },
    [navigate, setAuthUser],
  );
  useEffect(() => {
    checkAuth();
    // ✅ PERFORMANCE: Initialize network listeners for auto-reconnect
    initNetworkListeners();
  }, [checkAuth, initNetworkListeners]);
  // 🚀 PRODUCTION OPTIMIZATIONS
  useProductionOptimizations();
  // Performance optimizations are now built-in to components
  // Initialize Lenis smooth scrolling and mobile enhancements
  useEffect(() => {
    const lenis = initSmoothScroll();
    const cleanupMobile = initMobileEnhancements();
    return () => {
      destroySmoothScroll();
      cleanupMobile?.();
    };
  }, []);
  // Fetch friend data when user is authenticated
  useEffect(() => {
    if (authUser?.id) {
      fetchFriendData();
      useChatStore.getState().fetchUnreadCounts(); // 🔥 Load unread counts on init
    }
  }, [authUser?.id, fetchFriendData]);
  useEffect(() => {
    if (authUser?.isSuspended && window.location.pathname !== "/suspended") {
      navigate("/suspended");
    }
  }, [authUser, navigate]);
  // --- SOCKET LISTENERS ---
  // ✅ NEW: Centralized socket listeners hook
  useSocketListeners();
  // 🧹 CLEANUP: Reset chat state when user logs out
  useEffect(() => {
    if (!authUser) {
      useChatStore.setState({ selectedUser: null, messages: [] });
    }
  }, [authUser]);
  const hasCompletedProfile = authUser?.hasCompletedProfile;
  // ✅ FIXED: Loading screen uses theme background color (same as navbar)
  const LoadingScreen = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-base-100">
      <div className="flex flex-col items-center gap-3">
        <div
          style={{
            width: "50px",
            height: "50px",
            border: "3px solid rgba(255, 153, 51, 0.2)",
            borderTopColor: "#FF9933",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        ></div>
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
  const shouldShowNavbar =
    hasCompletedProfile && !hideNavbarPaths.includes(window.location.pathname);
  // Hide navbar on mobile when in chat mode
  const isMobileChatMode =
    isMobile && selectedUser && location.pathname === "/";
  const showNavbarFinal = shouldShowNavbar && !isMobileChatMode;
  return (
    <div
      data-theme={effectiveTheme}
      className={`min-h-screen min-h-[100dvh] bg-base-100 ${showNavbarFinal ? "pt-14 md:pt-16" : ""}`}
    >
      <ErrorBoundary>
        {/* PermissionHandler removed - permissions requested on feature usage only */}
        {showNavbarFinal && <Navbar />}
      </ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <ErrorBoundary>
          <AnimatePresence mode="wait">
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
              <Route path="/blocked" element={<BlockedPage />} />{" "}
              {/* ✅ FIXED: Use BlockedPage */}
              <Route path="/debug" element={<DebugPage />} />
              <Route
                path="/message-diagnostic"
                element={<MessageDiagnosticPage />}
              />
            </Routes>
          </AnimatePresence>
        </ErrorBoundary>
      </Suspense>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            maxWidth: "500px",
          },
        }}
      />
      <SOSBoard />
      <GlobalCallUI />
    </div>
  );
};
export default App;
