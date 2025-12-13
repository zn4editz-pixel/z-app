// frontend/src/store/useFriendStore.js

import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { cacheFriends, getCachedFriends } from "../utils/cache.js";
import { getId, includesId, filterOutId } from "../utils/idHelper.js";

export const useFriendStore = create((set, get) => ({
    friends: [],
    pendingReceived: [],
    pendingSent: [],
    isLoading: false,

    // Fetch all friend data (friends and requests) - OPTIMIZED
    fetchFriendData: async () => {
        const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
        const userId = authUser.id;
        
        if (import.meta.env.DEV) console.log("🔄 Fetching friend data for user:", userId);
        
        // Try cache first for instant load
        const cached = await getCachedFriends(userId);
        if (cached) {
            if (import.meta.env.DEV) console.log("📦 Using cached friend data:", {
                friends: cached.friends?.length || 0,
                received: cached.received?.length || 0,
                sent: cached.sent?.length || 0
            });
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
            if (import.meta.env.DEV) console.log("🌐 Making API calls to fetch friend data...");
            
            const [friendsRes, requestsRes] = await Promise.all([
                axiosInstance.get("/friends/all"),
                axiosInstance.get("/friends/requests"),
            ]);
            
            if (import.meta.env.DEV) console.log("✅ API responses received:", {
                friends: friendsRes.data?.length || 0,
                requests: {
                    received: requestsRes.data?.received?.length || 0,
                    sent: requestsRes.data?.sent?.length || 0
                }
            });
            
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

    // --- REAL-TIME ACTIONS ---
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

    /**
     * Used by WebSocket to instantly move accepted user to friends list
     */
    handleFriendRequestAccepted: (data) => {
        const { friendData } = data;
        set((state) => {
            // Remove from sent requests and add to friends
            const updatedSent = state.pendingSent.filter(r => getId(r) !== friendData.id);
            const updatedFriends = [...state.friends, friendData];
            
            toast.success(`${friendData.nickname || friendData.username} accepted your friend request! 🎉`);
            
            return {
                pendingSent: updatedSent,
                friends: updatedFriends
            };
        });
    },

    /**
     * Subscribe to real-time friend request events
     */
    subscribeToFriendEvents: (socket) => {
        if (!socket) {
            console.log("❌ No socket available for friend events");
            return;
        }

        console.log("🔔 Subscribing to real-time friend events");

        // Remove existing listeners to prevent duplicates
        socket.off("friendRequestReceived");
        socket.off("friendRequestAccepted");

        // Listen for incoming friend requests
        socket.on("friendRequestReceived", (data) => {
            console.log("📨 Received friend request:", data);
            get().addPendingReceived(data);
        });

        // Listen for friend request acceptances
        socket.on("friendRequestAccepted", (data) => {
            console.log("✅ Friend request accepted:", data);
            get().handleFriendRequestAccepted(data);
        });
    },

    /**
     * Unsubscribe from real-time friend request events
     */
    unsubscribeFromFriendEvents: (socket) => {
        if (!socket) return;

        console.log("🔕 Unsubscribing from friend events");
        socket.off("friendRequestReceived");
        socket.off("friendRequestAccepted");
    },
    // --- END REAL-TIME ACTIONS ---

    // --- Standard Actions ---
    sendRequest: async (receiverId) => {
        try {
            if (import.meta.env.DEV) console.log("🚀 Sending friend request to:", receiverId);
            
            // Check if already sent to prevent duplicates
            const { pendingSent, friends } = get();
            if (includesId(pendingSent, receiverId) || includesId(friends, receiverId)) {
                toast.error("Friend request already sent or you are already friends");
                return false;
            }

            // Optimistic update - add to pending sent immediately
            set((state) => ({
                pendingSent: [...state.pendingSent, { id: receiverId, _id: receiverId }]
            }));

            const response = await axiosInstance.post(`/friends/send/${receiverId}`);
            if (import.meta.env.DEV) console.log("✅ Friend request API response:", response.data);
            
            // Clear cache to ensure fresh data on next fetch
            sessionStorage.removeItem('friendDataLastFetch');
            const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
            if (authUser.id) {
                const cacheKey = `friends_${authUser.id}`;
                localStorage.removeItem(cacheKey);
                sessionStorage.removeItem(cacheKey);
            }
            
            // Fetch fresh data to get complete user details
            await get().fetchFriendData();
            
            toast.success("Friend request sent!");
            if (import.meta.env.DEV) console.log("✅ Friend request sent successfully");
            return true;
        } catch (error) {
            console.error("❌ Send friend request error:", error);
            
            // Revert optimistic update on error
            set((state) => ({
                pendingSent: filterOutId(state.pendingSent, receiverId)
            }));
            
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to send friend request";
            toast.error(errorMessage);
            return false;
        }
    },

    // Alias for sendRequest (for compatibility) - Enhanced with better error handling
    sendFriendRequest: async (receiverId) => {
        try {
            if (import.meta.env.DEV) console.log("🚀 Sending friend request to:", receiverId);
            
            const result = await get().sendRequest(receiverId);
            
            if (import.meta.env.DEV) console.log("✅ Friend request result:", result);
            return result;
        } catch (error) {
            if (import.meta.env.DEV) console.error("❌ Friend request failed:", error);
            throw error;
        }
    },

    acceptRequest: async (senderId) => {
        try {
            if (import.meta.env.DEV) console.log("🤝 Accepting friend request from:", senderId);
            
            // Find the request using the helper function
            const acceptedUser = get().pendingReceived.find(r => getId(r) === senderId);
            if (import.meta.env.DEV) console.log("👤 Accepted user data:", acceptedUser);
            
            if (!acceptedUser) {
                if (import.meta.env.DEV) console.error("❌ User not found in pending requests");
                // Force refresh to get latest data
                await get().fetchFriendData();
                toast.error("Request not found. Please try again.");
                return false;
            }
            
            // Make API call first to ensure backend consistency
            const response = await axiosInstance.post(`/friends/accept/${senderId}`);
            if (import.meta.env.DEV) console.log("✅ API response:", response.data);
            
            // Immediately update state - remove from pending and add to friends
            set((state) => ({
                friends: [...state.friends, acceptedUser],
                pendingReceived: state.pendingReceived.filter(r => getId(r) !== senderId)
            }));
            
            // Clear all caches to force fresh data on next fetch
            sessionStorage.removeItem('friendDataLastFetch');
            const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
            if (authUser.id) {
                const cacheKey = `friends_${authUser.id}`;
                localStorage.removeItem(cacheKey);
                sessionStorage.removeItem(cacheKey);
            }
            
            toast.success("Friend request accepted!");
            if (import.meta.env.DEV) console.log("✅ Friend request accepted and UI updated");
            
            return true;
        } catch (error) {
            console.error("❌ Accept request error:", error.response?.data || error.message);
            toast.error(error.response?.data?.message || "Failed to accept request.");
            
            // Force refresh on error to get correct state
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
        if (import.meta.env.DEV) console.log('📝 Updating last message for friend:', friendId, messageData);
        
        set((state) => {
            const updatedFriends = state.friends.map(friend => {
                if (friend.id === friendId) {
                    const updatedFriend = {
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
                    
                    if (import.meta.env.DEV) console.log('✅ Updated friend with last message:', updatedFriend);
                    return updatedFriend;
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
