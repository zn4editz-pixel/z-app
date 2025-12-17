import { useEffect } from "react";
import { useCallStore } from "../store/useCallStore";
import { useAuthStore } from "../store/useAuthStore";
import IncomingCallModal from "./IncomingCallModal";
import PrivateCallModal from "./PrivateCallModal";
import toast from "react-hot-toast";

const GlobalCallUI = () => {
    const {
        incomingCall,
        isCallActive,
        callType,
        isInitiator,
        otherUser,
        acceptCall,
        rejectCall,
        endCall,
        setIncomingCall
    } = useCallStore();

    const { socket, authUser } = useAuthStore();

    const handleAccept = () => {
        if (!incomingCall || !socket) return;

        console.log("✅ Accepting call globally from:", incomingCall.callerInfo.nickname);
        acceptCall(); // Update store to Connected state

        // Emit accept event
        socket.emit("private:call-accepted", {
            callerId: incomingCall.callerInfo.id,
            acceptorInfo: {
                id: authUser.id,
                nickname: authUser.nickname,
                profilePic: authUser.profilePic
            }
        });
    };

    const handleReject = () => {
        if (incomingCall && socket) {
            console.log("🚫 Rejecting call globally");
            socket.emit("private:reject-call", {
                callerId: incomingCall.callerInfo.id,
                reason: "declined"
            });
        }
        rejectCall();
    };

    const handleCallEnd = () => {
        endCall();
    };

    return (
        <>
            {/* Incoming Call Modal - Shows when receiving a call */}
            <IncomingCallModal
                isOpen={!!incomingCall}
                caller={incomingCall?.callerInfo}
                callType={incomingCall?.callType}
                onAccept={handleAccept}
                onReject={handleReject}
            />

            {/* Active Private Call Modal - Shows when call is connected/dialing */}
            {/* We conditionally render to ensure clean mount/unmount */}
            {isCallActive && (
                <PrivateCallModal
                    isOpen={isCallActive}
                    onClose={handleCallEnd}
                    callType={callType}
                    isInitiator={isInitiator}
                    otherUser={otherUser}
                />
            )}
        </>
    );
};

export default GlobalCallUI;
