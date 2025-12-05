import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import PrivateCallModal from "../components/PrivateCallModal";
import IncomingCallModal from "../components/IncomingCallModal";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { socket, authUser } = useAuthStore();
  
  const [callState, setCallState] = useState({
    isCallActive: false,
    callType: null,
    isInitiator: false,
    otherUser: null,
  });
  
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = ({ callerInfo, callType, callerId }) => {
      console.log("📞 Incoming call from:", callerInfo?.nickname || callerId, "Type:", callType);
      console.log("📞 Full call data:", { callerInfo, callType, callerId });
      
      // Validate callerInfo
      if (!callerInfo || !callerInfo._id) {
        console.error("❌ Invalid caller info received:", callerInfo);
        toast.error("Invalid call data received");
        return;
      }
      
      // Check if already in a call using the latest state
      setCallState((prevState) => {
        console.log("📊 Current call state:", prevState);
        if (prevState.isCallActive) {
          console.log("⚠️ Already in a call, rejecting incoming call from:", callerInfo.nickname);
          socket.emit("private:reject-call", { callerId: callerInfo._id });
          return prevState; // Don't update state
        }
        
        // Not in a call, show incoming call modal
        console.log("✅ Showing incoming call modal for:", callerInfo.nickname);
        setIncomingCall({ callerInfo, callType });
        return prevState;
      });
    };

    socket.on("private:incoming-call", handleIncomingCall);

    return () => {
      socket.off("private:incoming-call", handleIncomingCall);
    };
  }, [socket]);

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
      callerId: incomingCall.callerInfo._id,
      acceptorInfo: {
        _id: authUser._id,
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

  const handleRejectCall = () => {
    if (incomingCall && socket) {
      console.log("🚫 Rejecting call from:", incomingCall.callerInfo.nickname);
      socket.emit("private:reject-call", { 
        callerId: incomingCall.callerInfo._id,
        reason: "declined"
      });
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
            {selectedUser ? <ChatContainer onStartCall={handleStartCall} /> : <NoChatSelected />}
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
