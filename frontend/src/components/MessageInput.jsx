import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X, Smile, ChevronUp, Gamepad2 } from "lucide-react";
import toast from "react-hot-toast";
import VoiceRecorder from "./VoiceRecorder";
import "../styles/chat-improvements.css";

const EnhancedMessageInput = ({ replyingTo, onCancelReply }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const attachmentMenuRef = useRef(null);
  const lastTyped = useRef(0);

  const { sendMessage, selectedUser } = useChatStore();
  const { socket } = useAuthStore();

  const emojis = [
    "😊", "😂", "❤️", "👍", "🎉", "🔥",
    "😍", "🤔", "👏", "🙌", "💯", "✨",
  ];

  // Enhanced mobile detection with keyboard handling
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    const handleKeyboard = () => {
      if (!window.innerWidth || window.innerWidth > 768) return;

      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.screen.height;
      const keyboardThreshold = windowHeight * 0.75;

      const isKeyboardVisible = viewportHeight < keyboardThreshold;
      setKeyboardVisible(isKeyboardVisible);

      // Add class to body for CSS targeting
      if (isKeyboardVisible) {
        document.body.classList.add('mobile-keyboard-visible');
      } else {
        document.body.classList.remove('mobile-keyboard-visible');
      }
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
      document.body.classList.remove('mobile-keyboard-visible');
    };
  }, []);

  // Handle outside click for attachment menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) {
        setShowAttachmentMenu(false);
      }
    };

    if (showAttachmentMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAttachmentMenu]);

  // Enhanced typing indicator with throttling
  const handleTyping = (value) => {
    setText(value);

    if (!socket || !selectedUser) return;

    const now = Date.now();
    if (now - lastTyped.current > 2000) {
      const { authUser } = useAuthStore.getState();
      socket.emit("typing", {
        receiverId: selectedUser.id,
        senderId: authUser?.id,
      });
      lastTyped.current = now;
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        const { authUser } = useAuthStore.getState();
        socket.emit("stopTyping", {
          receiverId: selectedUser.id,
          senderId: authUser?.id,
        });
        setIsTyping(false);
      }
    }, 3000);
  };

  // Auto-focus on reply
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [replyingTo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (socket && selectedUser) {
        socket.emit("stopTyping", { receiverId: selectedUser.id });
      }
    };
  }, [socket, selectedUser]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setShowAttachmentMenu(false);
    };
    reader.readAsDataURL(file);
  };

  const handleImagePreviewClick = () => {
    setTempImage(imagePreview);
    setShowImagePreview(true);
  };

  const handlePreviewClose = () => {
    setShowImagePreview(false);
    setTempImage(null);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!text.trim() && !imagePreview) return;

    // Stop typing indicator immediately
    if (socket && selectedUser) {
      socket.emit("stopTyping", { receiverId: selectedUser.id });
    }

    // Store values before clearing
    const messageText = text.trim();
    const messageImage = imagePreview;
    const messageReplyTo = replyingTo?.id || null;

    // Clear form immediately for better UX
    setText("");
    setImagePreview(null);
    setShowEmojiPicker(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onCancelReply) onCancelReply();

    // Focus back to input
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Send message in background
    sendMessage({
      text: messageText,
      image: messageImage,
      replyTo: messageReplyTo,
      replyToData: replyingTo // Pass full object for optimistic UI
    }).catch((error) => {
      console.error("Failed to send message:", error);
    });
  };

  const handleSendVoice = async (audioData, duration) => {
    try {
      await sendMessage({
        voice: audioData,
        voiceDuration: duration,
      });
    } catch (error) {
      const errorMsg = error.response?.data?.details ||
        error.response?.data?.error ||
        "Failed to send voice message";
      toast.error(`Error: ${errorMsg}`);
    }
  };

  const addEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <>
      {/* Enhanced Image Preview Modal */}
      {showImagePreview && tempImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4"
          onClick={handlePreviewClose}
        >
          <button
            onClick={handlePreviewClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-12 h-12 bg-black bg-opacity-60 text-white rounded-full flex items-center justify-center hover:bg-opacity-80 transition-all z-10 backdrop-blur-sm haptic-feedback"
            aria-label="Close preview"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={() => {
              const link = document.createElement("a");
              link.href = tempImage;
              link.download = `image-${Date.now()}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="absolute top-20 right-4 sm:top-24 sm:right-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all z-10 backdrop-blur-sm shadow-lg flex items-center gap-2 text-sm haptic-feedback"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Save</span>
          </button>

          <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={tempImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm opacity-60 pointer-events-none">
            Tap anywhere to close
          </div>
        </div>
      )}

      {/* Ultra-Compact Message Input Container */}
      <div
        className={`px-2 py-1 w-full bg-base-100/95 backdrop-blur-xl border-t border-base-300/30 border-b border-base-300/20 sticky bottom-0 z-10 mobile-message-input-professional touch-optimized ${keyboardVisible ? 'keyboard-visible' : ''
          }`}
        style={{ paddingBottom: "max(4px, env(safe-area-inset-bottom))" }}
      >
        {/* Enhanced Reply Preview */}
        {replyingTo && (
          <div className="mb-2 sm:mb-3 reply-preview-container animate-slide-down">
            <div
              className="reply-preview-optimized"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(30);
                const replyElement = document.getElementById(`message-${replyingTo.id}`);
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
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-primary">Replying to</span>
                    <span className="text-xs font-medium text-base-content/80">
                      {replyingTo.senderId === selectedUser?.id
                        ? selectedUser.fullName || selectedUser.nickname || "User"
                        : "You"}
                    </span>
                    <span className="text-xs text-base-content/50 ml-auto">Tap to view</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {replyingTo.image && (
                      <div className="flex-shrink-0 w-6 h-6 rounded bg-base-300/50 flex items-center justify-center">
                        <span className="text-xs">📷</span>
                      </div>
                    )}
                    {replyingTo.voice && (
                      <div className="flex-shrink-0 w-6 h-6 rounded bg-base-300/50 flex items-center justify-center">
                        <span className="text-xs">🎤</span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-base-content/70 truncate leading-tight">
                        {replyingTo.text && replyingTo.text.trim()
                          ? replyingTo.text
                          : replyingTo.image
                            ? "📷 Photo"
                            : replyingTo.voice
                              ? "🎤 Voice message"
                              : "Message"}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onCancelReply}
                  className="flex-shrink-0 w-7 h-7 rounded-full bg-base-300/50 hover:bg-error/20 hover:text-error flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 haptic-feedback"
                  type="button"
                  aria-label="Cancel reply"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-base-200 rounded-xl">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border-2 border-primary cursor-pointer hover:opacity-80 transition-opacity haptic-feedback"
                onClick={handleImagePreviewClick}
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-error text-white flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-lg z-10 haptic-feedback"
                type="button"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <span className="text-sm text-base-content/70">Image ready to send</span>
              <p className="text-xs text-base-content/50 mt-1">Click image to preview</p>
            </div>
          </div>
        )}

        {/* Enhanced Emoji Picker */}
        {showEmojiPicker && (
          <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-base-200 rounded-xl shadow-lg">
            <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  className="text-2xl p-2 hover:bg-base-300 rounded-lg active:scale-110 transition haptic-feedback"
                  aria-label={`Add ${emoji} emoji`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Input Form */}
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 relative max-w-full justify-center"
        >
          {/* Enhanced Attachment Menu */}
          <div className="relative" ref={attachmentMenuRef}>
            {showAttachmentMenu && (
              <div className={`absolute bottom-full left-0 mb-3 p-3 bg-base-100/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-base-300/30 flex flex-col gap-3 min-w-[48px] z-50 transform origin-bottom-left transition-all duration-300 ease-out ${showAttachmentMenu ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-2 pointer-events-none"
                }`}>
                <button
                  type="button"
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95 touch-manipulation shadow-sm haptic-feedback ${imagePreview
                      ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                      : "bg-base-200/50 text-base-content/70 hover:bg-base-200 hover:text-base-content"
                    }`}
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach Image"
                >
                  <Image size={22} />
                </button>

                <button
                  type="button"
                  className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95 touch-manipulation shadow-sm bg-base-200/50 text-indigo-500 hover:bg-base-200 haptic-feedback"
                  onClick={() => {
                    if (!socket || !selectedUser) return;
                    const gameId = `game_${Date.now()}_${selectedUser.id}`;
                    socket.emit("game:invite", {
                      receiverId: selectedUser.id,
                      senderName: useAuthStore.getState().authUser.fullName,
                      senderPic: useAuthStore.getState().authUser.profilePic,
                      gameId: gameId,
                    });
                    sendMessage({ text: `GAME_INVITE:${gameId}` });
                    setShowAttachmentMenu(false);
                    toast.success("Game invite sent!");
                  }}
                  title="Play SOS Game"
                >
                  <Gamepad2 size={22} />
                </button>
              </div>
            )}

            <button
              type="button"
              className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-95 touch-manipulation haptic-feedback ${showAttachmentMenu
                  ? "bg-primary/10 text-primary rotate-180 shadow-sm"
                  : "bg-base-200/50 text-base-content/70 hover:bg-base-200 hover:text-base-content"
                }`}
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            >
              <ChevronUp size={20} />
            </button>
          </div>

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
            name="fileAttachment"
            id="fileAttachment"
            aria-label="File Attachment"
          />

          {/* Ultra-Compact Text Input */}
          <div
            className="flex-1 flex items-center gap-1.5 bg-base-200/50 backdrop-blur-sm rounded-full px-3 py-1.5 min-w-0 border border-base-300/20 shadow-sm hover:shadow-md transition-all duration-200 professional-input focus-within:ring-0 focus-within:outline-none"
            style={{
              WebkitTapHighlightColor: "transparent",
              WebkitTouchCallout: "none",
              outline: "none",
              boxShadow: "none"
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent outline-none border-none text-sm placeholder:text-base-content/40 min-w-0 font-normal leading-relaxed focus:outline-none focus:ring-0 focus:border-none shadow-none focus-visible:ring-0 focus-visible:outline-none touch-optimized"
              style={{
                outline: "none",
                boxShadow: "none",
                borderColor: "transparent",
                border: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                appearance: "none",
                WebkitTapHighlightColor: "transparent",
                WebkitTouchCallout: "none",
                WebkitUserSelect: "text",
                userSelect: "text",
                fontSize: "14px", // Compact size for all devices
                background: "transparent",
                backgroundColor: "transparent"
              }}
              placeholder="Message..."
              value={text}
              onChange={(e) => handleTyping(e.target.value)}
              autoComplete="off"
              name="message"
              id="message-input"
              aria-label="Type a message"
              data-tap-highlight="false"
              data-touch-callout="false"
            />

            <button
              type="button"
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 active:scale-95 touch-manipulation flex-shrink-0 haptic-feedback ${showEmojiPicker
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "bg-transparent text-base-content/50 hover:bg-base-300/50 hover:text-base-content/80"
                }`}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Add emoji"
              aria-label="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>

          {/* Enhanced Voice/Send Button */}
          {!text.trim() && !imagePreview && (
            <div className="flex-shrink-0">
              <VoiceRecorder onSendVoice={handleSendVoice} />
            </div>
          )}

          {(text.trim() || imagePreview) && (
            <button
              type="submit"
              className="w-9 h-9 bg-primary hover:bg-primary/90 active:bg-primary/80 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 touch-manipulation group haptic-feedback"
              aria-label="Send message"
            >
              <Send className="w-5 h-5 text-primary-content group-active:scale-90 transition-transform" />
            </button>
          )}
        </form>
      </div>
    </>
  );
};

export default EnhancedMessageInput;