import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { useFriendStore } from "../store/useFriendStore";
import { useChatStore } from "../store/useChatStore";
import { useGameStore } from "../store/useGameStore"; // ✅ Import Game Store
import { useCallStore } from "../store/useCallStore"; // ✅ Import Call Store

export const useSocketListeners = () => {
    const navigate = useNavigate();
    const { authUser, socket, setAuthUser, checkAuth } = useAuthStore();
    const { addPendingReceived, fetchFriendData } = useFriendStore();
    // Use Game Store actions
    const { initGame, updateGame, setGameOpen } = useGameStore();

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
            const { selectedUser } = useChatStore.getState();
            if (selectedUser?.id !== sender?.id) {
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
        socket.on("verification-approved", (data) => {
            console.log("🎉 Verification approved notification received:", data);
            toast.success("🎉 Verification Approved! You now have a verified badge.", {
                duration: 5000,
                position: 'top-center'
            });
            // Refresh auth data to get updated verification status
            setTimeout(() => checkAuth(), 500);
        });

        socket.on("verification-rejected", (data) => {
            console.log("❌ Verification rejected notification received:", data);
            const reason = data?.reason || "Does not meet verification criteria";
            toast.error(`❌ Verification Rejected: ${reason}`, {
                duration: 6000,
                position: 'top-center'
            });
            // Refresh auth data to get updated verification status
            setTimeout(() => checkAuth(), 500);
        });

        socket.on("admin-notification", (note) => {
            toast(note.message, { icon: '📢' });
        });

        // 5. SOS GAME LISTENERS 🎮
        socket.on("game:invite", (data) => {
            toast(`🎮 ${data.senderName} invited you to play SOS! Check chat.`, { icon: '🕹️' });
            // Optionally auto-open chat with sender? For now just notify.
        });

        socket.on("game:start", ({ game }) => {
            console.log("🎮 Game Started:", game);
            initGame(game);
            toast.success("Game Started!");
        });

        socket.on("game:update", ({ game, lastMove }) => {
            console.log("🎮 Game Update:", game);
            console.log("📏 Lines in update:", game?.lines);
            updateGame(game);
        });

        socket.on("game:end", ({ winner, game }) => {
            updateGame(game);
            const winnerName = game.players[winner]?.name || "Draw";
            if (winner === authUser.id) toast.success("🏆 YOU WON!");
            else if (winner === 'draw') toast("🤝 It's a Draw!");
            else toast("💀 You Lost!", { icon: '💔' });
        });

        socket.on("game:error", ({ message }) => {
            toast.error(message);
        });

        socket.on("game:expired", () => {
            toast.error("⌛ Game invite expired.", { icon: '⏲️' });
        });

        // 6. CALL LISTENERS 📞
        socket.on("private:incoming-call", ({ callerInfo, callType, callerId }) => {
            console.log("📞 Incoming call from:", callerInfo?.nickname);
            const { isCallActive, setIncomingCall } = useCallStore.getState();

            if (isCallActive) {
                console.log("⚠️ Already in call, rejecting incoming");
                socket.emit("private:reject-call", { callerId: callerInfo.id });
                return;
            }
            setIncomingCall({ callerInfo, callType });
        });

        socket.on("private:call-rejected", ({ reason }) => {
            toast.error(`Call ${reason || "declined"}`);
            useCallStore.getState().resetCallState();
        });

        socket.on("private:call-failed", ({ reason }) => {
            toast.error(`Call failed: ${reason}`);
            useCallStore.getState().resetCallState();
        });

        socket.on("private:call-accepted", ({ acceptorInfo }) => {
            console.log("✅ Call accepted by:", acceptorInfo?.nickname);
            toast.success("Call connected!");
            useCallStore.getState().setCallStatus("connected");
        });

        socket.on("private:call-ended", () => {
            console.log("🔚 Call ended");
            toast("Call ended");
            useCallStore.getState().resetCallState();
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

            socket.off("game:invite");
            socket.off("game:start");
            socket.off("game:update");
            socket.off("game:end");
            socket.off("game:error");
            socket.off("game:expired");

            // Call Events
            socket.off("private:incoming-call");
            socket.off("private:call-rejected");
            socket.off("private:call-failed");
            socket.off("private:call-accepted");
            socket.off("private:call-ended");
        };
    }, [socket, authUser?.id, navigate]);
};
