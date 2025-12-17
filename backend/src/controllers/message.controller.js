import prisma from "../lib/db.js";
import cloudinary from "../lib/cloudinary.js";
import { clearFriendsCache } from "./friend.controller.js";
import { getReceiverSocketId, getIO } from "../lib/socketHandlers.js";

// Cache for sidebar users (1 minute TTL)
let sidebarUsersCache = new Map();
const SIDEBAR_CACHE_TTL = 60000; // 1 minute

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const now = Date.now();

    // Check cache
    const cached = sidebarUsersCache.get(loggedInUserId);
    if (cached && (now - cached.timestamp) < SIDEBAR_CACHE_TTL) {
      return res.status(200).json(cached.data);
    }

    // Fetch friends using FriendRequest table (SQLite compatible) - only accepted friendships
    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        AND: [
          {
            OR: [
              { senderId: loggedInUserId },
              { receiverId: loggedInUserId }
            ]
          },
          { status: "accepted" }
        ]
      }
    });

    // Extract friend IDs
    const friendIds = friendRequests.map(request => {
      return request.senderId === loggedInUserId ? request.receiverId : request.senderId;
    });

    if (friendIds.length === 0) {
      return res.status(200).json([]);
    }

    // Get friends details
    const friends = await prisma.user.findMany({
      where: {
        id: { in: friendIds }
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        profilePic: true,
        isOnline: true,
        lastSeen: true,
        isVerified: true
      }
    });

    // Cache result
    sidebarUsersCache.set(loggedInUserId, {
      data: friends,
      timestamp: now
    });

    res.status(200).json(friends);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get unread message counts for sidebar badges
export const getUnreadCounts = async (req, res) => {
  try {
    const myId = req.user.id;

    // Get count of unread messages grouped by sender
    const unreadMessages = await prisma.message.groupBy({
      by: ['senderId'],
      where: {
        receiverId: myId,
        status: { not: 'read' },
        isDeleted: false
      },
      _count: {
        id: true
      }
    });

    // Format as { senderId: count }
    const unreadCounts = {};
    unreadMessages.forEach(item => {
      unreadCounts[item.senderId] = item._count.id;
    });

    console.log(`📊 Unread counts for ${myId}:`, unreadCounts);
    res.status(200).json(unreadCounts);
  } catch (error) {
    console.error("Error in getUnreadCounts:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user.id;

    console.log(`📥 getMessages: Fetching messages between ${myId} and ${userToChatId}`);

    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 50;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: myId, receiverId: userToChatId },
          { senderId: userToChatId, receiverId: myId }
        ]
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        text: true,
        image: true,
        voice: true,
        voiceDuration: true,
        isCallLog: true,
        callType: true,
        callDuration: true,
        callStatus: true,
        callInitiator: true,
        reactions: true,
        replyToId: true,
        isDeleted: true,
        deletedAt: true,
        status: true,
        deliveredAt: true,
        readAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: page * limit
    });

    // Parse reactions and fetch reply-to messages separately
    // 🔥 ULTRA-OPTIMIZATION: Batch fetch all reply-to messages in ONE query
    const replyIds = [...new Set(messages.filter(m => m.replyToId).map(m => m.replyToId))];
    let repliesMap = {};

    if (replyIds.length > 0) {
      const replies = await prisma.message.findMany({
        where: { id: { in: replyIds } },
        select: {
          id: true,
          senderId: true,
          text: true,
          image: true,
          voice: true,
          createdAt: true
        }
      });
      // Convert to map for O(1) lookup
      replies.forEach(r => { repliesMap[r.id] = r; });
    }

    const messagesWithParsedReactions = messages.map((message) => {
      // O(1) lookup from ephemeral map
      const replyTo = message.replyToId ? repliesMap[message.replyToId] : null;

      // Handle reactions - PostgreSQL JSON field or legacy string
      let reactions = [];
      if (message.reactions) {
        if (typeof message.reactions === 'string') {
          try {
            reactions = JSON.parse(message.reactions);
          } catch (e) {
            reactions = [];
          }
        } else if (Array.isArray(message.reactions)) {
          reactions = message.reactions;
        } else {
          reactions = [];
        }
      }

      return {
        ...message,
        reactions,
        replyTo
      };
    });

    console.log(`✅ getMessages: Returning ${messagesWithParsedReactions.length} messages`);
    res.status(200).json(messagesWithParsedReactions.reverse());
  } catch (error) {
    console.error("❌ Error in getMessages:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const createCallLog = async (req, res) => {
  try {
    const { receiverId, callType, duration, status } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !callType || duration === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create call log message
    const callLogMessage = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        isCallLog: true,
        callType,
        callDuration: duration,
        callStatus: status || "completed",
        callInitiator: senderId
      }
    });

    // Emit to receiver
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      const io = getIO();
      if (io) {
        io.to(receiverSocketId).emit("newMessage", callLogMessage);
      }
    }

    res.status(201).json(callLogMessage);
  } catch (error) {
    console.error("Error in createCallLog:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { text, image, voice, voiceDuration, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user.id;

    if (!text && !image && !voice) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    // 🚀 SPEED OPTIMIZATION: Respond immediately for text-only messages
    if (text && !image && !voice) {
      // Create message immediately
      const newMessage = await prisma.message.create({
        data: {
          senderId,
          receiverId,
          text: text.trim(),
          replyToId: replyTo || null
        }
      });

      // Prepare optimized message data
      const messageData = {
        ...newMessage,
        senderName: req.user?.fullName,
        senderAvatar: req.user?.profilePic
      };

      // 🔥 INSTANT SOCKET EMIT (Non-blocking)
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        const io = getIO();
        io?.to(receiverSocketId).emit("newMessage", messageData);
      }

      // 🔥 ASYNC OPERATIONS (Fire-and-forget)
      setImmediate(() => {
        // Clear cache async
        clearFriendsCache(senderId);
        clearFriendsCache(receiverId);
        
        // AI moderation async (if needed)
        if (text) {
          const prohibitedWords = ['spam', 'fake', 'hate', 'profit', 'stupid', 'idiot'];
          const lowerText = text.toLowerCase();
          const detectedWord = prohibitedWords.find(word => lowerText.includes(word));
          
          if (detectedWord) {
            prisma.report.create({
              data: {
                reporterId: receiverId,
                reportedUserId: senderId,
                reason: 'AI Detection',
                description: `AI detected: "${detectedWord}"`,
                status: 'pending',
                isAIDetected: true,
                aiCategory: 'Auto-flagged',
                aiConfidence: 0.9,
                severity: 'medium'
              }
            }).catch(err => console.error("AI report failed:", err));
          }
        }
      });

      const responseTime = Date.now() - startTime;
      console.log(`⚡ Fast text message sent in ${responseTime}ms`);
      
      return res.status(201).json(newMessage);
    }

    // 🔥 MEDIA MESSAGES: Optimized parallel processing
    const parsedVoiceDuration = voiceDuration ? parseInt(voiceDuration) : null;
    
    // Parallel upload processing
    const uploadPromises = [];
    
    if (image) {
      uploadPromises.push(
        cloudinary.uploader.upload(image, {
          folder: "chat_images",
          resource_type: "image",
          format: 'webp',
          quality: 'auto:low', // Faster upload
          transformation: [
            { width: 800, height: 600, crop: 'limit' } // Reduce size
          ]
        })
      );
    }
    
    if (voice) {
      uploadPromises.push(
        cloudinary.uploader.upload(voice, {
          folder: "chat_voices",
          resource_type: "auto"
        })
      );
    }

    // Wait for uploads
    const uploadResults = await Promise.all(uploadPromises);
    let imageUrl = null, voiceUrl = null;
    
    if (image) imageUrl = uploadResults[0]?.secure_url;
    if (voice) voiceUrl = uploadResults[uploadPromises.length - 1]?.secure_url;

    // Create message with media
    const newMessage = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        text: text || "",
        image: imageUrl,
        voice: voiceUrl,
        voiceDuration: parsedVoiceDuration || 0,
        replyToId: replyTo || null
      }
    });

    // Prepare message data
    const messageData = {
      ...newMessage,
      senderName: req.user?.fullName,
      senderAvatar: req.user?.profilePic
    };

    // Emit to receiver
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      const io = getIO();
      io?.to(receiverSocketId).emit("newMessage", messageData);
    }

    // Async cleanup
    setImmediate(() => {
      clearFriendsCache(senderId);
      clearFriendsCache(receiverId);
    });

    const responseTime = Date.now() - startTime;
    console.log(`📤 Media message sent in ${responseTime}ms`);
    
    res.status(201).json(newMessage);
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Message failed after ${responseTime}ms:`, error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const clearChat = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user.id;

    await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: myId, receiverId: userToChatId },
          { senderId: userToChatId, receiverId: myId }
        ]
      }
    });

    res.status(200).json({ message: "Chat cleared successfully" });
  } catch (error) {
    console.error("Error in clearChat:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const userId = req.user.id;

    const unreadMessages = await prisma.message.findMany({
      where: {
        senderId: senderId,
        receiverId: userId,
        status: { not: "read" }
      },
      select: { id: true, senderId: true }
    });

    if (unreadMessages.length > 0) {
      await prisma.message.updateMany({
        where: {
          id: { in: unreadMessages.map(msg => msg.id) }
        },
        data: {
          status: "read",
          readAt: new Date()
        }
      });

      // Emit read receipts
      const io = getIO();
      if (io) {
        const uniqueSenders = [...new Set(unreadMessages.map(m => m.senderId))];
        uniqueSenders.forEach(sId => {
          const sSocket = getReceiverSocketId(sId);
          if (sSocket) {
            io.to(sSocket).emit("messagesRead", {
              receiverId: userId,
              messageIds: unreadMessages.filter(m => m.senderId === sId).map(m => m.id)
            });
          }
        });
      }
    }

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error in markMessagesAsRead:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    if (!emoji) return res.status(400).json({ error: "Emoji is required" });

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: "Message not found" });

    // Handle reactions - PostgreSQL JSON field or legacy string
    let reactions = [];
    if (message.reactions) {
      if (typeof message.reactions === 'string') {
        try {
          reactions = JSON.parse(message.reactions);
        } catch (e) {
          reactions = [];
        }
      } else if (Array.isArray(message.reactions)) {
        reactions = message.reactions;
      } else {
        reactions = [];
      }
    }

    reactions = reactions.filter(r => r.userId !== userId);
    reactions.push({ emoji, userId, createdAt: new Date().toISOString() });

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { reactions: reactions } // Store as JSON, not string
    });

    const parsedReactions = reactions;
    const reactionData = { messageId, reactions: parsedReactions };

    const io = getIO();
    if (io) {
      const receiverSocket = getReceiverSocketId(message.receiverId);
      const senderSocket = getReceiverSocketId(message.senderId);
      if (receiverSocket) io.to(receiverSocket).emit("messageReaction", reactionData);
      if (senderSocket) io.to(senderSocket).emit("messageReaction", reactionData);
    }

    res.status(200).json({ message: "Reaction added", reactions: parsedReactions });
  } catch (error) {
    console.error("Error in addReaction:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: "Message not found" });

    // Handle reactions - PostgreSQL JSON field or legacy string
    let reactions = [];
    if (message.reactions) {
      if (typeof message.reactions === 'string') {
        try {
          reactions = JSON.parse(message.reactions);
        } catch (e) {
          reactions = [];
        }
      } else if (Array.isArray(message.reactions)) {
        reactions = message.reactions;
      } else {
        reactions = [];
      }
    }

    reactions = reactions.filter(r => r.userId !== userId);

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { reactions: reactions } // Store as JSON, not string
    });

    const reactionData = { messageId, reactions };
    const io = getIO();
    if (io) {
      const receiverSocket = getReceiverSocketId(message.receiverId);
      const senderSocket = getReceiverSocketId(message.senderId);
      if (receiverSocket) io.to(receiverSocket).emit("messageReaction", reactionData);
      if (senderSocket) io.to(senderSocket).emit("messageReaction", reactionData);
    }

    res.status(200).json({ message: "Reaction removed", reactions });
  } catch (error) {
    console.error("Error in removeReaction:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (message.senderId !== userId) return res.status(403).json({ error: "You can only delete your own messages" });

    await prisma.message.delete({ where: { id: messageId } });

    if (message.image) {
      const publicId = message.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`chat_images/${publicId}`).catch(err => console.log("Cloudinary delete error:", err));
    }
    if (message.voice) {
      const publicId = message.voice.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`chat_voices/${publicId}`, { resource_type: 'video' }).catch(err => console.log("Cloudinary delete error:", err));
    }

    const deleteData = { messageId, deletedBy: userId, isDeleted: true, deletedAt: new Date() };
    const io = getIO();
    if (io) {
      const receiverSocket = getReceiverSocketId(message.receiverId);
      const senderSocket = getReceiverSocketId(message.senderId);
      if (receiverSocket) io.to(receiverSocket).emit("messageDeleted", deleteData);
      if (senderSocket) io.to(senderSocket).emit("messageDeleted", deleteData);
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error in deleteMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
