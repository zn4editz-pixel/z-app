import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios"; // Keep axiosInstance for getMessages/sendMessage
import { useAuthStore } from "./useAuthStore"; // Auth store needed for socket & user info
import { cacheMessages, getCachedMessages, updateLastSync } from "../utils/offlineStorage";
import { cacheMessagesDB, getCachedMessagesDB } from "../utils/cache";

export const useChatStore = create((set, get) => ({
    // --- Existing Chat State ---
    messages: [],
    selectedUser: null, // User object for the currently selected chat partner
    isMessagesLoading: false,
    unreadCounts: {},

    // --- NEW: Call State ---
    callState: "idle", // 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'connected'
    callPartner: null, // User object of the person in the call (callerInfo or acceptorInfo)
    callType: null, // 'audio' | 'video'
    incomingCallData: null, // Stores { callerId, callerInfo, callType } for incoming calls
    isMuted: false,
    isCameraOff: false,
    // --- End Call State ---

    // --- Existing Chat Actions ---
    getMessages: async (userId) => {
        // Clear messages immediately to prevent showing wrong chat
        set({ messages: [], isMessagesLoading: true });
        
        // Try IndexedDB cache first (instant load)
        const cachedMessagesDB = await getCachedMessagesDB(userId);
        if (cachedMessagesDB && cachedMessagesDB.length > 0) {
            set({ messages: cachedMessagesDB, isMessagesLoading: false });
        } else {
            const cachedMessages = getCachedMessages(userId);
            if (cachedMessages && cachedMessages.length > 0) {
                set({ messages: cachedMessages, isMessagesLoading: false });
            }
        }
        
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({ messages: res.data });
            
            // Cache in both IndexedDB and localStorage
            await cacheMessagesDB(userId, res.data);
            cacheMessages(userId, res.data);
            updateLastSync();
            
            get().resetUnread(userId);
            get().markMessagesAsRead(userId);
        } catch (error) {
            // If fetch fails but we have cache, keep showing cache
            const hasCache = cachedMessagesDB?.length > 0 || getCachedMessages(userId)?.length > 0;
            if (hasCache) {
                console.log('Using cached messages - API failed');
            } else {
                toast.error(error.response?.data?.message || "Failed to fetch messages");
                set({ messages: [] });
            }
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        const { authUser, socket } = useAuthStore.getState();
        if (!selectedUser) return;
        
        // Check if online
        if (!navigator.onLine) {
            toast.error("You are offline - Cannot send messages");
            return;
        }
        
        // Create optimistic message (shows immediately - WhatsApp style)
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const optimisticMessage = {
            _id: tempId,
            senderId: authUser._id,
            receiverId: selectedUser._id,
            text: messageData.text || '',
            image: messageData.image || null,
            voice: messageData.voice || null,
            voiceDuration: messageData.voiceDuration || null,
            replyTo: messageData.replyTo || null,
            status: 'sending',
            createdAt: new Date().toISOString(),
            reactions: [],
            isOptimistic: true,
            tempId: tempId // Store temp ID for replacement
        };
        
        // Add optimistic message immediately (instant UI update)
        set({ messages: [...messages, optimisticMessage] });
        
        try {
            // Send via API
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            
            // Replace optimistic message with real message from server
            if (res.data && res.data._id) {
                set(state => ({
                    messages: state.messages.map(m => 
                        m.tempId === tempId ? { ...res.data, isOptimistic: false } : m
                    )
                }));
                
                // Update cache
                const currentMessages = get().messages;
                cacheMessages(selectedUser._id, currentMessages);
                await cacheMessagesDB(selectedUser._id, currentMessages);
            }
        } catch (error) {
            // Mark message as failed instead of removing it
            set(state => ({
                messages: state.messages.map(m => 
                    m.tempId === tempId ? { ...m, status: 'failed', isOptimistic: false } : m
                )
            }));
            toast.error(error.response?.data?.message || "Failed to send message");
        }
    },

    subscribeToMessages: () => {
        const { socket } = useAuthStore.getState(); // Get socket directly
        if (!socket) return;

        // Define handler separately
        const messageHandler = (newMessage) => {
            const { selectedUser, messages } = get();

            if (!newMessage || !newMessage._id) {
                console.warn("Received invalid message object:", newMessage);
                return;
            }

            // Check if message already exists (by real _id or tempId)
            const isDuplicate = messages.some(m => 
                m._id === newMessage._id || 
                (m.isOptimistic && m.text === newMessage.text && m.senderId === newMessage.senderId)
            );

            if (isDuplicate) {
                console.log("Duplicate message detected, skipping:", newMessage._id);
                return;
            }

            // Add message to state if it's for the selected user
            if (selectedUser && (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id)) {
                set({ messages: [...messages, newMessage] });
                // Mark as read if chat is open
                get().markMessagesAsRead(selectedUser._id);
            } else if (newMessage.senderId) {
                // Increment unread count if chat not open
                get().incrementUnread(newMessage.senderId);
            }
        };

        const messageDeliveredHandler = ({ messageId, deliveredAt }) => {
            const { messages } = get();
            const updatedMessages = messages.map(msg => 
                msg._id === messageId ? { ...msg, status: 'delivered', deliveredAt } : msg
            );
            set({ messages: updatedMessages });
        };

        const messagesDeliveredHandler = ({ messageIds, deliveredAt }) => {
            const { messages } = get();
            const updatedMessages = messages.map(msg => 
                messageIds.includes(msg._id) ? { ...msg, status: 'delivered', deliveredAt } : msg
            );
            set({ messages: updatedMessages });
        };

        const messagesReadHandler = ({ readBy }) => {
            const { messages, selectedUser } = get();
            console.log(`📘 Received messagesRead event. ReadBy: ${readBy}`);
            console.log(`📘 Current messages count: ${messages.length}`);
            
            // Update messages where I am the sender and the other person (readBy) is the receiver
            // Handle both string and ObjectId comparison
            const updatedMessages = messages.map(msg => {
                const receiverIdStr = typeof msg.receiverId === 'object' ? msg.receiverId._id || msg.receiverId.toString() : msg.receiverId;
                const readByStr = typeof readBy === 'object' ? readBy._id || readBy.toString() : readBy;
                const shouldUpdate = receiverIdStr === readByStr && msg.status !== 'read';
                
                if (shouldUpdate) {
                    console.log(`📘 Updating message ${msg._id} to read status`);
                    console.log(`📘 Message receiverId: ${receiverIdStr}, readBy: ${readByStr}`);
                }
                return shouldUpdate ? { ...msg, status: 'read', readAt: new Date() } : msg;
            });
            
            const readCount = updatedMessages.filter(m => m.status === 'read').length;
            console.log(`📘 Total messages with read status: ${readCount}`);
            
            set({ messages: updatedMessages });
        };

        socket.off("newMessage", messageHandler);
        socket.off("messageDelivered", messageDeliveredHandler);
        socket.off("messagesDelivered", messagesDeliveredHandler);
        socket.off("messagesRead", messagesReadHandler);
        
        socket.on("newMessage", messageHandler);
        socket.on("messageDelivered", messageDeliveredHandler);
        socket.on("messagesDelivered", messagesDeliveredHandler);
        socket.on("messagesRead", messagesReadHandler);
    },

    markMessagesAsRead: async (userId) => {
        try {
            await axiosInstance.put(`/messages/read/${userId}`);
        } catch (error) {
            console.error("Failed to mark messages as read:", error);
        }
    },

    unsubscribeFromMessages: () => {
        const { socket } = useAuthStore.getState();
        if (!socket) return;
        socket.off("newMessage");
    },

    setSelectedUser: (user) => { // Renamed param for clarity
        // CRITICAL: Clear messages IMMEDIATELY to prevent flash of previous chat
        set({ selectedUser: user, messages: [] });
        if (user) {
            get().getMessages(user._id); // Fetch messages for the selected user
            // resetUnread is called within getMessages on success
        }
    },

    incrementUnread: (userId) => set((state) => ({ unreadCounts: {...state.unreadCounts, [userId]: (state.unreadCounts[userId] || 0) + 1} })),
    resetUnread: (userId) => set((state) => { const updated = {...state.unreadCounts}; delete updated[userId]; return { unreadCounts: updated }; }),

    // --- Message Reactions ---
    addReaction: async (messageId, emoji) => {
        try {
            const res = await axiosInstance.post(`/messages/reaction/${messageId}`, { emoji });
            const { messages } = get();
            const updatedMessages = messages.map(msg => 
                msg._id === messageId ? { ...msg, reactions: res.data.reactions } : msg
            );
            set({ messages: updatedMessages });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add reaction");
        }
    },

    removeReaction: async (messageId) => {
        try {
            const res = await axiosInstance.delete(`/messages/reaction/${messageId}`);
            const { messages } = get();
            const updatedMessages = messages.map(msg => 
                msg._id === messageId ? { ...msg, reactions: res.data.reactions } : msg
            );
            set({ messages: updatedMessages });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to remove reaction");
        }
    },

    deleteMessage: async (messageId) => {
        try {
            await axiosInstance.delete(`/messages/message/${messageId}`);
            const { messages } = get();
            const updatedMessages = messages.map(msg => 
                msg._id === messageId ? { ...msg, isDeleted: true, deletedAt: new Date() } : msg
            );
            set({ messages: updatedMessages });
            toast.success("Message deleted");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete message");
        }
    },

    subscribeToReactions: () => {
        const { socket } = useAuthStore.getState();
        if (!socket) return;

        const reactionHandler = ({ messageId, reactions }) => {
            const { messages } = get();
            const updatedMessages = messages.map(msg => 
                msg._id === messageId ? { ...msg, reactions } : msg
            );
            set({ messages: updatedMessages });
        };

        const deleteHandler = ({ messageId, isDeleted, deletedAt }) => {
            const { messages } = get();
            const updatedMessages = messages.map(msg => 
                msg._id === messageId ? { ...msg, isDeleted, deletedAt } : msg
            );
            set({ messages: updatedMessages });
        };

        socket.off("messageReaction", reactionHandler);
        socket.off("messageDeleted", deleteHandler);
        
        socket.on("messageReaction", reactionHandler);
        socket.on("messageDeleted", deleteHandler);
    },


    // --- NEW: Call Actions ---
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

    initiateCall: (partner, type) => {
        const { callState } = get();
        if (callState !== "idle") {
            // Allow initiating if connecting fails? Maybe reset first.
            // For now, prevent multiple outgoing calls.
            return toast.error("Already busy in another call attempt.");
        }
        const { authUser, socket } = useAuthStore.getState();
        if (!socket || !authUser || !partner || !partner._id) {
             return toast.error("Cannot initiate call. Connection error.");
        }

        set({
            callState: "outgoing",
            callPartner: partner,
            callType: type,
            isCameraOff: type === 'audio',
        });

        socket.emit("private:initiate-call", {
            receiverId: partner._id,
            callerInfo: {
                _id: authUser._id,
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
            callState: "connecting", // Move to connecting
            callPartner: incomingCallData.callerInfo, // Caller is the partner
            callType: incomingCallData.callType,
            isCameraOff: incomingCallData.callType === 'audio',
            incomingCallData: null, // Clear incoming data
        });

        socket.emit("private:call-accepted", {
            callerId: incomingCallData.callerId,
            acceptorInfo: {
                _id: authUser._id,
                nickname: authUser.nickname || authUser.username,
                profilePic: authUser.profilePic,
            },
        });
        // WebRTC negotiation will now start, usually triggered by the CallModal component
    },

    rejectCall: (reason = 'declined') => {
        const { callState, incomingCallData, callPartner } = get();
        const { socket } = useAuthStore.getState();
        if (!socket) return;

        if (callState === "incoming" && incomingCallData) {
            console.log(`Rejecting incoming call from ${incomingCallData.callerInfo?.nickname}. Reason: ${reason}`);
            socket.emit("private:call-rejected", {
                callerId: incomingCallData.callerId,
                reason: reason,
            });
        } else if (callState === "outgoing" && callPartner) {
            console.log(`Cancelling outgoing call to ${callPartner.nickname || callPartner.username}`);
            socket.emit("private:end-call", { targetUserId: callPartner._id }); // Use end-call to notify
        }
        get().resetCallState(); // Reset state immediately
    },

    endCall: () => {
        const { callState, callPartner } = get();
        const { socket } = useAuthStore.getState();
        if (!socket || callState === 'idle') return;

        console.log(`Ending call with ${callPartner?.nickname || callPartner?.username || 'partner'}`);
        if (callPartner && (callState === 'connected' || callState === 'connecting' || callState === 'outgoing')) {
            socket.emit("private:end-call", { targetUserId: callPartner._id });
        }
        get().resetCallState(); // Reset state immediately
        // WebRTC cleanup should be triggered in the CallModal component
    },

    handleIncomingCall: (data) => {
        const { callState } = get(); // Check current call state
        const { socket } = useAuthStore.getState(); // Need socket to reject if busy

        if (callState !== "idle") {
            console.log(`Received incoming call from ${data.callerInfo?.nickname} but already busy (state: ${callState}). Rejecting.`);
            if(socket) {
                socket.emit("private:call-rejected", { callerId: data.callerId, reason: 'busy' });
            }
            return; // Ignore the incoming call further
        }
        console.log(`Incoming ${data.callType} call from ${data.callerInfo?.nickname}`);
        set({
            callState: "incoming",
            incomingCallData: data,
            callPartner: data.callerInfo, // Set partner info for UI
            callType: data.callType,
        });
        // Component listening to callState will show UI
    },

    handleCallAccepted: (data) => {
        const { callState } = get();
        if (callState !== "outgoing") {
             console.warn("Received call-accepted signal but wasn't in outgoing state.");
             return;
        }
        console.log(`Call accepted by ${data.acceptorInfo?.nickname}`);
        // Update partner info with acceptor details if needed, though usually caller initiated with partner info
        // set({ callPartner: data.acceptorInfo });
        set({ callState: "connecting" }); // Move to connecting, WebRTC starts
    },

    handleCallRejected: (data) => {
        const { callState, callPartner } = get();
        // Only act if we were the caller waiting for acceptance
        if (callState === "outgoing" && callPartner?._id === data.rejectorId) {
            console.log(`Call rejected by ${callPartner.nickname}. Reason: ${data.reason}`);
            toast.error(`Call ${data.reason || 'declined'} by user.`);
            get().resetCallState();
        } else {
             console.warn("Received call-rejected signal but wasn't the caller or partner mismatch.");
        }
    },

    handleCallEnded: (data) => { // data might contain { userId } of who ended
        const { callState, callPartner } = get();
        if (callState !== 'idle') {
            console.log(`Received signal: Call ended by ${data?.userId === callPartner?._id ? callPartner.nickname : 'partner'}.`);
            toast("Call ended", { icon: "📞" });
            get().resetCallState();
            // WebRTC cleanup should be triggered in the CallModal component
        }
    },

    toggleMute: () => { set((state) => ({ isMuted: !state.isMuted })); },
    toggleCamera: () => { set((state) => ({ isCameraOff: !state.isCameraOff })); },

    // --- DISABLED: Call events are now handled in HomePage to avoid conflicts ---
    subscribeToCallEvents: () => {
        // Call events are handled directly in HomePage.jsx
        // This prevents duplicate listeners and conflicts
        console.log("Call events handled in HomePage (useChatStore subscription disabled)");
        return;
        
        /* COMMENTED OUT TO PREVENT CONFLICTS
        const { socket } = useAuthStore.getState();
        if (!socket) return;
        console.log("Subscribing to private call events");

        // Define handlers referencing `get()` to access current store state/actions
        const onIncomingCall = (data) => get().handleIncomingCall(data);
        const onCallAccepted = (data) => get().handleCallAccepted(data);
        const onCallRejected = (data) => get().handleCallRejected(data);
        const onCallEnded = (data) => get().handleCallEnded(data);

        // Remove previous listeners first to avoid duplicates
        socket.off("private:incoming-call", onIncomingCall);
        socket.off("private:call-accepted", onCallAccepted);
        socket.off("private:call-rejected", onCallRejected);
        socket.off("private:call-ended", onCallEnded);

        // Add new listeners
        socket.on("private:incoming-call", onIncomingCall);
        socket.on("private:call-accepted", onCallAccepted);
        socket.on("private:call-rejected", onCallRejected);
        socket.on("private:call-ended", onCallEnded);
        */
    },

    unsubscribeFromCallEvents: () => {
        const { socket } = useAuthStore.getState();
        if (!socket) return;
        console.log("Unsubscribing from private call events");

        // Remove all listeners for these events
        socket.off("private:incoming-call");
        socket.off("private:call-accepted");
        socket.off("private:call-rejected");
        socket.off("private:call-ended");
    },

}));

// Auto-Subscription logic
// Using a flag to prevent multiple subscriptions if state updates rapidly
let subscribed = false;
useAuthStore.subscribe((state, prevState) => {
    const chatStore = useChatStore.getState();
    // Subscribe when socket becomes available and wasn't before
    if (state.socket && !prevState.socket && !subscribed) {
        console.log("AuthStore subscription: Socket connected, subscribing call events.");
        chatStore.subscribeToCallEvents();
        chatStore.subscribeToMessages(); // Also subscribe to messages here
        chatStore.subscribeToReactions(); // Subscribe to reactions
        subscribed = true;
    }
    // Unsubscribe when socket becomes unavailable and was available before
    else if (!state.socket && prevState.socket && subscribed) {
        console.log("AuthStore subscription: Socket disconnected, unsubscribing call events.");
        chatStore.unsubscribeFromCallEvents();
        chatStore.unsubscribeFromMessages(); // Also unsubscribe from messages
        chatStore.resetCallState(); // Reset call state on logout/disconnect
        subscribed = false;
    }
});