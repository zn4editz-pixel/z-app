import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios"; // Keep axiosInstance for getMessages/sendMessage
import { useAuthStore } from "./useAuthStore"; // Auth store needed for socket & user info
import { cacheMessagesDB, getCachedMessagesDB } from "../utils/cache";
import { useFriendStore } from "./useFriendStore"; // Import friend store for real-time updates

export const useChatStore = create((set, get) => ({
    // --- Existing Chat State ---
    messages: [],
    selectedUser: null, // User object for the currently selected chat partner
    isMessagesLoading: false,
    unreadCounts: {},
    socketConnected: false, // Track socket connection status

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
        const { selectedUser } = get();
        
        // CRITICAL FIX: Verify we're still on the same user
        const selectedUserId = selectedUser?.id?.toString();
        const targetUserId = userId?.toString();
        
        if (selectedUserId !== targetUserId) {
            console.log('⚠️ User changed during fetch, aborting');
            return;
        }
        
        // ✅ INSTANT: Try to load from cache first for instant display
        const chatId = `${userId}`;
        const cachedMessages = await getCachedMessagesDB(chatId);
        
        if (cachedMessages && cachedMessages.length > 0) {
            console.log(`⚡ INSTANT: Loaded ${cachedMessages.length} messages from cache`);
            
            // Ensure cached messages have proper reactions arrays
            const normalizedCachedMessages = cachedMessages.map(msg => ({
                ...msg,
                reactions: Array.isArray(msg.reactions) ? msg.reactions : []
            }));
            
            set({ messages: normalizedCachedMessages, isMessagesLoading: false });
            
            // Mark as read immediately
            get().resetUnread(userId);
            get().markMessagesAsRead(userId);
            
            // Fetch fresh data in background (stale-while-revalidate)
            axiosInstance.get(`/messages/${userId}`)
                .then(res => {
                    const currentUser = get().selectedUser;
                    if (currentUser?.id?.toString() === targetUserId) {
                        console.log(`🔄 Background: Updated with ${res.data.length} fresh messages`);
                        set({ messages: res.data });
                        // Update cache with fresh data
                        cacheMessagesDB(chatId, res.data);
                    }
                })
                .catch(err => console.error('Background fetch failed:', err));
            
            return; // Exit early - cache hit!
        }
        
        // No cache - show loading and fetch
        set({ messages: [], isMessagesLoading: true });
        
        try {
            console.log(`📥 Fetching messages for user: ${userId}`);
            
            const res = await axiosInstance.get(`/messages/${userId}`);
            
            // CRITICAL: Double-check user hasn't changed during fetch
            const currentUser = get().selectedUser;
            const currentUserId = currentUser?.id?.toString();
            
            if (currentUserId !== targetUserId) {
                console.log('⚠️ User changed during fetch, discarding messages');
                return;
            }
            
            console.log(`✅ Loaded ${res.data.length} messages`);
            
            // Ensure all messages have proper reactions arrays
            const normalizedMessages = res.data.map(msg => ({
                ...msg,
                reactions: Array.isArray(msg.reactions) ? msg.reactions : []
            }));
            
            set({ messages: normalizedMessages, isMessagesLoading: false });
            
            // Cache the messages for next time
            cacheMessagesDB(chatId, res.data);
            
            // Mark as read
            get().resetUnread(userId);
            get().markMessagesAsRead(userId);
        } catch (error) {
            console.error('❌ Failed to fetch messages:', error);
            toast.error(error.response?.data?.message || "Failed to load messages");
            set({ messages: [], isMessagesLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        const { authUser, socket } = useAuthStore.getState();
        
        if (!selectedUser) return;
        
        // Check if online
        if (!navigator.onLine) {
            toast.error("You are offline");
            return;
        }
        
        // Create optimistic message (shows INSTANTLY)
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const optimisticMessage = {
            id: tempId,
            senderId: authUser.id,
            receiverId: selectedUser.id,
            text: messageData.text || '',
            image: messageData.image || null,
            voice: messageData.voice || null,
            voiceDuration: messageData.voiceDuration || null,
            replyTo: messageData.replyTo || null,
            status: 'sending',
            createdAt: new Date().toISOString(),
            reactions: [],
            tempId: tempId
        };
        
        // ✅ INSTANT: Add optimistic message IMMEDIATELY (no waiting)
        const updatedMessages = [...messages, optimisticMessage];
        set({ messages: updatedMessages });
        
        // ✅ INSTANT: Update cache immediately
        const chatId = `${selectedUser.id}`;
        cacheMessagesDB(chatId, updatedMessages);
        
        // ✅ Update friend list with this message (for sidebar sorting)
        useFriendStore.getState().updateFriendLastMessage(selectedUser.id, optimisticMessage);
        
        // ✅ INSTANT: Send in background (fire and forget - NO AWAIT)
        // 🔧 TEMPORARY FIX: Force API usage for reliable message sending
        console.log('📤 Sending via API (FORCED - ensuring reliability)');
        
        // Always use API for now to ensure messages work
        {
            axiosInstance.post(`/messages/send/${selectedUser.id}`, messageData)
                .then(res => {
                    console.log('✅ Message sent successfully via API:', res.data);
                    const currentUser = get().selectedUser;
                    if (currentUser?.id === selectedUser.id && res.data?.id) {
                        // Ensure the response message has proper reactions array
                        const normalizedMessage = {
                            ...res.data,
                            reactions: Array.isArray(res.data.reactions) ? res.data.reactions : []
                        };
                        
                        set(state => ({
                            messages: state.messages.map(m => 
                                m.tempId === tempId ? normalizedMessage : m
                            )
                        }));
                    }
                })
                .catch(error => {
                    console.error('❌ Send failed:', error);
                    // Mark message as failed
                    set(state => ({
                        messages: state.messages.map(m => 
                            m.tempId === tempId ? { ...m, status: 'failed' } : m
                        )
                    }));
                    toast.error("Failed to send message");
                });
        }
    },

    subscribeToMessages: () => {
        const { socket } = useAuthStore.getState(); // Get socket directly
        if (!socket) {
            set({ socketConnected: false });
            return;
        }
        
        // ✅ CRITICAL FIX: Remove ALL existing listeners FIRST to prevent duplicates
        socket.removeAllListeners("newMessage");
        socket.removeAllListeners("messageDelivered");
        socket.removeAllListeners("messagesDelivered");
        socket.removeAllListeners("messagesRead");
        socket.removeAllListeners("connect");
        socket.removeAllListeners("disconnect");
        
        console.log('🔄 Chat Store: Cleaned up old listeners, attaching fresh ones');
        
        // Update connection status
        set({ socketConnected: socket.connected });
        
        // Monitor connection status changes
        socket.on('connect', () => {
            console.log('📡 Chat Store: Socket connected');
            set({ socketConnected: true });
        });
        
        socket.on('disconnect', () => {
            console.log('📡 Chat Store: Socket disconnected');
            set({ socketConnected: false });
        });

        // Define handler separately
        const messageHandler = (newMessage) => {
            const { selectedUser, messages } = get();
            const { authUser } = useAuthStore.getState();

            if (!newMessage || !newMessage.id) {
                console.warn("⚠️ Received invalid message object:", newMessage);
                return;
            }

            console.log(`📨 New message received:`, newMessage.id);

            // Convert to strings for comparison
            const selectedUserId = selectedUser?.id?.toString();
            const authUserId = authUser?.id?.toString();
            const msgSenderId = newMessage.senderId?.id?.toString() || newMessage.senderId?.toString();
            const msgReceiverId = newMessage.receiverId?.id?.toString() || newMessage.receiverId?.toString();
            
            const isForCurrentChat = selectedUser && (
                (msgSenderId === selectedUserId && msgReceiverId === authUserId) ||
                (msgSenderId === authUserId && msgReceiverId === selectedUserId)
            );

            if (isForCurrentChat) {
                // ✅ CRITICAL: Check for duplicates FIRST (before any state updates)
                let currentMessages = get().messages; // Get fresh messages state
                const isDuplicate = currentMessages.some(m => m.id === newMessage.id);
                
                if (isDuplicate) {
                    console.log(`⚠️ Duplicate message detected, skipping: ${newMessage.id}`);
                    return; // Exit immediately - don't process duplicates
                }
                
                // ✅ INSTANT: Check if this is replacing an optimistic message (my own message)
                if (msgSenderId === authUserId) {
                    // Find matching optimistic message by tempId or recent sending status
                    currentMessages = get().messages; // Refresh messages state
                    const optimisticIndex = currentMessages.findIndex(m => 
                        (m.tempId && m.status === 'sending') || 
                        (m.status === 'sending' && m.senderId === authUserId && 
                         Math.abs(new Date(m.createdAt) - new Date(newMessage.createdAt)) < 5000) // Within 5 seconds
                    );
                    
                    if (optimisticIndex !== -1) {
                        // Replace optimistic message with real one INSTANTLY
                        console.log(`✅ Replacing optimistic message with real one`);
                        const updatedMessages = currentMessages.map((m, idx) => 
                            idx === optimisticIndex ? { ...newMessage, status: 'sent' } : m
                        );
                        set({ messages: updatedMessages });
                        
                        // ✅ Update cache with replaced message
                        const chatId = `${selectedUserId}`;
                        cacheMessagesDB(chatId, updatedMessages);
                        return; // Exit early - message replaced
                    }
                }
                
                // Add new message from other person
                console.log(`✅ Adding new message to current chat`);
                currentMessages = get().messages; // Refresh messages state
                const updatedMessages = [...currentMessages, newMessage];
                set({ messages: updatedMessages });
                
                // ✅ Update cache with new message
                const chatId = `${selectedUserId}`;
                cacheMessagesDB(chatId, updatedMessages);
                
                // ✅ Update friend list with this received message
                useFriendStore.getState().updateFriendLastMessage(msgSenderId, newMessage);
                
                // Mark as read if I'm the receiver
                if (msgReceiverId === authUserId) {
                    get().markMessagesAsRead(selectedUser.id);
                }
            } else if (msgSenderId !== authUserId) {
                console.log(`📬 Message for different chat, incrementing unread`);
                // Increment unread count for other chats
                get().incrementUnread(msgSenderId);
                
                // ✅ Update friend list with this received message (even if not in current chat)
                useFriendStore.getState().updateFriendLastMessage(msgSenderId, newMessage);
            }
        };

        const messageDeliveredHandler = ({ messageId, deliveredAt }) => {
            const { messages } = get();
            const updatedMessages = messages.map(msg => 
                msg.id === messageId ? { ...msg, status: 'delivered', deliveredAt } : msg
            );
            set({ messages: updatedMessages });
        };

        const messagesDeliveredHandler = ({ messageIds, deliveredAt }) => {
            const { messages } = get();
            const updatedMessages = messages.map(msg => 
                messageIds.includes(msg.id) ? { ...msg, status: 'delivered', deliveredAt } : msg
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
                const receiverIdStr = typeof msg.receiverId === 'object' ? msg.receiverId.id || msg.receiverId.toString() : msg.receiverId;
                const readByStr = typeof readBy === 'object' ? readBy.id || readBy.toString() : readBy;
                const shouldUpdate = receiverIdStr === readByStr && msg.status !== 'read';
                
                if (shouldUpdate) {
                    console.log(`📘 Updating message ${msg.id} to read status`);
                    console.log(`📘 Message receiverId: ${receiverIdStr}, readBy: ${readByStr}`);
                }
                return shouldUpdate ? { ...msg, status: 'read', readAt: new Date() } : msg;
            });
            
            const readCount = updatedMessages.filter(m => m.status === 'read').length;
            console.log(`📘 Total messages with read status: ${readCount}`);
            
            set({ messages: updatedMessages });
        };

        // ✅ Attach fresh listeners (already cleaned up above)
        socket.on("newMessage", messageHandler);
        socket.on("messageDelivered", messageDeliveredHandler);
        socket.on("messagesDelivered", messagesDeliveredHandler);
        socket.on("messagesRead", messagesReadHandler);
        
        console.log('✅ Chat Store: Fresh message listeners attached');
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
        
        // ✅ Remove ALL message-related listeners
        socket.removeAllListeners("newMessage");
        socket.removeAllListeners("messageDelivered");
        socket.removeAllListeners("messagesDelivered");
        socket.removeAllListeners("messagesRead");
        socket.removeAllListeners("connect");
        socket.removeAllListeners("disconnect");
        
        console.log('🧹 Chat Store: All message listeners removed');
        set({ socketConnected: false });
    },

    setSelectedUser: (user) => {
        console.log(`👤 Selecting user: ${user?.nickname || user?.username || 'none'}`);
        // CRITICAL: Clear messages IMMEDIATELY to prevent flash of previous chat
        set({ selectedUser: user, messages: [], isMessagesLoading: false });
        
        if (user) {
            // Save selected user to localStorage for page refresh persistence
            localStorage.setItem('selectedChatUser', JSON.stringify({
                id: user.id,
                username: user.username,
                nickname: user.nickname,
                fullName: user.fullName,
                profilePic: user.profilePic,
                isOnline: user.isOnline
            }));
            
            // Update URL to reflect current chat (without page reload)
            const currentUrl = new URL(window.location);
            currentUrl.searchParams.set('chat', user.id);
            window.history.replaceState({}, '', currentUrl);
            
            // Small delay to ensure state is updated
            const userId = user.id;
            setTimeout(() => {
                get().getMessages(userId);
            }, 0);
        } else {
            // Clear localStorage and URL when no user selected
            localStorage.removeItem('selectedChatUser');
            const currentUrl = new URL(window.location);
            currentUrl.searchParams.delete('chat');
            window.history.replaceState({}, '', currentUrl);
        }
    },

    // NEW: Restore selected user from localStorage or URL
    restoreSelectedUser: async () => {
        try {
            // Check URL first for chat parameter
            const urlParams = new URLSearchParams(window.location.search);
            const chatUserId = urlParams.get('chat');
            
            // Check localStorage for saved user
            const savedUser = localStorage.getItem('selectedChatUser');
            
            if (chatUserId || savedUser) {
                const { friends } = useFriendStore.getState();
                let targetUserId = chatUserId;
                let targetUser = null;
                
                // If we have URL parameter, use that
                if (chatUserId) {
                    targetUser = friends.find(friend => friend.id === chatUserId);
                }
                
                // If no URL param or user not found, try localStorage
                if (!targetUser && savedUser) {
                    try {
                        const parsedUser = JSON.parse(savedUser);
                        targetUserId = parsedUser.id;
                        targetUser = friends.find(friend => friend.id === parsedUser.id) || parsedUser;
                    } catch (e) {
                        console.error('Failed to parse saved user:', e);
                        localStorage.removeItem('selectedChatUser');
                    }
                }
                
                // If we found a user, restore the chat
                if (targetUser && targetUserId) {
                    console.log(`🔄 Restoring chat with: ${targetUser.nickname || targetUser.username}`);
                    get().setSelectedUser(targetUser);
                    return true;
                }
            }
        } catch (error) {
            console.error('Failed to restore selected user:', error);
        }
        return false;
    },

    incrementUnread: (userId) => set((state) => ({ unreadCounts: {...state.unreadCounts, [userId]: (state.unreadCounts[userId] || 0) + 1} })),
    resetUnread: (userId) => set((state) => { const updated = {...state.unreadCounts}; delete updated[userId]; return { unreadCounts: updated }; }),

    // --- Message Reactions ---
    addReaction: async (messageId, emoji) => {
        try {
            const res = await axiosInstance.post(`/messages/reaction/${messageId}`, { emoji });
            const { messages, selectedUser } = get();
            const updatedMessages = messages.map(msg => 
                msg.id === messageId ? { ...msg, reactions: res.data.reactions } : msg
            );
            set({ messages: updatedMessages });
            
            // Update cache
            if (selectedUser) {
                const chatId = `${selectedUser.id}`;
                cacheMessagesDB(chatId, updatedMessages);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add reaction");
        }
    },

    removeReaction: async (messageId) => {
        try {
            const res = await axiosInstance.delete(`/messages/reaction/${messageId}`);
            const { messages, selectedUser } = get();
            const updatedMessages = messages.map(msg => 
                msg.id === messageId ? { ...msg, reactions: res.data.reactions } : msg
            );
            set({ messages: updatedMessages });
            
            // Update cache
            if (selectedUser) {
                const chatId = `${selectedUser.id}`;
                cacheMessagesDB(chatId, updatedMessages);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to remove reaction");
        }
    },

    deleteMessage: async (messageId) => {
        try {
            await axiosInstance.delete(`/messages/message/${messageId}`);
            const { messages, selectedUser } = get();
            const updatedMessages = messages.map(msg => 
                msg.id === messageId ? { ...msg, isDeleted: true, deletedAt: new Date() } : msg
            );
            set({ messages: updatedMessages });
            
            // Update cache
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
        if (!socket) return;

        // ✅ CRITICAL FIX: Remove ALL existing listeners FIRST
        socket.removeAllListeners("messageReaction");
        socket.removeAllListeners("messageDeleted");
        
        console.log('🔄 Chat Store: Cleaned up old reaction listeners');

        const reactionHandler = ({ messageId, reactions }) => {
            const { messages, selectedUser } = get();
            const updatedMessages = messages.map(msg => 
                msg.id === messageId ? { ...msg, reactions } : msg
            );
            set({ messages: updatedMessages });
            
            // Update cache
            if (selectedUser) {
                const chatId = `${selectedUser.id}`;
                cacheMessagesDB(chatId, updatedMessages);
            }
        };

        const deleteHandler = ({ messageId, isDeleted, deletedAt }) => {
            const { messages, selectedUser } = get();
            const updatedMessages = messages.map(msg => 
                msg.id === messageId ? { ...msg, isDeleted, deletedAt } : msg
            );
            set({ messages: updatedMessages });
            
            // Update cache
            if (selectedUser) {
                const chatId = `${selectedUser.id}`;
                cacheMessagesDB(chatId, updatedMessages);
            }
        };
        
        socket.on("messageReaction", reactionHandler);
        socket.on("messageDeleted", deleteHandler);
        
        console.log('✅ Chat Store: Fresh reaction listeners attached');
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
        if (!socket || !authUser || !partner || !partner.id) {
             return toast.error("Cannot initiate call. Connection error.");
        }

        set({
            callState: "outgoing",
            callPartner: partner,
            callType: type,
            isCameraOff: type === 'audio',
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
            callState: "connecting", // Move to connecting
            callPartner: incomingCallData.callerInfo, // Caller is the partner
            callType: incomingCallData.callType,
            isCameraOff: incomingCallData.callType === 'audio',
            incomingCallData: null, // Clear incoming data
        });

        socket.emit("private:call-accepted", {
            callerId: incomingCallData.callerId,
            acceptorInfo: {
                id: authUser.id,
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
            socket.emit("private:end-call", { targetUserId: callPartner.id }); // Use end-call to notify
        }
        get().resetCallState(); // Reset state immediately
    },

    endCall: () => {
        const { callState, callPartner } = get();
        const { socket } = useAuthStore.getState();
        if (!socket || callState === 'idle') return;

        console.log(`Ending call with ${callPartner?.nickname || callPartner?.username || 'partner'}`);
        if (callPartner && (callState === 'connected' || callState === 'connecting' || callState === 'outgoing')) {
            socket.emit("private:end-call", { targetUserId: callPartner.id });
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
        if (callState === "outgoing" && callPartner?.id === data.rejectorId) {
            console.log(`Call rejected by ${callPartner.nickname}. Reason: ${data.reason}`);
            toast.error(`Call ${data.reason || 'declined'} by user.`);
            get().resetCallState();
        } else {
             console.warn("Received call-rejected signal but wasn't the caller or partner mismatch.");
        }
    },

    handleCallEnded: (data) => {
        const { callState, callPartner } = get();
        if (callState !== 'idle') {
            console.log(`Call ended by ${data?.userId === callPartner?.id ? callPartner.nickname : 'partner'}`);
            // NO TOAST - just reset state
            get().resetCallState();
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