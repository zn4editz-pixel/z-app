import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Cache for sidebar users (1 minute TTL)
let sidebarUsersCache = new Map();
const SIDEBAR_CACHE_TTL = 60000; // 1 minute

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id.toString();
    const now = Date.now();
    
    // Check cache
    const cached = sidebarUsersCache.get(loggedInUserId);
    if (cached && (now - cached.timestamp) < SIDEBAR_CACHE_TTL) {
      return res.status(200).json(cached.data);
    }

    // Fetch only friends, not all users
    const user = await User.findById(loggedInUserId)
      .select('friends')
      .populate('friends', 'username nickname profilePic isOnline lastSeen isVerified')
      .lean();

    const filteredUsers = user?.friends || [];
    
    // Cache result
    sidebarUsersCache.set(loggedInUserId, {
      data: filteredUsers,
      timestamp: now
    });

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;
    
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 50; // Reduced to 50 for faster load

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId }
      ]
    })
    .select('senderId receiverId text image voice voiceDuration messageType callData status deliveredAt readAt createdAt replyTo reactions isDeleted')
    .populate('replyTo', 'text image voice senderId')
    .populate('reactions.userId', 'fullName profilePic')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(page * limit)
    .lean();

    res.status(200).json(messages.reverse());
  } catch (error) {
    console.error("Error in getMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createCallLog = async (req, res) => {
  try {
    const { receiverId, callType, duration } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !callType || duration === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create call log message
    const callLogMessage = new Message({
      senderId,
      receiverId,
      messageType: "call",
      callData: {
        type: callType, // "audio" or "video"
        duration: duration, // in seconds
        timestamp: new Date()
      }
    });

    await callLogMessage.save();

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
    const senderId = req.user._id;

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
    const newMessage = new Message({
      senderId,
      receiverId,
      text: text || "",
      image: imageUrl,
      voice: voiceUrl,
      voiceDuration: voiceDuration || null,
      replyTo: replyTo || null,
      status: 'sent'
    });

    // Save message and populate replyTo in parallel
    const savePromise = newMessage.save();
    const senderPromise = User.findById(senderId).select("fullName profilePic").lean();
    
    await savePromise;
    
    // Populate replyTo if exists
    if (replyTo) {
      await newMessage.populate('replyTo', 'text image voice senderId');
    }

    const sender = await senderPromise;
    const receiverSocketId = getReceiverSocketId(receiverId);
    
    // Prepare message data for socket
    const messageData = {
      _id: newMessage._id,
      senderId,
      receiverId,
      text: newMessage.text,
      image: newMessage.image,
      voice: newMessage.voice,
      voiceDuration: newMessage.voiceDuration,
      replyTo: newMessage.replyTo,
      status: newMessage.status,
      createdAt: newMessage.createdAt,
      reactions: [],
      senderName: sender?.fullName,
      senderAvatar: sender?.profilePic
    };

    if (receiverSocketId) {
      // Mark as delivered if receiver is online
      newMessage.status = 'delivered';
      newMessage.deliveredAt = new Date();
      messageData.status = 'delivered';
      messageData.deliveredAt = newMessage.deliveredAt;
      
      // Save status update (non-blocking)
      newMessage.save().catch(err => console.error('Failed to update message status:', err));

      // Emit to receiver instantly
      io.to(receiverSocketId).emit("newMessage", messageData);

      // Notify sender that message was delivered
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageDelivered", {
          messageId: newMessage._id,
          deliveredAt: newMessage.deliveredAt
        });
      }
    }

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
    const myId = req.user._id;

    // Delete all messages between the two users
    await Message.deleteMany({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId }
      ]
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
    const myId = req.user._id;

    // Mark all unread messages from sender as read
    const result = await Message.updateMany(
      {
        senderId: senderId,
        receiverId: myId,
        status: { $ne: 'read' }
      },
      {
        $set: {
          status: 'read',
          readAt: new Date()
        }
      }
    );

    // Notify sender that messages were read
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", {
        readBy: myId,
        count: result.modifiedCount
      });
    }

    res.status(200).json({ message: "Messages marked as read", count: result.modifiedCount });
  } catch (error) {
    console.error("Error in markMessagesAsRead:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ error: "Emoji is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user already reacted
    const existingReaction = message.reactions.find(
      r => r.userId.toString() === userId.toString()
    );

    if (existingReaction) {
      // Update existing reaction
      existingReaction.emoji = emoji;
      existingReaction.createdAt = new Date();
    } else {
      // Add new reaction
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    // Populate user info for reactions
    await message.populate('reactions.userId', 'fullName profilePic');

    // Notify both users
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    const senderSocketId = getReceiverSocketId(message.senderId);
    
    const reactionData = {
      messageId,
      reactions: message.reactions,
      reactedBy: userId
    };

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReaction", reactionData);
    }
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageReaction", reactionData);
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in addReaction:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Remove user's reaction
    message.reactions = message.reactions.filter(
      r => r.userId.toString() !== userId.toString()
    );

    await message.save();
    await message.populate('reactions.userId', 'fullName profilePic');

    // Notify both users
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    const senderSocketId = getReceiverSocketId(message.senderId);
    
    const reactionData = {
      messageId,
      reactions: message.reactions,
      removedBy: userId
    };

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReaction", reactionData);
    }
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageReaction", reactionData);
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in removeReaction:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only sender can delete their own message
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    // Mark as deleted instead of removing
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    // Delete images/voice from cloudinary if exists
    if (message.image) {
      const publicId = message.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`chat_images/${publicId}`).catch(err => console.log("Cloudinary delete error:", err));
    }
    if (message.voice) {
      const publicId = message.voice.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`chat_voices/${publicId}`, { resource_type: 'video' }).catch(err => console.log("Cloudinary delete error:", err));
    }

    // Notify both users
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    const senderSocketId = getReceiverSocketId(message.senderId);
    
    const deleteData = { messageId, deletedBy: userId, isDeleted: true, deletedAt: message.deletedAt };

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", deleteData);
    }
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeleted", deleteData);
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error in deleteMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
