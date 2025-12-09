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
    
    if (import.meta.env.DEV) console.log('🔍 Socket Monitor: Started');
    
    // Monitor connection events
    this.socket.on('connect', () => {
      if (import.meta.env.DEV) console.log('✅ Socket Monitor: Connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      
      // Re-register user on reconnect
      if (this.authUser?.id) {
        if (import.meta.env.DEV) console.log(`📝 Socket Monitor: Re-registering user ${this.authUser.id}`);
        this.socket.emit('register-user', this.authUser.id);
      }
    });

    this.socket.on('disconnect', (reason) => {
      if (import.meta.env.DEV) console.warn(`⚠️ Socket Monitor: Disconnected (${reason})`);
      
      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.attemptReconnect();
      } else if (reason === 'transport close' || reason === 'transport error') {
        // Network issue, try to reconnect
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      if (import.meta.env.DEV) console.error('❌ Socket Monitor: Connection error', error.message);
      this.attemptReconnect();
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      if (import.meta.env.DEV) console.log(`🔄 Socket Monitor: Reconnect attempt ${attemptNumber}`);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      if (import.meta.env.DEV) console.log(`✅ Socket Monitor: Reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_failed', () => {
      if (import.meta.env.DEV) console.error('❌ Socket Monitor: Reconnection failed');
    });

    // Start ping monitoring
    this.startPingMonitor();
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (import.meta.env.DEV) console.error('❌ Socket Monitor: Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    if (import.meta.env.DEV) console.log(`🔄 Socket Monitor: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (!this.socket.connected) {
        if (import.meta.env.DEV) console.log('🔌 Socket Monitor: Attempting manual reconnect');
        this.socket.connect();
      }
    }, delay);
  }

  startPingMonitor() {
    // Send periodic pings to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.socket.connected) {
        const start = Date.now();
        this.socket.emit('ping', {}, () => {
          const latency = Date.now() - start;
          if (import.meta.env.DEV) console.log(`🏓 Socket Monitor: Ping ${latency}ms`);
        });
      } else {
        if (import.meta.env.DEV) console.warn('⚠️ Socket Monitor: Socket disconnected, attempting reconnect');
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
    this.socket.off('connect');
    this.socket.off('disconnect');
    this.socket.off('connect_error');
    this.socket.off('reconnect_attempt');
    this.socket.off('reconnect');
    this.socket.off('reconnect_failed');
    
    if (import.meta.env.DEV) console.log('🛑 Socket Monitor: Stopped');
  }

  getStatus() {
    return {
      connected: this.socket.connected,
      reconnectAttempts: this.reconnectAttempts,
      isMonitoring: this.isMonitoring
    };
  }
}
