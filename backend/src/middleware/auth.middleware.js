import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

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
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized - Invalid or Expired Token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        nickname: true,
        bio: true,
        profilePic: true,
        isVerified: true,
        hasCompletedProfile: true,
        country: true,
        countryCode: true,
        city: true,
        region: true,
        timezone: true,
        isVPN: true,
        lastIP: true,
        isOnline: true,
        lastSeen: true,
        isBlocked: true,
        isSuspended: true,
        suspensionEndTime: true,
        suspensionReason: true,
        verificationStatus: true,
        verificationReason: true,
        verificationIdProof: true,
        verificationRequestedAt: true,
        verificationReviewedAt: true,
        verificationReviewedBy: true,
        verificationAdminNote: true,
        // friends: true, // Removed - not supported in SQLite
        // friendRequestsSent: true, // Removed - not supported in SQLite
        // friendRequestsReceived: true, // Removed - not supported in SQLite
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Access denied - User is blocked" });
    }

    if (
      user.isSuspended &&
      user.suspensionEndTime &&
      new Date(user.suspensionEndTime) > new Date()
    ) {
      return res.status(403).json({
        message: `Account suspended until ${new Date(
          user.suspensionEndTime
        ).toLocaleString()} - Reason: ${user.suspensionReason || "No reason provided"}`,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error in protectRoute middleware:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
