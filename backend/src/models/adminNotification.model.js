import mongoose from "mongoose";

const adminNotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // null means broadcast to all users
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["success", "warning", "error", "info"],
      default: "info",
    },
    color: {
      type: String,
      enum: ["green", "red", "blue", "yellow", "orange"],
      default: "blue",
    },
    isBroadcast: {
      type: Boolean,
      default: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for faster queries
adminNotificationSchema.index({ recipient: 1, createdAt: -1 });
adminNotificationSchema.index({ isBroadcast: 1, createdAt: -1 });

const AdminNotification = mongoose.model("AdminNotification", adminNotificationSchema);

export default AdminNotification;
