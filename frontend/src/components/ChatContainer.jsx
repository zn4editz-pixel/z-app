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
    if (!selectedUser?._id) return;
    
    console.log(`📱 ChatContainer: Loading chat for ${selectedUser.nickname || selectedUser.username}`);
    
    isInitialLoad.current = true;
    previousMessagesLength.current = 0;
    
    getMessages?.(selectedUser._id);
    const unsub = subscribeToMessages?.(selectedUser._id);
    return () => typeof unsub === "function" && unsub();
  }, [selectedUser?._id, getMessages, subscribeToMessages]);

  useEffect(() => {
    if (!bottomRef.current || !scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const isScrolledToBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    // INSTANT scroll to bottom - NO ANIMATION
    if (messages.length > 0) {
      // ✅ NEW: If user is scrolled up and new message arrives, show indicator
      if (!isInitialLoad.current && !isScrolledToBottom && messages.length > previousMessagesLength.current) {
        const newCount = messages.length - previousMessagesLength.current;
        setNewMessageCount(prev => prev + newCount);
        setShowNewMessageButton(true);
      } else {
        // Auto-scroll if at bottom or initial load
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
          }
        });
        setShowNewMessageButton(false);
        setNewMessageCount(0);
      }
      
      if (isInitialLoad.current) {
        console.log(`📜 Initial load: Jumped to bottom (${messages.length} messages)`);
        isInitialLoad.current = false;
      }
      previousMessagesLength.current = messages.length;
    }
  }, [messages.length, isTyping]);
  
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
      if (senderId === selectedUser._id) {
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
      if (senderId === selectedUser._id) {
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
          className="flex-1 overflow-y-auto p-2.5 sm:p-4 space-y-2.5 sm:space-y-4 bg-base-100 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent relative" 
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
              const mine = message.senderId === authUser?._id;
              
              // Render call log message
              if (message.messageType === "call" || message.callData) {
                return (
                  <div
                    key={message._id || message.id}
                    className="flex justify-center w-full my-2"
                  >
                    <div className="max-w-md w-full">
                      <CallLogMessage message={message} isOwnMessage={mine} />
                    </div>
                  </div>
                );
              }
              
              // Use new ChatMessage component with reactions and reply
              return <ChatMessage key={message._id || message.id} message={message} onReply={handleReply} />;
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
          
          {/* ✅ NEW: Instagram-style "New message" button */}
          {showNewMessageButton && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 btn btn-primary btn-sm gap-2 shadow-2xl animate-bounce z-10"
              style={{ 
                animation: 'bounce 1s ease-in-out infinite',
                backdropFilter: 'blur(10px)'
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              {newMessageCount > 0 && (
                <span className="badge badge-sm badge-error">{newMessageCount}</span>
              )}
              New message{newMessageCount > 1 ? 's' : ''}
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
