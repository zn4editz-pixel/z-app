import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId }
    }).select("-password");

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

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, voice, voiceDuration } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image && !voice) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "chat_images",
        resource_type: "image"
      });
      imageUrl = uploadResponse.secure_url;
    }

    let voiceUrl;
    if (voice) {
      const uploadResponse = await cloudinary.uploader.upload(voice, {
        folder: "chat_voices",
        resource_type: "video" // Cloudinary uses 'video' for audio files
      });
      voiceUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: text || "",
      image: imageUrl || null,
      voice: voiceUrl || null,
      voiceDuration: voiceDuration || null,
      status: 'sent'
    });

    await newMessage.save();

    // Fetch sender details for toast
    const sender = await User.findById(senderId).select("fullName profilePic");

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      // Mark as delivered if receiver is online
      newMessage.status = 'delivered';
      newMessage.deliveredAt = new Date();
      await newMessage.save();

      io.to(receiverSocketId).emit("newMessage", {
        _id: newMessage._id,
        senderId,
        receiverId,
        text: newMessage.text,
        image: newMessage.image,
        voice: newMessage.voice,
        voiceDuration: newMessage.voiceDuration,
        status: newMessage.status,
        deliveredAt: newMessage.deliveredAt,
        createdAt: newMessage.createdAt,
        senderName: sender.fullName,
        senderAvatar: sender.profilePic
      });

      // Notify sender that message was delivered
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageDelivered", {
          messageId: newMessage._id,
          deliveredAt: newMessage.deliveredAt
        });
      }
    }

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
