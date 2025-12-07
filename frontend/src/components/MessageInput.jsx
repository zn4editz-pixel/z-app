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
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { sendMessage, selectedUser } = useChatStore();
  const { socket } = useAuthStore();

  const emojis = ["😊", "😂", "❤️", "👍", "🎉", "🔥", "😍", "🤔", "👏", "🙌", "💯", "✨"];

  // Handle typing indicator
  const handleTyping = (value) => {
    setText(value);
    
    if (!socket || !selectedUser) return;
    
    // Emit typing event
    socket.emit("typing", { receiverId: selectedUser._id });
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { receiverId: selectedUser._id });
    }, 2000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (socket && selectedUser) {
        socket.emit("stopTyping", { receiverId: selectedUser._id });
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
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    // Stop typing indicator immediately
    if (socket && selectedUser) {
      socket.emit("stopTyping", { receiverId: selectedUser._id });
    }

    // Store values before clearing (for retry)
    const messageText = text.trim();
    const messageImage = imagePreview;
    const messageReplyTo = replyingTo?._id || null;

    // Clear form IMMEDIATELY for instant feel (WhatsApp style)
    setText("");
    setImagePreview(null);
    setShowEmojiPicker(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onCancelReply) onCancelReply();

    // Send message in background
    setIsSending(true);
    try {
      await sendMessage({
        text: messageText,
        image: messageImage,
        replyTo: messageReplyTo,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      // Message will show as failed in UI, user can retry
    } finally {
      setIsSending(false);
    }
  };

  const handleSendVoice = async (audioData, duration) => {
    try {
      await sendMessage({
        voice: audioData,
        voiceDuration: duration,
      });
      toast.success("Voice message sent!");
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
    <div className="p-2.5 sm:p-4 w-full bg-base-100 border-t border-base-300 sticky bottom-0 z-10" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
      {/* Reply Preview */}
      {replyingTo && (
        <div className="mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-base-200 rounded-xl border-l-4 border-primary reply-slide-in">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-primary mb-0.5">
              Replying to {replyingTo.senderId === selectedUser?._id ? selectedUser.fullName : "You"}
            </div>
            <div className="text-sm text-base-content/70 truncate">
              {replyingTo.text || (replyingTo.image ? "📷 Image" : replyingTo.voice ? "🎤 Voice message" : "Message")}
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="btn btn-ghost btn-xs btn-circle flex-shrink-0 hover:bg-error/20 hover:text-error transition-colors"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {imagePreview && (
        <div className="mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-base-200 rounded-xl">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border-2 border-primary"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-error text-white
              flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-lg"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm text-base-content/70">Image ready to send</span>
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
        <div className="flex-1 flex items-center gap-1 sm:gap-1.5 bg-base-200 rounded-full px-3 sm:px-4 py-2 sm:py-2.5 min-w-0">
          <input
            type="text"
            className="flex-1 bg-transparent outline-none border-none text-sm sm:text-base placeholder:text-base-content/50 min-w-0"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
          />
          
          {/* Emoji Button */}
          <button
            type="button"
            className={`p-1 sm:p-1.5 rounded-full hover:bg-base-300 active:scale-95 transition flex-shrink-0
              ${showEmojiPicker ? "text-primary" : "text-base-content/60"}`}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Add emoji"
          >
            <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          
          {/* Image Upload Button */}
          <button
            type="button"
            className={`p-1 sm:p-1.5 rounded-full hover:bg-base-300 active:scale-95 transition flex-shrink-0
              ${imagePreview ? "text-primary" : "text-base-content/60"}`}
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
          >
            <Image className="w-4 h-4 sm:w-5 sm:h-5" />
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

        {/* Send Button - Show when typing or image attached */}
        {(text.trim() || imagePreview) && (
          <button
            type="submit"
            className={`btn btn-primary btn-circle btn-sm sm:btn-md flex-shrink-0 shadow-lg transition-all ${
              isSending ? 'scale-90' : 'scale-100 hover:scale-105'
            }`}
            disabled={isSending}
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </form>
    </div>
  );
};

export default MessageInput;
