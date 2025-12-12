-- PRODUCTION DATABASE INDEXES FOR 500K+ USERS
-- Advanced indexing strategy for massive scale performance

-- ============================================
-- USERS TABLE PERFORMANCE INDEXES
-- ============================================

-- Primary lookup indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_hash ON users USING hash(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_hash ON users USING hash(username);

-- Online status and activity indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_online_lastseen ON users(is_online, last_seen DESC) WHERE is_online = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_lastseen_desc ON users(last_seen DESC);

-- Geographic indexes for location-based features
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_location ON users(country, city) WHERE country IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_coordinates ON users USING gist(ll_to_earth(latitude, longitude)) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Verification status index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_verification ON users(is_verified, verification_requested_at) WHERE verification_requested_at IS NOT NULL;

-- ============================================
-- MESSAGES TABLE PERFORMANCE INDEXES
-- ============================================

-- Core message lookup indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_receiver_time ON messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_receiver_sender_time ON messages(receiver_id, sender_id, created_at DESC);

-- Conversation indexes (bidirectional)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation ON messages(LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at DESC);

-- Unread messages optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_unread ON messages(receiver_id, is_read, created_at DESC) WHERE is_read = false;

-- Message type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_type_time ON messages(type, created_at DESC);

-- File attachments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_files ON messages(sender_id, created_at DESC) WHERE file_url IS NOT NULL;

-- ============================================
-- FRIEND REQUESTS PERFORMANCE INDEXES
-- ============================================

-- Pending requests optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friend_requests_pending ON friend_requests(receiver_id, status, created_at DESC) WHERE status = 'PENDING';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friend_requests_sender_status ON friend_requests(sender_id, status, created_at DESC);

-- Unique constraint optimization
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_friend_requests_unique ON friend_requests(LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id));

-- ============================================
-- FRIENDS TABLE PERFORMANCE INDEXES
-- ============================================

-- Bidirectional friendship lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friends_user_friend ON friends(user_id, friend_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friends_friend_user ON friends(friend_id, user_id);

-- Friend count optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friends_user_created ON friends(user_id, created_at DESC);

-- ============================================
-- REPORTS TABLE PERFORMANCE INDEXES
-- ============================================

-- Admin dashboard optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_status_time ON reports(status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_pending ON reports(created_at DESC) WHERE status = 'PENDING';

-- Reporter tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_reporter_time ON reports(reporter_id, created_at DESC);

-- Reported content tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id, created_at DESC) WHERE reported_user_id IS NOT NULL;

-- ============================================
-- SESSIONS TABLE PERFORMANCE INDEXES
-- ============================================

-- Session lookup and cleanup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_token_hash ON sessions USING hash(token);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_active ON sessions(user_id, expires_at DESC) WHERE expires_at > NOW();
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expired ON sessions(expires_at) WHERE expires_at <= NOW();

-- Device tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_device ON sessions(user_id, device, last_used DESC);

-- ============================================
-- ANALYTICS TABLE PERFORMANCE INDEXES
-- ============================================

-- Event tracking and aggregation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_event_time ON analytics(event, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_user_time ON analytics(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- Performance monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_performance ON analytics(event, response_time, created_at DESC) WHERE response_time IS NOT NULL;

-- Error tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_errors ON analytics(error_code, created_at DESC) WHERE error_code IS NOT NULL;

-- ============================================
-- PARTIAL INDEXES FOR OPTIMIZATION
-- ============================================

-- Active users only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_recent ON users(last_seen DESC) WHERE last_seen > NOW() - INTERVAL '30 days';

-- Recent messages only (for faster queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_recent ON messages(sender_id, receiver_id, created_at DESC) WHERE created_at > NOW() - INTERVAL '7 days';

-- ============================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ============================================

-- User search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_search ON users USING gin(to_tsvector('english', coalesce(username, '') || ' ' || coalesce(nickname, '')));

-- Message search optimization (if full-text search is needed)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_search ON messages USING gin(to_tsvector('english', content)) WHERE type = 'TEXT';

-- ============================================
-- MAINTENANCE QUERIES
-- ============================================

-- Query to check index usage
-- SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- ORDER BY idx_tup_read DESC;

-- Query to find unused indexes
-- SELECT schemaname, tablename, indexname, idx_scan
-- FROM pg_stat_user_indexes 
-- WHERE idx_scan = 0 
-- ORDER BY schemaname, tablename;

-- Query to check table sizes
-- SELECT schemaname, tablename, 
--        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;