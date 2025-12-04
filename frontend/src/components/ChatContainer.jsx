import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useRef, useState } from "react";
import { Download, Play, Pause } from "lucide-react";
import toast from "react-hot-toast";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import CallLogMessage from "./CallLogMessage";
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
  
  // Voice message playback
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const audioRefs = useRef({});
  
  // Typing indicator
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!selectedUser?._id) return;
    getMessages?.(selectedUser._id);
    const unsub = subscribeToMessages?.(selectedUser._id);
    return () => typeof unsub === "function" && unsub();
  }, [selectedUser?._id, getMessages, subscribeToMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isTyping]);

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
      <div className="flex-1 flex flex-col h-full w-full md:pt-0 pt-0">
        <ChatHeader onStartCall={handleStartCall} />
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 bg-base-100 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
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
              
              return (
                <div
                  key={message._id || message.id}
                  className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
                >
                  {(() => {
                    const isEmojiOnly = message.text && /^[\p{Emoji}\s]+$/u.test(message.text) && !message.image && !message.voice;
                    
                    return (
                      <div className="flex items-end max-w-[85%] sm:max-w-[75%] gap-1 sm:gap-2">
                        {!mine && !isEmojiOnly && (
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-base-300 flex-shrink-0">
                            <img
                              src={selectedUser.profilePic || "/avatar.png"}
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div
                          className={isEmojiOnly ? "" : `relative px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-2xl shadow-sm ${
                            mine
                              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-content bubble-right"
                              : "bg-base-200 text-base-content bubble-left"
                          }`}
                        >
                      {/* Check if message is emoji-only */}
                      {(() => {
                        const isEmojiOnly = message.text && /^[\p{Emoji}\s]+$/u.test(message.text) && !message.image && !message.voice;
                        const emojiCount = message.text ? (message.text.match(/\p{Emoji}/gu) || []).length : 0;
                        
                        if (isEmojiOnly && emojiCount > 0) {
                          // Render emoji-only message (Instagram style - smaller)
                          return (
                            <div className={`text-3xl sm:text-4xl leading-tight ${emojiCount === 1 ? 'text-4xl sm:text-5xl' : ''}`}>
                              {message.text}
                            </div>
                          );
                        }
                        
                        // Regular message rendering
                        return (
                          <>
                            {/* Image Message */}
                            {message.image && (
                              <div className="relative group">
                                <img
                                  src={message.image}
                                  className="rounded-lg mb-2 max-h-48 sm:max-h-64 object-cover w-full cursor-pointer hover:opacity-90 transition"
                                  alt="attached"
                                  onClick={() => window.open(message.image, "_blank")}
                                />
                                <button
                                  onClick={() => handleDownloadImage(message.image)}
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
                            onClick={() => toggleVoicePlayback(message._id)}
                            className="btn btn-circle btn-sm flex-shrink-0"
                          >
                            {playingVoiceId === message._id ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                          <audio
                            ref={(el) => {
                              if (el) audioRefs.current[message._id] = el;
                            }}
                            src={message.voice}
                            onEnded={() => setPlayingVoiceId(null)}
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
                        );
                      })()}
                        </div>
                      </div>
                    );
                  })()}
                  <div className="flex items-center gap-1 mt-1 px-1">
                    <span className="text-[10px] sm:text-[11px] text-base-content/50">
                      {formatMessageTime(message.createdAt)}
                    </span>
                    {mine && (
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
        </div>
        <MessageInput />
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
