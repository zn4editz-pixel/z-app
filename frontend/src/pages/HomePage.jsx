import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import toast from "react-hot-toast";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import PrivateCallModal from "../components/PrivateCallModal";
import IncomingCallModal from "../components/IncomingCallModal";

const HomePage = () => {
  const { selectedUser, restoreSelectedUser } = useChatStore();
  const { socket, authUser } = useAuthStore();
  const { friends, fetchFriendData } = useFriendStore();
  
  const [callState, setCallState] = useState({
    isCallActive: false,
    callType: null,
    isInitiator: false,
    otherUser: null,
  });
  
  const [incomingCall, setIncomingCall] = useState(null);
  const [isRestoringChat, setIsRestoringChat] = useState(true);

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
        console.log('✅ Chat already active, skipping restoration');
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
        
        // Add small delay to ensure registration completes
        setTimeout(() => {
          if (!isSubscribed) {
            subscribeToMessages();
            subscribeToReactions();
            isSubscribed = true;
            console.log('✅ Socket listeners initialized successfully');
          }
        }, 200);
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

    const handleIncomingCall = ({ callerInfo, callType, callerId }) => {
      console.log("📞 Incoming call from:", callerInfo?.nickname || callerId, "Type:", callType);
      console.log("📞 Full call data:", { callerInfo, callType, callerId });
      
      // Validate callerInfo
      if (!callerInfo || !callerInfo.id) {
        console.error("❌ Invalid caller info received:", callerInfo);
        toast.error("Invalid call data received");
        return;
      }
      
      // Check if already in a call using the latest state
      setCallState((prevState) => {
        console.log("📊 Current call state:", prevState);
        if (prevState.isCallActive) {
          console.log("⚠️ Already in a call, rejecting incoming call from:", callerInfo.nickname);
          socket.emit("private:reject-call", { callerId: callerInfo.id });
          return prevState; // Don't update state
        }
        
        // Not in a call, show incoming call modal
        console.log("✅ Showing incoming call modal for:", callerInfo.nickname);
        setIncomingCall({ callerInfo, callType });
        return prevState;
      });
    };

    // 🔥 NEW: Handle call rejection
    const handleCallRejected = async ({ rejectorId, reason }) => {
      console.log("🚫 Call rejected by user:", rejectorId, "Reason:", reason);
      toast.error(`Call ${reason || 'declined'} by user`);
      
      // Log the rejected outgoing call
      const { addCallLog } = useChatStore.getState();
      await addCallLog(rejectorId, callState.callType || 'voice', 0, 'rejected');
      
      setCallState({
        isCallActive: false,
        callType: null,
        isInitiator: false,
        otherUser: null,
      });
    };

    // 🔥 NEW: Handle call failure
    const handleCallFailed = async ({ reason }) => {
      console.log("❌ Call failed:", reason);
      toast.error(`Call failed: ${reason}`);
      
      // Log the failed call if we have call state
      if (callState.otherUser) {
        const { addCallLog } = useChatStore.getState();
        await addCallLog(callState.otherUser.id, callState.callType || 'voice', 0, 'failed');
      }
      
      setCallState({
        isCallActive: false,
        callType: null,
        isInitiator: false,
        otherUser: null,
      });
    };

    socket.on("private:incoming-call", handleIncomingCall);
    socket.on("private:call-rejected", handleCallRejected);
    socket.on("private:call-failed", handleCallFailed);

    return () => {
      socket.off("private:incoming-call", handleIncomingCall);
      socket.off("private:call-rejected", handleCallRejected);
      socket.off("private:call-failed", handleCallFailed);
      isSubscribed = false;
      console.log('🧹 HomePage: Cleaned up socket listeners');
    };
  }, [socket, authUser]);

  const handleStartCall = (callType) => {
    if (!selectedUser) {
      toast.error("No user selected");
      return;
    }
    
    if (callState.isCallActive) {
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
    
    setCallState({
      isCallActive: true,
      callType,
      isInitiator: true,
      otherUser: selectedUser,
    });
  };

  const handleAcceptCall = () => {
    if (!incomingCall || !socket) return;
    
    console.log("✅ Accepting call from:", incomingCall.callerInfo.nickname);
    
    // Immediately notify caller that call was accepted
    socket.emit("private:call-accepted", {
      callerId: incomingCall.callerInfo.id,
      acceptorInfo: {
        id: authUser.id,
        nickname: authUser.nickname,
        profilePic: authUser.profilePic,
      },
    });
    
    setCallState({
      isCallActive: true,
      callType: incomingCall.callType,
      isInitiator: false,
      otherUser: incomingCall.callerInfo,
    });
    setIncomingCall(null);
  };

  const handleRejectCall = async () => {
    if (incomingCall && socket) {
      console.log("🚫 Rejecting call from:", incomingCall.callerInfo.nickname);
      socket.emit("private:reject-call", { 
        callerId: incomingCall.callerInfo.id,
        reason: "declined"
      });

      // 🔥 NEW: Log rejected call
      const { addCallLog } = useChatStore.getState();
      await addCallLog(incomingCall.callerInfo.id, incomingCall.callType, 0, 'rejected');
    }
    setIncomingCall(null);
  };

  const handleCloseCall = () => {
    setCallState({
      isCallActive: false,
      callType: null,
      isInitiator: false,
      otherUser: null,
    });
  };

  return (
    <div className="fixed inset-0 bg-base-200 overflow-hidden">
      {/* Main container */}
      <div className="h-full w-full flex flex-col overflow-hidden">
        {/* Spacer for navbar */}
        <div className="h-14 sm:h-16 flex-shrink-0"></div>
        
        {/* Chat container - Full screen on mobile, contained on desktop */}
        <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0">
          <div className="bg-base-100 w-full h-full max-w-7xl flex overflow-hidden md:border-x border-base-300">
            {/* Sidebar */}
            <Sidebar />

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
          </div>
        </div>
        
        {/* Bottom padding for mobile safe area */}
        <div className="h-0 md:h-0 safe-area-bottom"></div>
      </div>

      {/* Private Call Modal */}
      <PrivateCallModal
        isOpen={callState.isCallActive}
        onClose={handleCloseCall}
        callType={callState.callType}
        isInitiator={callState.isInitiator}
        otherUser={callState.otherUser}
      />

      {/* Incoming Call Modal */}
      <IncomingCallModal
        isOpen={!!incomingCall}
        caller={incomingCall?.callerInfo}
        callType={incomingCall?.callType}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
    </div>
  );
};
export default HomePage;
