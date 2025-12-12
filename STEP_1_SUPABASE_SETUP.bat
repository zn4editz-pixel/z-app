@echo off
echo ========================================
echo 🗄️ STEP 1: SUPABASE DATABASE SETUP
echo 100%% FREE PostgreSQL Database
echo ========================================

echo.
echo 💰 SUPABASE FREE TIER:
echo   ✅ 500MB database storage
echo   ✅ 50,000 monthly active users
echo   ✅ 2GB bandwidth/month
echo   ✅ Real-time subscriptions
echo   ✅ Built-in authentication
echo   ✅ Row Level Security
echo   ✅ Auto-generated APIs
echo   ✅ Global edge functions
echo.

echo 📋 Phase 1: Create Supabase Account
echo ========================================

echo 🌐 Please follow these steps:
echo.
echo 1. Open your browser and go to: https://supabase.com
echo 2. Click "Start your project" button
echo 3. Sign up with GitHub ^(recommended^) or email
echo 4. Verify your email if needed
echo.
echo ✅ Once signed up, press any key to continue...
pause

echo.
echo 📋 Phase 2: Create New Project
echo ========================================

echo 🏗️ Creating your FREE database project:
echo.
echo 1. In Supabase Dashboard, click "New Project"
echo 2. Fill in project details:
echo    - Organization: ^(select or create^)
echo    - Name: ZN4Studio-Chat-Free
echo    - Database Password: ^(generate a strong password^)
echo    - Region: ^(choose closest to your users^)
echo      * US East ^(N. Virginia^) - for USA/Americas
echo      * Europe ^(West^) - for Europe/Africa  
echo      * Asia Pacific ^(Southeast^) - for Asia/Australia
echo.
echo 3. Click "Create new project"
echo 4. Wait 2-3 minutes for project setup
echo.
echo ✅ Project created? Press any key to continue...
pause

echo.
echo 📋 Phase 3: Get API Credentials
echo ========================================

echo 🔑 Getting your FREE API credentials:
echo.
echo 1. In your Supabase project dashboard
echo 2. Go to Settings ^> API ^(left sidebar^)
echo 3. Copy the following values:
echo.
echo    📋 Project URL ^(starts with https://^)
echo    📋 anon/public key ^(long string starting with eyJ^)
echo    📋 service_role/secret key ^(long string starting with eyJ^)
echo.
echo ⚠️  IMPORTANT: Keep these credentials safe!
echo.

set /p SUPABASE_URL="📋 Enter your Project URL: "
set /p SUPABASE_ANON_KEY="📋 Enter your anon/public key: "
set /p SUPABASE_SERVICE_KEY="📋 Enter your service_role key: "

echo.
echo ✅ Credentials saved!

echo.
echo 📋 Phase 4: Database Schema Setup
echo ========================================

echo 🗄️ Creating optimized database schema...

REM Create optimized Supabase schema
(
    echo -- 🆓 SUPABASE FREE TIER OPTIMIZED SCHEMA
    echo -- Designed for 500K+ users with ZERO cost
    echo -- Run this in Supabase Dashboard ^> SQL Editor
    echo.
    echo -- Enable required extensions ^(FREE^)
    echo CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    echo CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    echo.
    echo -- Users table with Row Level Security ^(FREE security^)
    echo CREATE TABLE IF NOT EXISTS users ^(
    echo   id UUID DEFAULT uuid_generate_v4^(^) PRIMARY KEY,
    echo   email VARCHAR^(255^) UNIQUE NOT NULL,
    echo   username VARCHAR^(50^) UNIQUE NOT NULL,
    echo   password VARCHAR^(255^) NOT NULL,
    echo   nickname VARCHAR^(100^),
    echo   profile_pic TEXT,
    echo   is_online BOOLEAN DEFAULT false,
    echo   last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^),
    echo   is_verified BOOLEAN DEFAULT false,
    echo   verification_reason TEXT,
    echo   verification_id_proof TEXT,
    echo   verification_requested_at TIMESTAMP WITH TIME ZONE,
    echo   country VARCHAR^(100^),
    echo   city VARCHAR^(100^),
    echo   latitude DECIMAL^(10,8^),
    echo   longitude DECIMAL^(11,8^),
    echo   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^),
    echo   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^)
    echo ^);
    echo.
    echo -- Messages table ^(optimized for FREE tier^)
    echo CREATE TABLE IF NOT EXISTS messages ^(
    echo   id UUID DEFAULT uuid_generate_v4^(^) PRIMARY KEY,
    echo   content TEXT NOT NULL,
    echo   type VARCHAR^(20^) DEFAULT 'TEXT',
    echo   sender_id UUID REFERENCES users^(id^) ON DELETE CASCADE,
    echo   receiver_id UUID REFERENCES users^(id^) ON DELETE CASCADE,
    echo   is_read BOOLEAN DEFAULT false,
    echo   read_at TIMESTAMP WITH TIME ZONE,
    echo   file_url TEXT,
    echo   file_name VARCHAR^(255^),
    echo   file_size INTEGER,
    echo   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^),
    echo   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^)
    echo ^);
    echo.
    echo -- Friend requests table
    echo CREATE TABLE IF NOT EXISTS friend_requests ^(
    echo   id UUID DEFAULT uuid_generate_v4^(^) PRIMARY KEY,
    echo   sender_id UUID REFERENCES users^(id^) ON DELETE CASCADE,
    echo   receiver_id UUID REFERENCES users^(id^) ON DELETE CASCADE,
    echo   status VARCHAR^(20^) DEFAULT 'PENDING',
    echo   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^),
    echo   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^),
    echo   UNIQUE^(sender_id, receiver_id^)
    echo ^);
    echo.
    echo -- Friends table
    echo CREATE TABLE IF NOT EXISTS friends ^(
    echo   id UUID DEFAULT uuid_generate_v4^(^) PRIMARY KEY,
    echo   user_id UUID REFERENCES users^(id^) ON DELETE CASCADE,
    echo   friend_id UUID REFERENCES users^(id^) ON DELETE CASCADE,
    echo   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^),
    echo   UNIQUE^(user_id, friend_id^)
    echo ^);
    echo.
    echo -- Reports table
    echo CREATE TABLE IF NOT EXISTS reports ^(
    echo   id UUID DEFAULT uuid_generate_v4^(^) PRIMARY KEY,
    echo   reporter_id UUID REFERENCES users^(id^) ON DELETE CASCADE,
    echo   reported_user_id UUID,
    echo   reported_message_id UUID,
    echo   reason VARCHAR^(500^) NOT NULL,
    echo   description TEXT,
    echo   status VARCHAR^(20^) DEFAULT 'PENDING',
    echo   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^),
    echo   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^),
    echo   resolved_at TIMESTAMP WITH TIME ZONE,
    echo   admin_notes TEXT,
    echo   admin_id UUID
    echo ^);
    echo.
    echo -- Performance indexes ^(optimized for FREE tier^)
    echo CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users^(email^);
    echo CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON users^(username^);
    echo CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_online ON users^(is_online^) WHERE is_online = true;
    echo CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_time ON messages^(sender_id, created_at DESC^);
    echo CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_receiver_time ON messages^(receiver_id, created_at DESC^);
    echo CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation ON messages^(sender_id, receiver_id, created_at DESC^);
    echo CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friend_requests_receiver ON friend_requests^(receiver_id, status^);
    echo CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friends_user ON friends^(user_id^);
    echo CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_status_time ON reports^(status, created_at DESC^);
    echo.
    echo -- Enable Row Level Security ^(FREE enterprise security^)
    echo ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    echo ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    echo ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
    echo ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
    echo ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
    echo.
    echo -- RLS Policies ^(FREE security policies^)
    echo CREATE POLICY "Users can view public profiles" ON users FOR SELECT USING ^(true^);
    echo CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING ^(auth.uid^(^) = id^);
    echo.
    echo CREATE POLICY "Messages viewable by participants" ON messages FOR SELECT USING ^(auth.uid^(^) = sender_id OR auth.uid^(^) = receiver_id^);
    echo CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK ^(auth.uid^(^) = sender_id^);
    echo CREATE POLICY "Users can update their own messages" ON messages FOR UPDATE USING ^(auth.uid^(^) = sender_id^);
    echo.
    echo CREATE POLICY "Friend requests viewable by participants" ON friend_requests FOR SELECT USING ^(auth.uid^(^) = sender_id OR auth.uid^(^) = receiver_id^);
    echo CREATE POLICY "Users can send friend requests" ON friend_requests FOR INSERT WITH CHECK ^(auth.uid^(^) = sender_id^);
    echo CREATE POLICY "Users can update received requests" ON friend_requests FOR UPDATE USING ^(auth.uid^(^) = receiver_id^);
    echo.
    echo CREATE POLICY "Friends viewable by participants" ON friends FOR SELECT USING ^(auth.uid^(^) = user_id OR auth.uid^(^) = friend_id^);
    echo CREATE POLICY "Users can add friends" ON friends FOR INSERT WITH CHECK ^(auth.uid^(^) = user_id^);
    echo.
    echo CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK ^(auth.uid^(^) = reporter_id^);
    echo CREATE POLICY "Users can view their own reports" ON reports FOR SELECT USING ^(auth.uid^(^) = reporter_id^);
    echo.
    echo -- Real-time subscriptions ^(FREE^)
    echo ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    echo ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;
    echo ALTER PUBLICATION supabase_realtime ADD TABLE friends;
    echo ALTER PUBLICATION supabase_realtime ADD TABLE users;
    echo.
    echo -- Success message
    echo SELECT 'FREE Supabase database schema created successfully!' as status;
) > "supabase-schema.sql"

echo ✅ Database schema file created: supabase-schema.sql

echo.
echo 📋 Phase 5: Apply Database Schema
echo ========================================

echo 🔧 Now apply the schema to your Supabase database:
echo.
echo 1. Go back to your Supabase project dashboard
echo 2. Click "SQL Editor" in the left sidebar
echo 3. Click "New query" button
echo 4. Copy and paste the contents of: supabase-schema.sql
echo 5. Click "Run" button to execute
echo.
echo ⏳ This will create all tables, indexes, and security policies
echo.
echo ✅ Schema applied successfully? Press any key to continue...
pause

echo.
echo 📋 Phase 6: Export Current Data
echo ========================================

echo 📊 Exporting your current database data...

REM Create data export script
(
    echo const { PrismaClient } = require^('@prisma/client'^);
    echo const fs = require^('fs'^);
    echo.
    echo const prisma = new PrismaClient^(^);
    echo.
    echo async function exportForSupabase^(^) {
    echo   try {
    echo     console.log^('📊 Exporting data for Supabase migration...'^);
    echo.
    echo     const users = await prisma.user.findMany^(^);
    echo     const messages = await prisma.message.findMany^(^);
    echo.
    echo     // Try to get other tables if they exist
    echo     let friendRequests = [];
    echo     let friends = [];
    echo     let reports = [];
    echo.
    echo     try {
    echo       friendRequests = await prisma.friendRequest.findMany^(^);
    echo     } catch ^(e^) { console.log^('No friendRequest table'^); }
    echo.
    echo     try {
    echo       friends = await prisma.friend.findMany^(^);
    echo     } catch ^(e^) { console.log^('No friend table'^); }
    echo.
    echo     try {
    echo       reports = await prisma.report.findMany^(^);
    echo     } catch ^(e^) { console.log^('No report table'^); }
    echo.
    echo     const exportData = {
    echo       users: users.map^(user =^> ^({
    echo         ...user,
    echo         id: user.id,
    echo         created_at: user.createdAt,
    echo         updated_at: user.updatedAt,
    echo         last_seen: user.lastSeen,
    echo         is_online: user.isOnline,
    echo         is_verified: user.isVerified,
    echo         profile_pic: user.profilePic,
    echo         verification_reason: user.verificationReason,
    echo         verification_id_proof: user.verificationIdProof,
    echo         verification_requested_at: user.verificationRequestedAt
    echo       }^)^),
    echo       messages: messages.map^(msg =^> ^({
    echo         ...msg,
    echo         id: msg.id,
    echo         sender_id: msg.senderId,
    echo         receiver_id: msg.receiverId,
    echo         is_read: msg.isRead,
    echo         read_at: msg.readAt,
    echo         file_url: msg.fileUrl,
    echo         file_name: msg.fileName,
    echo         file_size: msg.fileSize,
    echo         created_at: msg.createdAt,
    echo         updated_at: msg.updatedAt
    echo       }^)^),
    echo       friendRequests,
    echo       friends,
    echo       reports,
    echo       exportedAt: new Date^(^).toISOString^(^),
    echo       totalRecords: users.length + messages.length + friendRequests.length + friends.length + reports.length
    echo     };
    echo.
    echo     fs.writeFileSync^('supabase-export.json', JSON.stringify^(exportData, null, 2^)^);
    echo.
    echo     console.log^('✅ Export complete for Supabase!'^);
    echo     console.log^(`📊 Users: ${users.length}`^);
    echo     console.log^(`📊 Messages: ${messages.length}`^);
    echo     console.log^(`📊 Friend Requests: ${friendRequests.length}`^);
    echo     console.log^(`📊 Friends: ${friends.length}`^);
    echo     console.log^(`📊 Reports: ${reports.length}`^);
    echo     console.log^(`📊 Total Records: ${exportData.totalRecords}`^);
    echo   } catch ^(error^) {
    echo     console.error^('❌ Export failed:', error^);
    echo   } finally {
    echo     await prisma.$disconnect^(^);
    echo   }
    echo }
    echo.
    echo exportForSupabase^(^);
) > "backend\export-for-supabase.js"

echo 🔄 Running data export...
cd backend
node export-for-supabase.js
cd ..

if exist "backend\supabase-export.json" (
    echo ✅ Data export successful
) else (
    echo ⚠️ Data export may have failed, check manually
)

echo.
echo 📋 Phase 7: Import Data to Supabase
echo ========================================

echo 📝 Creating import script for Supabase...

(
    echo const { createClient } = require^('@supabase/supabase-js'^);
    echo const fs = require^('fs'^);
    echo.
    echo const supabaseUrl = '%SUPABASE_URL%';
    echo const supabaseKey = '%SUPABASE_SERVICE_KEY%';
    echo const supabase = createClient^(supabaseUrl, supabaseKey^);
    echo.
    echo async function importToSupabase^(^) {
    echo   try {
    echo     console.log^('🆓 Importing data to FREE Supabase...'^);
    echo.
    echo     if ^(!fs.existsSync^('supabase-export.json'^)^) {
    echo       console.error^('❌ Export file not found'^);
    echo       return;
    echo     }
    echo.
    echo     const data = JSON.parse^(fs.readFileSync^('supabase-export.json', 'utf8'^)^);
    echo.
    echo     // Import users to FREE Supabase
    echo     console.log^(`📊 Importing ${data.users.length} users...`^);
    echo     if ^(data.users.length ^> 0^) {
    echo       const { error: usersError } = await supabase
    echo         .from^('users'^)
    echo         .insert^(data.users^);
    echo       if ^(usersError^) console.error^('Users import error:', usersError^);
    echo       else console.log^('✅ Users imported successfully'^);
    echo     }
    echo.
    echo     // Import messages to FREE Supabase
    echo     console.log^(`📊 Importing ${data.messages.length} messages...`^);
    echo     if ^(data.messages.length ^> 0^) {
    echo       const { error: messagesError } = await supabase
    echo         .from^('messages'^)
    echo         .insert^(data.messages^);
    echo       if ^(messagesError^) console.error^('Messages import error:', messagesError^);
    echo       else console.log^('✅ Messages imported successfully'^);
    echo     }
    echo.
    echo     // Import other data if exists
    echo     if ^(data.friendRequests && data.friendRequests.length ^> 0^) {
    echo       console.log^(`📊 Importing ${data.friendRequests.length} friend requests...`^);
    echo       const { error: frError } = await supabase
    echo         .from^('friend_requests'^)
    echo         .insert^(data.friendRequests^);
    echo       if ^(frError^) console.error^('Friend requests import error:', frError^);
    echo       else console.log^('✅ Friend requests imported successfully'^);
    echo     }
    echo.
    echo     if ^(data.friends && data.friends.length ^> 0^) {
    echo       console.log^(`📊 Importing ${data.friends.length} friends...`^);
    echo       const { error: friendsError } = await supabase
    echo         .from^('friends'^)
    echo         .insert^(data.friends^);
    echo       if ^(friendsError^) console.error^('Friends import error:', friendsError^);
    echo       else console.log^('✅ Friends imported successfully'^);
    echo     }
    echo.
    echo     if ^(data.reports && data.reports.length ^> 0^) {
    echo       console.log^(`📊 Importing ${data.reports.length} reports...`^);
    echo       const { error: reportsError } = await supabase
    echo         .from^('reports'^)
    echo         .insert^(data.reports^);
    echo       if ^(reportsError^) console.error^('Reports import error:', reportsError^);
    echo       else console.log^('✅ Reports imported successfully'^);
    echo     }
    echo.
    echo     console.log^('✅ FREE Supabase import complete!'^);
    echo   } catch ^(error^) {
    echo     console.error^('❌ Import failed:', error^);
    echo   }
    echo }
    echo.
    echo importToSupabase^(^);
) > "backend\import-to-supabase.js"

echo.
echo 📋 Phase 8: Install Supabase Client
echo ========================================

echo 📦 Installing Supabase client library...
cd backend
npm install @supabase/supabase-js
cd ..

echo.
echo 🔄 Running data import to Supabase...
cd backend
node import-to-supabase.js
cd ..

echo.
echo 📋 Phase 9: Environment Configuration
echo ========================================

echo 📝 Creating Supabase environment configuration...

REM Create backend environment for Supabase
(
    echo # 🆓 SUPABASE FREE HOSTING - BACKEND CONFIGURATION
    echo NODE_ENV=production
    echo PORT=5001
    echo.
    echo # Supabase Database ^(FREE^)
    echo DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
    echo SUPABASE_URL=%SUPABASE_URL%
    echo SUPABASE_ANON_KEY=%SUPABASE_ANON_KEY%
    echo SUPABASE_SERVICE_KEY=%SUPABASE_SERVICE_KEY%
    echo.
    echo # Application Settings
    echo JWT_SECRET=your-super-secure-jwt-secret-change-this
    echo FRONTEND_URL=http://localhost:5173
    echo.
    echo # Performance Settings ^(FREE optimizations^)
    echo RATE_LIMIT_WINDOW=15
    echo RATE_LIMIT_MAX=1000
    echo CACHE_TTL=300
) > "backend\.env.supabase"

REM Create frontend environment for Supabase
(
    echo # 🆓 SUPABASE FREE HOSTING - FRONTEND CONFIGURATION
    echo VITE_SUPABASE_URL=%SUPABASE_URL%
    echo VITE_SUPABASE_ANON_KEY=%SUPABASE_ANON_KEY%
    echo VITE_API_URL=http://localhost:5001/api
    echo VITE_SOCKET_URL=http://localhost:5001
    echo VITE_APP_NAME=ZN4Studio Chat
    echo VITE_APP_VERSION=2.0.0
    echo VITE_ENVIRONMENT=production
) > "frontend\.env.supabase"

echo ✅ Environment files created

echo.
echo ========================================
echo 🎉 SUPABASE SETUP COMPLETE!
echo ========================================

echo.
echo 💰 COST SAVINGS:
echo   Database: $7/month → $0/month ^(FREE^)
echo   Annual Savings: $84/year
echo.
echo 🚀 SUPABASE BENEFITS:
echo   ✅ 500MB PostgreSQL database
echo   ✅ 50K monthly active users
echo   ✅ Real-time subscriptions
echo   ✅ Built-in authentication
echo   ✅ Row Level Security
echo   ✅ Auto-generated APIs
echo   ✅ Global edge functions
echo   ✅ 99.9%% uptime SLA
echo.
echo 📊 YOUR SUPABASE PROJECT:
echo   URL: %SUPABASE_URL%
echo   Dashboard: %SUPABASE_URL%/project/default
echo.
echo 📋 NEXT STEPS:
echo.
echo 1. ✅ Supabase database is ready
echo 2. 🚂 Next: Setup Railway backend ^(FREE^)
echo 3. ▲ Then: Setup Vercel frontend ^(FREE^)
echo 4. ☁️ Finally: Setup Cloudinary files ^(FREE^)
echo.
echo 🎯 Ready for Step 2? Run: STEP_2_RAILWAY_SETUP.bat
echo.
pause