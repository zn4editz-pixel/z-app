// ... keep imports but REMOVE useFriendStore
import { create } from "zustand";
import React from "react";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { SocketMonitor } from "../utils/socketMonitor.js";
import logger from "../utils/secureLogger.js";

// ✅ PRODUCTION SOCKET URL CONFIGURATION
const getSocketURL = () => {
  // Development
  if (import.meta.env.MODE === "development") {
    return "http://localhost:5001";
  }
  // Production - use environment variable or fallback
  const apiUrl =
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl;
  }
  // Fallback to current domain with HTTPS
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const host = window.location.host;
  return `${protocol}//${host}`;
};

const SOCKET_URL = getSocketURL();

logger.debug("Socket URL Configured:", SOCKET_URL);

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
      const token = localStorage.getItem("token");
      const cachedUser = localStorage.getItem("authUser");

      if (!token) {
        set({ authUser: null, isCheckingAuth: false });
        return;
      }

      if (cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          // If user ID looks like MongoDB ObjectId (24 hex chars), clear old data
          if (
            parsedUser.id &&
            parsedUser.id.length === 24 &&
            /^[0-9a-fA-F]{24}$/.test(parsedUser.id)
          ) {
            if (import.meta.env.DEV) localStorage.removeItem("authUser");
            localStorage.removeItem("token");
            delete axiosInstance.defaults.headers.common["Authorization"];
            set({ authUser: null, isCheckingAuth: false });
            toast.error(
              "Please log in again - your account has been migrated to a new system",
            );
            return;
          }
          set({ authUser: parsedUser, isCheckingAuth: false });
        } catch (e) {
          localStorage.removeItem("authUser");
          localStorage.removeItem("token");
          delete axiosInstance.defaults.headers.common["Authorization"];
          set({ authUser: null, isCheckingAuth: false });
          return;
        }
      }

      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const res = await axiosInstance.get("/auth/check");
      const user = res.data;

      if (!user || typeof user !== "object") {
        throw new Error("Invalid user data received");
      }

      if (user.isBlocked) {
        toast.error("Account is blocked");
        set({ authUser: null, isCheckingAuth: false });
        localStorage.removeItem("authUser");
        localStorage.removeItem("token");
        delete axiosInstance.defaults.headers.common["Authorization"];
        get().disconnectSocket();
        return;
      }

      if (
        user.isSuspended &&
        user.suspensionEndTime &&
        new Date(user.suspensionEndTime) > new Date()
      ) {
        toast.error("Account is suspended");
        set({ authUser: null, isCheckingAuth: false });
        localStorage.removeItem("authUser");
        localStorage.removeItem("token");
        delete axiosInstance.defaults.headers.common["Authorization"];
        get().disconnectSocket();
        return;
      }

      set({ authUser: user });
      localStorage.setItem("authUser", JSON.stringify(user));
      get().connectSocket();
    } catch (error) {
      if (
        error.response?.status === 401 &&
        error.response?.data?.message?.includes("Invalid token")
      ) {
        set({ authUser: null });
        localStorage.removeItem("authUser");
        localStorage.removeItem("token");
        delete axiosInstance.defaults.headers.common["Authorization"];
        get().disconnectSocket();
        toast.error("Please log in again - your session has expired");
      } else {
        const cachedUser = localStorage.getItem("authUser");
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            if (
              parsedUser.id &&
              parsedUser.id.length === 24 &&
              /^[0-9a-fA-F]{24}$/.test(parsedUser.id)
            ) {
              localStorage.removeItem("authUser");
              localStorage.removeItem("token");
              delete axiosInstance.defaults.headers.common["Authorization"];
              set({ authUser: null, isCheckingAuth: false });
              return;
            }
            set({ authUser: parsedUser, isCheckingAuth: false });
          } catch (e) {
            localStorage.removeItem("authUser");
            localStorage.removeItem("token");
            set({ authUser: null });
          }
        } else {
          set({ isCheckingAuth: false });
        }
      }
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      const { token, ...user } = res.data;

      if (token) {
        localStorage.setItem("token", token);
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      set({ authUser: user });
      localStorage.setItem("authUser", JSON.stringify(user));
      toast.success("Account created successfully");
      get().connectSocket();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      const { token, ...user } = res.data;

      if (!user || typeof user !== "object") {
        throw new Error("Invalid login response");
      }

      if (user.isBlocked) {
        toast.error("Account is blocked");
        return false;
      }

      if (
        user.isSuspended &&
        user.suspensionEndTime &&
        new Date(user.suspensionEndTime) > new Date()
      ) {
        toast.error("Account is suspended");
        return false;
      }

      if (token) {
        localStorage.setItem("token", token);
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      set({ authUser: user });
      localStorage.setItem("authUser", JSON.stringify(user));
      toast.success("Logged in successfully");
      get().connectSocket();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    const socket = get().socket;
    if (socket) get().disconnectSocket();

    try {
      await axiosInstance.post("/auth/logout", {});
    } catch (error) {
      // Ignore error
    } finally {
      localStorage.removeItem("authUser");
      localStorage.removeItem("token");
      delete axiosInstance.defaults.headers.common["Authorization"];
      set({ authUser: null, onlineUsers: [], socket: null });
      toast.success("Logged out successfully");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/users/me", data);
      const user = res.data;
      set({ authUser: user });
      localStorage.setItem("authUser", JSON.stringify(user));
      return user;
    } catch (error) {
      throw error;
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser || socket) {
      return;
    }

    const token = localStorage.getItem("token");
    const newSocket = io(SOCKET_URL, {
      query: {
        userId: authUser.id,
        token: token,
      },
      auth: {
        token: token,
      },
      transports: ["websocket"],
    });

    set({ socket: newSocket });

    const monitor = new SocketMonitor(newSocket, authUser);
    monitor.start();
    set({ socketMonitor: monitor });

    newSocket.on("connect", () => {
      if (authUser?.id) {
        newSocket.emit("register-user", authUser.id);
      }
    });

    newSocket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    const forceLogout = (msg) => {
      toast.error(msg);
      get().logout();
    };

    newSocket.on("user-suspended", ({ reason }) => {
      forceLogout(`Suspended: ${reason || "N/A"}`);
    });
    newSocket.on("user-blocked", () => forceLogout("Account blocked"));
    newSocket.on("user-deleted", () => forceLogout("Account deleted"));

    newSocket.on("disconnect", (reason) => {
      // Handle disconnect
    });

    newSocket.io.on("reconnect", async (attempt) => {
      const currentUser = get().authUser;
      if (currentUser) {
        newSocket.emit("register-user", currentUser.id);
        setTimeout(() => {
          get().checkAuth();
        }, 100);
      }
    });
  },

  disconnectSocket: () => {
    const { socket, socketMonitor } = get();
    if (socketMonitor) {
      socketMonitor.stop();
      set({ socketMonitor: null });
    }
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },

  initNetworkListeners: () => {
    if (typeof window === "undefined") return;
    window.addEventListener("online", () => {
      const { authUser, socket } = get();
      if (authUser) {
        if (socket && !socket.connected) {
          socket.connect();
        } else if (!socket) {
          get().connectSocket();
        }
      }
    });
  },
}));
// Initialize listeners outside the store definition to run once (or call from App.jsx)
// For simplicity, we can let the App component call this, OR just run it here if side-effects allowed.
// But valid zustand pattern is to expose it.
