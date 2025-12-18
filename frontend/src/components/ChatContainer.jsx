import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useRef, useState, useLayoutEffect } from "react";
import React from "react";
import { Download, Play, Pause } from "lucide-react";
import toast from "react-hot-toast";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import CallLogMessage from "./CallLogMessage";
import ChatMessage from "./ChatMessage";
import { formatMessageTime } from "../lib/utils";
import { getDateLabel, isDifferentDay } from "../utils/dateUtils";
// ✅ CRITICAL: Import animations for floating reactions
import "../styles/animations.css";
import SeasonalParticles from "./effects/SeasonalParticles";
const ChatContainer = ({ onStartCall }) => {
  const {
    messages = [],
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    subscribeToReactions,
  } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isInitialLoad = useRef(true);
  const previousMessagesLength = useRef(0);
  // Voice message playback
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const audioRefs = useRef({});
  // Typing indicator - Use Global Store State
  //   const [isTyping, setIsTyping] = useState(false); // ❌ Removed local state
  const { isTyping, typingUserId } = useChatStore(); // ✅ Use store state
  const typingTimeoutRef = useRef(null);
  // Reply to message
  const [replyingTo, setReplyingTo] = useState(null);
  // ✅ NEW: Instagram-style "New message" indicator
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  // ✅ NEW: Floating reactions system
  const [floatingReactions, setFloatingReactions] = useState([]);
  // ✅ CRITICAL FIX: Move mobile keyboard detection hooks to top
  const [isMobile, setIsMobile] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  // ✅ Mobile detection effect
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  useEffect(() => {
    if (!isMobile) return;
    const handleViewportChange = () => {
      const viewportHeight =
        window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.screen.height;
      const keyboardThreshold = windowHeight * 0.75;
      setKeyboardVisible(viewportHeight < keyboardThreshold);
    };
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
      return () =>
        window.visualViewport.removeEventListener(
          "resize",
          handleViewportChange,
        );
    } else {
      window.addEventListener("resize", handleViewportChange);
      return () => window.removeEventListener("resize", handleViewportChange);
    }
  }, [isMobile]);
  // ✅ SIMPLE: Add window function for manual testing
  // Debug hook removed for production
  const handleReply = (message) => {
    setReplyingTo(message);
  };
  // ✅ SIMPLE & GUARANTEED: Working floating reaction function
  const triggerFloatingReaction = (emoji, messageElement) => {
    try {
      let x = 50; // Default center
      let y = 50; // Default center
      // Try to get position from message element
      if (messageElement && messageElement.getBoundingClientRect) {
        const rect = messageElement.getBoundingClientRect();
        const containerRect =
          scrollContainerRef.current?.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && containerRect) {
          // Calculate relative position within the chat container
          x =
            ((rect.left + rect.width / 2 - containerRect.left) /
              containerRect.width) *
            100;
          y =
            ((rect.top + rect.height / 2 - containerRect.top) /
              containerRect.height) *
            100;
          // Keep within bounds
          x = Math.max(10, Math.min(90, x));
          y = Math.max(10, Math.min(90, y));
        }
      }
      // Create floating reaction
      const reaction = {
        id: Date.now() + Math.random(),
        emoji,
        x,
        y,
        delay: 0,
        duration: 3000,
      };
      // Add to state
      setFloatingReactions((prev) => [...prev, reaction]);
      // Remove after animation
      setTimeout(() => {
        setFloatingReactions((prev) =>
          prev.filter((r) => r.id !== reaction.id),
        );
      }, reaction.duration + 500);
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      // Still try to create a basic reaction at center
      const fallbackReaction = {
        id: Date.now() + Math.random(),
        emoji,
        x: 50,
        y: 50,
        delay: 0,
        duration: 3000,
      };
      setFloatingReactions((prev) => [...prev, fallbackReaction]);
      setTimeout(() => {
        setFloatingReactions((prev) =>
          prev.filter((r) => r.id !== fallbackReaction.id),
        );
      }, 3500);
    }
  };
  useEffect(() => {
    if (!selectedUser?.id) return;

    // ✅ ENHANCED: Reset state for new chat
    isInitialLoad.current = true;
    previousMessagesLength.current = 0;
    setShowNewMessageButton(false);
    setNewMessageCount(0);
    // ✅ INSTANT: Load messages immediately without delay
    getMessages?.(selectedUser.id);
    // ✅ ENHANCED: Force scroll to bottom after a brief delay to ensure messages are rendered
    // ✅ SMOOTH: Scroll to bottom after chat switch
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollToBottomSmooth("smooth");
      }
    }, 100);
    // ✅ FIXED: Subscribe to socket events without parameters - but only if not already subscribed
    // Note: Subscriptions are now handled in HomePage to avoid conflicts
    return () => {
      // Cleanup is handled by the store
    };
  }, [selectedUser?.id, getMessages, subscribeToMessages]);
  // ✅ RELIABLE: Use Global Store State for Typing
  // We no longer listen locally. We trust useChatStore.js which handles 'typing' and 'stopTyping' global events.
  // This prevents double-listeners and inconsistencies.
  useEffect(() => {
    // Logic moved to useChatStore.js
    // Just consuming 'isTyping' from store now.
  }, []);
  // ✅ INSTANT SCROLL: Use useLayoutEffect to scroll before paint
  useLayoutEffect(() => {
    if (
      messages.length > 0 &&
      isInitialLoad.current &&
      scrollContainerRef.current
    ) {
      // Smooth scroll for initial load
      scrollToBottomSmooth("smooth");
    }
  }, [messages, selectedUser?.id]);
  // ✅ SMOOTH SCROLL: Professional feel
  const scrollToBottomSmooth = (behavior = "smooth") => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    // Smooth scroll animation
    container.scrollTo({
      top: container.scrollHeight,
      behavior: behavior,
    });
  };
  useEffect(() => {
    if (!bottomRef.current || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    // Threshold for auto-scrolling
    const isScrolledToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      150;
    // Process new messages
    if (messages.length > 0) {
      if (
        !isInitialLoad.current &&
        messages.length > previousMessagesLength.current
      ) {
        // Source check
        const newMessages = messages.slice(previousMessagesLength.current);
        const receivedMessages = newMessages.filter(
          (msg) => msg.senderId !== authUser?.id,
        );
        const sentMessages = newMessages.filter(
          (msg) => msg.senderId === authUser?.id,
        );
        if (sentMessages.length > 0) {
          // ALWAYS auto-scroll for own sent messages - SMOOTH
          scrollToBottomSmooth("smooth");
          setShowNewMessageButton(false);
          setNewMessageCount(0);
        } else if (receivedMessages.length > 0) {
          // For received messages - SMOOTH
          if (isScrolledToBottom) {
            // User is watching the chat bottom -> Smooth scroll
            scrollToBottomSmooth("smooth");
          } else {
            // User is scrolled up reading old history -> Don't jerk them down
            setNewMessageCount((prev) => prev + receivedMessages.length);
            setShowNewMessageButton(true);
          }
        }
      } else if (isInitialLoad.current) {
        // INITIAL LOAD: Instant jump (no animation)
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop =
            scrollContainerRef.current.scrollHeight;
        }
        isInitialLoad.current = false;
      }
      previousMessagesLength.current = messages.length;
    }
  }, [messages.length, authUser?.id]);
  // Handle typing indicator smooth scroll
  useEffect(() => {
    if (isTyping && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        100;
      if (isNearBottom) {
        scrollToBottomSmooth("smooth");
      }
    }
  }, [isTyping]);
  // ✅ ENHANCED: Additional scroll effect for better reliability
  useEffect(() => {
    if (messages.length > 0 && isInitialLoad.current) {
      // ✅ MULTIPLE ATTEMPTS: Ensure scroll happens after DOM updates
      const attempts = [0, 50, 100, 200];
      attempts.forEach((delay) => {
        setTimeout(() => {
          if (scrollContainerRef.current && isInitialLoad.current) {
            scrollToBottom(false); // Instant scroll
          }
        }, delay);
      });
    }
  }, [messages]);
  // ✅ SMOOTH: Scroll to bottom function with animation
  const scrollToBottom = (smooth = true) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      if (smooth) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      } else {
        // Instant scroll for fallback
        container.scrollTop = container.scrollHeight;
      }
      setShowNewMessageButton(false);
      setNewMessageCount(0);
    }
  };
  // ✅ NEW: Detect manual scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const isScrolledToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;
    if (isScrolledToBottom) {
      setShowNewMessageButton(false);
      setNewMessageCount(0);
    }
  };
  // Typing indicator logic is now handled in useChatStore
  // Call handling is now done in HomePage
  const handleStartCall = (type) => {
    if (onStartCall) {
      onStartCall(type);
    }
  };
  const handleDownloadImage = async (imageUrl, fileName = "image.jpg") => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };
  const toggleVoicePlayback = (messageId) => {
    const audio = audioRefs.current[messageId];
    if (!audio) return;
    if (playingVoiceId === messageId) {
      audio.pause();
      setPlayingVoiceId(null);
    } else {
      // Pause any currently playing audio
      Object.values(audioRefs.current).forEach((a) => a.pause());
      audio.play();
      setPlayingVoiceId(messageId);
    }
  };
  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
        <SeasonalParticles />
        <div className="max-w-md text-center z-10">
          <h2 className="text-2xl font-bold">Welcome to Z-APP</h2>
          <p className="text-zinc-500 mt-2">
            Select a conversation to start messaging.
          </p>
        </div>
      </div>
    );
  }
  return (
    <>
      <div
        className={`flex-1 flex flex-col h-full w-full ${isMobile ? "mobile-chat-fullscreen" : ""
          }`}
      >
        <ChatHeader onStartCall={handleStartCall} />
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          data-chat-container
          className={`flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-3 bg-base-100 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent relative ${isMobile && keyboardVisible ? "chat-container-mobile-keyboard" : ""
            } ${isMobile ? "pt-24 mobile-chat-container professional-chat-container" : "pt-6"}`}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {isMessagesLoading ? (
            <MessageSkeleton />
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-20 h-20 rounded-full bg-base-200/50 flex items-center justify-center mb-6 shadow-sm">
                <div className="text-4xl">💬</div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-base-content">
                No messages yet
              </h3>
              <p className="text-base text-base-content/60 max-w-sm leading-relaxed">
                Start the conversation by sending a message to{" "}
                {selectedUser?.nickname || selectedUser?.username}!
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const mine = message.senderId === authUser?.id;
                const previousMessage = index > 0 ? messages[index - 1] : null;
                const showDateSeparator =
                  index === 0 ||
                  (previousMessage &&
                    isDifferentDay(
                      message.createdAt,
                      previousMessage.createdAt,
                    ));
                return (
                  <React.Fragment key={`message-group-${message.id}`}>
                    {/* Instagram-style Date Separator */}
                    {showDateSeparator && (
                      <div className="flex justify-center my-6">
                        <div className="bg-base-200/50 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                          <span className="text-sm font-medium text-base-content/70">
                            {getDateLabel(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Render call log message */}
                    {message.messageType === "call" ||
                      message.callData ||
                      message.isCallLog ? (
                      <div className="flex justify-center w-full my-2">
                        <div className="max-w-md w-full">
                          <CallLogMessage
                            message={message}
                            isOwnMessage={mine}
                          />
                        </div>
                      </div>
                    ) : (
                      // Use new ChatMessage component with reactions and reply
                      <ChatMessage
                        message={message}
                        onReply={handleReply}
                        onFloatingReaction={triggerFloatingReaction}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </>
          )}
          {/* Typing Indicator - Enhanced Bubble */}
          {/* Typing Indicator - Enhanced Bubble */}
          {isTyping && (
            <div className="flex justify-start w-full my-2 animate-slide-up">
              <div className="flex items-end gap-2 max-w-[80%]">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0 shadow-sm border border-base-200">
                  <img
                    src={selectedUser.profilePic || "/avatar.png"}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="chat-bubble flex items-center p-3 bg-base-200 rounded-2xl rounded-tl-none shadow-sm min-h-[44px]">
                  <div className="flex gap-1.5 px-2 items-center h-full">
                    <span
                      className="w-2.5 h-2.5 bg-base-content/50 rounded-full typing-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2.5 h-2.5 bg-base-content/50 rounded-full typing-bounce"
                      style={{ animationDelay: "200ms" }}
                    />
                    <span
                      className="w-2.5 h-2.5 bg-base-content/50 rounded-full typing-bounce"
                      style={{ animationDelay: "400ms" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
          {/* ✅ SIMPLE FLOATING REACTIONS - GUARANTEED TO WORK */}
          <div
            className="floating-reactions-overlay"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              overflow: "hidden",
              zIndex: 99999,
            }}
          >
            {floatingReactions.map((reaction) => (
              <div
                key={reaction.id}
                className="floating-reaction-simple"
                style={{
                  position: "absolute",
                  left: `${reaction.x}%`,
                  top: `${reaction.y}%`,
                  fontSize: "2.5rem",
                  transform: "translate(-50%, -50%)",
                  zIndex: 99999,
                  pointerEvents: "none",
                  fontFamily:
                    "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
                  animation: "simpleFloatUp 3s ease-out forwards",
                  textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                }}
              >
                {reaction.emoji}
              </div>
            ))}
          </div>
          {/* Modern "New message" indicator */}
          {showNewMessageButton && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-20
                         flex items-center gap-2 px-4 py-2.5 rounded-full
                         bg-primary text-primary-content font-medium text-sm
                         shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-95
                         transition-all duration-300 animate-slide-up"
              style={{
                backdropFilter: "blur(12px)",
                boxShadow:
                  "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
              }}
            >
              {/* Animated down arrow */}
              <div className="relative w-5 h-5 flex items-center justify-center">
                <svg
                  className="w-5 h-5 animate-bounce-slow"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
              {/* Message count badge */}
              {newMessageCount > 0 && (
                <span
                  className="flex items-center justify-center min-w-[20px] h-5 px-1.5 
                               bg-error text-error-content text-xs font-bold rounded-full
                               animate-pulse"
                >
                  {newMessageCount > 99 ? "99+" : newMessageCount}
                </span>
              )}
              {/* Text */}
              <span className="hidden sm:inline">
                {newMessageCount > 1
                  ? `${newMessageCount} new messages`
                  : "New message"}
              </span>
              <span className="sm:hidden">
                {newMessageCount > 1 ? "New" : "New"}
              </span>
            </button>
          )}
        </div>
        <MessageInput
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>
    </>
  );
};
export default ChatContainer;
