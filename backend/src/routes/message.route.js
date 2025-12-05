import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { messageLimiter, uploadLimiter } from "../middleware/security.js";
import { 
  getMessages, 
  getUsersForSidebar, 
  sendMessage, 
  clearChat, 
  markMessagesAsRead, 
  createCallLog,
  addReaction,
  removeReaction,
  deleteMessage
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, messageLimiter, sendMessage);
router.post("/call-log", protectRoute, createCallLog);
router.post("/reaction/:messageId", protectRoute, addReaction);

router.put("/read/:id", protectRoute, markMessagesAsRead);

router.delete("/reaction/:messageId", protectRoute, removeReaction);
router.delete("/message/:messageId", protectRoute, deleteMessage);
router.delete("/:id", protectRoute, clearChat);

export default router;
