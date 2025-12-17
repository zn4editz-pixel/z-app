import { create } from "zustand";

export const useCallStore = create((set, get) => ({
    // Call State
    isCallActive: false,
    callType: null, // "audio" | "video"
    isInitiator: false,
    otherUser: null,
    status: "idle", // idle, calling, ringing, connected, ended

    // Incoming Call State
    incomingCall: null, // { callerInfo, callType }

    // Actions
    setIncomingCall: (callData) => set({ incomingCall: callData }),

    setCallActive: (active, data = {}) => set({
        isCallActive: active,
        ...data
    }),

    setCallStatus: (status) => set({ status }),

    startCall: (user, type) => set({
        isCallActive: true,
        callType: type,
        isInitiator: true,
        otherUser: user,
        status: "calling"
    }),

    acceptCall: () => {
        const { incomingCall } = get();
        if (!incomingCall) return;

        set({
            isCallActive: true,
            callType: incomingCall.callType,
            isInitiator: false,
            otherUser: incomingCall.callerInfo,
            status: "connected",
            incomingCall: null
        });
    },

    rejectCall: () => set({
        incomingCall: null,
        isCallActive: false,
        status: "idle",
        otherUser: null
    }),

    endCall: () => set({
        isCallActive: false,
        callType: null,
        isInitiator: false,
        otherUser: null,
        status: "idle",
        incomingCall: null
    }),

    resetCallState: () => set({
        isCallActive: false,
        callType: null,
        isInitiator: false,
        otherUser: null,
        status: "idle",
        incomingCall: null
    })
}));
