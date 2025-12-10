// frontend/src/store/useFriendStore.js

import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { cacheFriends, getCachedFriends } from "../utils/cache.js";
import { getId, includesId, findById, filterOutId } from "../utils/idHelper.js";

export const useFriendStore = create((set, get) => ({
    friends: [],
    pendingReceived: [],
    pendingSent: [],
    isLoading: false,

    // Fetch all friend data (friends and requests) - OPTIMIZED
    fetchFriendData: async () => {
        const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
        const userId = authUser.id;
        
        // Try cache first for instant load
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
        
        // Check if we recently fetched (within 30 seconds) - but only skip if we have cached data
        const lastFetch = sessionStorage.getItem('friendDataLastFetch');
        const now = Date.now();
        if (lastFetch && (now - parseInt(lastFetch)) < 30000 && cached) {
            if (import.meta.env.DEV) console.log("⚡ Skipping friend data fetch - recently fetched (using cache)");
            return;
        }
        
        try {
            const [friendsRes, requestsRes] = await Promise.all([
                axiosInstance.get("/friends/all"),
                axiosInstance.get("/friends/requests"),
            ]);
            
            // Cache the fresh data
            const freshData = {
                friends: friendsRes.data || [],
                received: requestsRes.data?.received || [],
                sent: requestsRes.data?.sent || []
            };
            await cacheFriends(userId, freshData);
            
            // Mark fetch time
            sessionStorage.setItem('friendDataLastFetch', now.toString());

            // Merge with existing data to preserve real-time additions
            set((state) => {
                const newFriends = friendsRes.data || [];
                const newReceived = requestsRes.data?.received || [];
                const newSent = requestsRes.data?.sent || [];

                // Create ID sets from API data for efficient lookup
                const apiReceivedIds = new Set(newReceived.map(r => getId(r)));
                const apiSentIds = new Set(newSent.map(r => getId(r)));

                // Only keep existing requests that are still in the API response
                const existingReceivedStillValid = state.pendingReceived.filter(r => apiReceivedIds.has(getId(r)));
                const existingSentStillValid = state.pendingSent.filter(r => apiSentIds.has(getId(r)));

                // Add new requests from API that aren't in existing state
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
            if (import.meta.env.DEV) console.error("❌ Failed to fetch friend data:", error.response?.data || error.message);
            set({
                friends: [],
                pendingReceived: [],
                pendingSent: [],
            });
        } finally {
            set({ isLoading: false });
        }
    },

    // Get the friendship status with another user
    getFriendshipStatus: (userId) => {
        const { friends, pendingSent, pendingReceived } = get();
        if (includesId(friends, userId)) {
            return "FRIENDS";
        }
        if (includesId(pendingSent, userId)) {
            return "REQUEST_SENT";
        }
        if (includesId(pendingReceived, userId)) {
            return "REQUEST_RECEIVED";
        }
        return "NOT_FRIENDS";
    },

    // --- NEW ACTION FOR REAL-TIME UPDATES ---
    /**
     * Used by the WebSocket hook to instantly add a new pending request
     * without requiring a full refetch.
     */
    addPendingReceived: (newRequestData) => {
        set((state) => {
            // Ensure the new request object is not already in the list
            if (!state.pendingReceived.some(r => r.id === newRequestData.id)) {
                toast.success(`New friend request from ${newRequestData.nickname || newRequestData.username}! 🤝`);
                return {
                    pendingReceived: [newRequestData, ...state.pendingReceived],
                };
            }
            return state;
        });
    },
    // --- END NEW ACTION ---

    // --- Standard Actions ---
    sendRequest: async (receiverId) => {
        try {
            await axiosInstance.post(`/friends/send/${receiverId}`);
            // Clear throttle and refetch
            sessionStorage.removeItem('friendDataLastFetch');
            get().fetchFriendData();
            toast.success("Friend request sent!");
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send request.");
            return false;
        }
    },

    // Alias for sendRequest (for compatibility)
    sendFriendRequest: async (receiverId) => {
        return await get().sendRequest(receiverId);
    },

    acceptRequest: async (senderId) => {
        try {
            if (import.meta.env.DEV) console.log("🤝 Accepting friend request from:", senderId);
            
            // Optimistically update state before API call
            const acceptedUser = get().pendingReceived.find(r => r.id === senderId);
            if (import.meta.env.DEV) console.log("👤 Accepted user data:", acceptedUser);
            
            if (!acceptedUser) {
                if (import.meta.env.DEV) console.error("❌ User not found in pending requests");
                toast.error("Request not found");
                return false;
            }
            
            set((state) => ({
                pendingReceived: state.pendingReceived.filter((r) => r.id !== senderId),
                friends: [...state.friends, acceptedUser],
            }));
            if (import.meta.env.DEV) console.log("✅ Optimistic UI update complete");

            const response = await axiosInstance.post(`/friends/accept/${senderId}`);
            if (import.meta.env.DEV) console.log("✅ API response:", response.data);
            toast.success("Friend request accepted!");
            
            // Clear fetch throttle to allow immediate refetch
            sessionStorage.removeItem('friendDataLastFetch');
            
            // Force refetch to ensure consistency
            if (import.meta.env.DEV) console.log("🔄 Refetching friend data...");
            await get().fetchFriendData();
            if (import.meta.env.DEV) console.log("✅ Friend data refetched successfully");
            
            return true;
        } catch (error) {
            console.error("❌ Accept request error:", error.response?.data || error.message);
            toast.error(error.response?.data?.message || "Failed to accept request.");
            // Clear throttle and revert optimistic update on error
            sessionStorage.removeItem('friendDataLastFetch');
            await get().fetchFriendData();
            return false;
        }
    },

    // Alias for acceptRequest (for compatibility)
    acceptFriendRequest: async (senderId) => {
        return await get().acceptRequest(senderId);
    },

    rejectRequest: async (userId) => {
        try {
            await axiosInstance.post(`/friends/reject/${userId}`);
            // Remove from both lists for safety
            set((state) => ({
                pendingReceived: filterOutId(state.pendingReceived, userId),
                pendingSent: filterOutId(state.pendingSent, userId),
            }));
            // Clear cache
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
            // Clear cache
            sessionStorage.removeItem('friendDataLastFetch');
            toast.success("User unfriended.");
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to unfriend.");
            return false;
        }
    },

    // Update lastMessage for a friend (called when message is sent/received)
    updateFriendLastMessage: (friendId, messageData) => {
        set((state) => {
            const updatedFriends = state.friends.map(friend => {
                if (friend.id === friendId) {
                    return {
                        ...friend,
                        lastMessage: {
                            text: messageData.text || null,
                            image: messageData.image || null,
                            voice: messageData.voice || null,
                            senderId: messageData.senderId,
                            receiverId: messageData.receiverId,
                            timestamp: messageData.createdAt || new Date().toISOString(),
                            reactions: messageData.reactions || []
                        }
                    };
                }
                return friend;
            });
            
            return { friends: updatedFriends };
        });
    },

    // Clear data on logout
    clearFriendData: () => {
        set({
            friends: [],
            pendingReceived: [],
            pendingSent: [],
        });
    },
}));
