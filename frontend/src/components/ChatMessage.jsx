import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useThemeStore } from "../store/useThemeStore";
import { formatMessageTime } from "../lib/utils";
import { getMessageStatusInfo, getThemeColors, getReactionBadgeStyle } from "../utils/messageStatus";
import { Trash2, Download, Play, Pause, Reply, X } from "lucide-react";
import toast from "react-hot-toast";

const REACTION_EMOJIS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];
const LONG_PRESS_DURATION = 500; // ms
const DOUBLE_TAP_DELAY = 300; // ms
const SWIPE_THRESHOLD = 60; // px


  // ✅ ENHANCED: Add visual feedback when reacting
  const addMessagePulse = (element) => {
    if (element) {
      element.classList.add('message-reacting');
      setTimeout(() => {
        element.classList.remove('message-reacting');
      }, 600);
    }
  };




const ChatMessage = ({ message, onReply, onFloatingReaction }) => {
  const { authUser, onlineUsers } = useAuthStore();
  const { addReaction, removeReaction, deleteMessage, selectedUser } = useChatStore();
  const { theme } = useThemeStore();
  const [showReactions, setShowReactions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  
  const longPressTimer = useRef(null);
  const lastTap = useRef(0);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchStartTime = useRef(0);
  const audioRef = useRef(null);
  const messageRef = useRef(null);
  
  const isMyMessage = message.senderId === authUser.id;
  
  // ✅ FIXED: Ensure reactions is always an array
  const reactions = Array.isArray(message.reactions) ? message.reactions : [];
  
  // ✅ FIXED: Proper user ID comparison for reaction detection
  const myReaction = reactions.find(r => {
    const reactionUserId = r.userId?.id || r.userId;
    const currentUserId = authUser.id;
    return reactionUserId === currentUserId;
  });
  
  // Check if receiver is online for message status
  const isReceiverOnline = selectedUser && onlineUsers.includes(selectedUser.id);
  
  // Get theme-based colors and status info
  const themeColors = getThemeColors(theme);
  const statusInfo = getMessageStatusInfo(message, isMyMessage, isReceiverOnline, themeColors);

  // Update current time while playing
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener('timeupdate', updateTime);
    return () => audio.removeEventListener('timeupdate', updateTime);
  }, []);

  // ✅ ENHANCED: Touch start handler with better debugging
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    touchStartTime.current = Date.now();
    
    console.log('👆 Touch start detected on message:', message.id);
    console.log('📍 Touch position:', touch.clientX, touch.clientY);
    
    // Start long press timer for reactions or image save
    longPressTimer.current = setTimeout(() => {
      console.log('⏰ Long press timer triggered after', LONG_PRESS_DURATION, 'ms');
      if (message.image) {
        console.log('🖼️ Image long press detected');
        handleLongPressImage();
      } else {
        console.log('💬 Message long press detected');
        handleLongPressReaction();
      }
    }, LONG_PRESS_DURATION);
    
    console.log('⏱️ Long press timer started');
  };

  // ✅ ENHANCED: Touch move handler with better debugging and haptic feedback
  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartPos.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
    
    console.log('👆 Touch move - delta:', deltaX, deltaY);
    
    // Cancel long press if moved significantly
    if (Math.abs(deltaX) > 10 || deltaY > 10) {
      if (longPressTimer.current) {
        console.log('❌ Long press cancelled due to movement');
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
    
    // Swipe to reply (only horizontal swipe)
    if (Math.abs(deltaX) > 10 && deltaY < 30) {
      const offset = isMyMessage ? Math.min(0, deltaX) : Math.max(0, deltaX);
      const newOffset = Math.abs(offset) > SWIPE_THRESHOLD ? (isMyMessage ? -SWIPE_THRESHOLD : SWIPE_THRESHOLD) : offset;
      
      // ✅ HAPTIC FEEDBACK: Vibrate when threshold is reached
      if (Math.abs(newOffset) >= SWIPE_THRESHOLD && Math.abs(swipeOffset) < SWIPE_THRESHOLD) {
        if (navigator.vibrate) navigator.vibrate(30);
      }
      
      setSwipeOffset(newOffset);
    }
  };

  // ✅ ENHANCED: Touch end handler with better debugging
  const handleTouchEnd = () => {
    const touchDuration = Date.now() - touchStartTime.current;
    console.log('👆 Touch end - duration:', touchDuration, 'ms');
    
    // Clear long press timer if still active
    if (longPressTimer.current) {
      console.log('❌ Long press timer cleared on touch end');
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // Check for swipe to reply
    if (Math.abs(swipeOffset) >= SWIPE_THRESHOLD) {
      console.log('↔️ Swipe to reply triggered');
      onReply && onReply(message);
      if (navigator.vibrate) navigator.vibrate(30);
    }
    
    // Reset swipe
    setTimeout(() => setSwipeOffset(0), 200);
    
    // Check for double tap (quick heart)
    const now = Date.now();
    
    if (touchDuration < 200 && now - lastTap.current < DOUBLE_TAP_DELAY) {
      console.log('💖 Double tap detected!');
      handleDoubleTap();
    }
    lastTap.current = now;
  };

  // Long press handler for images
  const handleLongPressImage = () => {
    if (message.image) {
      if (navigator.vibrate) navigator.vibrate(50);
      setShowImageModal(true);
    }
  };

  // ✅ DEBUG: Add window function for manual testing
  useEffect(() => {
    if (typeof window !== 'undefined' && messageRef.current) {
      window.testFloatingReaction = (emoji = '🧪') => {
        console.log('🧪 Manual test triggered for message:', message.id);
        if (onFloatingReaction && messageRef.current) {
          onFloatingReaction(emoji, messageRef.current);
        } else {
          createGuaranteedFloating(emoji, messageRef.current);
        }
      };
    }
  }, [onFloatingReaction, message.id]);

  // ✅ ENHANCED: Manual floating reaction creator as fallback with proper animation
  
  // ✅ GUARANTEED: Working floating reaction that always works
  const createSimpleFloatingReaction = (emoji, element) => {
    console.log('🎨 Creating GUARANTEED floating reaction:', emoji);
    
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
      
      const floatingEmoji = document.createElement('div');
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
      console.log('✅ GUARANTEED floating reaction created at:', x, y);
      
    } catch (error) {
      console.error('❌ Error creating floating reaction:', error);
    }
  };



  
  
  // ✅ SIMPLE: Long press handler with guaranteed floating reaction
  const handleLongPressReaction = () => {
    console.log('🔥 Long press detected - showing reaction picker');
    if (navigator.vibrate) navigator.vibrate(50);
    setShowReactionPicker(true);
    
    // ✅ GUARANTEED: Always trigger floating reaction
    createSimpleFloatingReaction("❤️", messageRef.current);
  };

  // ✅ SIMPLE: Double tap handler with guaranteed floating reaction
  const handleDoubleTap = () => {
    console.log('💖 Double tap detected - adding heart reaction');
    if (navigator.vibrate) navigator.vibrate(30);
    if (myReaction?.emoji === "❤️") {
      removeReaction(message.id);
    } else {
      addReaction(message.id, "❤️");
      showHeartAnimation();
      
      // ✅ GUARANTEED: Always trigger floating reaction
      createSimpleFloatingReaction("❤️", messageRef.current);
    }
  };

  // ✅ ENHANCED: Show heart animation with theme colors
  const showHeartAnimation = () => {
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
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

  // ✅ SIMPLE: Guaranteed floating reaction trigger
  const triggerFloatingReaction = (emoji) => {
    console.log('🎉 Triggering floating reaction:', emoji);
    createSimpleFloatingReaction(emoji, messageRef.current);
  };



  // ✅ SIMPLE: Handle reaction selection with guaranteed floating
  const handleReactionSelect = (emoji) => {
    if (myReaction?.emoji === emoji) {
      removeReaction(message.id);
    } else {
      addReaction(message.id, emoji);
      
      // ✅ GUARANTEED: Always trigger floating reaction
      createSimpleFloatingReaction(emoji, messageRef.current);
    }
    setShowReactionPicker(false);
  };

  // Handle delete
  const handleDelete = () => {
    deleteMessage(message.id);
  };

  // Handle download image
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

  // Handle voice playback
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
  
  // ✅ DEBUG: Log reaction data to help identify issues
  if (reactions.length > 0) {
    console.log(`🎯 Message ${message.id} has ${reactions.length} reactions:`, reactions);
    console.log(`🎯 Grouped reactions:`, groupedReactions);
    console.log(`🎯 Will render ${Object.keys(groupedReactions).length} reaction badges`);
  }

  // Check if emoji-only message
  const isEmojiOnly = message.text && /^[\p{Emoji}\s]+$/u.test(message.text) && !message.image && !message.voice;
  const emojiCount = message.text ? (message.text.match(/\p{Emoji}/gu) || []).length : 0;
  
  // Check if number-only message (and length)
  const isNumberOnly = message.text && /^\d+$/.test(message.text.trim()) && !message.image && !message.voice;
  const numberLength = message.text ? message.text.trim().length : 0;
  const isShortNumber = isNumberOnly && numberLength <= 3;

  // If message is deleted
  if (message.isDeleted) {
    return (
      <div className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"} mb-3`}>
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
        className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"} ${Object.keys(groupedReactions).length > 0 ? 'message-with-reactions' : 'mb-3'} relative w-full max-w-full`}
      >
        <div 
          className="flex items-end gap-2 relative min-w-0" 
          style={{ 
            maxWidth: 'min(75%, 350px)',
            wordBreak: 'break-word'
          }}
        >
          {!isMyMessage && !isEmojiOnly && !isShortNumber && (
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-base-300 flex-shrink-0">
              <img
                src={selectedUser?.profilePic || "/avatar.png"}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div
            className="message-bubble-container relative max-w-full"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              transform: `translateX(${swipeOffset}px)`,
              transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none',
              touchAction: 'pan-y',
              userSelect: 'none'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            data-message-id={message.id}
            data-touch-enabled="true"
          >
            {/* ✅ ENHANCED: Instagram/WhatsApp Style Swipe Reply Icon */}
            {Math.abs(swipeOffset) > 20 && (
              <div 
                className={`absolute top-1/2 -translate-y-1/2 ${isMyMessage ? '-right-12' : '-left-12'} transition-all duration-200`}
                style={{ 
                  opacity: Math.min(Math.abs(swipeOffset) / SWIPE_THRESHOLD, 1),
                  transform: `translateY(-50%) scale(${Math.min(Math.abs(swipeOffset) / SWIPE_THRESHOLD, 1)})`
                }}
              >
                <div className={`w-8 h-8 rounded-full bg-base-300/80 backdrop-blur-sm flex items-center justify-center shadow-lg ${
                  Math.abs(swipeOffset) >= SWIPE_THRESHOLD ? 'bg-primary/20 scale-110' : ''
                } transition-all duration-200`}>
                  <Reply className={`w-4 h-4 ${
                    Math.abs(swipeOffset) >= SWIPE_THRESHOLD ? 'text-primary' : 'text-base-content/70'
                  } ${isMyMessage ? '' : 'scale-x-[-1]'} transition-colors duration-200`} />
                </div>
              </div>
            )}

            {/* Image Only - NO BUBBLE (Instagram/WhatsApp Style) */}
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
                  loading="eager"
                  onLoad={(e) => {
                    console.log('✅ Image loaded:', message.image);
                    e.target.style.opacity = '1';
                  }}
                  onError={(e) => {
                    console.error('❌ Image failed to load:', message.image);
                    e.target.style.display = 'none';
                    toast.error('Failed to load image');
                  }}
                  style={{ opacity: 0, transition: 'opacity 0.3s' }}
                />
              </div>
            ) : (
              /* Message Bubble (for text, voice, or image+text) - NO BUBBLE for emoji-only or number-only */
              <div
                className={(isEmojiOnly || isNumberOnly) ? "" : `relative px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-2xl shadow-sm ${
                  isMyMessage
                    ? "bg-gradient-to-br from-primary to-primary/90 text-primary-content"
                    : "bg-base-200 text-base-content"
                }`}
                style={(isEmojiOnly || isNumberOnly) ? {} : { 
                  display: 'inline-block',
                  maxWidth: '100%',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  pointerEvents: 'auto'
                }}
              >
                {/* Reply To Message */}
                {message.replyTo && (
                  <div 
                    className={`mb-2 border-l-4 pl-2 py-1 rounded-sm cursor-pointer active:scale-[0.98] transition-transform ${
                      isMyMessage 
                        ? "bg-primary-content/10 border-primary-content/50" 
                        : "bg-base-300/40 border-primary/70"
                    }`}
                    onClick={() => {
                      const replyElement = document.getElementById(`message-${message.replyTo.id}`);
                      if (replyElement) {
                        replyElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        replyElement.classList.add('highlight-flash');
                        setTimeout(() => replyElement.classList.remove('highlight-flash'), 1500);
                      }
                    }}
                  >
                    <div className={`text-[10px] font-bold mb-0.5 ${
                      isMyMessage ? "text-primary-content" : "text-primary"
                    }`}>
                      {message.replyTo.senderId === authUser.id ? "You" : selectedUser?.fullName || "User"}
                    </div>
                    <div className={`text-[11px] leading-tight truncate ${
                      isMyMessage ? "text-primary-content/80" : "text-base-content/70"
                    }`}>
                      {message.replyTo.text ? message.replyTo.text : 
                       (message.replyTo.image ? "📷 Photo" : 
                        message.replyTo.voice ? "🎤 Voice message" : 
                        "Message")}
                    </div>
                  </div>
                )}

                {isEmojiOnly && emojiCount > 0 ? (
                  <div 
                    className={`${emojiCount === 1 ? 'text-5xl sm:text-6xl' : 'text-4xl sm:text-5xl'} leading-tight`}
                    style={{ maxWidth: '100%', wordBreak: 'break-word' }}
                  >
                    {message.text}
                  </div>
                ) : isShortNumber ? (
                  /* Short numbers (1-3 digits) - Large, no bubble */
                  <div 
                    className={`${numberLength === 1 ? 'text-5xl sm:text-6xl' : numberLength === 2 ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'} font-bold leading-tight ${isMyMessage ? 'text-primary' : 'text-base-content'}`}
                    style={{ 
                      maxWidth: '100%', 
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }}
                  >
                    {message.text}
                  </div>
                ) : isNumberOnly ? (
                  /* Long numbers (4+ digits) - Normal size, no bubble, but with word break */
                  <div 
                    className={`text-2xl sm:text-3xl font-bold leading-tight ${isMyMessage ? 'text-primary' : 'text-base-content'}`}
                    style={{ 
                      maxWidth: '100%',
                      wordBreak: 'break-all',
                      overflowWrap: 'anywhere'
                    }}
                  >
                    {message.text}
                  </div>
                ) : (
                  <>
                    {/* Image with text (inside bubble) */}
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
                          loading="eager"
                          onLoad={(e) => {
                            console.log('✅ Image loaded:', message.image);
                            e.target.style.opacity = '1';
                          }}
                          onError={(e) => {
                            console.error('❌ Image failed to load:', message.image);
                            e.target.style.display = 'none';
                            toast.error('Failed to load image');
                          }}
                          style={{ opacity: 0, transition: 'opacity 0.3s' }}
                        />
                      </div>
                    )}

                    {/* Voice Message */}
                    {message.voice && (
                      <div className="flex items-center gap-2 min-w-[200px] max-w-[280px]">
                        <button
                          onClick={toggleVoicePlayback}
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            isPlaying ? 'bg-primary/20 scale-110' : isMyMessage ? 'bg-primary-content/20' : 'bg-primary/10'
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
                            const isActive = isPlaying && (i / 20) <= progress;
                            
                            return (
                              <div
                                key={i}
                                className={`w-[3px] rounded-full transition-all duration-150 ${
                                  isActive 
                                    ? isMyMessage ? 'bg-primary-content' : 'bg-primary' 
                                    : isMyMessage ? 'bg-primary-content/30' : 'bg-base-content/30'
                                }`}
                                style={{ 
                                  height: `${height * 2.5}px`,
                                  transform: isPlaying && isActive ? 'scaleY(1.15)' : 'scaleY(1)',
                                  opacity: isActive ? 1 : 0.6
                                }}
                              />
                            );
                          })}
                        </div>
                        
                        <span className="text-xs opacity-70 font-medium min-w-[32px] text-right">
                          {isPlaying 
                            ? `${Math.max(0, Math.ceil((message.voiceDuration || 0) - currentTime))}s`
                            : `${message.voiceDuration || 0}s`
                          }
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
                      <p className="message-text-content break-words whitespace-pre-wrap leading-relaxed" style={{ textWrap: 'balance', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {message.text}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ✅ INSTAGRAM EXACT: Reactions with individual tap-to-remove */}
            {Object.keys(groupedReactions).length > 0 && (
              <div 
                className={`reaction-badges-container ${isMyMessage ? 'my-message' : 'other-message'}`}
                style={{
                  // ✅ FORCE VISIBILITY: Ensure reactions are always visible
                  display: 'flex !important',
                  visibility: 'visible !important',
                  opacity: '1 !important',
                  zIndex: '999 !important'
                }}
              >
                {Object.entries(groupedReactions).map(([emoji, users]) => {
                  const hasMyReaction = users.some(user => {
                    const userId = user?.id || user;
                    return userId === authUser.id;
                  });
                  const badgeStyle = getReactionBadgeStyle(hasMyReaction, themeColors);
                  
                  console.log(`🎯 Rendering reaction badge: ${emoji} for ${users.length} users`);
                  
                  return (
                    <div
                      key={emoji}
                      className={`instagram-reaction-badge ${hasMyReaction ? 'my-reaction animate-reaction-badge-pop' : 'other-reaction'}`}
                      style={{
                        // ✅ INSTAGRAM EXACT: Perfect compact styling (override badgeStyle)
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '20px',
                        height: '22px',
                        padding: '1px 5px',
                        borderRadius: '11px',
                        fontSize: '11px',
                        fontWeight: '600',
                        gap: '2px',
                        lineHeight: '1',
                        cursor: 'pointer',
                        userSelect: 'none',
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                        // ✅ INSTAGRAM EXACT: White background with colorful border for my reactions
                        backgroundColor: '#ffffff',
                        color: '#262626',
                        border: hasMyReaction ? `1px solid ${themeColors.primary}` : '1px solid rgba(0,0,0,0.1)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
                        // ✅ FORCE VISIBILITY
                        visibility: 'visible !important',
                        opacity: '1 !important',
                        zIndex: '1000 !important'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // ✅ INSTAGRAM BEHAVIOR: Only allow removal if user has reacted
                        if (hasMyReaction) {
                          console.log(`🗑️ Removing my reaction: ${emoji}`);
                          removeReaction(message.id);
                          // Add haptic feedback
                          if (navigator.vibrate) navigator.vibrate(20);
                        } else {
                          // ✅ INSTAGRAM BEHAVIOR: Show who reacted (optional)
                          console.log(`👀 Viewing reactions for: ${emoji}`);
                          setShowReactions(!showReactions);
                        }
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      <span style={{ fontSize: '12px', lineHeight: '1' }}>{emoji}</span>
                      {users.length > 1 && (
                        <span 
                          style={{ 
                            fontSize: '10px',
                            fontWeight: '700',
                            lineHeight: '1'
                          }}
                        >
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

        {/* Time + Enhanced Status Ticks (WhatsApp Style with Theme Colors) */}
        <div className="flex items-center gap-1.5 mt-1 px-1">
          <span className="text-[10px] text-base-content/50">
            {formatMessageTime(message.createdAt)}
          </span>
          {statusInfo.show && (
            <span className="flex items-center" title={statusInfo.tooltip}>
              {statusInfo.type === 'clock' ? (
                // Clock icon for sending/failed
                <svg 
                  className={`w-3 h-3 ${statusInfo.animate}`} 
                  fill="currentColor" 
                  viewBox="0 0 16 16"
                  style={{ color: statusInfo.color }}
                >
                  <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                </svg>
              ) : statusInfo.type === 'double-tick' ? (
                // Double tick for delivered/read
                <svg 
                  className={`w-4 h-4 ${statusInfo.animate}`} 
                  fill="currentColor" 
                  viewBox="0 0 16 16"
                  style={{ color: statusInfo.color }}
                >
                  <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 1.854 7.146a.5.5 0 1 0-.708.708l3.5 3.5a.5.5 0 0 0 .708 0l7-7zm-4.208 7-.896-.897.707-.707.543.543 6.646-6.647a.5.5 0 0 1 .708.708l-7 7a.5.5 0 0 1-.708 0z"/>
                  <path d="m5.354 7.146.896.897-.707.707-.897-.896a.5.5 0 1 1 .708-.708z"/>
                </svg>
              ) : (
                // Single tick for sent
                <svg 
                  className={`w-3.5 h-3.5 ${statusInfo.animate}`} 
                  fill="currentColor" 
                  viewBox="0 0 16 16"
                  style={{ color: statusInfo.color }}
                >
                  <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                </svg>
              )}
            </span>
          )}
        </div>

      </div>

      {/* Long-Press Reaction Picker */}
      {showReactionPicker && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setShowReactionPicker(false)}
        >
          <div
            className="bg-base-100 rounded-t-3xl sm:rounded-3xl p-3 sm:p-4 shadow-2xl w-full sm:w-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center gap-2 sm:gap-3 mb-3">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    handleReactionSelect(emoji);
                    setShowReactionPicker(false);
                  }}
                  className={`text-2xl sm:text-3xl hover:scale-110 active:scale-95 transition-transform p-2 rounded-full hover:bg-base-200 ${
                    myReaction?.emoji === emoji ? 'scale-110 bg-base-200' : ''
                  }`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
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
                className="w-full btn btn-error btn-sm gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Message
              </button>
            )}
          </div>
        </div>
      )}

      {/* ✅ ENHANCED: Reactions Detail Modal with User Names and Tap-to-Remove */}
      {showReactions && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setShowReactions(false)}
        >
          <div
            className="bg-base-100 rounded-t-2xl sm:rounded-2xl p-3 sm:p-4 max-w-sm w-full shadow-2xl max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Reactions</h3>
              <button onClick={() => setShowReactions(false)} className="btn btn-ghost btn-xs btn-circle">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {Object.entries(groupedReactions).map(([emoji, userIds]) => (
                <div key={emoji} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl flex-shrink-0">{emoji}</span>
                    <span className="text-xs text-base-content/50">{userIds.length} {userIds.length === 1 ? 'person' : 'people'}</span>
                  </div>
                  <div className="space-y-1 ml-6">
                    {userIds.map((userId, idx) => {
                      // ✅ FIXED: Get actual user data from reactions array
                      const reactionData = reactions.find(r => 
                        (r.userId?.id || r.userId) === (userId?.id || userId) && r.emoji === emoji
                      );
                      
                      const isMyReaction = (userId?.id || userId) === authUser.id;
                      const userName = isMyReaction 
                        ? "You" 
                        : (reactionData?.user?.fullName || reactionData?.user?.nickname || selectedUser?.fullName || "User");
                      
                      return (
                        <div 
                          key={idx} 
                          className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors ${
                            isMyReaction 
                              ? 'bg-primary/10 hover:bg-primary/20 cursor-pointer' 
                              : 'bg-base-200/50'
                          }`}
                          onClick={() => {
                            if (isMyReaction) {
                              console.log(`🗑️ Removing my reaction: ${emoji} from modal`);
                              removeReaction(message.id);
                              // Add haptic feedback
                              if (navigator.vibrate) navigator.vibrate(20);
                              // Close modal if no more reactions
                              if (Object.keys(groupedReactions).length === 1 && userIds.length === 1) {
                                setShowReactions(false);
                              }
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary">
                                {userName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm font-medium">{userName}</span>
                          </div>
                          {isMyReaction && (
                            <div className="flex items-center gap-1 text-xs text-primary">
                              <span>Tap to remove</span>
                              <X className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Modal with Save Option */}
      {showImageModal && message.image && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 btn btn-circle btn-sm bg-base-100/20 border-none text-white"
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
              className="absolute bottom-4 right-4 btn btn-primary gap-2"
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

export default ChatMessage;
