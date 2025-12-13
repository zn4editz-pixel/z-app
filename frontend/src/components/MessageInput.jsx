import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X, Smile } from "lucide-react";
import toast from "react-hot-toast";
import VoiceRecorder from "./VoiceRecorder";

const MessageInput = ({ replyingTo, onCancelReply }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null); // ✅ NEW: For instant focus
  const { sendMessage, selectedUser } = useChatStore();
  const { socket } = useAuthStore();

  const emojis = ["😊", "😂", "❤️", "👍", "🎉", "🔥", "😍", "🤔", "👏", "🙌", "💯", "✨"];

  // Handle typing indicator
  const handleTyping = (value) => {
    setText(value);
    
    if (!socket || !selectedUser) return;
    
    // Emit typing event
    socket.emit("typing", { receiverId: selectedUser.id });
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { receiverId: selectedUser.id });
    }, 2000);
  };

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

  // ✅ INSTAGRAM/WHATSAPP: Auto-focus input when replying
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      // Small delay to ensure the reply preview is rendered first
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [replyingTo]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      // Directly set image preview without cropping
      setImagePreview(reader.result);
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
    
    // ✅ INSTANT: Check and return immediately if empty
    if (!text.trim() && !imagePreview) return;

    // Stop typing indicator immediately
    if (socket && selectedUser) {
      socket.emit("stopTyping", { receiverId: selectedUser.id });
    }

    // Store values before clearing
    const messageText = text.trim();
    const messageImage = imagePreview;
    const messageReplyTo = replyingTo?.id || null;

    // ✅ INSTANT: Clear form IMMEDIATELY (no await, no delay)
    setText("");
    setImagePreview(null);
    setShowEmojiPicker(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onCancelReply) onCancelReply();
    
    // ✅ INSTANT: Focus back to input for rapid messaging
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // ✅ INSTANT: Send in background (fire and forget - NO WAITING)
    sendMessage({
      text: messageText,
      image: messageImage,
      replyTo: messageReplyTo,
    }).catch(error => {
      console.error("Send failed:", error);
    });
  };

  const handleSendVoice = async (audioData, duration) => {
    try {
      await sendMessage({
        voice: audioData,
        voiceDuration: duration,
      });
      // ✅ No toast - silent send for better UX
    } catch (error) {
      console.error("Failed to send voice:", error);
      toast.error("Failed to send voice message");
    }
  };

  const addEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <>
      {/* Image Preview Modal */}
      {showImagePreview && tempImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4"
          onClick={handlePreviewClose}
        >
          {/* Close button - top right corner */}
          <button
            onClick={handlePreviewClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-12 h-12 bg-black bg-opacity-60 text-white rounded-full flex items-center justify-center hover:bg-opacity-80 transition-all z-10 backdrop-blur-sm"
            aria-label="Close preview"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Save button - top right, below close button */}
          <button
            onClick={() => {
              // Create download link
              const link = document.createElement('a');
              link.href = tempImage;
              link.download = `image-${Date.now()}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="absolute top-20 right-4 sm:top-24 sm:right-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all z-10 backdrop-blur-sm shadow-lg flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Image container - centered */}
          <div 
            className="relative max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={tempImage} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Optional: Tap anywhere to close hint */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm opacity-60 pointer-events-none">
            Tap anywhere to close
          </div>
        </div>
      )}

      <div className="p-2.5 sm:p-4 w-full bg-base-100 border-t border-base-300 sticky bottom-0 z-10" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        {/* ✅ INSTAGRAM/WHATSAPP STYLE: Enhanced Reply Preview */}
      {replyingTo && (
        <div className="mb-2 sm:mb-3 reply-preview-container animate-slide-down">
          <div 
            className="flex items-start gap-3 p-3 bg-gradient-to-r from-base-200/80 to-base-200/60 rounded-2xl border border-base-300/50 shadow-sm backdrop-blur-sm cursor-pointer hover:bg-gradient-to-r hover:from-base-200/90 hover:to-base-200/70 transition-all duration-200 active:scale-[0.98]"
            onClick={() => {
              // ✅ CLICK TO SCROLL: Jump to original message
              const replyElement = document.getElementById(`message-${replyingTo.id}`);
              if (replyElement) {
                replyElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                replyElement.classList.add('highlight-flash');
                setTimeout(() => replyElement.classList.remove('highlight-flash'), 1500);
              }
            }}
          >
            {/* Reply Icon */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </div>
            
            {/* Reply Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-primary">
                  Replying to
                </span>
                <span className="text-xs font-medium text-base-content/80">
                  {replyingTo.senderId === selectedUser?.id ? selectedUser.fullName || selectedUser.nickname || "User" : "You"}
                </span>
                <span className="text-xs text-base-content/50 ml-auto">
                  Tap to view
                </span>
              </div>
              
              {/* Message Preview */}
              <div className="flex items-center gap-2">
                {/* Message Type Icon */}
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
                
                {/* Message Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-base-content/70 truncate leading-tight">
                    {replyingTo.text && replyingTo.text.trim() ? replyingTo.text : 
                     (replyingTo.image ? "📷 Photo" : 
                      replyingTo.voice ? "🎤 Voice message" : 
                      "Message")}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Cancel Button */}
            <button
              onClick={onCancelReply}
              className="flex-shrink-0 w-7 h-7 rounded-full bg-base-300/50 hover:bg-error/20 hover:text-error flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
              type="button"
              aria-label="Cancel reply"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {imagePreview && (
        <div className="mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-base-200 rounded-xl">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border-2 border-primary cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleImagePreviewClick}
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-error text-white
              flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-lg z-10"
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

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-base-200 rounded-xl shadow-lg">
          <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="text-2xl p-2 hover:bg-base-300 rounded-lg active:scale-110 transition"
                aria-label={`Add ${emoji} emoji`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2"
      >
        {/* Text Input Container */}
        <div className="flex-1 flex items-center gap-2.5 bg-base-200 rounded-full px-4 py-2.5 min-w-0">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none border-none text-sm sm:text-base placeholder:text-base-content/50 min-w-0"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            autoComplete="off"
          />
          
          {/* Emoji Button */}
          <button
            type="button"
            className={`w-9 h-9 flex items-center justify-center rounded-full hover:bg-base-300 active:scale-95 transition-all flex-shrink-0
              ${showEmojiPicker ? "bg-base-300 text-primary" : "bg-base-300/50 text-base-content/70 hover:text-base-content"}`}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Add emoji"
            aria-label="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>
          
          {/* Image Upload Button */}
          <button
            type="button"
            className={`w-9 h-9 flex items-center justify-center rounded-full hover:bg-base-300 active:scale-95 transition-all flex-shrink-0
              ${imagePreview ? "bg-base-300 text-primary" : "bg-base-300/50 text-base-content/70 hover:text-base-content"}`}
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
            aria-label="Attach image"
          >
            <Image className="w-5 h-5" />
          </button>

          {/* Hidden File Input */}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
        </div>

        {/* Voice Recorder - Show when no text */}
        {!text.trim() && !imagePreview && (
          <VoiceRecorder onSendVoice={handleSendVoice} />
        )}

        {/* Send Button - ALWAYS ENABLED for rapid messaging */}
        {(text.trim() || imagePreview) && (
          <button
            type="submit"
            className="btn btn-primary btn-circle btn-sm sm:btn-md flex-shrink-0 shadow-lg hover:scale-105 active:scale-95 transition-transform"
            aria-label="Send message"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </form>
      </div>
    </>
  );
};

export default MessageInput;
