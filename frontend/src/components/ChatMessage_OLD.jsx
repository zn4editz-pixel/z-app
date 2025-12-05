import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatMessageTime } from "../lib/utils";
import { Trash2, Download, Play, Pause, Reply, Heart } from "lucide-react";
import toast from "react-hot-toast";

const REACTION_EMOJIS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];
const LONG_PRESS_DURATION = 500; // ms
const DOUBLE_TAP_DELAY = 300; // ms
const SWIPE_THRESHOLD = 50; // px

const ChatMessage = ({ message, onReply }) => {
  const { authUser } = useAuthStore();
  const { addReaction, removeReaction, deleteMessage, selectedUser } = useChatStore();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showDeleteOption, setShowDeleteOption] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  
  const longPressTimer = useRef(null);
  const lastTap = useRef(0);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchStartTime = useRef(0);
  const audioRef = useRef(null);
  const messageRef = useRef(null);
  
  const isMyMessage = message.senderId === authUser._id;
  const myReaction = message.reactions?.find(r => r.userId?._id === authUser._id || r.userId === authUser._id);

  // Handle touch start
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    touchStartTime.current = Date.now();
    
    // Start long press timer for image save
    if (message.image) {
      longPressTimer.current = setTimeout(() => {
        handleLongPressImage();
      }, LONG_PRESS_DURATION);
    }
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
    }
    
    // Reset swipe
    setSwipeOffset(0);
    
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

  // Double tap handler (quick heart)
  const handleDoubleTap = () => {
    if (navigator.vibrate) navigator.vibrate(30);
    if (myReaction?.emoji === "❤️") {
      removeReaction(message._id);
    } else {
      addReaction(message._id, "❤️");
      // Show heart animation
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
    setShowReactionPicker(false);
  };

  // Handle delete
  const handleDelete = () => {
    deleteMessage(message._id);
    setShowDeleteOption(false);
  };

  // Close modals on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setShowReactionPicker(false);
      setShowDeleteOption(false);
    };
    
    if (showReactionPicker || showDeleteOption) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showReactionPicker, showDeleteOption]);

  // Handle download image
  const handleDownloadImage = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "image.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch (error) {
      toast.error("Failed to download image");
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

  // If message is deleted, show placeholder
  if (message.isDeleted) {
    return (
      <div className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"} mb-4`}>
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
          <div className="relative px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-2xl bg-base-200/50 border border-base-300/50">
            <div className="flex items-center gap-2 text-base-content/50 italic">
              <Trash2 className="w-3 h-3" />
              <span>Message deleted</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-1 px-1">
          <span className="text-[10px] sm:text-[11px] text-base-content/50">
            {formatMessageTime(message.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"} mb-4`}>
      <div className="flex items-end max-w-[85%] sm:max-w-[75%] gap-2">
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
          className="relative select-none"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Message Bubble */}
          <div
            className={isEmojiOnly ? "" : `relative px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-2xl shadow-sm ${
              isMyMessage
                ? "bg-gradient-to-br from-primary to-primary/90 text-primary-content"
                : "bg-base-200 text-base-content"
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {isEmojiOnly && emojiCount > 0 ? (
              <div className={`${emojiCount === 1 ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'} leading-tight`}>
                {message.text}
              </div>
            ) : (
              <>
                {/* Image Message */}
                {message.image && (
                  <div 
                    className="relative group mb-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(message.image, "_blank");
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <img
                      src={message.image}
                      className="rounded-lg max-h-48 sm:max-h-64 object-cover w-full cursor-pointer active:opacity-80 transition"
                      alt="attached"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadImage(message.image);
                      }}
                      className="absolute top-2 right-2 btn btn-circle btn-xs bg-black/50 border-none text-white opacity-0 group-hover:opacity-100 transition"
                      title="Download image"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Voice Message */}
                {message.voice && (
                  <div className="flex items-center gap-2 min-w-[200px]">
                    <button
                      onClick={toggleVoicePlayback}
                      className="btn btn-circle btn-sm flex-shrink-0"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <audio
                      ref={audioRef}
                      src={message.voice}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                    <div className="flex-1 h-8 bg-base-300/50 rounded-full flex items-center px-2">
                      <div className="flex gap-0.5 items-center h-full">
                        {[...Array(20)].map((_, i) => (
                          <div
                            key={i}
                            className="w-0.5 bg-current rounded-full"
                            style={{
                              height: `${Math.random() * 100}%`,
                              minHeight: "20%",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs opacity-70">
                      {message.voiceDuration || 0}s
                    </span>
                  </div>
                )}

                {/* Text Message */}
                {message.text && (
                  <div className="whitespace-pre-wrap break-words leading-relaxed">
                    {message.text}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Reactions Display */}
          {Object.keys(groupedReactions).length > 0 && (
            <div
              className={`absolute -bottom-3 ${isMyMessage ? "right-2" : "left-2"} flex gap-1 cursor-pointer z-10`}
              onClick={() => setShowReactions(!showReactions)}
            >
              {Object.entries(groupedReactions).map(([emoji, users]) => (
                <div
                  key={emoji}
                  className="bg-base-100 border border-base-300 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 shadow-sm"
                >
                  <span>{emoji}</span>
                  <span className="text-base-content/70">{users.length}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reaction Picker */}
          {showReactionPicker && (
            <div
              className={`absolute ${isMyMessage ? "right-0" : "left-0"} -top-12 bg-base-100 border border-base-300 rounded-full px-3 py-2 shadow-lg flex gap-2 z-50 animate-in fade-in zoom-in duration-200`}
              onClick={(e) => e.stopPropagation()}
            >
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReactionSelect(emoji)}
                  className={`text-2xl hover:scale-125 transition-transform ${
                    myReaction?.emoji === emoji ? "scale-125" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Delete Modal with Blur Background */}
          {showDeleteOption && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
              onClick={() => setShowDeleteOption(false)}
            >
              <div
                className="bg-base-100 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8 text-error" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Delete Message?</h3>
                  <p className="text-sm text-base-content/60">
                    This message will be deleted for everyone. This action cannot be undone.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteOption(false)}
                    className="flex-1 btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 btn btn-error"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reactions Detail Modal */}
          {showReactions && (
            <div
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowReactions(false)}
            >
              <div
                className="bg-base-100 rounded-lg p-4 max-w-sm w-full max-h-96 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-bold text-lg mb-3">Reactions</h3>
                {Object.entries(groupedReactions).map(([emoji, users]) => (
                  <div key={emoji} className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{emoji}</span>
                      <span className="text-sm text-base-content/70">{users.length}</span>
                    </div>
                    <div className="space-y-1 ml-8">
                      {users.map((user) => (
                        <div key={user._id || user} className="flex items-center gap-2">
                          <img
                            src={user.profilePic || "/avatar.png"}
                            alt={user.fullName || "User"}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm">{user.fullName || user.nickname || "User"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Status */}
      <div className="flex items-center gap-1 mt-1 px-1">
        <span className="text-[10px] sm:text-[11px] text-base-content/50">
          {formatMessageTime(message.createdAt)}
        </span>
        {isMyMessage && (
          <span className="text-[10px] sm:text-[11px]">
            {message.status === 'read' ? (
              <span className="text-blue-500" title="Read">✓✓</span>
            ) : message.status === 'delivered' ? (
              <span className="text-base-content/50" title="Delivered">✓✓</span>
            ) : (
              <span className="text-base-content/50" title="Sent">✓</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
