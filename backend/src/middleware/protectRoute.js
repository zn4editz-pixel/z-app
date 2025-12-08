import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

// 🔐 Middleware to protect routes
export const protectRoute = async (req, res, next) => {
  try {
    // Check both cookie and Authorization header for token (mobile compatibility)
    let token = req.cookies?.jwt;
    
    // If no cookie, check Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        profilePic: true,
        isBlocked: true,
        isSuspended: true,
        suspensionEndTime: true,
        suspensionReason: true,
        isVerified: true,
        hasCompletedProfile: true,
        // Don't select password
      }
    });
    
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User not found in database" });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        error: "Access denied: You have been blocked by the admin.",
        type: "blocked",
      });
    }

    const now = new Date();
    if (user.isSuspended && user.suspensionEndTime && new Date(user.suspensionEndTime) > now) {
      return res.status(403).json({
        error: "Access denied: Your account is suspended.",
        type: "suspended",
        reason: user.suspensionReason || "No reason provided",
        until: user.suspensionEndTime,
      });
    }

    // ✅ Attach user to request
    req.user = user;
    next();
  } catch (err) {
    console.error("protectRoute error:", err);
    return res.status(500).json({ error: "Server error in protectRoute" });
  }
};

// 🛡️ Middleware to check admin access
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: No user data in request" });
    }
    
    // Check if user email matches admin email
    const isAdminUser = req.user.email === process.env.ADMIN_EMAIL;
    
    if (!isAdminUser) {
      console.log(`❌ Admin access denied for user: ${req.user.email}`);
      return res.status(403).json({ error: "Access denied: Admins only" });
    }
    
    console.log(`✅ Admin access granted for: ${req.user.email}`);
    next();
  } catch (err) {
    console.error("isAdmin error:", err);
    return res.status(500).json({ error: "Server error in admin check" });
  }
};