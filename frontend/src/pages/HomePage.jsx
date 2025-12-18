import { useState, useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import { useCallStore } from "../store/useCallStore";
const HomePage = () => {
  const { selectedUser, restoreSelectedUser } = useChatStore();
  const { socket, authUser } = useAuthStore();
  const { friends, fetchFriendData } = useFriendStore();
  const [isMobile, setIsMobile] = useState(false);
  // ✅ ROBUST: Use sessionStorage to detect refresh (set by App.jsx)
  const isRefresh =
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem("z_refresh_flag") === "true";
  const [isRestoringChat, setIsRestoringChat] = useState(() => {
    // If it's a refresh, don't restore
    if (isRefresh) return false;
    return !!new URLSearchParams(window.location.search).get("chat");
  });
  // Enhanced chat restoration with better timing and error handling
  useEffect(() => {
    const restoreChat = async () => {
      // Wait for auth user
      if (!authUser) {
        setIsRestoringChat(false);
        return;
      }
      // If we already have a selected user, don't restore
      if (selectedUser) {
        setIsRestoringChat(false);
        return;
      }
      // 🔥 Optimization: If no URL param, don't even try to restore from legacy storage
      const urlParams = new URLSearchParams(window.location.search);
      // 🛑 STRICT REFRESH CHECK: If this is a refresh, clear URL and stop
      if (isRefresh) {
        const currentUrl = new URL(window.location);
        if (currentUrl.searchParams.get("chat")) {
          currentUrl.searchParams.delete("chat");
          window.history.replaceState({}, "", currentUrl);
        }
        setIsRestoringChat(false);
        return;
      }
      if (!urlParams.get("chat")) {
        setIsRestoringChat(false);
        return;
      }
      // Force fetch friends if not loaded
      if (friends.length === 0) {
        try {
          await fetchFriendData();
        } catch (error) {
          setIsRestoringChat(false);
          return;
        }
      }
      // Now attempt restoration with loaded friends
      const restored = await restoreSelectedUser();
      if (restored) {
      } else {
      }
      setIsRestoringChat(false);
    };
    // Add longer delay to ensure all stores are initialized
    const timeoutId = setTimeout(restoreChat, 500);
    return () => clearTimeout(timeoutId);
  }, [authUser, selectedUser]); // Simplified dependencies
  // Separate effect for friends loading
  useEffect(() => {
    if (authUser && friends.length === 0) {
      fetchFriendData();
    }
  }, [authUser, fetchFriendData]);
  // Additional effect to handle URL-based chat restoration
  useEffect(() => {
    const handleUrlChatParam = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const chatUserId = urlParams.get("chat");
      if (chatUserId && authUser && friends.length > 0 && !selectedUser) {
        const targetUser = friends.find((friend) => friend.id === chatUserId);
        if (targetUser) {
          const { setSelectedUser } = useChatStore.getState();
          setSelectedUser(targetUser);
        } else {
        }
      }
    };
    handleUrlChatParam();
  }, [authUser, friends, selectedUser]);
  // Handle browser back/forward navigation and window focus
  useEffect(() => {
    const handlePopState = () => {
      if (authUser && friends.length > 0) {
        setTimeout(() => {
          restoreSelectedUser();
        }, 100);
      }
    };
    const handleWindowFocus = () => {
      if (authUser && friends.length > 0 && !selectedUser) {
        const urlParams = new URLSearchParams(window.location.search);
        const chatUserId = urlParams.get("chat");
        if (chatUserId) {
          restoreSelectedUser();
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("focus", handleWindowFocus);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [authUser, friends.length, selectedUser, restoreSelectedUser]);
  useEffect(() => {
    if (!socket || !authUser?.id) return;
    let isSubscribed = false;
    // ✅ CRITICAL: Initialize socket listeners with proper timing and registration
    const initializeSocketListeners = () => {
      if (isSubscribed) {
        return;
      }
      const { subscribeToMessages, subscribeToReactions } =
        useChatStore.getState();
      // Ensure user is registered before subscribing to events
      if (authUser?.id && socket.connected) {
        socket.emit("register-user", authUser.id);
        // 🔥 IMMEDIATE: Subscribe to events immediately after registration
        if (!isSubscribed) {
          subscribeToMessages();
          subscribeToReactions();
          isSubscribed = true;
          // 🔥 FORCE: Re-subscribe after a short delay to ensure connection
          setTimeout(() => {
            subscribeToMessages();
            subscribeToReactions();
          }, 500);
        }
      }
    };
    if (socket.connected) {
      // Socket is already connected, initialize immediately
      initializeSocketListeners();
    } else {
      // Wait for socket to connect
      const handleConnect = () => {
        initializeSocketListeners();
      };
      socket.on("connect", handleConnect);
      return () => {
        socket.off("connect", handleConnect);
      };
    }
    return () => {
      isSubscribed = false;
    };
  }, [socket, authUser]);
  const handleStartCall = (callType) => {
    if (!selectedUser) {
      toast.error("No user selected");
      return;
    }
    // Check global store
    const { isCallActive, startCall } = useCallStore.getState();
    if (isCallActive) {
      toast.error("Already in a call");
      return;
    }
    // ✅ ENHANCED: Add haptic feedback and notification
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]); // Call vibration pattern
    }
    // Show calling notification
    toast.success(
      `Calling ${selectedUser.nickname || selectedUser.username}...`,
      {
        icon: callType === "video" ? "📹" : "📞",
        duration: 3000,
      },
    );
    // Emit call request to backend
    if (socket) {
      socket.emit("private:start-call", {
        receiverId: selectedUser.id,
        callType,
        callerInfo: {
          id: authUser.id,
          nickname: authUser.nickname || authUser.username,
          profilePic: authUser.profilePic,
        },
      });
    }
    // Update global store
    startCall(selectedUser, callType);
  };
  // Mobile detection for full-screen chat
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  // Full-screen mobile chat mode
  const isMobileChatMode = isMobile && selectedUser;
  return (
    <div className="fixed inset-0 bg-base-200 overflow-hidden">
      {/* Main container */}
      <div className="h-full w-full flex flex-col overflow-hidden">
        {/* Spacer for navbar - hidden in mobile chat mode */}
        {!isMobileChatMode && (
          <div className="h-14 sm:h-16 flex-shrink-0"></div>
        )}
        {/* Chat container - Full screen on mobile, contained on desktop */}
        <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0">
          <div
            className={`bg-base-100 w-full h-full flex overflow-hidden border-base-300 ${
              isMobileChatMode ? "fixed inset-0 z-40" : ""
            }`}
          >
            {/* Sidebar - hidden in mobile chat mode */}
            {!isMobileChatMode && <Sidebar />}
            {/* Chat area */}
            {selectedUser ? (
              <div className="chat-slide-transition"><ChatContainer onStartCall={handleStartCall} />
            ) : isRestoringChat ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
                  <p className="text-base-content/70">Restoring your chat...</p>
                </div>
              </div>
            ) : (
              <NoChatSelected />
            )}
            {/* Loading State */}
            {isRestoringChat && !selectedUser && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
                  <p className="text-base-content/70">Restoring your chat...</p>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Bottom padding for mobile safe area - hidden in mobile chat mode */}
        {!isMobileChatMode && (
          <div className="h-0 md:h-0 safe-area-bottom"></div>
        )}
      </div>
    </div>
  );
};
export default HomePage;
