// PRODUCTION WEBSOCKET CLUSTERING FOR 500K+ USERS
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import { QueryOptimizer, DatabaseCache } from './db.production.js';

class SocketCluster {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
      },
      // Optimize for high concurrency
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000,
      maxHttpBufferSize: 1e6, // 1MB
      allowEIO3: true,
    });

    this.setupRedisAdapter();
    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupMetrics();
  }

  async setupRedisAdapter() {
    try {
      // Redis adapter for horizontal scaling
      const pubClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Redis retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        },
      });

      const subClient = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);

      this.io.adapter(createAdapter(pubClient, subClient));
      
      console.log('✅ Socket.IO Redis adapter connected');
    } catch (error) {
      console.error('❌ Redis adapter setup failed:', error);
    }
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await QueryOptimizer.findUserById(decoded.userId);
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Rate limiting middleware
    this.io.use(async (socket, next) => {
      const rateLimitKey = `rate_limit:${socket.userId}`;
      const current = await DatabaseCache.get(rateLimitKey) || 0;
      
      if (current > 100) { // 100 events per minute
        return next(new Error('Rate limit exceeded'));
      }
      
      await DatabaseCache.set(rateLimitKey, current + 1, 60);
      next();
    });
  }

  setupEventHandlers() {
    this.io.on('connection', async (socket) => {
      console.log(`👤 User ${socket.user.username} connected (${socket.id})`);
      
      // Join user to their personal room
      await socket.join(`user:${socket.userId}`);
      
      // Update user online status
      await this.updateUserStatus(socket.userId, true);
      
      // Notify friends about online status
      await this.notifyFriendsStatus(socket.userId, true);

      // Handle private messages
      socket.on('send_message', async (data) => {
        await this.handlePrivateMessage(socket, data);
      });

      // Handle message read receipts
      socket.on('mark_read', async (data) => {
        await this.handleMarkRead(socket, data);
      });

      // Handle typing indicators
      socket.on('typing_start', async (data) => {
        await this.handleTyping(socket, data, true);
      });

      socket.on('typing_stop', async (data) => {
        await this.handleTyping(socket, data, false);
      });

      // Handle friend requests
      socket.on('send_friend_request', async (data) => {
        await this.handleFriendRequest(socket, data);
      });

      // Handle voice/video calls
      socket.on('call_user', async (data) => {
        await this.handleCall(socket, data);
      });

      socket.on('call_response', async (data) => {
        await this.handleCallResponse(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log(`👤 User ${socket.user.username} disconnected`);
        await this.updateUserStatus(socket.userId, false);
        await this.notifyFriendsStatus(socket.userId, false);
      });
    });
  }

  async handlePrivateMessage(socket, data) {
    try {
      const { receiverId, content, type = 'TEXT', fileUrl, fileName } = data;

      // Validate receiver exists
      const receiver = await QueryOptimizer.findUserById(receiverId);
      if (!receiver) {
        return socket.emit('error', { message: 'Receiver not found' });
      }

      // Create message in database
      const message = await prisma.message.create({
        data: {
          content,
          type,
          senderId: socket.userId,
          receiverId,
          fileUrl,
          fileName,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              nickname: true,
              profilePic: true,
            },
          },
        },
      });

      // Invalidate message cache
      await DatabaseCache.invalidatePattern(`messages:${socket.userId}:${receiverId}:*`);
      await DatabaseCache.invalidatePattern(`messages:${receiverId}:${socket.userId}:*`);

      // Send to receiver if online
      this.io.to(`user:${receiverId}`).emit('new_message', message);
      
      // Confirm to sender
      socket.emit('message_sent', { messageId: message.id });

      // Update metrics
      await this.updateMetrics('message_sent');

    } catch (error) {
      console.error('Message handling error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  async handleMarkRead(socket, data) {
    try {
      const { messageIds } = data;

      await prisma.message.updateMany({
        where: {
          id: { in: messageIds },
          receiverId: socket.userId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      // Notify sender about read receipts
      const messages = await prisma.message.findMany({
        where: { id: { in: messageIds } },
        select: { senderId: true },
      });

      const senderIds = [...new Set(messages.map(m => m.senderId))];
      
      for (const senderId of senderIds) {
        this.io.to(`user:${senderId}`).emit('messages_read', {
          messageIds,
          readBy: socket.userId,
        });
      }

    } catch (error) {
      console.error('Mark read error:', error);
    }
  }

  async handleTyping(socket, data, isTyping) {
    try {
      const { receiverId } = data;
      
      this.io.to(`user:${receiverId}`).emit('typing_status', {
        userId: socket.userId,
        username: socket.user.username,
        isTyping,
      });
    } catch (error) {
      console.error('Typing indicator error:', error);
    }
  }

  async handleFriendRequest(socket, data) {
    try {
      const { receiverId } = data;

      // Check if request already exists
      const existing = await prisma.friendRequest.findFirst({
        where: {
          senderId: socket.userId,
          receiverId,
        },
      });

      if (existing) {
        return socket.emit('error', { message: 'Friend request already sent' });
      }

      // Create friend request
      const friendRequest = await prisma.friendRequest.create({
        data: {
          senderId: socket.userId,
          receiverId,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              nickname: true,
              profilePic: true,
            },
          },
        },
      });

      // Notify receiver
      this.io.to(`user:${receiverId}`).emit('friend_request', friendRequest);
      
      // Confirm to sender
      socket.emit('friend_request_sent', { requestId: friendRequest.id });

    } catch (error) {
      console.error('Friend request error:', error);
      socket.emit('error', { message: 'Failed to send friend request' });
    }
  }

  async handleCall(socket, data) {
    try {
      const { receiverId, type, offer } = data;

      // Check if receiver is online
      const receiverSockets = await this.io.in(`user:${receiverId}`).fetchSockets();
      
      if (receiverSockets.length === 0) {
        return socket.emit('call_failed', { reason: 'User offline' });
      }

      // Forward call to receiver
      this.io.to(`user:${receiverId}`).emit('incoming_call', {
        callerId: socket.userId,
        callerName: socket.user.username,
        type,
        offer,
      });

    } catch (error) {
      console.error('Call handling error:', error);
    }
  }

  async handleCallResponse(socket, data) {
    try {
      const { callerId, accepted, answer } = data;

      this.io.to(`user:${callerId}`).emit('call_response', {
        responderId: socket.userId,
        accepted,
        answer,
      });

    } catch (error) {
      console.error('Call response error:', error);
    }
  }

  async updateUserStatus(userId, isOnline) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isOnline,
          lastSeen: new Date(),
        },
      });

      // Invalidate user cache
      await DatabaseCache.del(`user:${userId}`);

    } catch (error) {
      console.error('User status update error:', error);
    }
  }

  async notifyFriendsStatus(userId, isOnline) {
    try {
      const friends = await QueryOptimizer.getFriends(userId);
      
      for (const friend of friends) {
        this.io.to(`user:${friend.friendId}`).emit('friend_status', {
          userId,
          isOnline,
          lastSeen: new Date(),
        });
      }
    } catch (error) {
      console.error('Friend status notification error:', error);
    }
  }

  async updateMetrics(event) {
    try {
      await prisma.analytics.create({
        data: {
          event,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Metrics update error:', error);
    }
  }

  setupMetrics() {
    // Connection metrics
    setInterval(async () => {
      const connectedUsers = this.io.sockets.sockets.size;
      await DatabaseCache.set('socket_metrics:connected_users', connectedUsers, 60);
      
      console.log(`📊 Connected users: ${connectedUsers}`);
    }, 30000); // Every 30 seconds
  }

  // Graceful shutdown
  async shutdown() {
    console.log('🔄 Shutting down Socket.IO server...');
    this.io.close();
  }
}

export default SocketCluster;