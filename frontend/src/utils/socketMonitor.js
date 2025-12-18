/**
 * Socket Connection Monitor & Auto-Reconnection
 * Ensures sockets stay connected for instant messaging
 */
export class SocketMonitor {
  constructor(socket, authUser) {
    this.socket = socket;
    this.authUser = authUser;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.pingInterval = null;
    this.isMonitoring = false;
  }
  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Monitor connection events
    this.socket.on("connect", () => {
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      // Re-register user on reconnect
      if (this.authUser?.id) {
        this.socket.emit("register-user", this.authUser.id);
      }
    });
    this.socket.on("disconnect", (reason) => {
      // Auto-reconnect for certain disconnect reasons
      if (reason === "io server disconnect") {
        // Server disconnected us, try to reconnect
        this.attemptReconnect();
      } else if (reason === "transport close" || reason === "transport error") {
        // Network issue, try to reconnect
        this.attemptReconnect();
      }
    });
    this.socket.on("connect_error", (error) => {
      this.attemptReconnect();
    });
    this.socket.on("reconnect_attempt", (attemptNumber) => {});
    this.socket.on("reconnect", (attemptNumber) => {
      this.reconnectAttempts = 0;
    });
    this.socket.on("reconnect_failed", () => {});
    // Start ping monitoring
    this.startPingMonitor();
  }
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay,
    );

    setTimeout(() => {
      if (!this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }
  startPingMonitor() {
    // Send periodic pings to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.socket.connected) {
        const start = Date.now();
        this.socket.emit("ping", {}, () => {
          const latency = Date.now() - start;
        });
      } else {
        this.attemptReconnect();
      }
    }, 30000); // Ping every 30 seconds
  }
  stop() {
    this.isMonitoring = false;
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    // Remove all listeners
    this.socket.off("connect");
    this.socket.off("disconnect");
    this.socket.off("connect_error");
    this.socket.off("reconnect_attempt");
    this.socket.off("reconnect");
    this.socket.off("reconnect_failed");
  }
  getStatus() {
    return {
      connected: this.socket.connected,
      reconnectAttempts: this.reconnectAttempts,
      isMonitoring: this.isMonitoring,
    };
  }
}
