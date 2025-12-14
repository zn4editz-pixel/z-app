import express from "express";
import { getSettings, updateSettings } from "../controllers/settings.controller.js";
import { protectRoute, isAdmin } from "../middleware/protectRoute.js";

const router = express.Router();

// Public: Get settings/theme
router.get("/", getSettings);

// Admin: Update settings
router.put("/", protectRoute, isAdmin, updateSettings);

export default router;
