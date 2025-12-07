import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    voice: {
      type: String,
    },
    voiceDuration: {
      type: Number,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'voice', 'call'],
      default: 'text'
    },
    callData: {
      type: {
        type: String,
        enum: ['audio', 'video']
      },
      duration: Number, // in seconds
      timestamp: Date
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    },
    deliveredAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
    reactions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      emoji: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      }
    }],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// ✅ Performance Optimization: Add database indexes for faster queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 }); // Conversation queries
messageSchema.index({ receiverId: 1, status: 1 }); // Unread messages
messageSchema.index({ senderId: 1, createdAt: -1 }); // Sent messages
messageSchema.index({ createdAt: -1 }); // Recent messages
messageSchema.index({ isDeleted: 1, createdAt: -1 }); // Non-deleted messages

const Message = mongoose.model("Message", messageSchema);

export default Message;
