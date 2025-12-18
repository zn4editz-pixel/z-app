import React, { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useThemeStore } from "../store/useThemeStore";
import { formatMessageTime } from "../lib/utils";
import {
  getMessageStatusInfo,
  getThemeColors,
  getReactionBadgeStyle,
} from "../utils/messageStatus";
import {
  Trash2,
  Download,
  Play,
  Pause,
  Reply,
  X,
  Phone,
  Video,
} from "lucide-react";
import MessageStatus from "./MessageStatus";
import GameInviteMessage from "./chat/GameInviteMessage";
import toast from "react-hot-toast";
import "../styles/chat-improvements.css";

const REACTION_EMOJIS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];
const LONG_PRESS_DURATION = 500;
const DOUBLE_TAP_DELAY = 300;
const SWIPE_THRESHOLD = 60;

const EnhancedChatMessage = ({
  message,
  onReply,
  onFloatingReaction,
  isNewMessage = false,
  previousMessage,
  nextMessage,
}) => {
  const { authUser, onlineUsers } = useAuthStore();
  const { addReaction, removeReaction, deleteMessage, selectedUser } = useChatStore();
  const { theme } = useThemeStore();

  // Message grouping logic
  const isMyMessage = message.senderId === authUser.id;
  const isSequenceStart = !previousMessage || previousMessage.senderId !== message.senderId;
  const isSequenceEnd = !nextMessage || nextMessage.senderId !== message.senderId;

  // Enhanced border radius for message grouping
  const getBorderRadiusDetails = () => {
    if (isMyMessage) {
      if (isSequenceStart && isSequenceEnd) return "rounded-[22px]";
      if (isSequenceStart) return "rounded-[22px] rounded-br-md mb-[2px]";
      if (isSequenceEnd) return "rounded-[22px] rounded-tr-md mt-[2px]";
      return "rounded-[22px] rounded-tr-md rounded-br-md my-[2px]";
    } else {
      if (isSequenceStart && isSequenceEnd) return "rounded-[22px]";
      if (isSequenceStart) return "rounded-[22px] rounded-bl-md mb-[2px]";
      if (isSequenceEnd) return "rounded-[22px] rounded-tl-md mt-[2px]";
      return "rounded-[22px] rounded-tl-md rounded-bl-md my-[2px]";
    }
  };

  const bubbleRadiusClass = getBorderRadiusDetails();
  const showAvatar = !isMyMessage && isSequenceEnd;

  // State management
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Refs
  const longPressTimer = useRef(null);
  const lastTap = useRef(0);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchStartTime = useRef(0);
  const audioRef = useRef(null);
  const messageRef = useRef(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isReceiverOnline = selectedUser && onlineUsers.includes(selectedUser.id);
  const reactions = Array.isArray(message.reactions) ? message.reactions : [];

  // Auto-mark messages as read
  useEffect(() => {
    if (!isMyMessage && selectedUser && message.status !== "read") {
      const timer = setTimeout(() => {
        useChatStore.getState().markMessagesAsRead(selectedUser.id);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isMyMessage, selectedUser?.id, message.status]);

  const myReaction = reactions.find((r) => {
    const reactionUserId = r.userId?.id || r.userId;
    const currentUserId = authUser.id;
    return reactionUserId === currentUserId;
  });

  const themeColors = getThemeColors(theme);
  const statusInfo = getMessageStatusInfo(message, isMyMessage, isReceiverOnline, themeColors);

  // Enhanced touch handlers with better mobile support
  const handleTouchStart = (e) => {
    if (!isMobile) return;
    
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    touchStartTime.current = Date.now();
    
    // Enhanced long press with haptic feedback
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) {
        navigator.vibrate([50, 10, 50]); // Double vibration for long press
      }
      
      if (message.image) {
        handleLongPressImage();
      } else {
        handleLongPressReaction();
      }
    }, LONG_PRESS_DURATION);
  };

  const handleTouchMove = (e) => {
    if (!isMobile) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartPos.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

    // Cancel long press if moved significantly
    if (Math.abs(deltaX) > 10 || deltaY > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }

    // Enhanced swipe to reply
    if (Math.abs(deltaX) > 10 && deltaY < 30) {
      const offset = isMyMessage ? Math.min(0, deltaX) : Math.max(0, deltaX);
      const newOffset = Math.abs(offset) > SWIPE_THRESHOLD
        ? isMyMessage ? -SWIPE_THRESHOLD : SWIPE_THRESHOLD
        : offset;

      // Haptic feedback when threshold is reached
      if (Math.abs(newOffset) >= SWIPE_THRESHOLD && Math.abs(swipeOffset) < SWIPE_THRESHOLD) {
        if (navigator.vibrate) navigator.vibrate(30);
      }
      
      setSwipeOffset(newOffset);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    
    const touchDuration = Date.now() - touchStartTime.current;

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Check for swipe to reply
    if (Math.abs(swipeOffset) >= SWIPE_THRESHOLD) {
      onReply && onReply(message);
      if (navigator.vibrate) navigator.vibrate(30);
    }

    // Reset swipe
    setTimeout(() => setSwipeOffset(0), 200);

    // Enhanced double tap detection
    const now = Date.now();
    if (touchDuration < 200 && now - lastTap.current < DOUBLE_TAP_DELAY) {
      handleDoubleTap();
    }
    lastTap.current = now;
  };

  const handleLongPressImage = () => {
    if (message.image) {
      if (navigator.vibrate) navigator.vibrate(50);
      setShowImageModal(true);
    }
  };

  const handleLongPressReaction = () => {
    if (navigator.vibrate) navigator.vibrate([50, 10, 50]);
    setShowReactionPicker(true);
    createSimpleFloatingReaction("❤️", messageRef.current);
  };

  const handleDoubleTap = () => {
    if (navigator.vibrate) navigator.vibrate([30, 10, 30]);
    
    if (myReaction?.emoji === "❤️") {
      removeReaction(message.id);
    } else {
      addReaction(message.id, "❤️");
      showHeartAnimation();
      createSimpleFloatingReaction("❤️", messageRef.current);
    }
  };

  // Enhanced floating reaction system
  const createSimpleFloatingReaction = (emoji, element) => {
    try {
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;
      
      if (element && element.getBoundingClientRect) {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        }
      }
      
      const floatingEmoji = document.createElement("div");
      floatingEmoji.innerHTML = emoji;
      floatingEmoji.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        font-size: 3rem;
        pointer-events: none;
        z-index: 999999;
        transform: translate(-50%, -50%);
        font-family: Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif;
        animation: simpleFloatUp 3s ease-out forwards;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      `;
      
      document.body.appendChild(floatingEmoji);
      
      setTimeout(() => {
        if (floatingEmoji.parentNode) {
          floatingEmoji.parentNode.removeChild(floatingEmoji);
        }
      }, 3500);
      
      if (navigator.vibrate) navigator.vibrate(30);
    } catch (error) {
      console.error("Floating reaction error:", error);
    }
  };

  const showHeartAnimation = () => {
    const heart = document.createElement("div");
    heart.innerHTML = "❤️";
    heart.style.cssText = `
      position: fixed;
      font-size: 60px;
      pointer-events: none;
      z-index: 9999;
      animation: heartFloat 1s ease-out forwards;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      filter: drop-shadow(0 0 8px ${themeColors.primary}50);
    `;
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1000);
  };

  const handleReactionSelect = (emoji) => {
    if (myReaction?.emoji === emoji) {
      removeReaction(message.id);
    } else {
      addReaction(message.id, emoji);
      createSimpleFloatingReaction(emoji, messageRef.current);
    }
    setShowReactionPicker(false);
  };

  const handleDelete = () => {
    deleteMessage(message.id);
  };

  const handleDownloadImage = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Image saved!");
      setShowImageModal(false);
    } catch (error) {
      toast.error("Failed to save image");
    }
  };

  const toggleVoicePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction.userId);
    return acc;
  }, {});

  // Check message types
  const isEmojiOnly = message.text && /^[\p{Emoji}\s]+$/u.test(message.text) && !message.image && !message.voice;
  const emojiCount = message.text ? (message.text.match(/\p{Emoji}/gu) || []).length : 0;
  const isNumberOnly = message.text && /^\d+$/.test(message.text.trim()) && !message.image && !message.voice;
  const numberLength = message.text ? message.text.trim().length : 0;
  const isShortNumber = isNumberOnly && numberLength <= 3;

  if (message.isDeleted) {
    return (
      <div className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"} mb-3 px-3`}>
        <div className="flex items-end max-w-[85%] sm:max-w-[75%] gap-2">
          {!isMyMessage && (
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-base-300 flex-shrink-0 opacity-50">
              <img
                src={selectedUser?.profilePic || "/avatar.png"}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="px-3 py-2 text-sm rounded-2xl bg-base-200/50 border border-base-300/50">
            <div className="flex items-center gap-2 text-base-content/50 italic text-xs">
              <Trash2 className="w-3 h-3" />
              <span>Message deleted</span>
            </div>
          </div>
        </div>
        <div className="text-[10px] text-base-content/40 mt-1 px-1">
          {formatMessageTime(message.createdAt)}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={messageRef}
        id={`message-${message.id}`}
        className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"} ${
          Object.keys(groupedReactions).length > 0 ? "message-with-reactions mb-4" : isSequenceEnd ? "mb-3" : "mb-1"
        } relative w-full max-w-full px-3 message-scroll-item message-optimized`}
      >
        <div
          className="flex items-end gap-2 relative min-w-0"
          style={{
            maxWidth: "min(75%, 350px)",
            wordBreak: "break-word",
          }}
        >
          {!isMyMessage && !isEmojiOnly && !isShortNumber && (
            <div className={`w-8 h-8 flex-shrink-0 ${showAvatar ? "opacity-100" : "opacity-0 invisible"}`}>
              {showAvatar && (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-base-300">
                  <img
                    src={selectedUser?.profilePic || "/avatar.png"}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          )}
          
          <div
            className="message-bubble-container relative max-w-full long-press-target"
            style={{
              WebkitTapHighlightColor: "transparent",
              transform: `translateX(${swipeOffset}px)`,
              transition: swipeOffset === 0 ? "transform 0.2s ease-out" : "none",
              touchAction: "manipulation",
              userSelect: "none",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            data-message-id={message.id}
            data-touch-enabled="true"
          >
            {/* Enhanced Swipe Reply Icon */}
            {Math.abs(swipeOffset) > 20 && (
              <div
                className={`absolute top-1/2 -translate-y-1/2 ${
                  isMyMessage ? "-right-12" : "-left-12"
                } transition-all duration-200`}
                style={{
                  opacity: Math.min(Math.abs(swipeOffset) / SWIPE_THRESHOLD, 1),
                  transform: `translateY(-50%) scale(${Math.min(Math.abs(swipeOffset) / SWIPE_THRESHOLD, 1)})`,
                }}
              >
                <div
                  className={`w-8 h-8 rounded-full bg-base-300/80 backdrop-blur-sm flex items-center justify-center shadow-lg ${
                    Math.abs(swipeOffset) >= SWIPE_THRESHOLD ? "bg-primary/20 scale-110" : ""
                  } transition-all duration-200`}
                >
                  <Reply
                    className={`w-4 h-4 ${
                      Math.abs(swipeOffset) >= SWIPE_THRESHOLD ? "text-primary" : "text-base-content/70"
                    } ${isMyMessage ? "" : "scale-x-[-1]"} transition-colors duration-200`}
                  />
                </div>
              </div>
            )}

            {/* Message Content */}
            {message.image && !message.text && !message.voice ? (
              <div
                className="relative group"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImageModal(true);
                }}
              >
                <img
                  src={message.image}
                  className="rounded-2xl max-h-64 sm:max-h-80 min-w-[200px] max-w-[300px] w-auto object-cover cursor-pointer active:scale-[0.98] transition-transform shadow-lg bg-base-300"
                  alt="attached"
                  loading="lazy"
                  onLoad={(e) => {
                    e.target.style.opacity = "1";
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    toast.error("Failed to load image");
                  }}
                  style={{ opacity: 0, transition: "opacity 0.3s" }}
                />
              </div>
            ) : message.text && message.text.startsWith("GAME_INVITE:") ? (
              <GameInviteMessage
                message={message}
                onJoin={(gameId) => {
                  const inviteId = message.text.replace("GAME_INVITE:", "");
                  const { socket, authUser } = useAuthStore.getState();
                  socket.emit("game:join", {
                    gameId: inviteId,
                    myName: authUser.fullName,
                    myPic: authUser.profilePic,
                  });
                }}
              />
            ) : message.isCallLog ? (
              <div className="flex justify-center w-full my-2 mb-4">
                <div className="bg-base-300/50 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-medium text-base-content/70 flex items-center gap-2 shadow-sm border border-base-content/5">
                  {message.callType === "video" ? <Video size={14} /> : <Phone size={14} />}
                  <span>
                    {message.callStatus === "missed"
                      ? "Missed call"
                      : message.callStatus === "declined"
                      ? "Call declined"
                      : message.callStatus === "busy"
                      ? "Line busy"
                      : `Call ${message.callStatus === "completed" ? "ended" : "started"}`}
                  </span>
                  {message.callDuration > 0 && (
                    <span className="opacity-70">
                      • {Math.floor(message.callDuration / 60)}:
                      {String(message.callDuration % 60).padStart(2, "0")}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div
                className={
                  isEmojiOnly || isNumberOnly
                    ? ""
                    : `relative px-4 py-2.5 text-[0.93rem] shadow-sm message-bubble-professional ${bubbleRadiusClass} ${
                        isMyMessage
                          ? "bg-gradient-to-br from-primary to-primary/95 text-primary-content"
                          : "bg-base-200 text-base-content border border-base-300/10"
                      }`
                }
                style={
                  isEmojiOnly || isNumberOnly
                    ? {}
                    : {
                        display: "inline-block",
                        maxWidth: "100%",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        pointerEvents: "auto",
                      }
                }
              >
                {/* Reply Preview */}
                {message.replyTo && (
                  <div
                    className={`mb-2 rounded-xl p-3 cursor-pointer active:scale-[0.98] transition-all duration-200 overflow-hidden relative instagram-reply-preview ${
                      isMyMessage
                        ? "bg-black/10 dark:bg-black/20 hover:bg-black/15 dark:hover:bg-black/25"
                        : "bg-base-content/5 hover:bg-base-content/10 border border-base-content/5"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (navigator.vibrate) navigator.vibrate(30);
                      const replyElement = document.getElementById(`message-${message.replyTo.id}`);
                      if (replyElement) {
                        replyElement.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                          inline: "nearest",
                        });
                        replyElement.classList.add("instagram-highlight-flash");
                        setTimeout(() => {
                          replyElement.classList.remove("instagram-highlight-flash");
                        }, 2000);
                      } else {
                        toast.error("Message not found in current chat", {
                          icon: "📍",
                          duration: 2000,
                        });
                      }
                    }}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${
                      isMyMessage ? "bg-primary-content/80" : "bg-primary/80"
                    }`} />
                    <div className="pl-3">
                      <div className={`text-[11px] font-semibold mb-1 truncate flex items-center gap-1.5 ${
                        isMyMessage ? "text-primary-content/90" : "text-primary"
                      }`}>
                        <span>
                          {message.replyTo.senderId === authUser.id
                            ? "You"
                            : selectedUser?.fullName || selectedUser?.nickname || "User"}
                        </span>
                        <span className="text-[10px] opacity-50 ml-auto">Tap to view</span>
                      </div>
                      <div className={`text-[12px] leading-tight opacity-90 ${
                        isMyMessage ? "text-primary-content/85" : "text-base-content/75"
                      }`}>
                        {message.replyTo.text && message.replyTo.text.trim() ? (
                          <div className="line-clamp-2 break-words">{message.replyTo.text}</div>
                        ) : message.replyTo.image ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">📷</span>
                            <span>Photo</span>
                          </div>
                        ) : message.replyTo.voice ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">🎤</span>
                            <span>Voice message</span>
                          </div>
                        ) : (
                          <span className="italic opacity-60">Message</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Message Content Based on Type */}
                {isEmojiOnly && emojiCount > 0 ? (
                  <div
                    className={`${
                      emojiCount === 1 ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl"
                    } leading-tight`}
                    style={{ maxWidth: "100%", wordBreak: "break-word" }}
                  >
                    {message.text}
                  </div>
                ) : isShortNumber ? (
                  <div
                    className={`${
                      numberLength === 1
                        ? "text-5xl sm:text-6xl"
                        : numberLength === 2
                        ? "text-4xl sm:text-5xl"
                        : "text-3xl sm:text-4xl"
                    } font-bold leading-tight ${isMyMessage ? "text-primary" : "text-base-content"}`}
                    style={{
                      maxWidth: "100%",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    {message.text}
                  </div>
                ) : isNumberOnly ? (
                  <div
                    className={`text-2xl sm:text-3xl font-bold leading-tight ${
                      isMyMessage ? "text-primary" : "text-base-content"
                    }`}
                    style={{
                      maxWidth: "100%",
                      wordBreak: "break-all",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {message.text}
                  </div>
                ) : (
                  <>
                    {/* Image with text */}
                    {message.image && message.text && (
                      <div
                        className="relative group mb-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowImageModal(true);
                        }}
                      >
                        <img
                          src={message.image}
                          className="rounded-xl max-h-64 sm:max-h-80 min-w-[200px] object-cover w-full cursor-pointer active:scale-[0.98] transition-transform bg-base-300"
                          alt="attached"
                          loading="lazy"
                          onLoad={(e) => {
                            e.target.style.opacity = "1";
                          }}
                          onError={(e) => {
                            e.target.style.display = "none";
                            toast.error("Failed to load image");
                          }}
                          style={{ opacity: 0, transition: "opacity 0.3s" }}
                        />
                      </div>
                    )}

                    {/* Voice Message */}
                    {message.voice && (
                      <div className="flex items-center gap-2 min-w-[200px] max-w-[280px]">
                        <button
                          onClick={toggleVoicePlayback}
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all haptic-feedback ${
                            isPlaying
                              ? "bg-primary/20 scale-110"
                              : isMyMessage
                              ? "bg-primary-content/20"
                              : "bg-primary/10"
                          }`}
                        >
                          {isPlaying ? (
                            <Pause className="w-4 h-4" fill="currentColor" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                          )}
                        </button>
                        
                        <div className="flex-1 flex items-center justify-center gap-[3px] h-8">
                          {[4, 7, 5, 9, 6, 10, 7, 8, 5, 9, 6, 7, 8, 6, 9, 7, 5, 8, 6, 7].map((height, i) => {
                            const duration = message.voiceDuration || 3;
                            const progress = currentTime / duration;
                            const isActive = isPlaying && i / 20 <= progress;
                            return (
                              <div
                                key={i}
                                className={`w-[3px] rounded-full transition-all duration-150 ${
                                  isActive
                                    ? isMyMessage
                                      ? "bg-primary-content"
                                      : "bg-primary"
                                    : isMyMessage
                                    ? "bg-primary-content/30"
                                    : "bg-base-content/30"
                                }`}
                                style={{
                                  height: `${height * 2.5}px`,
                                  transform: isPlaying && isActive ? "scaleY(1.15)" : "scaleY(1)",
                                  opacity: isActive ? 1 : 0.6,
                                }}
                              />
                            );
                          })}
                        </div>
                        
                        <span className="text-xs opacity-70 font-medium min-w-[32px] text-right">
                          {isPlaying
                            ? `${Math.max(0, Math.ceil((message.voiceDuration || 0) - currentTime))}s`
                            : `${message.voiceDuration || 0}s`}
                        </span>
                        
                        <audio
                          ref={audioRef}
                          src={message.voice}
                          onEnded={() => {
                            setIsPlaying(false);
                            setCurrentTime(0);
                          }}
                        />
                      </div>
                    )}

                    {/* Text Message */}
                    {message.text && !isEmojiOnly && !isShortNumber && (
                      <p
                        className="message-text-content break-words whitespace-pre-wrap leading-relaxed"
                        style={{
                          textWrap: "balance",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {message.text}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Enhanced Reactions */}
            {Object.keys(groupedReactions).length > 0 && (
              <div className="reaction-badges-container flex flex-wrap gap-1 mt-1">
                {Object.entries(groupedReactions).map(([emoji, users]) => {
                  const hasMyReaction = users.some((user) => {
                    const userId = user?.id || user;
                    return userId === authUser.id;
                  });
                  
                  return (
                    <div
                      key={emoji}
                      className={`reaction-badge-optimized ${hasMyReaction ? "my-reaction" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasMyReaction) {
                          removeReaction(message.id);
                          if (navigator.vibrate) navigator.vibrate(20);
                        }
                      }}
                    >
                      <span style={{ fontSize: "12px", lineHeight: "1" }}>{emoji}</span>
                      {users.length > 1 && (
                        <span style={{ fontSize: "10px", fontWeight: "700", lineHeight: "1" }}>
                          {users.length}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Time and Status */}
        <div className="flex items-center gap-1.5 mt-1 px-1">
          <span className="text-[10px] text-base-content/50">
            {formatMessageTime(message.createdAt)}
          </span>
          <MessageStatus message={message} isMyMessage={isMyMessage} />
        </div>
      </div>

      {/* Enhanced Mobile Reaction Picker */}
      {showReactionPicker && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setShowReactionPicker(false)}
        >
          <div
            className="reaction-picker-mobile visible"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reaction-grid">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReactionSelect(emoji)}
                  className={`reaction-button ${myReaction?.emoji === emoji ? "scale-110 bg-primary/20" : ""}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            
            {isMyMessage && (
              <button
                onClick={() => {
                  handleDelete();
                  setShowReactionPicker(false);
                }}
                className="w-full btn btn-error btn-sm gap-2 haptic-feedback"
              >
                <Trash2 className="w-4 h-4" />
                Delete Message
              </button>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Image Modal */}
      {showImageModal && message.image && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 btn btn-circle btn-sm bg-base-100/20 border-none text-white haptic-feedback"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={message.image}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              alt="Full size"
            />
            <button
              onClick={() => handleDownloadImage(message.image)}
              className="absolute bottom-4 right-4 btn btn-primary gap-2 haptic-feedback"
            >
              <Download className="w-4 h-4" />
              Save Image
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(EnhancedChatMessage, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.message.isRead === nextProps.message.isRead &&
    prevProps.message.reactions?.length === nextProps.message.reactions?.length &&
    JSON.stringify(prevProps.message.reactions) === JSON.stringify(nextProps.message.reactions)
  );
});