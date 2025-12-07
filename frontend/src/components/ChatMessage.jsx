import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatMessageTime } from "../lib/utils";
import { Trash2, Download, Play, Pause, Reply, X } from "lucide-react";
import toast from "react-hot-toast";

const REACTION_EMOJIS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];
const LONG_PRESS_DURATION = 500; // ms
const DOUBLE_TAP_DELAY = 300; // ms
const SWIPE_THRESHOLD = 60; // px

const ChatMessage = ({ message, onReply }) => {
  const { authUser } = useAuthStore();
  const { addReaction, removeReaction, deleteMessage, selectedUser } = useChatStore();
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
  
  const isMyMessage = message.senderId === authUser._id;
  const myReaction = message.reactions?.find(r => r.userId?._id === authUser._id || r.userId === authUser._id);

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

  // Handle touch start
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    touchStartTime.current = Date.now();
    
    // Start long press timer for reactions or image save
    longPressTimer.current = setTimeout(() => {
      if (message.image) {
        handleLongPressImage();
      } else {
        handleLongPressReaction();
      }
    }, LONG_PRESS_DURATION);
  };

  // Handle touch move (swipe to reply + cancel long press)
  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartPos.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
    
    // Cancel long press if moved
    if (Math.abs(deltaX) > 10 || deltaY > 10) {
      clearTimeout(longPressTimer.current);
    }
    
    // Swipe to reply (only horizontal swipe)
    if (Math.abs(deltaX) > 10 && deltaY < 30) {
      const offset = isMyMessage ? Math.min(0, deltaX) : Math.max(0, deltaX);
      setSwipeOffset(Math.abs(offset) > SWIPE_THRESHOLD ? (isMyMessage ? -SWIPE_THRESHOLD : SWIPE_THRESHOLD) : offset);
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
    
    // Check for swipe to reply
    if (Math.abs(swipeOffset) >= SWIPE_THRESHOLD) {
      onReply && onReply(message);
      if (navigator.vibrate) navigator.vibrate(30);
    }
    
    // Reset swipe
    setTimeout(() => setSwipeOffset(0), 200);
    
    // Check for double tap (quick heart)
    const now = Date.now();
    const timeSinceStart = now - touchStartTime.current;
    
    if (timeSinceStart < 200 && now - lastTap.current < DOUBLE_TAP_DELAY) {
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

  // Long press handler for reactions
  const handleLongPressReaction = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    setShowReactionPicker(true);
  };

  // Double tap handler (quick heart)
  const handleDoubleTap = () => {
    if (navigator.vibrate) navigator.vibrate(30);
    if (myReaction?.emoji === "❤️") {
      removeReaction(message._id);
    } else {
      addReaction(message._id, "❤️");
      showHeartAnimation();
    }
  };

  // Show heart animation
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
    `;
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1000);
  };

  // Handle reaction selection
  const handleReactionSelect = (emoji) => {
    if (myReaction?.emoji === emoji) {
      removeReaction(message._id);
    } else {
      addReaction(message._id, emoji);
    }
  };

  // Handle delete
  const handleDelete = () => {
    deleteMessage(message._id);
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
  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction.userId);
    return acc;
  }, {}) || {};

  // Check if emoji-only message
  const isEmojiOnly = message.text && /^[\p{Emoji}\s]+$/u.test(message.text) && !message.image && !message.voice;
  const emojiCount = message.text ? (message.text.match(/\p{Emoji}/gu) || []).length : 0;

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
        id={`message-${message._id}`}
        className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"} ${
          Object.keys(groupedReactions).length > 0 ? "mb-6" : "mb-3"
        } relative`}
      >
        <div className="flex items-end max-w-[80%] sm:max-w-[70%] gap-2 relative">
          {!isMyMessage && !isEmojiOnly && (
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-base-300 flex-shrink-0">
              <img
                src={selectedUser?.profilePic || "/avatar.png"}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div
            className="relative"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              transform: `translateX(${swipeOffset}px)`,
              transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Swipe Reply Icon */}
            {Math.abs(swipeOffset) > 20 && (
              <div 
                className={`absolute top-1/2 -translate-y-1/2 ${isMyMessage ? '-right-10' : '-left-10'}`}
                style={{ opacity: Math.min(Math.abs(swipeOffset) / SWIPE_THRESHOLD, 1) }}
              >
                <Reply className={`w-5 h-5 text-base-content/50 ${isMyMessage ? '' : 'scale-x-[-1]'}`} />
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
                  className="rounded-2xl max-h-64 sm:max-h-80 min-w-[200px] max-w-[300px] w-auto object-cover cursor-pointer active:scale-[0.98] transition-transform shadow-lg"
                  alt="attached"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    console.error('Image failed to load:', message.image);
                    e.target.src = '/avatar.png';
                  }}
                />
              </div>
            ) : (
              /* Message Bubble (for text, voice, or image+text) */
              <div
                className={isEmojiOnly ? "" : `relative px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-2xl shadow-sm ${
                  isMyMessage
                    ? "bg-gradient-to-br from-primary to-primary/90 text-primary-content"
                    : "bg-base-200 text-base-content"
                }`}
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
                      const replyElement = document.getElementById(`message-${message.replyTo._id}`);
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
                      {message.replyTo.senderId === authUser._id ? "You" : selectedUser?.fullName || "User"}
                    </div>
                    <div className={`text-[11px] leading-tight truncate ${
                      isMyMessage ? "text-primary-content/80" : "text-base-content/70"
                    }`}>
                      {message.replyTo.image && "📷 "}
                      {message.replyTo.voice && "🎤 "}
                      {message.replyTo.text || (message.replyTo.image ? "Photo" : message.replyTo.voice ? "Voice message" : "Message")}
                    </div>
                  </div>
                )}

                {isEmojiOnly && emojiCount > 0 ? (
                  <div className={`${emojiCount === 1 ? 'text-5xl sm:text-6xl' : 'text-4xl sm:text-5xl'} leading-tight`}>
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
                          className="rounded-xl max-h-64 sm:max-h-80 min-w-[200px] object-cover w-full cursor-pointer active:scale-[0.98] transition-transform"
                          alt="attached"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            console.error('Image failed to load:', message.image);
                            e.target.src = '/avatar.png';
                          }}
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
                    {message.text && !isEmojiOnly && (
                      <p className="break-words whitespace-pre-wrap leading-relaxed">
                        {message.text}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Reactions Display - Instagram/WhatsApp Style */}
            {Object.keys(groupedReactions).length > 0 && (
              <div
                className={`absolute -bottom-4 ${isMyMessage ? "right-0" : "left-0"} flex gap-1 z-10`}
                onClick={() => setShowReactions(!showReactions)}
              >
                {Object.entries(groupedReactions).map(([emoji, users]) => (
                  <div
                    key={emoji}
                    className="flex items-center gap-1 bg-base-100 border-2 border-base-300 rounded-full px-2 py-1 shadow-xl cursor-pointer hover:scale-110 transition-all active:scale-95 hover:shadow-2xl"
                  >
                    <span className="text-sm leading-none">{emoji}</span>
                    {users.length > 1 && (
                      <span className="text-xs font-bold text-base-content/80 leading-none">{users.length}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Time + Status */}
        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-[10px] text-base-content/50">
            {formatMessageTime(message.createdAt)}
          </span>
          {isMyMessage && message.status && (
            <span className="text-[10px] font-bold">
              {message.status === 'sending' ? (
                <span className="text-gray-400 opacity-50 animate-pulse" title="Sending">⏱</span>
              ) : message.status === 'read' ? (
                <span className="text-blue-500" title="Read">✓✓</span>
              ) : message.status === 'delivered' ? (
                <span className="text-gray-400" title="Delivered">✓✓</span>
              ) : (
                <span className="text-gray-400" title="Sent">✓</span>
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

      {/* Reactions Detail Modal - Instagram Style */}
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
            <div className="space-y-2">
              {Object.entries(groupedReactions).map(([emoji, users]) => (
                <div key={emoji} className="flex items-start gap-2 py-1">
                  <span className="text-xl flex-shrink-0">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5">
                      {users.map((user, idx) => (
                        <span key={idx} className="text-xs text-base-content/70">
                          {user?.fullName || "User"}{idx < users.length - 1 ? "," : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-base-content/50 flex-shrink-0">{users.length}</span>
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
