import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { useFriendStore } from "../store/useFriendStore";
import { useChatStore } from "../store/useChatStore";

export const useSocketListeners = () => {
    const navigate = useNavigate();
    const { authUser, socket, setAuthUser, checkAuth } = useAuthStore();
    const { addPendingReceived, fetchFriendData } = useFriendStore();

    useEffect(() => {
        if (!socket || !authUser?.id) return;

        console.log("🔌 Initializing Global Socket Listeners for user:", authUser.id);

        const handleConnect = () => {
            console.log('🟢 Socket connected, registering user:', authUser.id);
            socket.emit("register-user", authUser.id);
        };

        if (socket.connected) handleConnect();

        socket.on('connect', handleConnect);

        // 1. User Actions (Block/Suspend/Delete)
        socket.on("user-action", ({ type, reason, until }) => {
            console.log("⚠️ User Action received:", type);
            switch (type) {
                case "suspended":
                    setAuthUser(null);
                    toast.error(`⛔ Suspended until ${new Date(until).toLocaleString()}. Reason: ${reason}`);
                    navigate("/suspended");
                    break;
                case "unsuspended":
                    toast.success("✅ Suspension lifted. Please log in again.");
                    navigate("/login");
                    break;
                case "blocked":
                    setAuthUser(null);
                    toast.error("🚫 You have been blocked by admin.");
                    navigate("/blocked");
                    break;
                case "unblocked":
                    toast.success("✅ You’ve been unblocked. Please log in again.");
                    navigate("/login");
                    break;
                case "deleted":
                    setAuthUser(null);
                    toast.error("❌ Your account has been deleted.");
                    navigate("/goodbye");
                    break;
            }
        });

        // 2. Global Message Listener (for Notifications & "Missed" Messages)
        socket.on("message-received", ({ sender, text }) => {
            // Only notify if not already in chat with this user
            const { selectedUser } = useChatStore.getState();
            if (selectedUser?.id !== sender?.id) {
                // Add to notifications
                useNotificationStore.getState().addNotification({
                    type: 'message',
                    title: sender?.name || "New Message",
                    message: text,
                    senderId: sender?.id,
                    senderAvatar: sender?.profilePic,
                    createdAt: new Date().toISOString(),
                    id: `msg-${Date.now()}`
                });

                toast(`${sender?.name || 'Someone'}: ${text}`, { icon: '💬' });
            }
        });

        // 3. Friend Request Listeners
        socket.on("friendRequest:received", (senderProfile) => {
            addPendingReceived(senderProfile);
            toast("New Friend Request! 👥", { icon: '👋' });
        });

        socket.on("friendRequest:accepted", ({ user }) => {
            toast.success(`${user.nickname || user.username} accepted your request!`);
            fetchFriendData();
        });

        socket.on("friendRequest:rejected", () => {
            fetchFriendData();
        });

        // 4. Verification & Admin
        socket.on("verification-approved", () => {
            toast.success("Verification Approved! ✅");
            checkAuth(); // Refresh user data
        });

        socket.on("verification-rejected", ({ reason }) => {
            toast.error(`Verification Rejected: ${reason}`);
            checkAuth();
        });

        socket.on("admin-notification", (note) => {
            toast(note.message, { icon: '📢' });
        });

        return () => {
            socket.off('connect', handleConnect);
            socket.off("user-action");
            socket.off("message-received");
            socket.off("friendRequest:received");
            socket.off("friendRequest:accepted");
            socket.off("friendRequest:rejected");
            socket.off("verification-approved");
            socket.off("verification-rejected");
            socket.off("admin-notification");
        };

    }, [socket, authUser?.id, navigate]);
};
