import prisma from "../lib/prisma.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { clearFriendsCache } from "./friend.controller.js";
import { emitToUser } from "../lib/socketHandlers.js";

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
    const messagesWithParsedReactions = await Promise.all(
      messages.map(async (message) => {
        let replyTo = null;
        
        // Fetch reply-to message if replyToId exists
        if (message.replyToId) {
          try {
            replyTo = await prisma.message.findUnique({
              where: { id: message.replyToId },
              select: {
                id: true,
                senderId: true,
                text: true,
                image: true,
                voice: true,
                createdAt: true
              }
            });
          } catch (error) {
            console.error('Error fetching reply-to message:', error);
            // Continue without reply-to data
          }
        }

        return {
          ...message,
          reactions: message.reactions ? JSON.parse(message.reactions) : [],
          replyTo
        };
      })
    );

    res.status(200).json(messagesWithParsedReactions.reverse());
  } catch (error) {
    console.error("Error in getMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
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
      io.to(receiverSocketId).emit("newMessage", callLogMessage);
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

    // Process uploads in parallel for speed
    const uploadPromises = [];
    
    if (image) {
      uploadPromises.push(
        cloudinary.uploader.upload(image, {
          folder: "chat_images",
          resource_type: "image",
          format: 'webp',
          quality: 'auto:good',
          transformation: [
            { width: 1200, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        })
      );
    } else {
      uploadPromises.push(Promise.resolve(null));
    }

    if (voice) {
      uploadPromises.push(
        cloudinary.uploader.upload(voice, {
          folder: "chat_voices",
          resource_type: "video"
        })
      );
    } else {
      uploadPromises.push(Promise.resolve(null));
    }

    // Wait for uploads to complete
    const [imageUpload, voiceUpload] = await Promise.all(uploadPromises);
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
        voiceDuration: voiceDuration || null,
        replyToId: replyTo || null
      }
    });

    // Clear friends cache for both users so last message updates
    clearFriendsCache(senderId);
    clearFriendsCache(receiverId);

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { fullName: true, profilePic: true }
    });
    
    const receiverSocketId = getReceiverSocketId(receiverId);
    
    // Prepare message data for socket
    const messageData = {
      ...newMessage,
      senderName: sender?.fullName,
      senderAvatar: sender?.profilePic
    };

    // 🔥 REAL-TIME: Emit new message to receiver
    emitToUser(receiverId, "newMessage", messageData);

    // 🔥 REAL-TIME: Notify sender that message was delivered
    emitToUser(senderId, "messageDelivered", {
      messageId: newMessage.id,
      deliveredAt: new Date()
    });

    // Return response immediately
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const clearChat = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user.id;

    // Delete all messages between the two users
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
    const myId = req.user.id;

    // Note: The current Prisma schema doesn't have status/readAt fields
    // This is a placeholder that counts messages
    const messages = await prisma.message.findMany({
      where: {
        senderId: senderId,
        receiverId: myId
      },
      select: { id: true }
    });

    // 🔥 REAL-TIME: Notify sender that messages were read
    emitToUser(senderId, "messagesRead", {
      readBy: myId,
      count: messages.length
    });

    res.status(200).json({ message: "Messages marked as read", count: messages.length });
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

    if (!emoji) {
      return res.status(400).json({ error: "Emoji is required" });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: { select: { id: true, fullName: true, nickname: true, profilePic: true } },
        receiver: { select: { id: true, fullName: true, nickname: true, profilePic: true } }
      }
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Get current reactions (parse JSON string)
    let reactions = [];
    try {
      reactions = message.reactions ? JSON.parse(message.reactions) : [];
    } catch (error) {
      reactions = [];
    }
    
    // Remove existing reaction from this user (if any)
    reactions = reactions.filter(r => r.userId !== userId);
    
    // Add new reaction
    reactions.push({
      emoji,
      userId,
      createdAt: new Date().toISOString()
    });

    // Update message with new reactions (stringify for SQLite)
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { reactions: JSON.stringify(reactions) },
      include: {
        sender: { select: { id: true, fullName: true, nickname: true, profilePic: true } },
        receiver: { select: { id: true, fullName: true, nickname: true, profilePic: true } }
      }
    });

    // 🔥 REAL-TIME: Notify both users about reaction
    const parsedReactions = updatedMessage.reactions ? JSON.parse(updatedMessage.reactions) : [];
    const reactionData = {
      messageId,
      reactions: parsedReactions
    };
    
    emitToUser(message.receiverId, "messageReaction", reactionData);
    emitToUser(message.senderId, "messageReaction", reactionData);

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

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: { select: { id: true, fullName: true, nickname: true, profilePic: true } },
        receiver: { select: { id: true, fullName: true, nickname: true, profilePic: true } }
      }
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Get current reactions and remove this user's reaction (parse JSON string)
    let reactions = [];
    try {
      reactions = message.reactions ? JSON.parse(message.reactions) : [];
    } catch (error) {
      reactions = [];
    }
    reactions = reactions.filter(r => r.userId !== userId);

    // Update message with new reactions (stringify for SQLite)
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { reactions: JSON.stringify(reactions) },
      include: {
        sender: { select: { id: true, fullName: true, nickname: true, profilePic: true } },
        receiver: { select: { id: true, fullName: true, nickname: true, profilePic: true } }
      }
    });

    // 🔥 REAL-TIME: Notify both users about reaction removal
    const parsedReactions = updatedMessage.reactions ? JSON.parse(updatedMessage.reactions) : [];
    const reactionData = {
      messageId,
      reactions: parsedReactions
    };
    
    emitToUser(message.receiverId, "messageReaction", reactionData);
    emitToUser(message.senderId, "messageReaction", reactionData);

    res.status(200).json({ message: "Reaction removed", reactions: parsedReactions });
  } catch (error) {
    console.error("Error in removeReaction:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only sender can delete their own message
    if (message.senderId !== userId) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    // Delete the message
    await prisma.message.delete({
      where: { id: messageId }
    });

    // Delete images/voice from cloudinary if exists
    if (message.image) {
      const publicId = message.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`chat_images/${publicId}`).catch(err => console.log("Cloudinary delete error:", err));
    }
    if (message.voice) {
      const publicId = message.voice.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`chat_voices/${publicId}`, { resource_type: 'video' }).catch(err => console.log("Cloudinary delete error:", err));
    }

    // 🔥 REAL-TIME: Notify both users about message deletion
    const deleteData = { 
      messageId, 
      deletedBy: userId, 
      isDeleted: true, 
      deletedAt: new Date() 
    };

    emitToUser(message.receiverId, "messageDeleted", deleteData);
    emitToUser(message.senderId, "messageDeleted", deleteData);

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error in deleteMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
