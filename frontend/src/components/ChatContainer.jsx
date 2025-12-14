import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { Download, Play, Pause } from "lucide-react";
import toast from "react-hot-toast";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import CallLogMessage from "./CallLogMessage";
import ChatMessage from "./ChatMessage";
import { formatMessageTime } from "../lib/utils";

// ✅ CRITICAL: Import animations for floating reactions
import "../styles/animations.css";

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


  // Typing indicator - Local state for maximum reliability
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);


  // Reply to message
  const [replyingTo, setReplyingTo] = useState(null);

  // ✅ NEW: Instagram-style "New message" indicator
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);

  // ✅ NEW: Floating reactions system
  const [floatingReactions, setFloatingReactions] = useState([]);

  // ✅ SIMPLE: Add window function for manual testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.testChatContainerFloating = (emoji = '🧪') => {
        console.log('🧪 Manual ChatContainer floating test triggered');
        triggerFloatingReaction(emoji, null);
      };
    }
  }, []);

  const handleReply = (message) => {
    setReplyingTo(message);
  };

  // ✅ SIMPLE & GUARANTEED: Working floating reaction function
  const triggerFloatingReaction = (emoji, messageElement) => {
    console.log('🎉 ChatContainer: Creating floating reaction', emoji);

    try {
      let x = 50; // Default center
      let y = 50; // Default center

      // Try to get position from message element
      if (messageElement && messageElement.getBoundingClientRect) {
        const rect = messageElement.getBoundingClientRect();
        const containerRect = scrollContainerRef.current?.getBoundingClientRect();

        if (rect.width > 0 && rect.height > 0 && containerRect) {
          // Calculate relative position within the chat container
          x = ((rect.left + rect.width / 2 - containerRect.left) / containerRect.width) * 100;
          y = ((rect.top + rect.height / 2 - containerRect.top) / containerRect.height) * 100;

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
        duration: 3000
      };

      console.log('✅ Creating floating reaction at:', x, y);

      // Add to state
      setFloatingReactions(prev => [...prev, reaction]);

      // Remove after animation
      setTimeout(() => {
        setFloatingReactions(prev => prev.filter(r => r.id !== reaction.id));
      }, reaction.duration + 500);

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      console.log('✅ Floating reaction created successfully');

    } catch (error) {
      console.error('❌ Error creating floating reaction:', error);
      // Still try to create a basic reaction at center
      const fallbackReaction = {
        id: Date.now() + Math.random(),
        emoji,
        x: 50,
        y: 50,
        delay: 0,
        duration: 3000
      };

      setFloatingReactions(prev => [...prev, fallbackReaction]);
      setTimeout(() => {
        setFloatingReactions(prev => prev.filter(r => r.id !== fallbackReaction.id));
      }, 3500);
    }
  };



  useEffect(() => {
    if (!selectedUser?.id) return;

    if (import.meta.env.DEV) console.log(`📱 ChatContainer: Loading chat for ${selectedUser.nickname || selectedUser.username}`);

    // ✅ ENHANCED: Reset state for new chat
    isInitialLoad.current = true;
    previousMessagesLength.current = 0;
    setShowNewMessageButton(false);
    setNewMessageCount(0);

    // ✅ INSTANT: Load messages immediately without delay
    getMessages?.(selectedUser.id);

    // ✅ ENHANCED: Force scroll to bottom after a brief delay to ensure messages are rendered
    setTimeout(() => {
      if (scrollContainerRef.current && isInitialLoad.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        if (import.meta.env.DEV) console.log('🔄 Force scroll to bottom after chat switch');
      }
    }, 100);

    // ✅ FIXED: Subscribe to socket events without parameters - but only if not already subscribed
    // Note: Subscriptions are now handled in HomePage to avoid conflicts

    return () => {
      // Cleanup is handled by the store
    };
  }, [selectedUser?.id, getMessages, subscribeToMessages]);


  // ✅ RELIABLE: Handle typing events locally in the component
  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleTypingEvent = (data) => {
      console.log('🔥 FRONTEND RECEIVED TYPING:', data);
      const senderId = data?.senderId || data;
      console.log(`   -> Check: Sender ${senderId} vs Selected ${selectedUser?.id}`);


      // Update debug log UI
      const debugContainer = document.getElementById('debug-log-container');
      if (debugContainer) {
        const log = document.createElement('div');
        log.innerText = `RX Typing: ${senderId?.slice(0, 8)}...`;
        debugContainer.prepend(log);
      }

      // Strict check: Only show if the typing user is the one we are currently chatting with
      if (senderId && selectedUser && senderId.toString() === selectedUser.id.toString()) {
        console.log('   -> ✅ MATCH! Showing indicator');
        // toast.success("📥 Rx Typing", { id: "debug-typing-rx", duration: 2000, icon: '📥' });
        setIsTyping(true);

        // Auto-scroll to bottom to show the indicator
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          // Only scroll if we are already near bottom
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
          if (isNearBottom) {
            setTimeout(() => {
              container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            }, 50);
          }
        }
      }
    };

    const handleStopTypingEvent = (data) => {
      const senderId = data?.senderId || data;
      if (senderId && selectedUser && senderId.toString() === selectedUser.id.toString()) {
        setIsTyping(false);
      }
    };

    socket.on("typing", handleTypingEvent);
    socket.on("stopTyping", handleStopTypingEvent);

    return () => {
      socket.off("typing", handleTypingEvent);
      socket.off("stopTyping", handleStopTypingEvent);
    };
  }, [socket, selectedUser]);

  // ✅ INSTANT SCROLL: Use useLayoutEffect to scroll before paint
  useLayoutEffect(() => {
    if (messages.length > 0 && isInitialLoad.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, selectedUser?.id]);

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
        // ✅ ENHANCED: Multiple attempts to ensure scroll to bottom works
        const scrollToBottomInstant = () => {
          if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            container.scrollTop = container.scrollHeight;

            // ✅ DOUBLE CHECK: Ensure we actually scrolled to bottom
            const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10;
            if (!isAtBottom) {
              // Try again with requestAnimationFrame
              requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
              });
            }
          }
        };

        // ✅ INSTANT: Initial load scroll - no animation, no delay
        scrollToBottomInstant();

        // ✅ BACKUP: Try again after a brief delay to ensure DOM is updated
        setTimeout(scrollToBottomInstant, 50);

        if (import.meta.env.DEV) console.log(`📜 Initial load: Jumped to bottom (${messages.length} messages)`);
        isInitialLoad.current = false;
      }

      previousMessagesLength.current = messages.length;
    }
  }, [messages.length, authUser?.id]); // Removed isTyping from here to handle it separately

  // ✅ VISIBILITY: Auto-scroll when friend starts typing
  useEffect(() => {
    if (isTyping && bottomRef.current) {
      // Small delay to allow rendering
      setTimeout(() => {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isTyping]);

  // ✅ ENHANCED: Additional scroll effect for better reliability
  useEffect(() => {
    if (messages.length > 0 && isInitialLoad.current) {
      // ✅ MULTIPLE ATTEMPTS: Ensure scroll happens after DOM updates
      const attempts = [0, 50, 100, 200];

      attempts.forEach(delay => {
        setTimeout(() => {
          if (scrollContainerRef.current && isInitialLoad.current) {
            scrollToBottom(false); // Instant scroll
          }
        }, delay);
      });
    }
  }, [messages]);

  // ✅ ENHANCED: Reliable scroll to bottom function
  const scrollToBottom = (smooth = true) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;

      if (smooth) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        // Instant scroll
        container.scrollTop = container.scrollHeight;

        // ✅ ENSURE: Double-check we reached the bottom
        requestAnimationFrame(() => {
          if (container.scrollTop < container.scrollHeight - container.clientHeight - 10) {
            container.scrollTop = container.scrollHeight;
          }
        });
      }

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

  import SeasonalParticles from "./effects/SeasonalParticles";

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
              if (message.messageType === "call" || message.callData || message.isCallLog) {
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
              return <ChatMessage
                key={message.id}
                message={message}
                onReply={handleReply}
                onFloatingReaction={triggerFloatingReaction}
              />;
            })
          )}

          {/* Typing Indicator - Enhanced Bubble */}
          {isTyping && (
            <div className="flex justify-start w-full my-2 animate-slide-up">
              <div className="flex items-end gap-2 max-w-[80%]">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0 shadow-sm">
                  <img
                    src={selectedUser.profilePic || "/avatar.png"}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="chat-bubble flex items-center p-3 bg-base-200 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex gap-1.5 px-1">
                    <span className="w-2 h-2 bg-base-content/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-base-content/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-base-content/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              overflow: 'hidden',
              zIndex: 99999
            }}
          >
            {floatingReactions.map((reaction) => (
              <div
                key={reaction.id}
                className="floating-reaction-simple"
                style={{
                  position: 'absolute',
                  left: `${reaction.x}%`,
                  top: `${reaction.y}%`,
                  fontSize: '2.5rem',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 99999,
                  pointerEvents: 'none',
                  fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
                  animation: 'simpleFloatUp 3s ease-out forwards',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
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


    </>
  );
};

export default ChatContainer;
