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
  const isRefresh = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('z_refresh_flag') === 'true';

  const [isRestoringChat, setIsRestoringChat] = useState(() => {
    // If it's a refresh, don't restore
    if (isRefresh) return false;
    return !!new URLSearchParams(window.location.search).get('chat');
  });

  // Enhanced chat restoration with better timing and error handling
  useEffect(() => {
    const restoreChat = async () => {
      console.log('🔄 Starting enhanced chat restoration...');
      console.log('📊 Current state:', {
        authUser: !!authUser,
        friendsCount: friends.length,
        selectedUser: !!selectedUser
      });

      // Wait for auth user
      if (!authUser) {
        console.log('⏳ Waiting for auth user...');
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
        console.log('🛑 Refresh detected via session flag - Cleaning URL and skipping restoration');
        const currentUrl = new URL(window.location);
        if (currentUrl.searchParams.get('chat')) {
          currentUrl.searchParams.delete('chat');
          window.history.replaceState({}, '', currentUrl);
        }
        setIsRestoringChat(false);
        return;
      }

      if (!urlParams.get('chat')) {
        setIsRestoringChat(false);
        return;
      }

      console.log('👥 Ensuring friends are loaded...');

      // Force fetch friends if not loaded
      if (friends.length === 0) {
        try {
          console.log('📥 Loading friends data for restoration...');
          await fetchFriendData();
          console.log('✅ Friends loaded, proceeding with restoration');
        } catch (error) {
          console.error('❌ Failed to load friends:', error);
          setIsRestoringChat(false);
          return;
        }
      }

      // Now attempt restoration with loaded friends
      console.log('🔄 Attempting restoration with loaded data...');
      const restored = await restoreSelectedUser();

      if (restored) {
        console.log('✅ Successfully restored chat state');
      } else {
        console.log('ℹ️ No previous chat to restore');
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
      console.log('👥 Loading friends data...');
      fetchFriendData();
    }
  }, [authUser, fetchFriendData]);

  // Additional effect to handle URL-based chat restoration
  useEffect(() => {
    const handleUrlChatParam = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const chatUserId = urlParams.get('chat');

      if (chatUserId && authUser && friends.length > 0 && !selectedUser) {
        console.log('🔗 Found chat parameter in URL:', chatUserId);
        const targetUser = friends.find(friend => friend.id === chatUserId);

        if (targetUser) {
          console.log('✅ Restoring chat from URL parameter');
          const { setSelectedUser } = useChatStore.getState();
          setSelectedUser(targetUser);
        } else {
          console.log('⚠️ User from URL not found in friends list');
        }
      }
    };

    handleUrlChatParam();
  }, [authUser, friends, selectedUser]);

  // Handle browser back/forward navigation and window focus
  useEffect(() => {
    const handlePopState = () => {
      console.log('🔄 Browser navigation detected, attempting chat restoration');
      if (authUser && friends.length > 0) {
        setTimeout(() => {
          restoreSelectedUser();
        }, 100);
      }
    };

    const handleWindowFocus = () => {
      console.log('👁️ Window focused, checking chat state');
      if (authUser && friends.length > 0 && !selectedUser) {
        const urlParams = new URLSearchParams(window.location.search);
        const chatUserId = urlParams.get('chat');
        if (chatUserId) {
          console.log('🔄 Restoring chat on window focus');
          restoreSelectedUser();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [authUser, friends.length, selectedUser, restoreSelectedUser]);

  useEffect(() => {
    if (!socket || !authUser?.id) return;

    let isSubscribed = false;

    // ✅ CRITICAL: Initialize socket listeners with proper timing and registration
    const initializeSocketListeners = () => {
      if (isSubscribed) {
        console.log('🔌 Already subscribed, skipping duplicate subscription');
        return;
      }

      const { subscribeToMessages, subscribeToReactions } = useChatStore.getState();
      console.log('🔌 HomePage: Initializing socket listeners for realtime updates');
      console.log('🔌 Socket connected status:', socket.connected);
      console.log('🔌 Socket ID:', socket.id);

      // Ensure user is registered before subscribing to events
      if (authUser?.id && socket.connected) {
        console.log(`📝 Ensuring user ${authUser.id} is registered with socket`);
        socket.emit("register-user", authUser.id);

        // 🔥 IMMEDIATE: Subscribe to events immediately after registration
        if (!isSubscribed) {
          console.log('🔄 Subscribing to real-time events immediately...');
          subscribeToMessages();
          subscribeToReactions();
          isSubscribed = true;
          console.log('✅ Socket listeners initialized successfully');

          // 🔥 FORCE: Re-subscribe after a short delay to ensure connection
          setTimeout(() => {
            console.log('🔄 Re-subscribing to ensure real-time events...');
            subscribeToMessages();
            subscribeToReactions();
          }, 500);
        }
      }
    };

    if (socket.connected) {
      // Socket is already connected, initialize immediately
      console.log('🔌 Socket already connected, initializing listeners');
      initializeSocketListeners();
    } else {
      // Wait for socket to connect
      const handleConnect = () => {
        console.log('🔌 Socket connected event received, initializing listeners');
        initializeSocketListeners();
      };

      socket.on('connect', handleConnect);

      return () => {
        socket.off('connect', handleConnect);
      };
    }

    return () => {
      isSubscribed = false;
      console.log('🧹 HomePage: Cleaned up socket listeners');
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

    console.log(`📞 Starting ${callType} call with:`, selectedUser.nickname || selectedUser.username);

    // ✅ ENHANCED: Add haptic feedback and notification
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]); // Call vibration pattern
    }

    // Show calling notification
    toast.success(`Calling ${selectedUser.nickname || selectedUser.username}...`, {
      icon: callType === 'video' ? '📹' : '📞',
      duration: 3000
    });

    // Emit call request to backend
    if (socket) {
      socket.emit("private:start-call", {
        receiverId: selectedUser.id,
        callType,
        callerInfo: {
          id: authUser.id,
          nickname: authUser.nickname || authUser.username,
          profilePic: authUser.profilePic
        }
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
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Full-screen mobile chat mode
  const isMobileChatMode = isMobile && selectedUser;

  return (
    <div className="fixed inset-0 bg-base-200 overflow-hidden">
      {/* Main container */}
      <div className="h-full w-full flex flex-col overflow-hidden">
        {/* Spacer for navbar - hidden in mobile chat mode */}
        {!isMobileChatMode && <div className="h-14 sm:h-16 flex-shrink-0"></div>}

        {/* Chat container - Full screen on mobile, contained on desktop */}
        <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0">
          <div className={`bg-base-100 w-full h-full flex overflow-hidden border-base-300 ${isMobileChatMode ? 'fixed inset-0 z-40' : ''
            }`}>
            {/* Sidebar - hidden in mobile chat mode */}
            {!isMobileChatMode && <Sidebar />}

            {/* Chat area */}
            {selectedUser ? (
              <ChatContainer onStartCall={handleStartCall} />
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
        {!isMobileChatMode && <div className="h-0 md:h-0 safe-area-bottom"></div>}
      </div>

    </div>
  );
};
export default HomePage;
