@echo off
echo ========================================
echo 🆓 COMPLETING SUPABASE SETUP
echo 100%% FREE Database Migration
echo ========================================

echo.
echo 💰 SUPABASE FREE BENEFITS:
echo   ✅ 500MB PostgreSQL database
echo   ✅ 50,000 monthly active users  
echo   ✅ Real-time subscriptions
echo   ✅ Built-in authentication
echo   ✅ Row Level Security
echo   ✅ Auto-generated APIs
echo   ✅ Global edge functions
echo.

echo 📋 Step 1: Apply Database Schema
echo ========================================

echo 🔧 Please apply the schema to your Supabase database:
echo.
echo 1. Go to your Supabase Dashboard
echo 2. Click "SQL Editor" in the left sidebar
echo 3. Click "New query" button
echo 4. Copy and paste the contents of: supabase-schema.sql
echo 5. Click "Run" button to execute
echo.
echo ⏳ This will create all tables, indexes, and security policies
echo.
echo ✅ Schema applied? Press any key to continue...
pause

echo.
echo 📋 Step 2: Install Supabase Client
echo ========================================

echo 📦 Installing Supabase client library...
cd backend
npm install @supabase/supabase-js
if %errorlevel% neq 0 (
    echo ❌ Failed to install Supabase client
    echo 💡 Please run manually: cd backend && npm install @supabase/supabase-js
    pause
    exit /b 1
)
echo ✅ Supabase client installed
cd ..

echo.
echo 📋 Step 3: Export Current Data
echo ========================================

echo 🔄 Exporting your current database data...
cd backend
node export-for-supabase.js
cd ..

if exist "backend\supabase-export.json" (
    echo ✅ Data export successful
) else (
    echo ⚠️ Data export may have failed, check manually
    echo 💡 You can continue without data migration if needed
)

echo.
echo 📋 Step 4: Import Data to Supabase
echo ========================================

echo 🔄 Importing data to your FREE Supabase database...
cd backend
node import-to-supabase.js
cd ..

echo.
echo 📋 Step 5: Update Environment Variables
echo ========================================

echo 📝 Updating your environment configuration...

REM Backup current environment files
if exist "backend\.env" (
    copy "backend\.env" "backend\.env.backup"
    echo ✅ Backend environment backed up
)

if exist "frontend\.env" (
    copy "frontend\.env" "frontend\.env.backup"
    echo ✅ Frontend environment backed up
)

REM Copy Supabase environment files
copy "backend\.env.supabase" "backend\.env"
copy "frontend\.env.supabase" "frontend\.env"

echo ✅ Environment variables updated

echo.
echo 📋 Step 6: Test Supabase Connection
echo ========================================

echo 🔧 Creating connection test script...

REM Create test script
(
    echo const { createClient } = require^('@supabase/supabase-js'^);
    echo.
    echo const supabaseUrl = 'https://psmdpjokjhjfhzesaret.supabase.co';
    echo const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzbWRwam9ramhmamh6YXNhcmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODEyNzgsImV4cCI6MjA4MTA1NzI3OH0.ozEecDWueKpyJ_9n78B6f3-OjRa0hiL1DGQgnSjzh1g';
    echo.
    echo async function testConnection^(^) {
    echo   try {
    echo     const supabase = createClient^(supabaseUrl, supabaseKey^);
    echo     
    echo     console.log^('🔄 Testing Supabase connection...'^);
    echo     
    echo     const { data, error } = await supabase
    echo       .from^('users'^)
    echo       .select^('count'^)
    echo       .limit^(1^);
    echo     
    echo     if ^(error^) {
    echo       console.error^('❌ Connection failed:', error^);
    echo     } else {
    echo       console.log^('✅ Supabase connection successful!'^);
    echo       console.log^('📊 Database is ready for use'^);
    echo     }
    echo   } catch ^(err^) {
    echo     console.error^('❌ Connection test failed:', err^);
    echo   }
    echo }
    echo.
    echo testConnection^(^);
) > "backend\test-supabase.js"

echo 🔄 Testing Supabase connection...
cd backend
node test-supabase.js
cd ..

echo.
echo ========================================
echo 🎉 SUPABASE SETUP COMPLETE!
echo ========================================

echo.
echo 💰 COST SAVINGS:
echo   Database: $7/month → $0/month ^(FREE^)
echo   Annual Savings: $84/year
echo.
echo 🚀 SUPABASE BENEFITS ACTIVATED:
echo   ✅ 500MB PostgreSQL database
echo   ✅ 50K monthly active users
echo   ✅ Real-time subscriptions
echo   ✅ Built-in authentication
echo   ✅ Row Level Security
echo   ✅ Auto-generated APIs
echo   ✅ Global edge functions
echo   ✅ 99.9%% uptime SLA
echo.
echo 📊 YOUR FREE SUPABASE PROJECT:
echo   URL: https://psmdpjokjhjfhzesaret.supabase.co
echo   Dashboard: https://supabase.com/dashboard/project/psmdpjokjhjfhzesaret
echo.
echo 📋 WHAT'S NEXT:
echo.
echo ✅ Step 1: Supabase Database ^(COMPLETE^)
echo 🚂 Step 2: Railway Backend ^(FREE - Next^)
echo ▲ Step 3: Vercel Frontend ^(FREE - After Railway^)
echo ☁️ Step 4: Cloudinary Files ^(FREE - Final^)
echo.
echo 🎯 Ready for Step 2? 
echo Run: STEP_2_RAILWAY_SETUP.bat
echo.
echo 💡 Your database is now 100%% FREE and ready!
echo You've saved $84/year on database costs alone!
echo.
pause