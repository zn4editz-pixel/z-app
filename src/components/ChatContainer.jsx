import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useRef, useState } from "react";
import { Download, Play, Pause } from "lucide-react";
import toast from "react-hot-toast";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import CallLogMessage from "./CallLogMessage";
import ChatMessage from "./ChatMessage";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = ({ onStartCall }) => {
  const {
    messages = [],
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
  } = useChatStore();

  const { authUser, socket } = useAuthStore();
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isInitialLoad = useRef(true);
  const previousMessagesLength = useRef(0);
  
  // Voice message playback
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const audioRefs = useRef({});
  
  // Typing indicator
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  
  // Reply to message
  const [replyingTo, setReplyingTo] = useState(null);
  
  // ✅ NEW: Instagram-style "New message" indicator
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  
  const handleReply = (message) => {
    setReplyingTo(message);
  };

  useEffect(() => {
    if (!selectedUser?.id) return;
    
    if (import.meta.env.DEV) console.log(`📱 ChatContainer: Loading chat for ${selectedUser.nickname || selectedUser.username}`);
    
    isInitialLoad.current = true;
    previousMessagesLength.current = 0;
    
    // ✅ INSTANT: Load messages immediately without delay
    getMessages?.(selectedUser.id);
    const unsub = subscribeToMessages?.(selectedUser.id);
    return () => typeof unsub === "function" && unsub();
  }, [selectedUser?.id, getMessages, subscribeToMessages]);

  useEffect(() => {
    if (!bottomRef.current || !scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const isScrolledToBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    // INSTANT scroll to bottom - NO ANIMATION
    if (messages.length > 0) {
      // ✅ FIXED: Only show button for RECEIVED messages (not sender's own)
      if (!isInitialLoad.current && messages.length > previousMessagesLength.current) {
        // Check if new messages are from the OTHER person (not me)
        const newMessages = messages.slice(previousMessagesLength.current);
        const receivedMessages = newMessages.filter(msg => msg.senderId !== authUser?.id);
        
        // Only show button if: scrolled up AND received messages from other person
        if (!isScrolledToBottom && receivedMessages.length > 0) {
          setNewMessageCount(prev => prev + receivedMessages.length);
          setShowNewMessageButton(true);
        } else {
          // Auto-scroll if: at bottom OR sender sent message (always scroll for own messages)
          requestAnimationFrame(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            }
          });
          setShowNewMessageButton(false);
          setNewMessageCount(0);
        }
      } else if (isInitialLoad.current) {
        // ✅ INSTANT: Initial load scroll - no animation, no delay
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
        if (import.meta.env.DEV) console.log(`📜 Initial load: Jumped to bottom (${messages.length} messages)`);
        isInitialLoad.current = false;
      }
      
      previousMessagesLength.current = messages.length;
    }
  }, [messages.length, isTyping, authUser?.id]);
  
  // ✅ NEW: Handle scroll to bottom button click
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
      setShowNewMessageButton(false);
      setNewMessageCount(0);
    }
  };
  
  // ✅ NEW: Detect manual scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const isScrolledToBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    if (isScrolledToBottom) {
      setShowNewMessageButton(false);
      setNewMessageCount(0);
    }
  };

  // Handle typing indicator
  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleTyping = ({ senderId }) => {
      if (senderId === selectedUser.id) {
        setIsTyping(true);
        
        // Clear previous timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Auto-hide after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    };

    const handleStopTyping = ({ senderId }) => {
      if (senderId === selectedUser.id) {
        setIsTyping(false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    };

    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, selectedUser]);

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
      console.error("Download error:", error);
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
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md text-center">
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
      <div className="flex-1 flex flex-col h-full w-full">
        <ChatHeader onStartCall={handleStartCall} />
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 sm:p-4 space-y-2.5 sm:space-y-4 bg-base-100 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent relative" 
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {isMessagesLoading ? (
            <MessageSkeleton />
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="text-6xl mb-4">👋</div>
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p className="text-sm text-base-content/60">
                Start the conversation by sending a message!
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const mine = message.senderId === authUser?.id;
              
              // Render call log message
              if (message.messageType === "call" || message.callData) {
                return (
                  <div
                    key={message.id || message.id}
                    className="flex justify-center w-full my-2"
                  >
                    <div className="max-w-md w-full">
                      <CallLogMessage message={message} isOwnMessage={mine} />
                    </div>
                  </div>
                );
              }
              
              // Use new ChatMessage component with reactions and reply
              return <ChatMessage key={message.id} message={message} onReply={handleReply} />;
            })
          )}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start gap-2 animate-fadeIn">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-base-300 flex-shrink-0">
                <img
                  src={selectedUser.profilePic || "/avatar.png"}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bg-base-200 px-4 py-3 rounded-2xl shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-base-content/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-base-content/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-base-content/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={bottomRef} />
          
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
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              
              {/* Message count badge */}
              {newMessageCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 
                               bg-error text-error-content text-xs font-bold rounded-full
                               animate-pulse">
                  {newMessageCount > 99 ? '99+' : newMessageCount}
                </span>
              )}
              
              {/* Text */}
              <span className="hidden sm:inline">
                {newMessageCount > 1 ? `${newMessageCount} new messages` : 'New message'}
              </span>
              <span className="sm:hidden">
                {newMessageCount > 1 ? 'New' : 'New'}
              </span>
            </button>
          )}
        </div>
        <MessageInput replyingTo={replyingTo} onCancelReply={() => setReplyingTo(null)} />
      </div>

      <style>{`
        .bubble-left::after {
          content: "";
          position: absolute;
          left: -6px;
          bottom: 4px;
          border-top: 6px solid transparent;
          border-right: 6px solid var(--b2);
          border-bottom: 6px solid transparent;
        }
        .bubble-right::after {
          content: "";
          position: absolute;
          right: -6px;
          bottom: 4px;
          border-top: 6px solid transparent;
          border-left: 6px solid var(--p);
          border-bottom: 6px solid transparent;
        }
      `}</style>
    </>
  );
};

export default ChatContainer;
