import express from "express";
import {
	signup,
	login,
	logout,
	updateProfile,
	checkAuth,
	forgotPassword,
	verifyResetOTP,
	resetPassword,
	changePassword,
	sendPasswordChangeOTP,
	completeProfileSetup,
	sendEmailChangeOTP,
	verifyEmailChangeOTP,
} from "../controllers/auth.controller.js";
// Assuming 'auth.middleware.js' is correct. If it's 'protectRoute.js', let me know.
import { protectRoute } from "../middleware/auth.middleware.js"; 
import { authLimiter } from "../middleware/security.js";

const router = express.Router();

// 🔓 Public Routes (with rate limiting)
router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.post("/forgot-password", authLimiter, forgotPassword); // Send OTP to email
router.post("/verify-reset-otp", authLimiter, verifyResetOTP); // Verify OTP
router.post("/reset-password", authLimiter, resetPassword); // Reset password with OTP

// 🔒 Protected Routes
router.get("/check", protectRoute, checkAuth);
router.put("/update-profile", protectRoute, updateProfile);
router.post("/setup-profile", protectRoute, completeProfileSetup);

// Password change with OTP
router.post("/send-password-change-otp", protectRoute, sendPasswordChangeOTP);
router.post("/change-password", protectRoute, changePassword);

// Email change with OTP
router.post("/send-email-otp", protectRoute, sendEmailChangeOTP);
router.post("/verify-email-change", protectRoute, verifyEmailChangeOTP);

export default router;