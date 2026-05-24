import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useRef, useState, useLayoutEffect, useCallback } from "react";
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
import "../styles/animations.css";
import "../styles/chat-improvements.css";
import SeasonalParticles from "./effects/SeasonalParticles";

const MESSAGES_PER_PAGE = 50;
const SCROLL_THRESHOLD = 100;

const EnhancedChatContainer = ({ onStartCall }) => {
  const {
    messages = [],
    getMessages,
    loadMoreMessages,
    isMessagesLoading,
    hasMoreMessages,
    selectedUser,
    subscribeToMessages,
    subscribeToReactions,
  } = useChatStore();
  
  const { authUser, socket } = useAuthStore();
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isInitialLoad = useRef(true);
  const previousMessagesLength = useRef(0);
  const loadingMoreRef = useRef(false);
  
  // Enhanced state management
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const audioRefs = useRef({});
  const { isTyping, typingUserId } = useChatStore();
  const [replyingTo, setReplyingTo] = useState(null);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Mobile detection with keyboard handling
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    const handleKeyboard = () => {
      if (!isMobile) return;
      
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.screen.height;
      const keyboardThreshold = windowHeight * 0.75;
      
      setKeyboardVisible(viewportHeight < keyboardThreshold);
    };
    
    checkMobile();
    handleKeyboard();
    
    window.addEventListener("resize", checkMobile);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleKeyboard);
    }
    
    return () => {
      window.removeEventListener("resize", checkMobile);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleKeyboard);
      }
    };
  }, [isMobile]);

  // Instagram-style infinite scroll
  const handleScroll = useCallback(async () => {
    if (!scrollContainerRef.current || !selectedUser?.id || loadingMoreRef.current) return;
    
    const container = scrollContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Check if scrolled to bottom for new message button
    const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 100;
    if (isScrolledToBottom) {
      setShowNewMessageButton(false);
      setNewMessageCount(0);
    }
    
    // Check if scrolled to top for loading more messages
    if (scrollTop < SCROLL_THRESHOLD && hasMoreMessages && !isLoadingMore) {
      loadingMoreRef.current = true;
      setIsLoadingMore(true);
      
      try {
        const previousScrollHeight = scrollHeight;
        await loadMoreMessages?.(selectedUser.id);
        
        // Maintain scroll position after loading
        setTimeout(() => {
          if (scrollContainerRef.current) {
            const newScrollHeight = scrollContainerRef.current.scrollHeight;
            const scrollDiff = newScrollHeight - previousScrollHeight;
            scrollContainerRef.current.scrollTop = scrollTop + scrollDiff;
          }
        }, 100);
      } catch (error) {
        console.error("Failed to load more messages:", error);
      } finally {
        setIsLoadingMore(false);
        loadingMoreRef.current = false;
      }
    }
  }, [selectedUser?.id, hasMoreMessages, isLoadingMore, loadMoreMessages]);

  // Enhanced floating reactions
  const triggerFloatingReaction = useCallback((emoji, messageElement) => {
    try {
      let x = 50;
      let y = 50;
      
      if (messageElement && messageElement.getBoundingClientRect) {
        const rect = messageElement.getBoundingClientRect();
        const containerRect = scrollContainerRef.current?.getBoundingClientRect();
        
        if (rect.width > 0 && rect.height > 0 && containerRect) {
          x = ((rect.left + rect.width / 2 - containerRect.left) / containerRect.width) * 100;
          y = ((rect.top + rect.height / 2 - containerRect.top) / containerRect.height) * 100;
          x = Math.max(10, Math.min(90, x));
          y = Math.max(10, Math.min(90, y));
        }
      }
      
      const reaction = {
        id: Date.now() + Math.random(),
        emoji,
        x,
        y,
        delay: 0,
        duration: 3000,
      };
      
      setFloatingReactions(prev => [...prev, reaction]);
      
      setTimeout(() => {
        setFloatingReactions(prev => prev.filter(r => r.id !== reaction.id));
      }, reaction.duration + 500);
      
      // Enhanced haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([30, 10, 30]);
      }
    } catch (error) {
      console.error("Floating reaction error:", error);
    }
  }, []);

  // Initialize chat
  useEffect(() => {
    if (!selectedUser?.id) return;

    isInitialLoad.current = true;
    previousMessagesLength.current = 0;
    setShowNewMessageButton(false);
    setNewMessageCount(0);
    setIsLoadingMore(false);
    loadingMoreRef.current = false;

    // Load initial messages
    getMessages?.(selectedUser.id);

    // Smooth scroll to bottom after brief delay
    // Instagram-style instant scroll to bottom - NO ANIMATION
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }

    return () => {
      // Cleanup handled by store
    };
  }, [selectedUser?.id, getMessages]);

  // Enhanced scroll management
  const scrollToBottomSmooth = useCallback((behavior = "smooth") => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: behavior,
    });
  }, []);

  // Handle new messages with smart scrolling
  useEffect(() => {
    if (!bottomRef.current || !scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const isScrolledToBottom = 
      container.scrollHeight - container.scrollTop - container.clientHeight < 150;

    if (messages.length > 0) {
      if (!isInitialLoad.current && messages.length > previousMessagesLength.current) {
        const newMessages = messages.slice(previousMessagesLength.current);
        const receivedMessages = newMessages.filter(msg => msg.senderId !== authUser?.id);
        const sentMessages = newMessages.filter(msg => msg.senderId === authUser?.id);

        if (sentMessages.length > 0) {
          // Always scroll for own messages
          scrollToBottomSmooth("smooth");
          setShowNewMessageButton(false);
          setNewMessageCount(0);
        } else if (receivedMessages.length > 0) {
          if (isScrolledToBottom) {
            scrollToBottomSmooth("smooth");
          } else {
            setNewMessageCount(prev => prev + receivedMessages.length);
            setShowNewMessageButton(true);
          }
        }
      } else if (isInitialLoad.current) {
        // Initial load - instant scroll
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
        isInitialLoad.current = false;
      }
      
      previousMessagesLength.current = messages.length;
    }
  }, [messages.length, authUser?.id, scrollToBottomSmooth]);

  // Handle typing indicator scroll
  useEffect(() => {
    if (isTyping && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const isNearBottom = 
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      if (isNearBottom) {
        scrollToBottomSmooth("smooth");
      }
    }
  }, [isTyping, scrollToBottomSmooth]);

  const handleReply = useCallback((message) => {
    setReplyingTo(message);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      if (smooth) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      } else {
        container.scrollTop = container.scrollHeight;
      }
      setShowNewMessageButton(false);
      setNewMessageCount(0);
    }
  }, []);

  const handleStartCall = useCallback((type) => {
    if (onStartCall) {
      onStartCall(type);
    }
  }, [onStartCall]);

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
    <div className={`flex-1 flex flex-col h-full w-full chat-performance-optimized chat-container-enter ${
      isMobile ? "mobile-chat-fullscreen" : ""
    }`}>
      <ChatHeader onStartCall={handleStartCall} />
      
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        data-chat-container
        className={`flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-3 bg-base-100 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent relative chat-scroll-optimized instant-scroll ${
          isMobile 
            ? `pt-24 mobile-chat-container professional-chat-container ${keyboardVisible ? 'keyboard-visible' : ''}` 
            : "pt-6"
        }`}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* Instagram-style loading more indicator */}
        {isLoadingMore && (
          <div className="infinite-scroll-loader visible">
            <div className="loading-dots">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          </div>
        )}

        {isMessagesLoading && !isLoadingMore ? (
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
                  isDifferentDay(message.createdAt, previousMessage.createdAt));

              return (
                <React.Fragment key={`message-group-${message.id}`}>
                  {showDateSeparator && (
                    <div className="flex justify-center my-6">
                      <div className="bg-base-200/50 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                        <span className="text-sm font-medium text-base-content/70">
                          {getDateLabel(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {message.messageType === "call" || message.callData || message.isCallLog ? (
                    <div className="flex justify-center w-full my-2">
                      <div className="max-w-md w-full">
                        <CallLogMessage message={message} isOwnMessage={mine} />
                      </div>
                    </div>
                  ) : (
                    <div className="message-enter-animation">
                      <ChatMessage
                        message={message}
                        onReply={handleReply}
                        onFloatingReaction={triggerFloatingReaction}
                        previousMessage={previousMessage}
                        nextMessage={messages[index + 1]}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </>
        )}

        {/* Enhanced typing indicator */}
        {isTyping && (
          <div className="flex justify-start w-full my-2">
            <div className="flex items-end gap-2 max-w-[80%]">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0 shadow-sm border border-base-200">
                <img
                  src={selectedUser.profilePic || "/avatar.png"}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="typing-indicator-optimized">
                <div className="typing-dots-optimized">
                  <div className="typing-dot-optimized"></div>
                  <div className="typing-dot-optimized"></div>
                  <div className="typing-dot-optimized"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />

        {/* Enhanced floating reactions */}
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
                fontFamily: "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
                animation: "simpleFloatUp 3s ease-out forwards",
                textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
              }}
            >
              {reaction.emoji}
            </div>
          ))}
        </div>

        {/* Enhanced new message indicator */}
        {showNewMessageButton && (
          <button
            onClick={() => scrollToBottom(true)}
            className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-20
                       flex items-center gap-2 px-4 py-2.5 rounded-full
                       bg-primary text-primary-content font-medium text-sm
                       shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-95
                       transition-all duration-300 animate-slide-up haptic-feedback"
            style={{
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
            }}
          >
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
            {newMessageCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 
                               bg-error text-error-content text-xs font-bold rounded-full
                               animate-pulse">
                {newMessageCount > 99 ? "99+" : newMessageCount}
              </span>
            )}
            <span className="hidden sm:inline">
              {newMessageCount > 1 ? `${newMessageCount} new messages` : "New message"}
            </span>
            <span className="sm:hidden">New</span>
          </button>
        )}
      </div>

      <MessageInput
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
};

export default React.memo(EnhancedChatContainer);