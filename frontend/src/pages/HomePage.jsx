import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import PrivateCallModal from "../components/PrivateCallModal";
import IncomingCallModal from "../components/IncomingCallModal";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { socket } = useAuthStore();
  
  const [callState, setCallState] = useState({
    isCallActive: false,
    callType: null,
    isInitiator: false,
    otherUser: null,
  });
  
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = ({ callerInfo, callType }) => {
      setIncomingCall({ callerInfo, callType });
    };

    const handleCallEnded = () => {
      setCallState({
        isCallActive: false,
        callType: null,
        isInitiator: false,
        otherUser: null,
      });
      setIncomingCall(null);
    };

    socket.on("private:incoming-call", handleIncomingCall);
    socket.on("private:call-ended", handleCallEnded);

    return () => {
      socket.off("private:incoming-call", handleIncomingCall);
      socket.off("private:call-ended", handleCallEnded);
    };
  }, [socket]);

  const handleStartCall = (callType) => {
    if (!selectedUser) return;
    
    setCallState({
      isCallActive: true,
      callType,
      isInitiator: true,
      otherUser: selectedUser,
    });
  };

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    
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
      socket.emit("private:reject-call", { callerId: incomingCall.callerInfo._id });
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
    <div className="fixed inset-0 bg-base-200">
      {/* Main container with proper height calculation */}
      <div className="h-full w-full flex flex-col">
        {/* Spacer for navbar */}
        <div className="h-14 sm:h-16 flex-shrink-0"></div>
        
        {/* Chat container */}
        <div className="flex-1 flex items-center justify-center px-0 sm:px-4 py-0 sm:py-4 overflow-hidden">
          <div className="bg-base-100 rounded-none sm:rounded-lg shadow-xl w-full h-full max-w-6xl sm:max-h-[calc(100vh-8rem)] flex overflow-hidden">
            {/* Sidebar: hidden on mobile when a chat is selected */}
            <Sidebar />

            {/* Chat area */}
            {selectedUser ? <ChatContainer onStartCall={handleStartCall} /> : <NoChatSelected />}
          </div>
        </div>
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
