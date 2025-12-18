import { Phone, Video, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import VerifiedBadge from "./VerifiedBadge";
import { useEffect, useState } from "react";
const ChatHeader = ({ onStartCall }) => {
  const { selectedUser, setSelectedUser, isTyping, typingUserId } =
    useChatStore();
  const { onlineUsers } = useAuthStore();
  const [isMobile, setIsMobile] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  // Handle mobile keyboard visibility
  useEffect(() => {
    if (!isMobile) return;
    const handleViewportChange = () => {
      // Detect keyboard by viewport height change
      const viewportHeight =
        window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.screen.height;
      const keyboardThreshold = windowHeight * 0.75; // 75% of screen height
      setKeyboardVisible(viewportHeight < keyboardThreshold);
    };
    // Listen to visual viewport changes (better than resize for keyboard detection)
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
      return () =>
        window.visualViewport.removeEventListener(
          "resize",
          handleViewportChange,
        );
    } else {
      // Fallback for older browsers
      window.addEventListener("resize", handleViewportChange);
      return () => window.removeEventListener("resize", handleViewportChange);
    }
  }, [isMobile]);
  if (!selectedUser) return null;
  const isOnline = onlineUsers.includes(selectedUser.id);
  const handleStartCall = (callType) => {
    if (onStartCall) {
      onStartCall(callType);
    }
  };
  return (
    <div
      className={`${
        isMobile
          ? "fixed top-0 left-0 right-0 z-50 px-4 py-4 bg-base-100/95 backdrop-blur-xl border-t border-t-base-300/30 border-b border-base-300/50 shadow-lg mobile-chat-header-professional"
          : "p-4 border-b border-base-300 relative bg-base-100 z-30"
      } ${isMobile && keyboardVisible ? "mobile-chat-header-keyboard" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Back Button - Instagram Style */}
          <button
            onClick={() => setSelectedUser(null)}
            className="w-10 h-10 rounded-full bg-base-200/50 hover:bg-base-200 active:bg-base-300 flex items-center justify-center transition-all duration-200 active:scale-95 touch-manipulation"
          >
            <ArrowLeft className="w-5 h-5 text-base-content" />
          </button>
          {/* Avatar with Online Indicator */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-base-300/30 shadow-sm">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.username}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Online Status Dot */}
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-base-100 shadow-sm animate-pulse"></div>
            )}
          </div>
          {/* User Info - Enhanced */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="font-semibold text-lg text-base-content truncate">
                {selectedUser.nickname || selectedUser.username}
              </h3>
              {selectedUser.isVerified && <VerifiedBadge size="xs" />}
            </div>
            <p className="text-sm text-base-content/60 font-medium">
              {isTyping && typingUserId === selectedUser.id ? (
                <span className="text-primary font-medium flex items-center gap-1">
                  typing...
                </span>
              ) : isOnline ? (
                <span className="text-green-500">Online</span>
              ) : (
                <span className="text-base-content/50">Offline</span>
              )}
            </p>
          </div>
        </div>
        {/* Header Actions - Professional Style */}
        <div className="flex items-center gap-1">
          {/* Video Call Button */}
          <button
            onClick={() => handleStartCall("video")}
            className="w-11 h-11 rounded-full bg-base-200/50 hover:bg-base-200 active:bg-base-300 flex items-center justify-center transition-all duration-200 active:scale-95 touch-manipulation group"
            title="Video Call"
          >
            <Video className="w-5 h-5 text-base-content group-hover:text-primary transition-colors" />
          </button>
          {/* Audio Call Button */}
          <button
            onClick={() => handleStartCall("audio")}
            className="w-11 h-11 rounded-full bg-base-200/50 hover:bg-base-200 active:bg-base-300 flex items-center justify-center transition-all duration-200 active:scale-95 touch-manipulation group"
            title="Voice Call"
          >
            <Phone className="w-5 h-5 text-base-content group-hover:text-primary transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
