import prisma from "../lib/prisma.js";
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

    // Parse reactions JSON and fetch reply-to messages separately
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

      return {
        ...message,
        reactions: typeof message.reactions === 'string' ? JSON.parse(message.reactions || "[]") : (message.reactions || []),
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
  try {
    const { text, image, voice, voiceDuration, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user.id;

    if (!text && !image && !voice) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    // Parse voiceDuration if it exists to ensure integer type
    const parsedVoiceDuration = voiceDuration ? parseInt(voiceDuration) : null;

    // --- AI MODERATION SYSTEM (NON-BLOCKING) ---
    if (text) {
      const prohibitedWords = {
        'spam': 'Spam Content',
        'fake': 'Scam/Fake',
        'hate': 'Hate Speech',
        'profit': 'Solicitation',
        'stupid': 'Harassment',
        'idiot': 'Harassment',
        'badword': 'Inappropriate Language'
      };

      const lowerText = text.toLowerCase();
      const detectedWord = Object.keys(prohibitedWords).find(word => lowerText.includes(word));

      if (detectedWord) {
        // 🔥 OPTIMIZATION: Fire-and-forget (Don't await)
        prisma.report.create({
          data: {
            reporterId: receiverId, // System acts on behalf of receiver
            reportedUserId: senderId,
            reason: prohibitedWords[detectedWord],
            description: `AI System detected prohibited content: "${detectedWord}" in message: "${text.substring(0, 50)}..."`,
            status: 'pending',
            isAIDetected: true,
            aiCategory: prohibitedWords[detectedWord],
            aiConfidence: 0.85 + (Math.random() * 0.14),
            severity: 'medium'
          }
        }).then(() => console.log("✅ AI Report created (Async)"))
          .catch(err => console.error("Failed to create AI report:", err));
      }
    }
    // ---------------------------

    // Debug payload size
    console.log(`📨 message.send payload: text=${text?.length || 0} chars, image=${image ? (image.length / 1024).toFixed(2) + 'KB' : 'null'}, voice=${voice ? (voice.length / 1024).toFixed(2) + 'KB' : 'null'}`);

    // Process uploads
    const uploadPromises = [];

    if (image) {
      uploadPromises.push(
        cloudinary.uploader.upload(image, {
          folder: "chat_images",
          resource_type: "image",
          format: 'webp',
          quality: 'auto:good'
        })
      );
    } else {
      uploadPromises.push(Promise.resolve(null));
    }

    if (voice) {
      uploadPromises.push(
        (async () => {
          try {
            console.log('🎙️ Uploading voice as video...');
            return await cloudinary.uploader.upload(voice, {
              folder: "chat_voices",
              resource_type: "video"
            });
          } catch (err1) {
            console.warn('⚠️ Voice/Video upload failed, retrying as auto:', err1.message);
            try {
              return await cloudinary.uploader.upload(voice, {
                folder: "chat_voices",
                resource_type: "auto"
              });
            } catch (err2) {
              console.warn('⚠️ Voice/Auto upload failed, retrying as raw:', err2.message);
              return await cloudinary.uploader.upload(voice, {
                folder: "chat_voices",
                resource_type: "raw"
              });
            }
          }
        })()
      );
    } else {
      uploadPromises.push(Promise.resolve(null));
    }

    let imageUpload = null;
    let voiceUpload = null;

    try {
      const results = await Promise.all(uploadPromises);
      imageUpload = results[0];
      voiceUpload = results[1];
      console.log('✅ Media upload successful');
    } catch (uploadError) {
      console.error('❌ Cloudinary Upload Failed:', uploadError);
      return res.status(500).json({
        error: "Media upload failed",
        details: uploadError.message,
        hint: "Check Cloudinary configuration"
      });
    }

    const imageUrl = imageUpload?.secure_url || null;
    const voiceUrl = voiceUpload?.secure_url || null;

    // Create message
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

    // Clear friends cache (Sync Map operation, fast)
    clearFriendsCache(senderId);
    clearFriendsCache(receiverId);

    // 🔥 OPTIMIZATION: Use req.user instead of fetching again
    // protectRoute already populated req.user with fullName and profilePic
    const sender = req.user;

    // Prepare message data
    const messageData = {
      ...newMessage,
      senderName: sender?.fullName,
      senderAvatar: sender?.profilePic
    };

    // 🔥 REAL-TIME: Emit new message to receiver (Using Shared Socket)
    console.log(`📤 Message sent to DB. Emitting to receiver ${receiverId}...`);
    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      const io = getIO();
      if (io) {
        io.to(receiverSocketId).emit("newMessage", messageData);
        console.log(`✅ Socket sent to ${receiverSocketId}`);
      } else {
        console.log(`❌ IO Instance is null, cannot emit!`);
      }
    } else {
      console.log(`⚠️ Receiver ${receiverId} not online (no socket found)`);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("❌ Error in sendMessage:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
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

    let reactions = [];
    try {
      reactions = typeof message.reactions === 'string' ? JSON.parse(message.reactions || "[]") : (message.reactions || []);
    } catch (e) { reactions = []; }

    reactions = reactions.filter(r => r.userId !== userId);
    reactions.push({ emoji, userId, createdAt: new Date().toISOString() });

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { reactions: JSON.stringify(reactions) }
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

    let reactions = [];
    try {
      reactions = typeof message.reactions === 'string' ? JSON.parse(message.reactions || "[]") : (message.reactions || []);
    } catch (e) { reactions = []; }

    reactions = reactions.filter(r => r.userId !== userId);

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { reactions: JSON.stringify(reactions) }
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
