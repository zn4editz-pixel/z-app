import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js"; // Used for API calls
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useFriendStore } from "./useFriendStore.js";
import { SocketMonitor } from "../utils/socketMonitor.js";

// ✅ --- CORRECTED BASE_URL ---
// Get the base URL from the environment variable set during the build process
// Remove the '/api' part for the socket connection if your server listens at the root
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

// Optional check (already in axios.js, but good to be aware)
if (!SOCKET_URL && import.meta.env.PROD) {
  console.error("VITE_API_BASE_URL is not defined in the environment!");
}
// ✅ --- END CORRECTION ---


export const useAuthStore = create((set, get) => ({
	authUser: null,
	isSigningUp: false,
	isLoggingIn: false,
	isUpdatingProfile: false,
	isCheckingAuth: true,
	onlineUsers: [],
	socket: null,
	socketMonitor: null,

	setAuthUser: (user) => {
		set({ authUser: user });
	},

	checkAuth: async () => {
		try {
			// Restore token from localStorage if exists
			const token = localStorage.getItem("token");
			const cachedUser = localStorage.getItem("authUser");
			
			if (!token) {
				// No token, skip auth check
				set({ authUser: null, isCheckingAuth: false });
				return;
			}
			
			// Show cached user immediately for instant load
			if (cachedUser) {
				try {
					const parsedUser = JSON.parse(cachedUser);
					set({ authUser: parsedUser, isCheckingAuth: false });
				} catch (e) {
					console.error("Failed to parse cached user");
				}
			} else {
				set({ isCheckingAuth: true });
			}
			
			// Set token in axios headers
			axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

			// Check auth with backend in background
			const res = await axiosInstance.get("/auth/check");
			const user = res.data;

			if (!user || typeof user !== 'object') {
                 throw new Error("Invalid user data received");
            }

			// Check if user is blocked or suspended
			if (user.isBlocked) { 
				console.log("User is blocked");
				toast.error("Account is blocked"); 
				set({ authUser: null, isCheckingAuth: false });
				localStorage.removeItem("authUser");
				localStorage.removeItem("token");
				return;
			}
			if (user.isSuspended && user.suspensionEndTime && new Date(user.suspensionEndTime) > new Date()) { 
				console.log("User is suspended");
				toast.error("Account is suspended"); 
				set({ authUser: null, isCheckingAuth: false });
				localStorage.removeItem("authUser");
				localStorage.removeItem("token");
				return;
			}

			// Auth successful
			console.log("Auth check successful for user:", user.username);
			set({ authUser: user });
			localStorage.setItem("authUser", JSON.stringify(user));
			get().connectSocket();
			useFriendStore.getState().fetchFriendData();
		} catch (error) {
			console.log("Auth check failed:", error.response?.status, error.response?.data?.message || error.message);
			
			// Only clear auth if it's a real auth failure (401), not network errors
			if (error.response?.status === 401) {
				console.log("Token invalid or expired, clearing auth");
				set({ authUser: null });
				localStorage.removeItem("authUser");
				localStorage.removeItem("token");
				delete axiosInstance.defaults.headers.common['Authorization'];
				get().disconnectSocket();
				useFriendStore.getState().clearFriendData();
			} else {
				// For network errors, keep the user logged in (offline support)
				console.log("Network error during auth check, keeping user logged in");
				const cachedUser = localStorage.getItem("authUser");
				if (cachedUser) {
					try {
						set({ authUser: JSON.parse(cachedUser) });
					} catch (e) {
						console.error("Failed to parse cached user:", e);
					}
				}
			}
		} finally {
			set({ isCheckingAuth: false });
		}
	},

	signup: async (data) => {
		set({ isSigningUp: true });
		try {
			const res = await axiosInstance.post("/auth/signup", data); // Removed withCredentials
			const { token, ...user } = res.data;
			
			// Store token for mobile compatibility
			if (token) {
				localStorage.setItem("token", token);
				axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
			}
			
			set({ authUser: user });
			localStorage.setItem("authUser", JSON.stringify(user));
			toast.success("Account created successfully");
			get().connectSocket(); // Connect socket after setting authUser
			useFriendStore.getState().fetchFriendData();
            return true; // Indicate success for navigation
		} catch (error) {
			toast.error(error.response?.data?.message || "Signup failed");
            return false; // Indicate failure
		} finally {
			set({ isSigningUp: false });
		}
	},

	login: async (data) => {
		set({ isLoggingIn: true });
		try {
			const res = await axiosInstance.post("/auth/login", data); // Removed withCredentials
			const { token, ...user } = res.data;

            if (!user || typeof user !== 'object') {
                 throw new Error("Invalid login response");
            }
			if (user.isBlocked) { toast.error("Account is blocked"); return; }
			if (user.suspension && new Date(user.suspension.endTime) > new Date()) { toast.error("Account is suspended"); return; }

			// Store token for mobile compatibility
			if (token) {
				localStorage.setItem("token", token);
				axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
			}

			set({ authUser: user });
			localStorage.setItem("authUser", JSON.stringify(user));
			toast.success("Logged in successfully");
			get().connectSocket(); // Connect socket after setting authUser
			useFriendStore.getState().fetchFriendData();
             return true; // Indicate success for navigation
		} catch (error) {
			toast.error(error.response?.data?.message || "Login failed");
             return false; // Indicate failure
		} finally {
			set({ isLoggingIn: false });
		}
	},

	logout: async () => {
        const socket = get().socket; // Get socket before clearing state
        if (socket) get().disconnectSocket(); // Disconnect socket first

		try {
            // Still attempt API logout even if socket failsafe triggers
			await axiosInstance.post("/auth/logout", {});
		} catch (error) {
			console.error("Logout API call error:", error.response?.data?.message || error.message);
            // Don't necessarily stop the logout process here
		} finally {
			localStorage.removeItem("authUser");
			localStorage.removeItem("token");
			delete axiosInstance.defaults.headers.common['Authorization'];
			set({ authUser: null, onlineUsers: [], socket: null }); // Clear socket in state too
			useFriendStore.getState().clearFriendData();
			toast.success("Logged out successfully");
            // Optionally navigate here or let App.jsx handle redirect via authUser change
		}
	},

	updateProfile: async (data) => {
		set({ isUpdatingProfile: true });
		try {
			// Use the correct user profile endpoint
			const res = await axiosInstance.put("/users/me", data);
			const user = res.data;
			set({ authUser: user });
			localStorage.setItem("authUser", JSON.stringify(user));
			// Don't show toast here - let the calling component handle it
			return user;
		} catch (error) {
			console.error("Update profile error:", error);
			throw error; // Let the calling component handle the error
		} finally {
			set({ isUpdatingProfile: false });
		}
	},

	connectSocket: () => {
		const { authUser, socket } = get();
		// Prevent multiple connections or connecting without user
		if (!authUser || socket) {
            console.log(`connectSocket: Skipped. authUser: ${!!authUser}, socket: ${!!socket}`);
            return;
        }

        console.log(`Connecting socket to ${SOCKET_URL} for user ${authUser.id}`);
		
		// Get token for authentication
		const token = localStorage.getItem("token");
		
		// ✅ --- USE CORRECT SOCKET_URL WITH TOKEN AUTH ---
		const newSocket = io(SOCKET_URL, {
			query: { 
				userId: authUser.id,
				token: token // Send token for mobile compatibility
			},
			auth: {
				token: token // Also send in auth object
			},
            // Optional: force new connection if needed, depends on server behavior
            // forceNew: true,
			transports: ["websocket"], // Explicitly use websockets
			// `withCredentials: true` is NOT needed for socket.io client usually,
            // auth happens via query or initial handshake/token
		});
		// ✅ --- END CORRECTION ---

		set({ socket: newSocket });

		// Start socket monitoring for auto-reconnection
		const monitor = new SocketMonitor(newSocket, authUser);
		monitor.start();
		set({ socketMonitor: monitor });

		newSocket.on("connect", () => {
			console.log("✅ Socket connected:", newSocket.id);
		});
		
        newSocket.on("connect_error", (err) => {
            console.error("Socket connection error:", err.message, err.description);
            // Only show error after multiple failed attempts
            if (!newSocket.recovered) {
				// Don't spam errors - socket will auto-retry
				console.log("⚠️ Socket connection failed, will retry automatically...");
			}
        });
		newSocket.on("getOnlineUsers", (userIds) => {
			console.log('📡 Online users updated:', userIds.length, 'users online');
			console.log('📡 Online user IDs:', userIds);
			set({ onlineUsers: userIds });
		});

		const forceLogout = (msg) => {
			toast.error(msg);
            // Call the main logout action to ensure consistent cleanup
            get().logout();
		};

		// Admin action listeners remain the same
		newSocket.on("user-suspended", ({ reason }) => { forceLogout(`Suspended: ${reason || "N/A"}`); });
		newSocket.on("user-blocked", () => forceLogout("Account blocked"));
		newSocket.on("user-deleted", () => forceLogout("Account deleted"));

		newSocket.on("disconnect", (reason) => {
             console.log("⚠️ Socket disconnected:", reason);
             // Attempt to reconnect manually or show message? For now, just log.
             // If reason is 'io server disconnect', it was likely intentional (e.g., logout)
             if (reason !== 'io server disconnect') {
                // Could try to reconnect or notify user connection lost
             }
             // Clear socket ref in state if disconnected unexpectedly? Risky if it auto-reconnects.
             // set({ socket: null }); // Consider implications
        });

		// Reconnect logic might be handled automatically by socket.io, but explicit checkAuth can be good
		newSocket.io.on("reconnect", async (attempt) => {
			console.log(`🔄 Socket reconnected after ${attempt} attempts`);
			// Re-register user and fetch data upon successful reconnect
            if (get().authUser) { // Check if user is still logged in client-side
                newSocket.emit("register-user", get().authUser.id); // Re-register
                await get().checkAuth(); // Re-check auth and fetch friend data
            }
		});
        newSocket.io.on("reconnect_attempt", (attempt) => {
             console.log(`Attempting to reconnect socket... (${attempt})`);
        });
        newSocket.io.on("reconnect_error", (error) => {
            console.error("Socket reconnection error:", error.message);
        });
        newSocket.io.on("reconnect_failed", () => {
             console.error("Socket reconnection failed after multiple attempts.");
        });
	},

	disconnectSocket: () => {
		const { socket, socketMonitor } = get();
		
		// Stop socket monitor
		if (socketMonitor) {
			socketMonitor.stop();
			set({ socketMonitor: null });
		}
		
		if (socket) {
            console.log("Disconnecting socket...", socket.id);
			socket.disconnect();
			set({ socket: null, onlineUsers: [] }); // Clear socket and online users
		}
	},
}));
