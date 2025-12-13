import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { cacheMessagesDB, getCachedMessagesDB } from "../utils/cache";
import { useFriendStore } from "./useFriendStore";

export const useChatStore = create((set, get) => ({
    // --- Existing Chat State ---
    messages: [],
    selectedUser: null,
    isMessagesLoading: false,
    unreadCounts: {},
    socketConnected: false,

    // --- Call State ---
    callState: "idle",
    callPartner: null,
    callType: null,
    incomingCallData: null,
    isMuted: false,
    isCameraOff: false,

    // --- Chat Actions ---
    getMessages: async (userId) => {
        const { selectedUser } = get();
        
        const selectedUserId = selectedUser?.id?.toString();
        const targetUserId = userId?.toString();
        
        if (selectedUserId !== targetUserId) {
            console.log('⚠️ User changed during fetch, aborting');
            return;
        }
        
        const chatId = `${userId}`;
        const cachedMessages = await getCachedMessagesDB(chatId);
        
        if (cachedMessages && cachedMessages.length > 0) {
            console.log(`⚡ INSTANT: Loaded ${cachedMessages.length} messages from cache`);
            
            const normalizedCachedMessages = cachedMessages.map(msg => ({
                ...msg,
                reactions: Array.isArray(msg.reactions) ? msg.reactions : []
            }));
            
            set({ messages: normalizedCachedMessages, isMessagesLoading: false });
            
            get().resetUnread(userId);
            get().markMessagesAsRead(userId);
            
            axiosInstance.get(`/messages/${userId}`)
                .then(res => {
                    const currentUser = get().selectedUser;
                    if (currentUser?.id?.toString() === targetUserId) {
                        console.log(`🔄 Background: Updated with ${res.data.length} fresh messages`);
                        set({ messages: res.data });
                        cacheMessagesDB(chatId, res.data);
                    }
                })
                .catch(err => console.error('Background fetch failed:', err));
            
            return;
        }
        
        set({ messages: [], isMessagesLoading: true });
        
        try {
            console.log(`📥 Fetching messages for user: ${userId}`);
            
            const res = await axiosInstance.get(`/messages/${userId}`);
            
            const currentUser = get().selectedUser;
            const currentUserId = currentUser?.id?.toString();
            
            if (currentUserId !== targetUserId) {
                console.log('⚠️ User changed during fetch, discarding messages');
                return;
            }
            
            console.log(`✅ Loaded ${res.data.length} messages`);
            
            const normalizedMessages = res.data.map(msg => ({
                ...msg,
                reactions: Array.isArray(msg.reactions) ? msg.reactions : []
            }));
            
            set({ messages: normalizedMessages, isMessagesLoading: false });
            
            cacheMessagesDB(chatId, res.data);
            
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
        
        if (!navigator.onLine) {
            toast.error("You are offline");
            return;
        }
        
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
        
        const updatedMessages = [...messages, optimisticMessage];
        set({ messages: updatedMessages });
        
        const chatId = `${selectedUser.id}`;
        cacheMessagesDB(chatId, updatedMessages);
        
        useFriendStore.getState().updateFriendLastMessage(selectedUser.id, optimisticMessage);
        
        if (socket && socket.connected) {
            console.log('📤 Sending via SOCKET for realtime delivery');
            socket.emit("sendMessage", {
                receiverId: selectedUser.id,
                text: messageData.text || null,
                image: messageData.image || null,
                voice: messageData.voice || null,
                voiceDuration: messageData.voiceDuration || null,
                replyTo: messageData.replyTo || null,
                tempId: tempId
            });
        }
        
        axiosInstance.post(`/messages/send/${selectedUser.id}`, messageData)
            .then(res => {
                console.log('✅ Message sent successfully via API:', res.data);
                const currentUser = get().selectedUser;
                if (currentUser?.id === selectedUser.id && res.data?.id) {
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
                set(state => ({
                    messages: state.messages.map(m => 
                        m.tempId === tempId ? { ...m, status: 'failed' } : m
                    )
                }));
                toast.error("Failed to send message");
            });
    },

    subscribeToMessages: () => {
        const { socket } = useAuthStore.getState();
        if (!socket) {
            console.warn('⚠️ Socket not available, skipping subscription');
            set({ socketConnected: false });
            return;
        }
        
        console.log('🔄 SUBSCRIBING TO MESSAGES:');
        console.log(`   Socket connected: ${socket.connected}`);
        console.log(`   Socket ID: ${socket.id}`);
        
        socket.removeAllListeners("newMessage");
        socket.removeAllListeners("messageDelivered");
        socket.removeAllListeners("messagesDelivered");
        socket.removeAllListeners("messagesRead");
        socket.removeAllListeners("connect");
        socket.removeAllListeners("disconnect");
        
        console.log('🔄 Chat Store: Cleaned up old listeners, attaching fresh ones');
        
        set({ socketConnected: socket.connected });
        
        socket.on('connect', () => {
            console.log('📡 Chat Store: Socket connected');
            set({ socketConnected: true });
        });
        
        socket.on('disconnect', () => {
            console.log('📡 Chat Store: Socket disconnected');
            set({ socketConnected: false });
        });

        const messageHandler = (newMessage) => {
            console.log(`🔥 SOCKET EVENT: newMessage received!`, newMessage);
            
            const { selectedUser, messages } = get();
            const { authUser } = useAuthStore.getState();

            if (!newMessage || !newMessage.id) {
                console.warn("⚠️ Received invalid message object:", newMessage);
                return;
            }

            const selectedUserId = selectedUser?.id?.toString();
            const authUserId = authUser?.id?.toString();
            const msgSenderId = newMessage.senderId?.id?.toString() || newMessage.senderId?.toString();
            const msgReceiverId = newMessage.receiverId?.id?.toString() || newMessage.receiverId?.toString();

            console.log(`📨 REALTIME MESSAGE ANALYSIS:`);
            console.log(`   Message ID: ${newMessage.id}`);
            console.log(`   From: ${msgSenderId} → To: ${msgReceiverId}`);
            console.log(`   Text: ${newMessage.text?.substring(0, 50)}...`);
            console.log(`   Current chat: ${selectedUserId}`);
            console.log(`   Auth user: ${authUserId}`);
            
            const isForCurrentChat = selectedUser && (
                (msgSenderId === selectedUserId && msgReceiverId === authUserId) ||
                (msgSenderId === authUserId && msgReceiverId === selectedUserId)
            );

            if (isForCurrentChat) {
                let currentMessages = get().messages;
                const isDuplicate = currentMessages.some(m => m.id === newMessage.id);
                
                if (isDuplicate) {
                    console.log(`⚠️ Duplicate message detected, skipping: ${newMessage.id}`);
                    return;
                }
                
                if (msgSenderId === authUserId) {
                    currentMessages = get().messages;
                    const optimisticIndex = currentMessages.findIndex(m => 
                        (m.tempId && m.status === 'sending') || 
                        (m.status === 'sending' && m.senderId === authUserId && 
                         Math.abs(new Date(m.createdAt) - new Date(newMessage.createdAt)) < 5000)
                    );
                    
                    if (optimisticIndex !== -1) {
                        console.log(`✅ Replacing optimistic message with real one`);
                        const updatedMessages = currentMessages.map((m, idx) => 
                            idx === optimisticIndex ? { ...newMessage, status: 'sent' } : m
                        );
                        set({ messages: updatedMessages });
                        
                        const chatId = `${selectedUserId}`;
                        cacheMessagesDB(chatId, updatedMessages);
                        return;
                    }
                }
                
                console.log(`✅ Adding new message to current chat`);
                currentMessages = get().messages;
                const updatedMessages = [...currentMessages, newMessage];
                set({ messages: updatedMessages });
                
                const chatId = `${selectedUserId}`;
                cacheMessagesDB(chatId, updatedMessages);
                
                useFriendStore.getState().updateFriendLastMessage(msgSenderId, newMessage);
                
                if (msgReceiverId === authUserId) {
                    get().markMessagesAsRead(selectedUser.id);
                }
            } else if (msgSenderId !== authUserId) {
                console.log(`📬 Message for different chat, incrementing unread`);
                get().incrementUnread(msgSenderId);
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

        socket.on("newMessage", messageHandler);
        socket.on("messageDelivered", messageDeliveredHandler);
        socket.on("messagesDelivered", messagesDeliveredHandler);
        socket.on("messagesRead", messagesReadHandler);
        
        console.log('✅ SOCKET LISTENERS ATTACHED:');
        console.log('   - newMessage handler attached');
        console.log('   - messageDelivered handler attached');
        console.log('   - messagesDelivered handler attached');
        console.log('   - messagesRead handler attached');
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
        set({ selectedUser: user, messages: [], isMessagesLoading: false });
        
        if (user) {
            localStorage.setItem('selectedChatUser', JSON.stringify({
                id: user.id,
                username: user.username,
                nickname: user.nickname,
                fullName: user.fullName,
                profilePic: user.profilePic,
                isOnline: user.isOnline
            }));
            
            const currentUrl = new URL(window.location);
            currentUrl.searchParams.set('chat', user.id);
            window.history.replaceState({}, '', currentUrl);
            
            const userId = user.id;
            setTimeout(() => {
                get().getMessages(userId);
            }, 0);
        } else {
            localStorage.removeItem('selectedChatUser');
            const currentUrl = new URL(window.location);
            currentUrl.searchParams.delete('chat');
            window.history.replaceState({}, '', currentUrl);
        }
    },

    restoreSelectedUser: async () => {
        try {
            console.log('🔄 Starting enhanced chat restoration...');
            
            // Check URL parameter first (highest priority)
            const urlParams = new URLSearchParams(window.location.search);
            const chatUserId = urlParams.get('chat');
            
            // Check localStorage as fallback
            const savedUser = localStorage.getItem('selectedChatUser');
            
            console.log('📊 Restoration data:', { 
                urlChatId: chatUserId, 
                hasSavedUser: !!savedUser 
            });
            
            if (!chatUserId && !savedUser) {
                console.log('ℹ️ No restoration data found');
                return false;
            }
            
            // Get friends with retry mechanism
            let friends = useFriendStore.getState().friends;
            console.log('👥 Available friends:', friends.length);
            
            // If no friends, try to fetch them
            if (friends.length === 0) {
                console.log('📥 No friends loaded, attempting to fetch...');
                try {
                    await useFriendStore.getState().fetchFriendData();
                    friends = useFriendStore.getState().friends;
                    console.log('✅ Friends fetched, now have:', friends.length);
                } catch (error) {
                    console.error('❌ Failed to fetch friends for restoration:', error);
                    return false;
                }
            }
            
            let targetUserId = chatUserId;
            let targetUser = null;
            
            // Try URL parameter first
            if (chatUserId) {
                console.log('🔗 Looking for user from URL:', chatUserId);
                targetUser = friends.find(friend => friend.id === chatUserId);
                if (targetUser) {
                    console.log('✅ Found user from URL parameter');
                } else {
                    console.log('⚠️ User from URL not found in friends list');
                }
            }
            
            // Fallback to localStorage
            if (!targetUser && savedUser) {
                try {
                    console.log('💾 Trying localStorage fallback');
                    const parsedUser = JSON.parse(savedUser);
                    targetUserId = parsedUser.id;
                    
                    // Try to find in friends list first
                    targetUser = friends.find(friend => friend.id === parsedUser.id);
                    
                    if (targetUser) {
                        console.log('✅ Found user from localStorage in friends list');
                    } else if (friends.length > 0) {
                        // If we have friends but saved user not found, clear stale data
                        console.log('🧹 Saved user not in friends list, clearing stale data');
                        localStorage.removeItem('selectedChatUser');
                        return false;
                    } else {
                        // Use saved user data as fallback (might be outdated but better than nothing)
                        console.log('⚠️ Using saved user data as fallback');
                        targetUser = parsedUser;
                    }
                } catch (e) {
                    console.error('❌ Failed to parse saved user:', e);
                    localStorage.removeItem('selectedChatUser');
                    return false;
                }
            }
            
            if (targetUser && targetUserId) {
                console.log(`🔄 Restoring chat with: ${targetUser.nickname || targetUser.username} (ID: ${targetUserId})`);
                
                // Update URL if it doesn't match
                if (!chatUserId || chatUserId !== targetUserId) {
                    const currentUrl = new URL(window.location);
                    currentUrl.searchParams.set('chat', targetUserId);
                    window.history.replaceState({}, '', currentUrl);
                    console.log('🔗 Updated URL with chat parameter');
                }
                
                get().setSelectedUser(targetUser);
                return true;
            } else {
                console.log('❌ No valid user found for restoration');
                // Clean up URL if no valid restoration
                if (chatUserId) {
                    const currentUrl = new URL(window.location);
                    currentUrl.searchParams.delete('chat');
                    window.history.replaceState({}, '', currentUrl);
                    console.log('🧹 Cleaned up invalid chat parameter from URL');
                }
            }
        } catch (error) {
            console.error('❌ Failed to restore selected user:', error);
        }
        return false;
    },

    incrementUnread: (userId) => set((state) => ({ 
        unreadCounts: {...state.unreadCounts, [userId]: (state.unreadCounts[userId] || 0) + 1} 
    })),
    
    resetUnread: (userId) => set((state) => { 
        const updated = {...state.unreadCounts}; 
        delete updated[userId]; 
        return { unreadCounts: updated }; 
    }),

    // --- Message Reactions ---
    addReaction: async (messageId, emoji) => {
        try {
            const { socket } = useAuthStore.getState();
            
            const { messages, selectedUser } = get();
            const { authUser } = useAuthStore.getState();
            
            const optimisticMessages = messages.map(msg => {
                if (msg.id === messageId) {
                    const currentReactions = Array.isArray(msg.reactions) ? msg.reactions : [];
                    const filteredReactions = currentReactions.filter(r => {
                        const reactionUserId = r.userId?.id || r.userId;
                        return reactionUserId !== authUser.id;
                    });
                    const newReaction = {
                        userId: authUser.id,
                        emoji: emoji,
                        createdAt: new Date().toISOString()
                    };
                    return { ...msg, reactions: [...filteredReactions, newReaction] };
                }
                return msg;
            });
            
            set({ messages: optimisticMessages });
            
            if (socket && selectedUser) {
                socket.emit("messageReaction", {
                    messageId,
                    emoji,
                    receiverId: selectedUser.id
                });
                console.log('📤 Emitted reaction via socket for realtime delivery');
            }
            
            axiosInstance.post(`/messages/reaction/${messageId}`, { emoji })
                .then(res => {
                    console.log('✅ Reaction persisted to database');
                    const currentMessages = get().messages;
                    const serverUpdatedMessages = currentMessages.map(msg => 
                        msg.id === messageId ? { ...msg, reactions: res.data.reactions } : msg
                    );
                    set({ messages: serverUpdatedMessages });
                    
                    if (selectedUser) {
                        const chatId = `${selectedUser.id}`;
                        cacheMessagesDB(chatId, serverUpdatedMessages);
                    }
                })
                .catch(error => {
                    console.error('❌ Failed to persist reaction:', error);
                    const revertedMessages = messages.map(msg => 
                        msg.id === messageId ? { ...msg, reactions: msg.reactions } : msg
                    );
                    set({ messages: revertedMessages });
                    toast.error("Failed to add reaction");
                });
                
        } catch (error) {
            console.error('❌ Add reaction error:', error);
            toast.error("Failed to add reaction");
        }
    },

    removeReaction: async (messageId) => {
        try {
            const { socket } = useAuthStore.getState();
            
            const { messages, selectedUser } = get();
            const { authUser } = useAuthStore.getState();
            
            const optimisticMessages = messages.map(msg => {
                if (msg.id === messageId) {
                    const currentReactions = Array.isArray(msg.reactions) ? msg.reactions : [];
                    const filteredReactions = currentReactions.filter(r => {
                        const reactionUserId = r.userId?.id || r.userId;
                        return reactionUserId !== authUser.id;
                    });
                    return { ...msg, reactions: filteredReactions };
                }
                return msg;
            });
            
            set({ messages: optimisticMessages });
            
            if (socket && selectedUser) {
                socket.emit("messageReactionRemove", {
                    messageId,
                    receiverId: selectedUser.id
                });
                console.log('📤 Emitted reaction removal via socket for realtime delivery');
            }
            
            axiosInstance.delete(`/messages/reaction/${messageId}`)
                .then(res => {
                    console.log('✅ Reaction removal persisted to database');
                    const currentMessages = get().messages;
                    const serverUpdatedMessages = currentMessages.map(msg => 
                        msg.id === messageId ? { ...msg, reactions: res.data.reactions } : msg
                    );
                    set({ messages: serverUpdatedMessages });
                    
                    if (selectedUser) {
                        const chatId = `${selectedUser.id}`;
                        cacheMessagesDB(chatId, serverUpdatedMessages);
                    }
                })
                .catch(error => {
                    console.error('❌ Failed to persist reaction removal:', error);
                    const revertedMessages = messages.map(msg => 
                        msg.id === messageId ? { ...msg, reactions: msg.reactions } : msg
                    );
                    set({ messages: revertedMessages });
                    toast.error("Failed to remove reaction");
                });
                
        } catch (error) {
            console.error('❌ Remove reaction error:', error);
            toast.error("Failed to remove reaction");
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
            console.warn('⚠️ Socket not available or not connected, skipping reaction subscription');
            return;
        }

        socket.removeAllListeners("messageReaction");
        socket.removeAllListeners("messageDeleted");
        
        console.log('🔄 Chat Store: Cleaned up old reaction listeners');

        const reactionHandler = ({ messageId, reactions }) => {
            console.log(`😊 REALTIME: Reaction update received for message ${messageId}:`, reactions?.length || 0, 'reactions');
            const { messages, selectedUser } = get();
            const updatedMessages = messages.map(msg => 
                msg.id === messageId ? { ...msg, reactions } : msg
            );
            set({ messages: updatedMessages });
            
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
            
            if (selectedUser) {
                const chatId = `${selectedUser.id}`;
                cacheMessagesDB(chatId, updatedMessages);
            }
        };
        
        socket.on("messageReaction", reactionHandler);
        socket.on("messageDeleted", deleteHandler);
        
        console.log('✅ Chat Store: Fresh reaction listeners attached');
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
            callState: "connecting",
            callPartner: incomingCallData.callerInfo,
            callType: incomingCallData.callType,
            isCameraOff: incomingCallData.callType === 'audio',
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
            socket.emit("private:end-call", { targetUserId: callPartner.id });
        }
        get().resetCallState();
    },

    endCall: () => {
        const { callState, callPartner } = get();
        const { socket } = useAuthStore.getState();
        if (!socket || callState === 'idle') return;

        console.log(`Ending call with ${callPartner?.nickname || callPartner?.username || 'partner'}`);
        if (callPartner && (callState === 'connected' || callState === 'connecting' || callState === 'outgoing')) {
            socket.emit("private:end-call", { targetUserId: callPartner.id });
        }
        get().resetCallState();
    },

    handleIncomingCall: (data) => {
        const { callState } = get();
        const { socket } = useAuthStore.getState();

        if (callState !== "idle") {
            console.log(`Received incoming call from ${data.callerInfo?.nickname} but already busy (state: ${callState}). Rejecting.`);
            if(socket) {
                socket.emit("private:call-rejected", { callerId: data.callerId, reason: 'busy' });
            }
            return;
        }
        console.log(`Incoming ${data.callType} call from ${data.callerInfo?.nickname}`);
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
             console.warn("Received call-accepted signal but wasn't in outgoing state.");
             return;
        }
        console.log(`Call accepted by ${data.acceptorInfo?.nickname}`);
        set({ callState: "connecting" });
    },

    handleCallRejected: (data) => {
        const { callState, callPartner } = get();
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
        console.log("Call events handled in HomePage (useChatStore subscription disabled)");
        return;
    },

    unsubscribeFromCallEvents: () => {
        const { socket } = useAuthStore.getState();
        if (!socket) return;
        console.log("Unsubscribing from private call events");

        socket.off("private:incoming-call");
        socket.off("private:call-accepted");
        socket.off("private:call-rejected");
        socket.off("private:call-ended");
    },

}));