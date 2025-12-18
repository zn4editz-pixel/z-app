import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
const SocketConnectionStatus = () => {
  const { socket } = useAuthStore();
  const { socketConnected } = useChatStore();
  useEffect(() => {
    if (!socket) {
      setIsConnected(false);
      setShowStatus(true);
      return;
    }
    // Initial state
    setIsConnected(socket.connected);
    // Listen for connection events
    const handleConnect = () => {
      setIsConnected(true);
      setReconnectAttempts(0);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };
    const handleDisconnect = (reason) => {
      setIsConnected(false);
      setShowStatus(true);
    };
    const handleReconnectAttempt = (attemptNumber) => {
      setReconnectAttempts(attemptNumber);
      setShowStatus(true);
    };
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.io.on("reconnect_attempt", handleReconnectAttempt);
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
    };
  }, [socket]);
  // Sync with chat store connection status
  useEffect(() => {
    setIsConnected(socketConnected);
  }, [socketConnected]);
  // Only show when disconnected or briefly when reconnected
  if (!showStatus && isConnected) return null;
  const handleManualReconnect = () => {
    if (socket && !socket.connected) {
      socket.connect();
    }
  };
  return (
    <div
      className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all ${
        isConnected ? "bg-green-500 text-white" : "bg-red-500 text-white"
      }`}
    >
      {isConnected ? (
        <>
          <Wifi className="w-5 h-5" />
          <span className="font-medium">Socket Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="w-5 h-5 animate-pulse" />
          <span className="font-medium">
            {reconnectAttempts > 0
              ? `Reconnecting... (${reconnectAttempts})`
              : "Socket Disconnected"}
          </span>
          <button
            onClick={handleManualReconnect}
            className="ml-2 p-1 hover:bg-red-600 rounded transition-colors"
            title="Reconnect manually"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};
export default SocketConnectionStatus;
