@echo off
echo ========================================
echo 🗄️ MIGRATING TO SUPABASE DATABASE
echo From Limited PostgreSQL to Powerful Free Tier
echo ========================================

echo.
echo 📋 Phase 1: Supabase Setup
echo ========================================

echo 🔧 Installing Supabase CLI...
where supabase >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Supabase CLI via npm...
    npm install -g supabase
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Supabase CLI
        echo 💡 Please install manually: npm install -g supabase
        pause
        exit /b 1
    )
)
echo ✅ Supabase CLI ready

echo.
echo 📋 Phase 2: Create Supabase Project
echo ========================================

echo 🌐 Please follow these steps:
echo.
echo 1. Go to https://supabase.com
echo 2. Sign up/Login with GitHub
echo 3. Create new project:
echo    - Name: ZN4Studio-Chat-Production
echo    - Database Password: [Generate strong password]
echo    - Region: [Choose closest to your users]
echo.
echo 4. Copy the following from Project Settings ^> API:
echo    - Project URL
echo    - anon/public key
echo    - service_role/secret key
echo.
pause

echo.
echo 📋 Phase 3: Configure Environment
echo ========================================

echo 📝 Creating Supabase environment configuration...

set /p SUPABASE_URL="Enter your Supabase Project URL: "
set /p SUPABASE_ANON_KEY="Enter your Supabase anon key: "
set /p SUPABASE_SERVICE_KEY="Enter your Supabase service key: "

REM Create backend environment for Supabase
(
    echo # SUPABASE PRODUCTION CONFIGURATION
    echo NODE_ENV=production
    echo PORT=5001
    echo.
    echo # Supabase Database
    echo DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
    echo SUPABASE_URL=%SUPABASE_URL%
    echo SUPABASE_ANON_KEY=%SUPABASE_ANON_KEY%
    echo SUPABASE_SERVICE_KEY=%SUPABASE_SERVICE_KEY%
    echo.
    echo # Application Settings
    echo JWT_SECRET=your-super-secure-jwt-secret-change-this
    echo FRONTEND_URL=https://your-app.vercel.app
    echo.
    echo # Email Configuration
    echo EMAIL_HOST=smtp.gmail.com
    echo EMAIL_PORT=587
    echo EMAIL_USER=your-email@gmail.com
    echo EMAIL_PASS=your-app-password
    echo.
    echo # Performance Settings
    echo REDIS_URL=redis://localhost:6379
    echo UPLOAD_MAX_SIZE=50MB
    echo RATE_LIMIT_WINDOW=15
    echo RATE_LIMIT_MAX=1000
) > "backend\.env.supabase"

REM Create frontend environment for Supabase
(
    echo # SUPABASE FRONTEND CONFIGURATION
    echo VITE_SUPABASE_URL=%SUPABASE_URL%
    echo VITE_SUPABASE_ANON_KEY=%SUPABASE_ANON_KEY%
    echo VITE_API_URL=https://your-backend.railway.app/api
    echo VITE_SOCKET_URL=https://your-backend.railway.app
    echo VITE_APP_NAME=ZN4Studio Chat
    echo VITE_APP_VERSION=2.0.0
    echo VITE_ENVIRONMENT=production
) > "frontend\.env.supabase"

echo ✅ Environment files created

echo.
echo 📋 Phase 4: Database Schema Migration
echo ========================================

echo 🔄 Preparing database schema for Supabase...

REM Create Supabase-specific schema
(
    echo -- SUPABASE PRODUCTION SCHEMA
    echo -- Optimized for 500K+ users with Row Level Security
    echo.
    echo -- Enable required extensions
    echo CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    echo CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    echo.
    echo -- Users table with RLS
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
    echo   latitude DECIMAL,
    echo   longitude DECIMAL,
    echo   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^),
    echo   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^)
    echo ^);
    echo.
    echo -- Enable RLS
    echo ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    echo.
    echo -- Messages table with RLS
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
    echo -- Enable RLS
    echo ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    echo.
    echo -- Performance indexes
    echo CREATE INDEX IF NOT EXISTS idx_users_email ON users^(email^);
    echo CREATE INDEX IF NOT EXISTS idx_users_username ON users^(username^);
    echo CREATE INDEX IF NOT EXISTS idx_users_online ON users^(is_online^) WHERE is_online = true;
    echo CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages^(sender_id, created_at DESC^);
    echo CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages^(receiver_id, created_at DESC^);
    echo CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages^(sender_id, receiver_id, created_at DESC^);
    echo.
    echo -- RLS Policies
    echo CREATE POLICY "Users can view their own data" ON users FOR SELECT USING ^(auth.uid^(^) = id^);
    echo CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING ^(auth.uid^(^) = id^);
    echo CREATE POLICY "Messages are viewable by sender and receiver" ON messages FOR SELECT USING ^(auth.uid^(^) = sender_id OR auth.uid^(^) = receiver_id^);
    echo CREATE POLICY "Users can insert their own messages" ON messages FOR INSERT WITH CHECK ^(auth.uid^(^) = sender_id^);
) > "backend\supabase-schema.sql"

echo ✅ Supabase schema created

echo.
echo 📋 Phase 5: Data Export from Current Database
echo ========================================

echo 🔄 Exporting current database data...

REM Create data export script
(
    echo const { PrismaClient } = require^('@prisma/client'^);
    echo const fs = require^('fs'^);
    echo.
    echo const prisma = new PrismaClient^(^);
    echo.
    echo async function exportData^(^) {
    echo   try {
    echo     console.log^('📊 Exporting users...'^);
    echo     const users = await prisma.user.findMany^(^);
    echo     fs.writeFileSync^('users-export.json', JSON.stringify^(users, null, 2^)^);
    echo.
    echo     console.log^('📊 Exporting messages...'^);
    echo     const messages = await prisma.message.findMany^(^);
    echo     fs.writeFileSync^('messages-export.json', JSON.stringify^(messages, null, 2^)^);
    echo.
    echo     console.log^('✅ Data export complete!'^);
    echo     console.log^(`Users: ${users.length}`^);
    echo     console.log^(`Messages: ${messages.length}`^);
    echo   } catch ^(error^) {
    echo     console.error^('❌ Export failed:', error^);
    echo   } finally {
    echo     await prisma.$disconnect^(^);
    echo   }
    echo }
    echo.
    echo exportData^(^);
) > "backend\export-data.js"

echo 🔄 Running data export...
cd backend
node export-data.js
cd ..

if exist "backend\users-export.json" (
    echo ✅ Data export successful
) else (
    echo ⚠️ Data export may have failed, check manually
)

echo.
echo 📋 Phase 6: Import to Supabase
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
    echo async function importData^(^) {
    echo   try {
    echo     // Import users
    echo     if ^(fs.existsSync^('users-export.json'^)^) {
    echo       const users = JSON.parse^(fs.readFileSync^('users-export.json', 'utf8'^)^);
    echo       console.log^(`📊 Importing ${users.length} users...`^);
    echo       
    echo       for ^(const user of users^) {
    echo         const { error } = await supabase
    echo           .from^('users'^)
    echo           .insert^(user^);
    echo         if ^(error^) console.error^('User import error:', error^);
    echo       }
    echo     }
    echo.
    echo     // Import messages
    echo     if ^(fs.existsSync^('messages-export.json'^)^) {
    echo       const messages = JSON.parse^(fs.readFileSync^('messages-export.json', 'utf8'^)^);
    echo       console.log^(`📊 Importing ${messages.length} messages...`^);
    echo       
    echo       for ^(const message of messages^) {
    echo         const { error } = await supabase
    echo           .from^('messages'^)
    echo           .insert^(message^);
    echo         if ^(error^) console.error^('Message import error:', error^);
    echo       }
    echo     }
    echo.
    echo     console.log^('✅ Data import complete!'^);
    echo   } catch ^(error^) {
    echo     console.error^('❌ Import failed:', error^);
    echo   }
    echo }
    echo.
    echo importData^(^);
) > "backend\import-to-supabase.js"

echo.
echo ========================================
echo 🎉 SUPABASE MIGRATION READY!
echo ========================================

echo.
echo 📋 Next Steps:
echo.
echo 1. 🌐 Apply schema to Supabase:
echo    - Go to Supabase Dashboard ^> SQL Editor
echo    - Run: backend\supabase-schema.sql
echo.
echo 2. 📊 Import your data:
echo    cd backend
echo    npm install @supabase/supabase-js
echo    node import-to-supabase.js
echo.
echo 3. 🔧 Update your application:
echo    - Copy backend\.env.supabase to backend\.env
echo    - Copy frontend\.env.supabase to frontend\.env
echo.
echo 4. 🚀 Deploy to Railway ^(next step^):
echo    MIGRATE_TO_RAILWAY_BACKEND.bat
echo.
echo 🎯 Benefits:
echo   ✅ 500MB database storage ^(vs current limits^)
echo   ✅ 50K monthly active users
echo   ✅ Real-time subscriptions
echo   ✅ Built-in authentication
echo   ✅ Auto-generated APIs
echo   ✅ Row Level Security
echo.
pause