-- 🚨 DATABASE EMERGENCY CLEANUP SCRIPT
-- Run this immediately to free up space and improve performance

-- ============================================
-- 1. DELETE OLD DATA (IMMEDIATE SPACE SAVINGS)
-- ============================================

-- Delete messages older than 30 days
DELETE FROM "Message" 
WHERE "createdAt" < NOW() - INTERVAL '30 days';

-- Delete resolved/dismissed reports older than 90 days
DELETE FROM "Report" 
WHERE status IN ('resolved', 'dismissed') 
AND "createdAt" < NOW() - INTERVAL '90 days';

-- Delete rejected friend requests older than 30 days
DELETE FROM "FriendRequest" 
WHERE status = 'rejected' 
AND "createdAt" < NOW() - INTERVAL '30 days';

-- Delete old admin notifications (30+ days)
DELETE FROM "AdminNotification" 
WHERE "createdAt" < NOW() - INTERVAL '30 days';

-- ============================================
-- 2. CLEAR EXPIRED SUSPENSIONS
-- ============================================

UPDATE "User" 
SET 
  "isSuspended" = false,
  "suspensionEndTime" = NULL,
  "suspensionReason" = NULL
WHERE "isSuspended" = true 
AND "suspensionEndTime" < NOW();

-- ============================================
-- 3. ADD PERFORMANCE INDEXES
-- ============================================

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_message_sender ON "Message"("senderId");
CREATE INDEX IF NOT EXISTS idx_message_receiver ON "Message"("receiverId");
CREATE INDEX IF NOT EXISTS idx_message_created ON "Message"("createdAt");
CREATE INDEX IF NOT EXISTS idx_message_sender_receiver ON "Message"("senderId", "receiverId");

-- Report indexes
CREATE INDEX IF NOT EXISTS idx_report_status ON "Report"("status");
CREATE INDEX IF NOT EXISTS idx_report_created ON "Report"("createdAt");
CREATE INDEX IF NOT EXISTS idx_report_reporter ON "Report"("reporterId");
CREATE INDEX IF NOT EXISTS idx_report_reported ON "Report"("reportedUserId");

-- User indexes
CREATE INDEX IF NOT EXISTS idx_user_online ON "User"("isOnline");
CREATE INDEX IF NOT EXISTS idx_user_created ON "User"("createdAt");
CREATE INDEX IF NOT EXISTS idx_user_suspended ON "User"("isSuspended");
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"("email");

-- Friend Request indexes
CREATE INDEX IF NOT EXISTS idx_friend_request_status ON "FriendRequest"("status");
CREATE INDEX IF NOT EXISTS idx_friend_request_sender ON "FriendRequest"("senderId");
CREATE INDEX IF NOT EXISTS idx_friend_request_receiver ON "FriendRequest"("receiverId");

-- ============================================
-- 4. VACUUM DATABASE (RECLAIM SPACE)
-- ============================================

-- Analyze tables for query optimization
ANALYZE "User";
ANALYZE "Message";
ANALYZE "Report";
ANALYZE "FriendRequest";

-- Note: VACUUM FULL requires exclusive lock and may take time
-- Run this during low-traffic hours
-- VACUUM FULL ANALYZE;

-- ============================================
-- 5. CHECK DATABASE SIZE
-- ============================================

SELECT 
  pg_size_pretty(pg_database_size(current_database())) as "Database Size";

-- Check individual table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS "Table Size",
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS "Data Size",
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS "Index Size"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- 6. CHECK RECORD COUNTS
-- ============================================

SELECT 
  'Users' as table_name, 
  COUNT(*) as record_count 
FROM "User"
UNION ALL
SELECT 
  'Messages' as table_name, 
  COUNT(*) as record_count 
FROM "Message"
UNION ALL
SELECT 
  'Reports' as table_name, 
  COUNT(*) as record_count 
FROM "Report"
UNION ALL
SELECT 
  'Friend Requests' as table_name, 
  COUNT(*) as record_count 
FROM "FriendRequest";

-- ============================================
-- 7. CHECK CONNECTION COUNT
-- ============================================

SELECT 
  count(*) as "Active Connections",
  max_conn as "Max Connections",
  round((count(*)::float / max_conn::float) * 100, 2) as "Usage %"
FROM pg_stat_activity, 
     (SELECT setting::int as max_conn FROM pg_settings WHERE name = 'max_connections') as mc
GROUP BY max_conn;

-- ============================================
-- DONE! 
-- ============================================

-- Your database should now be:
-- ✅ Smaller (old data deleted)
-- ✅ Faster (indexes added)
-- ✅ Optimized (analyzed)
-- ✅ Healthier (expired data cleared)
