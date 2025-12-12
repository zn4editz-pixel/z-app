@echo off
echo.
echo ========================================
echo 🚀 SUPABASE SETUP FOR 500K+ USERS
echo ========================================
echo.

echo 📋 STEP 1: Install Supabase CLI
echo Run this command in your terminal:
echo npm install -g supabase
echo.

echo 📋 STEP 2: Create Supabase Project
echo 1. Go to https://supabase.com
echo 2. Sign up/Login with GitHub
echo 3. Create new project
echo 4. Choose region closest to your users
echo 5. Copy your project URL and anon key
echo.

echo 📋 STEP 3: Update Environment Variables
echo Add these to your backend/.env file:
echo.
echo # Supabase Configuration
echo SUPABASE_URL=your_supabase_project_url
echo SUPABASE_ANON_KEY=your_supabase_anon_key
echo SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
echo.

echo 📋 STEP 4: Run Migration
echo cd backend
echo node migrate-to-supabase.js
echo.

echo 📋 STEP 5: Update Frontend
echo Update frontend/.env:
echo VITE_SUPABASE_URL=your_supabase_project_url
echo VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
echo.

echo ========================================
echo 💰 COST BREAKDOWN:
echo ========================================
echo Free Tier:     0-50K users    = $0/month
echo Pro Tier:      50K-100K users = $25/month  
echo Team Tier:     100K-500K users = $599/month
echo Enterprise:    500K+ users     = Custom pricing
echo.

echo ========================================
echo 🎯 BENEFITS:
echo ========================================
echo ✅ Real-time subscriptions built-in
echo ✅ Auto-scaling infrastructure  
echo ✅ Global CDN for fast performance
echo ✅ Built-in authentication
echo ✅ Row Level Security
echo ✅ File storage included
echo ✅ No server management needed
echo.

echo Press any key to open Supabase website...
pause >nul
start https://supabase.com

echo.
echo 🚀 Ready to scale to 500K+ users!
echo.
pause