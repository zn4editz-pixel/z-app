import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { cacheMessagesDB, getCachedMessagesDB } from "../utils/cache";
import { useFriendStore } from "./useFriendStore";
export const useChatStore = create((set, get) => ({
  // --- Existing Chat State ---
  messages: [],
  hasMoreMessages: true,
  selectedUser: null,
  isMessagesLoading: false,
  unreadCounts: {},
  socketConnected: false,

  // --- Typing State ---
  isTyping: false,
  typingUserId: null,

  // --- Call State ---
  callState: "idle",
  callPartner: null,
  callType: null,
  incomingCallData: null,
  isMuted: false,
  isCameraOff: false,

  // --- Chat Actions ---
  lastDebugEvent: null,
  setLastDebugEvent: (evt) => set({ lastDebugEvent: evt }),

  // Fetch unread counts on app init
  fetchUnreadCounts: async () => {
    try {
      const res = await axiosInstance.get("/messages/unread-counts");
      set({ unreadCounts: res.data || {} });
    } catch (error) {}
  },

  loadMoreMessages: async (userId) => {
    const { messages } = get();
    if (messages.length === 0) return;
    
    try {
      const oldestMessage = messages[0];
      const response = await axiosInstance.get(`/messages/${userId}`, {
        params: {
          before: oldestMessage.createdAt,
          limit: 50
        }
      });
      
      const olderMessages = response.data;
      if (olderMessages.length > 0) {
        set((state) => ({
          messages: [...olderMessages, ...state.messages],
          hasMoreMessages: olderMessages.length === 50
        }));
      } else {
        set({ hasMoreMessages: false });
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
      set({ hasMoreMessages: false });
    }
  },

  getMessages: async (userId) => {
    const { selectedUser } = get();
    const selectedUserId = selectedUser?.id?.toString();
    const targetUserId = userId?.toString();

    if (selectedUserId !== targetUserId) {
      return;
    }

    const chatId = `${userId}`;
    const cachedMessages = await getCachedMessagesDB(chatId);

    if (cachedMessages && cachedMessages.length > 0) {
      const normalizedCachedMessages = cachedMessages.map((msg) => ({
        ...msg,
        reactions: Array.isArray(msg.reactions) ? msg.reactions : [],
      }));
      set({ messages: normalizedCachedMessages, isMessagesLoading: false });
      get().resetUnread(userId);
      get().markMessagesAsRead(userId);

      axiosInstance
        .get(`/messages/${userId}`)
        .then((res) => {
          const currentUser = get().selectedUser;
          if (currentUser?.id?.toString() === targetUserId) {
            set({ messages: res.data });
            cacheMessagesDB(chatId, res.data);
          }
        })
        .catch((err) => {});
      return;
    }

    set({ messages: [], isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      const currentUser = get().selectedUser;
      const currentUserId = currentUser?.id?.toString();

      if (currentUserId !== targetUserId) {
        return;
      }

      const normalizedMessages = res.data.map((msg) => ({
        ...msg,
        reactions: Array.isArray(msg.reactions) ? msg.reactions : [],
      }));

      set({ messages: normalizedMessages, isMessagesLoading: false });
      cacheMessagesDB(chatId, res.data);
      get().resetUnread(userId);
      get().markMessagesAsRead(userId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
      set({ messages: [], isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();
    if (!selectedUser) return;

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const timestamp = new Date().toISOString();

    // ⚡ INSTANT: Create optimistic message
    const optimisticMessage = {
      id: tempId,
      senderId: authUser.id,
      receiverId: selectedUser.id,
      text: messageData.text || "",
      image: messageData.image || null,
      voice: messageData.voice || null,
      voiceDuration: messageData.voiceDuration || null,
      replyToId: messageData.replyTo || null,
      status: "sent", // ⚡ Show as sent immediately for speed
      createdAt: timestamp,
      reactions: [],
      tempId: tempId,
      senderName: authUser.fullName,
      senderAvatar: authUser.profilePic,
    };

    // ⚡ INSTANT: Update UI with zero delay
    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    // ⚡ INSTANT: Update sidebar (async, non-blocking)
    setTimeout(() => {
      try {
        useFriendStore
          .getState()
          .updateFriendLastMessage(selectedUser.id, optimisticMessage);
      } catch (e) {}
    }, 0);

    // ⚡ FIRE-AND-FORGET: Send to server (no await, no blocking)
    axiosInstance
      .post(`/messages/send/${selectedUser.id}`, messageData)
      .then((res) => {
        // ✅ Success: Replace temp message with server response
        const serverMessage = {
          ...res.data,
          reactions: Array.isArray(res.data.reactions)
            ? res.data.reactions
            : [],
        };

        // ✅ SAFETY: Check if we still have the temp message before updating
        const currentState = get();
        const tempMessageExists = currentState.messages.some(
          (m) => m.tempId === tempId,
        );

        if (tempMessageExists) {
          set((state) => ({
            messages: state.messages.map((m) =>
              m.tempId === tempId
                ? { ...m, ...serverMessage, tempId: undefined }
                : m,
            ),
          }));
        }
      })
      .catch((error) => {
        // ❌ Failure: Mark message as failed
        set((state) => ({
          messages: state.messages.map((m) =>
            m.tempId === tempId ? { ...m, status: "failed" } : m,
          ),
        }));
        // Show error toast (non-blocking)
        setTimeout(() => {
          toast.error("Message failed to send");
        }, 100);
      });

    // ⚡ RETURN IMMEDIATELY (no waiting for server response)
    return Promise.resolve(optimisticMessage);
  },

  subscribeToMessages: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) {
      set({ socketConnected: false });
      return;
    }

    socket.removeAllListeners("newMessage");
    socket.removeAllListeners("messageDelivered");
    socket.removeAllListeners("messagesDelivered");
    socket.removeAllListeners("messagesRead");
    socket.removeAllListeners("userTyping");
    socket.removeAllListeners("stopTyping");
    socket.removeAllListeners("connect");
    socket.removeAllListeners("disconnect");

    set({ socketConnected: socket.connected });

    socket.on("connect", () => {
      set({ socketConnected: true });
    });

    socket.on("disconnect", () => {
      set({ socketConnected: false });
    });

    const messageHandler = (newMessage) => {
      // ... (message handler logic remains same, handled by existing code in file)
      const receiveTime = performance.now();
      const { selectedUser, messages } = get();
      const { authUser } = useAuthStore.getState();

      if (!newMessage || !newMessage.id) {
        return;
      }

      const selectedUserId = selectedUser?.id?.toString();
      const authUserId = authUser?.id?.toString();
      const msgSenderId =
        newMessage.senderId?.id?.toString() || newMessage.senderId?.toString();
      const msgReceiverId =
        newMessage.receiverId?.id?.toString() ||
        newMessage.receiverId?.toString();

      const isForCurrentChat =
        selectedUser &&
        ((msgSenderId === selectedUserId && msgReceiverId === authUserId) ||
          (msgSenderId === authUserId && msgReceiverId === selectedUserId));

      if (isForCurrentChat) {
        // Stop typing indicator when message received
        set({ isTyping: false, typingUserId: null });

        const socket = get().socket;
        // 🔥 REAL-TIME ACKNOWLEDGEMENT: Emit Delivered event
        if (socket && newMessage.id) {
          socket.emit("messageDelivered", { messageId: newMessage.id });
        }

        // 🔥 CRITICAL FIX: Mark as read IMMEDIATELY if we are looking at this chat
        // AND it's an incoming message (not my own echo)
        if (msgSenderId !== authUserId && selectedUserId) {
          // 🚀 ULTRA-FAST: No timeout, mark immediately
          get().markMessagesAsRead(selectedUserId);
        }

        let currentMessages = get().messages;

        // Check if message already exists to avoid duplicates
        const isDuplicateById = currentMessages.some(
          (m) => m.id === newMessage.id,
        );
        // ...
        if (isDuplicateById) return;

        if (msgSenderId === authUserId) {
          // This is our own message coming back from server (echo)
          currentMessages = get().messages;
          const optimisticIndex = currentMessages.findIndex(
            (m) =>
              (m.tempId && (m.status === "sending" || m.status === "sent")) ||
              (m.status === "sending" &&
                m.senderId === authUserId &&
                m.text === newMessage.text),
          );

          if (optimisticIndex !== -1) {
            const updatedMessages = currentMessages.map((m, idx) =>
              idx === optimisticIndex
                ? { ...newMessage, status: newMessage.status || "sent" }
                : m,
            );
            set({ messages: updatedMessages });
            return;
          }
        }

        const updatedMessages = [...currentMessages, newMessage];
        set({ messages: [...updatedMessages] });

        // Scroll to bottom (optional trigger if needed)
        setTimeout(() => {
          const container = document.querySelector(".chat-scroll-container");
          if (container) container.scrollTop = container.scrollHeight;
        }, 10);
      } else if (msgSenderId !== authUserId) {
        // Message for a different chat
        get().incrementUnread(msgSenderId);
        useFriendStore
          .getState()
          .updateFriendLastMessage(msgSenderId, newMessage);

        // 🔥 REAL-TIME ACKNOWLEDGEMENT: Emit Delivered event even if not current chat
        // This ensures the sender gets the double-tick even if I'm not looking at their chat
        const socket = get().socket;
        if (socket && newMessage.id) {
          socket.emit("messageDelivered", { messageId: newMessage.id });
        }
      }
    };

    const handleUserTyping = (data) => {
      // Backend sends: { senderId }
      get().setLastDebugEvent(`TYPING: ${JSON.stringify(data)}`); // 🔥 DEBUG
      const senderId = data?.senderId || data;
      const { selectedUser } = get();
      const currentSelectedId = selectedUser?.id?.toString();
      const typingSenderId = senderId?.toString();

      if (
        currentSelectedId &&
        typingSenderId &&
        currentSelectedId === typingSenderId
      ) {
        set({ isTyping: true, typingUserId: senderId });

        // Auto-clear typing after 3 seconds in case stopTyping is missed
        if (get()._typingTimeout) clearTimeout(get()._typingTimeout);
        const timeout = setTimeout(() => {
          set({ isTyping: false, typingUserId: null });
        }, 3000);
        set({ _typingTimeout: timeout });
      }
    };

    const handleStopTyping = (data) => {
      const senderId = data?.senderId || data;
      const { selectedUser } = get();
      if (selectedUser?.id?.toString() === senderId?.toString()) {
        set({ isTyping: false, typingUserId: null });
        if (get()._typingTimeout) clearTimeout(get()._typingTimeout);
      }
    };

    const messageDeliveredHandler = (payload) => {
      // Backend sends: { messageId, deliveredAt }
      const messageId = payload?.messageId || payload;
      const deliveredAt = payload?.deliveredAt || new Date().toISOString();
      const { messages } = get();
      const targetId = messageId.toString();

      set((state) => ({
        messages: state.messages.map((msg) => {
          if (msg.id.toString() === targetId) {
            // 🛡️ PROTECTION: Do not revert status if already read
            if (msg.isRead || msg.status === "read" || msg.readAt) {
              return msg;
            }
            return {
              ...msg,
              status: "delivered",
              isDelivered: true,
              deliveredAt: deliveredAt,
            };
          }
          return msg;
        }),
      }));
    };

    const messagesDeliveredHandler = (payload) => {
      // Backend sends: { messageIds: [...], deliveredAt: ... }
      const messageIds = payload?.messageIds || payload;
      const deliveredAt = payload?.deliveredAt || new Date().toISOString();
      if (!Array.isArray(messageIds)) return;

      const targetIds = messageIds.map((id) => id.toString());

      set((state) => ({
        messages: state.messages.map((msg) => {
          if (targetIds.includes(msg.id.toString())) {
            // 🛡️ PROTECTION: Do not revert status if already read
            if (msg.isRead || msg.status === "read" || msg.readAt) {
              return msg;
            }
            return {
              ...msg,
              status: "delivered",
              isDelivered: true,
              deliveredAt: deliveredAt,
            };
          }
          return msg;
        }),
      }));
    };

    const messagesReadHandler = (payload) => {
      const { messageIds = [], receiverId, readBy } = payload;
      const { messages } = get();
      const { authUser } = useAuthStore.getState();

      // Note: 'readBy' or 'receiverId' is the person who DID the reading.
      const readerId = readBy || receiverId;

      if (!authUser) return;

      // CASE 1: Specific Message IDs provided (Preferred)
      if (messageIds.length > 0) {
        const updatedMessages = messages.map((msg) => {
          if (messageIds.includes(msg.id) && msg.senderId === authUser.id) {
            return {
              ...msg,
              status: "read",
              isRead: true,
              readAt: new Date().toISOString(),
            };
          }
          return msg;
        });
        set({ messages: updatedMessages });
        return;
      }

      // CASE 2: "readBy" User ID provided (Fallback/Legacy)
      // If the receiver read our chat, mark ALL our messages to them as read
      if (readBy) {
        const updatedMessages = messages.map((msg) => {
          // If I sent this message TO the person who just read it, and it's not read yet
          if (
            msg.receiverId === readBy &&
            msg.senderId === authUser.id &&
            !msg.isRead &&
            msg.status !== "read"
          ) {
            return {
              ...msg,
              status: "read",
              isRead: true,
              readAt: new Date().toISOString(),
            };
          }
          return msg;
        });
        set({ messages: updatedMessages });
      }
    };

    socket.on("newMessage", messageHandler);
    socket.on("messageDelivered", messageDeliveredHandler); // defined in file
    socket.on("messagesDelivered", messagesDeliveredHandler); // defined in file
    socket.on("messagesRead", messagesReadHandler); // defined in file

    // 🔥 NEW: Listen for real-time call logs
    socket.on("call-log", (callLog) => {
      const { selectedUser, messages, authUser } = get();

      // Only add if relevant to current chat
      const isRelevant =
        selectedUser &&
        (callLog.receiverId === selectedUser.id ||
          callLog.callerId === selectedUser.id ||
          callLog.receiverId?.id === selectedUser.id ||
          callLog.callerId?.id === selectedUser.id);

      if (isRelevant) {
        // Check if already exists to avoid dupes
        const exists = messages.some((m) => m.id === callLog.id);
        if (!exists) {
          set({ messages: [...messages, callLog] });
          // Update cache
          cacheMessagesDB(selectedUser.id, [...messages, callLog]);
          // Force scroll
          setTimeout(() => {
            const container = document.querySelector(".chat-scroll-container");
            if (container) container.scrollTop = container.scrollHeight;
          }, 100);
        }
      }

      // Update friend list preview
      const friendId =
        callLog.callerId === authUser.id
          ? callLog.receiverId
          : callLog.callerId;
      useFriendStore.getState().updateFriendLastMessage(friendId, callLog);
    });

    socket.on("typing", handleUserTyping);
    socket.on("stopTyping", handleStopTyping);
  },

  markMessagesAsRead: async (userId) => {
    if (!userId) return;
    const { messages, selectedUser, authUser } = get();

    // Optimistic UI Update: Mark logic as read immediately if current chat matches
    if (selectedUser && selectedUser.id.toString() === userId.toString()) {
      const updatedMessages = messages.map((msg) =>
        msg.senderId === userId && !msg.isRead
          ? {
              ...msg,
              isRead: true,
              status: "read",
              readAt: new Date().toISOString(),
            }
          : msg,
      );
      // Only update if something changed
      if (JSON.stringify(updatedMessages) !== JSON.stringify(messages)) {
        set({ messages: updatedMessages });
        cacheMessagesDB(userId, updatedMessages);
      }
    }

    try {
      await axiosInstance.put(`/messages/read/${userId}`);
    } catch (error) {}
  },

  unsubscribeFromMessages: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    socket.removeAllListeners("newMessage");
    socket.removeAllListeners("messageDelivered");
    socket.removeAllListeners("messagesDelivered");
    socket.removeAllListeners("messagesRead");
    socket.removeAllListeners("connect");
    socket.removeAllListeners("disconnect");

    // 🔥 CLEANUP: Remove enhanced listeners
    socket.removeAllListeners("message-received");
    socket.removeAllListeners("messageReceived");
    socket.removeAllListeners("messageReaction");
    socket.removeAllListeners("reactionUpdate");
    socket.removeAllListeners("reaction-update");

    // 🔥 CLEANUP: Remove typing listeners
    socket.removeAllListeners("typing");
    socket.removeAllListeners("stopTyping");

    // 🔥 CLEANUP: Clear reaction interval
    if (socket._reactionInterval) {
      clearInterval(socket._reactionInterval);
      socket._reactionInterval = null;
    }

    set({ socketConnected: false });
  },

  setSelectedUser: (user) => {
    set({ selectedUser: user, messages: [], isMessagesLoading: false });
    if (user) {
      const currentUrl = new URL(window.location);
      currentUrl.searchParams.set("chat", user.id);
      window.history.replaceState({}, "", currentUrl);
      const userId = user.id;
      // Immediate fetch (no timeout needed usually, but keeping logic similar)
      get().getMessages(userId);
    } else {
      const currentUrl = new URL(window.location);
      currentUrl.searchParams.delete("chat");
      window.history.replaceState({}, "", currentUrl);
    }
  },

  restoreSelectedUser: async () => {
    try {
      // Check URL parameter first (highest priority)
      const urlParams = new URLSearchParams(window.location.search);
      const chatUserId = urlParams.get("chat");
      if (!chatUserId) {
        return false;
      }

      // Get friends with retry mechanism
      let friends = useFriendStore.getState().friends;
      // If no friends, try to fetch them
      if (friends.length === 0) {
        try {
          await useFriendStore.getState().fetchFriendData();
          friends = useFriendStore.getState().friends;
        } catch (error) {
          return false;
        }
      }

      let targetUser = null;
      // Try URL parameter
      if (chatUserId) {
        targetUser = friends.find((friend) => friend.id === chatUserId);
      }

      if (targetUser) {
        get().setSelectedUser(targetUser);
        return true;
      } else {
        // Clean up URL if no valid restoration
        if (chatUserId) {
          const currentUrl = new URL(window.location);
          currentUrl.searchParams.delete("chat");
          window.history.replaceState({}, "", currentUrl);
        }
      }
    } catch (error) {}
    return false;
  },

  incrementUnread: (userId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [userId]: (state.unreadCounts[userId] || 0) + 1,
      },
    })),

  resetUnread: (userId) =>
    set((state) => {
      const updated = { ...state.unreadCounts };
      delete updated[userId];
      return { unreadCounts: updated };
    }),

  // --- Message Reactions ---
  addReaction: async (messageId, emoji) => {
    try {
      const { socket } = useAuthStore.getState();
      const { messages, selectedUser } = get();
      const { authUser } = useAuthStore.getState();

      const optimisticMessages = messages.map((msg) => {
        if (msg.id === messageId) {
          const currentReactions = Array.isArray(msg.reactions)
            ? msg.reactions
            : [];
          const filteredReactions = currentReactions.filter((r) => {
            const reactionUserId = r.userId?.id || r.userId;
            return reactionUserId !== authUser.id;
          });
          const newReaction = {
            userId: authUser.id,
            emoji: emoji,
            createdAt: new Date().toISOString(),
          };
          return { ...msg, reactions: [...filteredReactions, newReaction] };
        }
        return msg;
      });
      set({ messages: optimisticMessages });

      // 🔥 FIXED: Use socket for real-time, API as fallback only
      if (socket && socket.connected && selectedUser) {
        socket.emit("messageReaction", {
          messageId,
          emoji,
          receiverId: selectedUser.id,
        });
      } else {
        axiosInstance
          .post(`/messages/reaction/${messageId}`, { emoji })
          .then((res) => {
            const currentMessages = get().messages;
            const serverUpdatedMessages = currentMessages.map((msg) =>
              msg.id === messageId
                ? { ...msg, reactions: res.data.reactions }
                : msg,
            );
            set({ messages: serverUpdatedMessages });
            if (selectedUser) {
              const chatId = `${selectedUser.id}`;
              cacheMessagesDB(chatId, serverUpdatedMessages);
            }
          })
          .catch((error) => {
            const revertedMessages = messages.map((msg) =>
              msg.id === messageId ? { ...msg, reactions: msg.reactions } : msg,
            );
            set({ messages: revertedMessages });
            toast.error("Failed to add reaction");
          });
      }
    } catch (error) {
      toast.error("Failed to add reaction");
    }
  },

  removeReaction: async (messageId) => {
    try {
      const { socket } = useAuthStore.getState();
      const { messages, selectedUser } = get();
      const { authUser } = useAuthStore.getState();

      const optimisticMessages = messages.map((msg) => {
        if (msg.id === messageId) {
          const currentReactions = Array.isArray(msg.reactions)
            ? msg.reactions
            : [];
          const filteredReactions = currentReactions.filter((r) => {
            const reactionUserId = r.userId?.id || r.userId;
            return reactionUserId !== authUser.id;
          });
          return { ...msg, reactions: filteredReactions };
        }
        return msg;
      });
      set({ messages: optimisticMessages });

      // 🔥 FIXED: Use socket for real-time, API as fallback only
      if (socket && socket.connected && selectedUser) {
        socket.emit("messageReactionRemove", {
          messageId,
          receiverId: selectedUser.id,
        });
      } else {
        axiosInstance
          .delete(`/messages/reaction/${messageId}`)
          .then((res) => {
            const currentMessages = get().messages;
            const serverUpdatedMessages = currentMessages.map((msg) =>
              msg.id === messageId
                ? { ...msg, reactions: res.data.reactions }
                : msg,
            );
            set({ messages: serverUpdatedMessages });
            if (selectedUser) {
              const chatId = `${selectedUser.id}`;
              cacheMessagesDB(chatId, serverUpdatedMessages);
            }
          })
          .catch((error) => {
            const revertedMessages = messages.map((msg) =>
              msg.id === messageId ? { ...msg, reactions: msg.reactions } : msg,
            );
            set({ messages: revertedMessages });
            toast.error("Failed to remove reaction");
          });
      }
    } catch (error) {
      toast.error("Failed to remove reaction");
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/message/${messageId}`);
      const { messages, selectedUser } = get();
      const updatedMessages = messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, isDeleted: true, deletedAt: new Date() }
          : msg,
      );
      set({ messages: updatedMessages });
      if (selectedUser) {
        const chatId = `${selectedUser.id}`;
        cacheMessagesDB(chatId, updatedMessages);
      }
      toast.success("Message deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  subscribeToReactions: () => {
    const { socket } = useAuthStore.getState();
    if (!socket || !socket.connected) {
      return;
    }

    socket.removeAllListeners("messageReaction");
    socket.removeAllListeners("messageDeleted");

    const reactionHandler = ({ messageId, reactions }) => {
      const { messages, selectedUser } = get();
      const updatedMessages = messages.map((msg) =>
        msg.id === messageId ? { ...msg, reactions } : msg,
      );
      // 🔥 FORCE UPDATE: Set messages with new array reference to trigger re-render
      set({ messages: [...updatedMessages] });
      if (selectedUser) {
        const chatId = `${selectedUser.id}`;
        cacheMessagesDB(chatId, updatedMessages);
      }
      // 🔥 ADDITIONAL: Force component re-render
    };

    const deleteHandler = ({ messageId, isDeleted, deletedAt }) => {
      const { messages, selectedUser } = get();
      const updatedMessages = messages.map((msg) =>
        msg.id === messageId ? { ...msg, isDeleted, deletedAt } : msg,
      );
      set({ messages: updatedMessages });
      if (selectedUser) {
        const chatId = `${selectedUser.id}`;
        cacheMessagesDB(chatId, updatedMessages);
      }
    };

    socket.on("messageReaction", reactionHandler);
    socket.on("messageDeleted", deleteHandler);

    // 🔥 ENHANCED: Add multiple reaction event listeners for better coverage
    socket.on("reactionUpdate", reactionHandler);
    socket.on("reaction-update", reactionHandler);

    // 🔥 FORCE: Set up interval to check for missed updates
    const reactionInterval = setInterval(() => {
      // Force a small update to ensure reactions are current
      const { messages } = get();
      if (messages.length > 0) {
        set({ messages: [...messages] });
      }
    }, 2000); // Check every 2 seconds

    // Store interval for cleanup
    socket._reactionInterval = reactionInterval;
  },

  // --- Call Actions ---
  resetCallState: () => {
    set({
      callState: "idle",
      callPartner: null,
      callType: null,
      incomingCallData: null,
      isMuted: false,
      isCameraOff: false,
    });
  },

  // 🔥 NEW: Add call log to chat
  addCallLog: async (
    receiverId,
    callType,
    duration = 0,
    status = "completed",
  ) => {
    try {
      const response = await axiosInstance.post("/messages/call-log", {
        receiverId,
        callType,
        duration,
        status,
      });

      // Add to current messages if this is the active chat
      const { selectedUser, messages } = get();
      if (selectedUser?.id === receiverId) {
        const updatedMessages = [...messages, response.data];
        set({ messages: updatedMessages });
        // Cache the updated messages
        const chatId = `${receiverId}`;
        cacheMessagesDB(chatId, updatedMessages);
      }

      // 🔥 REAL-TIME: Update friend's last message with call log
      useFriendStore
        .getState()
        .updateFriendLastMessage(receiverId, response.data);

      return response.data;
    } catch (error) {
      toast.error("Failed to log call");
    }
  },

  initiateCall: (partner, type) => {
    const { callState } = get();
    if (callState !== "idle") {
      return toast.error("Already busy in another call attempt.");
    }

    const { authUser, socket } = useAuthStore.getState();
    if (!socket || !authUser || !partner || !partner.id) {
      return toast.error("Cannot initiate call. Connection error.");
    }

    set({
      callState: "outgoing",
      callPartner: partner,
      callType: type,
      isCameraOff: type === "audio",
    });

    socket.emit("private:initiate-call", {
      receiverId: partner.id,
      callerInfo: {
        id: authUser.id,
        nickname: authUser.nickname || authUser.username,
        profilePic: authUser.profilePic,
      },
      callType: type,
    });
  },

  acceptCall: () => {
    const { incomingCallData } = get();
    const { authUser, socket } = useAuthStore.getState();

    if (!incomingCallData || !socket || !authUser) {
      return;
    }

    set({
      callState: "connecting",
      callPartner: incomingCallData.callerInfo,
      callType: incomingCallData.callType,
      isCameraOff: incomingCallData.callType === "audio",
      incomingCallData: null,
    });

    socket.emit("private:call-accepted", {
      callerId: incomingCallData.callerId,
      acceptorInfo: {
        id: authUser.id,
        nickname: authUser.nickname || authUser.username,
        profilePic: authUser.profilePic,
      },
    });
  },

  rejectCall: (reason = "declined") => {
    const { callState, incomingCallData, callPartner } = get();
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    if (callState === "incoming" && incomingCallData) {
      socket.emit("private:call-rejected", {
        callerId: incomingCallData.callerId,
        reason: reason,
      });
    } else if (callState === "outgoing" && callPartner) {
      socket.emit("private:end-call", { targetUserId: callPartner.id });
    }
    get().resetCallState();
  },

  endCall: () => {
    const { callState, callPartner } = get();
    const { socket } = useAuthStore.getState();
    if (!socket || callState === "idle") return;

    if (
      callPartner &&
      (callState === "connected" ||
        callState === "connecting" ||
        callState === "outgoing")
    ) {
      socket.emit("private:end-call", { targetUserId: callPartner.id });
    }
    get().resetCallState();
  },

  handleIncomingCall: (data) => {
    const { callState } = get();
    const { socket } = useAuthStore.getState();

    if (callState !== "idle") {
      if (socket) {
        socket.emit("private:call-rejected", {
          callerId: data.callerId,
          reason: "busy",
        });
      }
      return;
    }

    set({
      callState: "incoming",
      incomingCallData: data,
      callPartner: data.callerInfo,
      callType: data.callType,
    });
  },

  handleCallAccepted: (data) => {
    const { callState } = get();
    if (callState !== "outgoing") {
      return;
    }
    set({ callState: "connecting" });
  },

  handleCallRejected: (data) => {
    const { callState, callPartner } = get();
    if (callState === "outgoing" && callPartner?.id === data.rejectorId) {
      toast.error(`Call ${data.reason || "declined"} by user.`);
      get().resetCallState();
    } else {
    }
  },

  handleCallEnded: (data) => {
    const { callState, callPartner } = get();
    if (callState !== "idle") {
      get().resetCallState();
    }
  },

  toggleMute: () => {
    set((state) => ({ isMuted: !state.isMuted }));
  },

  toggleCamera: () => {
    set((state) => ({ isCameraOff: !state.isCameraOff }));
  },

  subscribeToCallEvents: () => {
    return;
  },

  unsubscribeFromCallEvents: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    socket.off("private:incoming-call");
    socket.off("private:call-accepted");
    socket.off("private:call-rejected");
    socket.off("private:call-ended");
  },

  // Simple message status update
  updateMessageStatus: (messageId, newStatus) => {
    const { messages } = get();
    const updatedMessages = messages.map((msg) => {
      if (msg.id === messageId) {
        const updates = { status: newStatus };
        if (newStatus === "delivered")
          updates.deliveredAt = new Date().toISOString();
        if (newStatus === "read") updates.readAt = new Date().toISOString();
        return { ...msg, ...updates };
      }
      return msg;
    });
    set({ messages: updatedMessages });
  },
}));
