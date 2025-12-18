import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { cacheFriends, getCachedFriends } from "../utils/cache.js";
import { getId, includesId, filterOutId } from "../utils/idHelper.js";
import { useAuthStore } from "./useAuthStore.js";

// Create the store
export const useFriendStore = create((set, get) => ({
    friends: [],
    pendingReceived: [],
    pendingSent: [],
    isLoading: false,

    // Fetch all friend data
    fetchFriendData: async () => {
        const authUser = useAuthStore.getState().authUser || JSON.parse(localStorage.getItem("authUser") || "{}");
        const userId = authUser.id;
        if (!userId) return;

        // Try cache first
        const cached = await getCachedFriends(userId);
        if (cached) {
            set({
                friends: cached.friends || [],
                pendingReceived: cached.received || [],
                pendingSent: cached.sent || [],
                isLoading: false
            });
        } else {
            set({ isLoading: true });
        }

        const lastFetch = sessionStorage.getItem('friendDataLastFetch');
        const now = Date.now();
        if (lastFetch && (now - parseInt(lastFetch)) < 30000 && cached) {
            return;
        }

        try {
            const [friendsRes, requestsRes] = await Promise.all([
                axiosInstance.get("/friends/all"),
                axiosInstance.get("/friends/requests"),
            ]);

            const freshData = {
                friends: friendsRes.data || [],
                received: requestsRes.data?.received || [],
                sent: requestsRes.data?.sent || []
            };
            await cacheFriends(userId, freshData);
            sessionStorage.setItem('friendDataLastFetch', now.toString());

            set((state) => {
                const newFriends = friendsRes.data || [];
                const newReceived = requestsRes.data?.received || [];
                const newSent = requestsRes.data?.sent || [];
                const apiReceivedIds = new Set(newReceived.map(r => getId(r)));
                const apiSentIds = new Set(newSent.map(r => getId(r)));
                const existingReceivedStillValid = state.pendingReceived.filter(r => apiReceivedIds.has(getId(r)));
                const existingSentStillValid = state.pendingSent.filter(r => apiSentIds.has(getId(r)));

                const mergedReceived = [...existingReceivedStillValid];
                newReceived.forEach(req => {
                    if (!includesId(mergedReceived, getId(req))) {
                        mergedReceived.push(req);
                    }
                });

                const mergedSent = [...existingSentStillValid];
                newSent.forEach(req => {
                    if (!includesId(mergedSent, getId(req))) {
                        mergedSent.push(req);
                    }
                });

                return {
                    friends: newFriends,
                    pendingReceived: mergedReceived,
                    pendingSent: mergedSent,
                };
            });
        } catch (error) {
            console.error("Error fetching friend data:", error);
            if (!cached) {
                set({
                    friends: [],
                    pendingReceived: [],
                    pendingSent: [],
                });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    getFriendshipStatus: (userId) => {
        const { friends, pendingSent, pendingReceived } = get();
        if (includesId(friends, userId)) return "FRIENDS";
        if (includesId(pendingSent, userId)) return "REQUEST_SENT";
        if (includesId(pendingReceived, userId)) return "REQUEST_RECEIVED";
        return "NOT_FRIENDS";
    },

    addPendingReceived: (newRequestData) => {
        set((state) => {
            if (!state.pendingReceived.some(r => r.id === newRequestData.id)) {
                toast.success(`New friend request from ${newRequestData.nickname || newRequestData.username}! 🤝`);
                return {
                    pendingReceived: [newRequestData, ...state.pendingReceived],
                };
            }
            return state;
        });
    },

    handleFriendRequestAccepted: (data) => {
        const { friendData } = data;
        set((state) => {
            const updatedSent = state.pendingSent.filter(r => getId(r) !== friendData.id);
            const updatedFriends = [...state.friends, friendData];
            toast.success(`${friendData.nickname || friendData.username} accepted your friend request! 🎉`);
            return {
                pendingSent: updatedSent,
                friends: updatedFriends
            };
        });
    },

    subscribeToFriendEvents: (socket) => {
        if (!socket) return;
        socket.off("friendRequestReceived");
        socket.off("friendRequestAccepted");

        socket.on("friendRequestReceived", (data) => {
            get().addPendingReceived(data);
        });
        socket.on("friendRequestAccepted", (data) => {
            get().handleFriendRequestAccepted(data);
        });
    },

    unsubscribeFromFriendEvents: (socket) => {
        if (!socket) return;
        socket.off("friendRequestReceived");
        socket.off("friendRequestAccepted");
    },

    sendRequest: async (receiverId) => {
        try {
            const { pendingSent, friends } = get();
            if (includesId(pendingSent, receiverId) || includesId(friends, receiverId)) {
                toast.error("Friend request already sent or you are already friends");
                return false;
            }

            set((state) => ({
                pendingSent: [...state.pendingSent, { id: receiverId, _id: receiverId }]
            }));

            await axiosInstance.post(`/friends/send/${receiverId}`);

            sessionStorage.removeItem('friendDataLastFetch');
            const authUser = useAuthStore.getState().authUser || JSON.parse(localStorage.getItem("authUser") || "{}");
            if (authUser.id) {
                const cacheKey = `friends_${authUser.id}`;
                localStorage.removeItem(cacheKey);
                sessionStorage.removeItem(cacheKey);
            }

            await get().fetchFriendData();
            toast.success("Friend request sent!");
            return true;
        } catch (error) {
            set((state) => ({
                pendingSent: filterOutId(state.pendingSent, receiverId)
            }));
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to send friend request";
            toast.error(errorMessage);
            return false;
        }
    },

    sendFriendRequest: async (receiverId) => {
        return await get().sendRequest(receiverId);
    },

    acceptRequest: async (senderId) => {
        try {
            const acceptedUser = get().pendingReceived.find(r => getId(r) === senderId);
            if (!acceptedUser) {
                await get().fetchFriendData();
                toast.error("Request not found. Please try again.");
                return false;
            }

            await axiosInstance.post(`/friends/accept/${senderId}`);

            set((state) => ({
                friends: [...state.friends, acceptedUser],
                pendingReceived: state.pendingReceived.filter(r => getId(r) !== senderId)
            }));

            sessionStorage.removeItem('friendDataLastFetch');
            const authUser = useAuthStore.getState().authUser || JSON.parse(localStorage.getItem("authUser") || "{}");
            if (authUser.id) {
                const cacheKey = `friends_${authUser.id}`;
                localStorage.removeItem(cacheKey);
                sessionStorage.removeItem(cacheKey);
            }

            toast.success("Friend request accepted!");
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to accept request.");
            sessionStorage.removeItem('friendDataLastFetch');
            await get().fetchFriendData();
            return false;
        }
    },

    acceptFriendRequest: async (senderId) => {
        return await get().acceptRequest(senderId);
    },

    rejectRequest: async (userId) => {
        try {
            await axiosInstance.post(`/friends/reject/${userId}`);
            set((state) => ({
                pendingReceived: filterOutId(state.pendingReceived, userId),
                pendingSent: filterOutId(state.pendingSent, userId),
            }));
            sessionStorage.removeItem('friendDataLastFetch');
            toast.success("Request rejected.");
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reject request.");
            return false;
        }
    },

    unfriend: async (friendId) => {
        try {
            await axiosInstance.delete(`/friends/unfriend/${friendId}`);
            set((state) => ({
                friends: filterOutId(state.friends, friendId),
            }));
            sessionStorage.removeItem('friendDataLastFetch');
            toast.success("User unfriended.");
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to unfriend.");
            return false;
        }
    },

    updateFriendLastMessage: (friendId, messageData) => {
        set((state) => {
            const updatedFriends = state.friends.map(friend => {
                if (friend.id === friendId) {
                    return {
                        ...friend,
                        lastMessage: {
                            id: messageData.id,
                            text: messageData.text || null,
                            image: messageData.image || null,
                            voice: messageData.voice || null,
                            voiceDuration: messageData.voiceDuration || null,
                            senderId: messageData.senderId,
                            receiverId: messageData.receiverId,
                            timestamp: messageData.createdAt || messageData.timestamp || new Date().toISOString(),
                            reactions: messageData.reactions || [],
                            status: messageData.status || 'sent',
                            deliveredAt: messageData.deliveredAt || null,
                            readAt: messageData.readAt || null,
                            isCallLog: messageData.isCallLog || false,
                            callType: messageData.callType || null,
                            callStatus: messageData.callStatus || null,
                            callDuration: messageData.callDuration || null
                        }
                    };
                }
                return friend;
            });
            return { friends: updatedFriends };
        });
    },

    updateFriendMessageStatus: (friendId, messageId, status, deliveredAt = null, readAt = null) => {
        set((state) => {
            const updatedFriends = state.friends.map(friend => {
                if (friend.id === friendId && friend.lastMessage && friend.lastMessage.id === messageId) {
                    return {
                        ...friend,
                        lastMessage: {
                            ...friend.lastMessage,
                            status,
                            deliveredAt: deliveredAt || friend.lastMessage.deliveredAt,
                            readAt: readAt || friend.lastMessage.readAt
                        }
                    };
                }
                return friend;
            });
            return { friends: updatedFriends };
        });
    },

    setupRealtimeListeners: () => {
        const { socket } = useAuthStore.getState();
        if (!socket) return;

        socket.on("messageDelivered", ({ messageId, deliveredAt }) => {
            const { friends } = get();
            friends.forEach(friend => {
                if (friend.lastMessage && friend.lastMessage.id === messageId) {
                    get().updateFriendMessageStatus(friend.id, messageId, 'delivered', deliveredAt);
                }
            });
            set({ friends: [...friends] });
        });

        socket.on("messagesDelivered", ({ messageIds, deliveredAt }) => {
            const { friends } = get();
            messageIds.forEach(messageId => {
                friends.forEach(friend => {
                    if (friend.lastMessage && friend.lastMessage.id === messageId) {
                        get().updateFriendMessageStatus(friend.id, messageId, 'delivered', deliveredAt);
                    }
                });
            });
        });

        socket.on("messagesRead", ({ readBy }) => {
            const { friends } = get();
            const authUserId = useAuthStore.getState().authUser?.id;
            const readAt = new Date();
            friends.forEach(friend => {
                if (friend.id === readBy && friend.lastMessage && friend.lastMessage.senderId === authUserId) {
                    get().updateFriendMessageStatus(friend.id, friend.lastMessage.id, 'read', null, readAt);
                }
            });
            set({ friends: [...friends] });
        });

        socket.on("game:invite", (inviteData) => {
            const messageData = {
                id: `game-${Date.now()}`,
                text: `GAME_INVITE:${inviteData.gameId}`,
                senderId: inviteData.inviterId,
                receiverId: useAuthStore.getState().authUser?.id,
                createdAt: new Date().toISOString(),
                status: 'sent'
            };
            get().updateFriendLastMessage(inviteData.inviterId, messageData);
        });
    },

    cleanupRealtimeListeners: () => {
        // We need to get socket from AuthStore since we don't store it here
        const { socket } = useAuthStore.getState();
        if (!socket) return;

        socket.off("messageDelivered");
        socket.off("messagesDelivered");
        socket.off("messagesRead");
        socket.off("game:invite");
    },

    clearFriendData: () => {
        get().cleanupRealtimeListeners();
        set({
            friends: [],
            pendingReceived: [],
            pendingSent: [],
        });
    },
}));

// Setup subscription to automatically react to AuthStore changes
// This eliminates the need for useAuthStore to manually call methods on useFriendStore
// breaking the circular dependency.
useAuthStore.subscribe((state, prevState) => {
    // Handle Socket Connection Changes
    if (state.socket && !prevState.socket) {
        // Socket connected - subscribe to listeners
        useFriendStore.getState().subscribeToFriendEvents(state.socket);
        useFriendStore.getState().setupRealtimeListeners(); // Only call this if you moved setup logic here
    }
    if (!state.socket && prevState.socket) {
        // Socket disconnected
        useFriendStore.getState().unsubscribeFromFriendEvents(prevState.socket);
    }

    // Handle Auth User Changes (Login/Logout)
    if (state.authUser && !prevState.authUser) {
        // User logged in
        useFriendStore.getState().fetchFriendData();
    }
    if (!state.authUser && prevState.authUser) {
        // User logged out
        useFriendStore.getState().clearFriendData();
    }
});