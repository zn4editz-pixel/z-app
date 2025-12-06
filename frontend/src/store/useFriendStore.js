// frontend/src/store/useFriendStore.js

import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { cacheFriends, getCachedFriends } from "../utils/cache.js";

export const useFriendStore = create((set, get) => ({
    friends: [],
    pendingReceived: [],
    pendingSent: [],
    isLoading: false,

    // Fetch all friend data (friends and requests)
    fetchFriendData: async () => {
        const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
        const userId = authUser._id;
        
        // Try cache first for instant load
        const cached = await getCachedFriends(userId);
        if (cached) {
            console.log("⚡ Loading friends from cache (instant)");
            set({
                friends: cached.friends || [],
                pendingReceived: cached.received || [],
                pendingSent: cached.sent || [],
                isLoading: false
            });
        } else {
            set({ isLoading: true });
        }
        
        try {
            const [friendsRes, requestsRes] = await Promise.all([
                axiosInstance.get("/friends/all"),
                axiosInstance.get("/friends/requests"),
            ]);

            console.log("✅ Friends data loaded from API:", {
                friends: friendsRes.data?.length || 0,
                received: requestsRes.data?.received?.length || 0,
                sent: requestsRes.data?.sent?.length || 0
            });
            
            // Cache the fresh data
            const freshData = {
                friends: friendsRes.data || [],
                received: requestsRes.data?.received || [],
                sent: requestsRes.data?.sent || []
            };
            await cacheFriends(userId, freshData);

            // Merge with existing data to preserve real-time additions
            set((state) => {
                const newFriends = friendsRes.data || [];
                const newReceived = requestsRes.data?.received || [];
                const newSent = requestsRes.data?.sent || [];

                // Create ID sets from API data for efficient lookup
                const apiReceivedIds = new Set(newReceived.map(r => r._id));
                const apiSentIds = new Set(newSent.map(r => r._id));

                // Only keep existing requests that are still in the API response
                // This ensures accepted/rejected requests are removed
                const existingReceivedStillValid = state.pendingReceived.filter(r => apiReceivedIds.has(r._id));
                const existingSentStillValid = state.pendingSent.filter(r => apiSentIds.has(r._id));

                // Add new requests from API that aren't in existing state
                const mergedReceived = [...existingReceivedStillValid];
                newReceived.forEach(req => {
                    if (!mergedReceived.some(r => r._id === req._id)) {
                        mergedReceived.push(req);
                    }
                });

                const mergedSent = [...existingSentStillValid];
                newSent.forEach(req => {
                    if (!mergedSent.some(r => r._id === req._id)) {
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
            console.error("❌ Failed to fetch friend data:", error.response?.data || error.message);
            // Don't show toast error on initial load to avoid spam
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
        if (friends.some((f) => f._id === userId)) {
            return "FRIENDS";
        }
        if (pendingSent.some((r) => r._id === userId)) {
            return "REQUEST_SENT";
        }
        if (pendingReceived.some((r) => r._id === userId)) {
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
            if (!state.pendingReceived.some(r => r._id === newRequestData._id)) {
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
            // Note: We should refetch immediately if the server responds with success
            get().fetchFriendData(); // Full refetch ensures we get the latest sent request data
            toast.success("Friend request sent!");
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send request.");
            return false;
        }
    },

    acceptRequest: async (senderId) => {
        try {
            // Optimistically update state before API call
            const acceptedUser = get().pendingReceived.find(r => r._id === senderId);
            
            set((state) => ({
                pendingReceived: state.pendingReceived.filter((r) => r._id !== senderId),
                friends: acceptedUser ? [...state.friends, acceptedUser] : state.friends,
            }));

            await axiosInstance.post(`/friends/accept/${senderId}`);
            toast.success("Friend request accepted!");
            
            // Refetch to ensure consistency with backend
            get().fetchFriendData();
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to accept request.");
            // Revert optimistic update on error
            get().fetchFriendData();
            return false;
        }
    },

    rejectRequest: async (userId) => {
        try {
            await axiosInstance.post(`/friends/reject/${userId}`);
            // Remove from both lists for safety
            set((state) => ({
                pendingReceived: state.pendingReceived.filter((r) => r._id !== userId),
                pendingSent: state.pendingSent.filter((r) => r._id !== userId),
            }));
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
                friends: state.friends.filter((f) => f._id !== friendId),
            }));
            toast.success("User unfriended.");
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to unfriend.");
            return false;
        }
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
