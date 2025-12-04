import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage, clearChat, markMessagesAsRead } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.put("/read/:id", protectRoute, markMessagesAsRead);
router.delete("/:id", protectRoute, clearChat);

export default router;
