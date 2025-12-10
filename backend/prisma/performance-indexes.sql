-- ⚡ PERFORMANCE OPTIMIZATION INDEXES
-- Run this SQL to dramatically improve query performance

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_username ON "User"(username);
CREATE INDEX IF NOT EXISTS idx_user_isOnline ON "User"("isOnline");
CREATE INDEX IF NOT EXISTS idx_user_isSuspended ON "User"("isSuspended");
CREATE INDEX IF NOT EXISTS idx_user_createdAt ON "User"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_user_lastSeen ON "User"("lastSeen" DESC);

-- Message table indexes
CREATE INDEX IF NOT EXISTS idx_message_senderId ON "Message"("senderId");
CREATE INDEX IF NOT EXISTS idx_message_receiverId ON "Message"("receiverId");
CREATE INDEX IF NOT EXISTS idx_message_createdAt ON "Message"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_message_sender_receiver ON "Message"("senderId", "receiverId");
CREATE INDEX IF NOT EXISTS idx_message_conversation ON "Message"("senderId", "receiverId", "createdAt" DESC);

-- Report table indexes
CREATE INDEX IF NOT EXISTS idx_report_status ON "Report"(status);
CREATE INDEX IF NOT EXISTS idx_report_reportedUserId ON "Report"("reportedUserId");
CREATE INDEX IF NOT EXISTS idx_report_reporterId ON "Report"("reporterId");
CREATE INDEX IF NOT EXISTS idx_report_createdAt ON "Report"("createdAt" DESC);

-- FriendRequest table indexes
CREATE INDEX IF NOT EXISTS idx_friendrequest_senderId ON "FriendRequest"("senderId");
CREATE INDEX IF NOT EXISTS idx_friendrequest_receiverId ON "FriendRequest"("receiverId");
CREATE INDEX IF NOT EXISTS idx_friendrequest_status ON "FriendRequest"(status);
CREATE INDEX IF NOT EXISTS idx_friendrequest_createdAt ON "FriendRequest"("createdAt" DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_online_verified ON "User"("isOnline", "isVerified");
CREATE INDEX IF NOT EXISTS idx_message_unread ON "Message"("receiverId", "readAt") WHERE "readAt" IS NULL;

-- Analyze tables for query planner
ANALYZE "User";
ANALYZE "Message";
ANALYZE "Report";
ANALYZE "FriendRequest";

-- Vacuum to reclaim space and update statistics
VACUUM ANALYZE;
