@echo off
echo ========================================
echo 🚨 RAILWAY DEPLOYMENT FIX
echo Fixing Backend Service Offline Issue
echo ========================================

echo.
echo 🔍 PROBLEM IDENTIFIED:
echo   ❌ Railway shows "Limited Access"
echo   ❌ "There is no active deployment"
echo   ❌ Backend URL returns 404
echo.

echo 💡 SOLUTION: Redeploy with proper configuration
echo.

echo 📋 Step 1: Install Railway CLI
echo ========================================
echo.
echo Installing Railway CLI globally...
npm install -g @railway/cli
echo.
echo ✅ Railway CLI installed
echo.

echo 📋 Step 2: Login to Railway
echo ========================================
echo.
echo Opening Railway login...
railway login
echo.
echo ✅ Please complete login in browser
pause

echo.
echo 📋 Step 3: Navigate and Deploy
echo ========================================
echo.
echo Navigating to backend directory...
cd backend

echo.
echo Linking to existing Railway project...
railway link

echo.
echo 📋 Step 4: Set Environment Variables
echo ========================================
echo.
echo Setting production environment variables...

railway variables set NODE_ENV=production
railway variables set PORT=5001
railway variables set DATABASE_URL="postgresql://postgres.psmdpjokjhjfhzesaret:your-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
railway variables set SUPABASE_URL="https://psmdpjokjhjfhzesaret.supabase.co"
railway variables set SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzbWRwam9ramhmamh6YXNhcmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODEyNzgsImV4cCI6MjA4MTA1NzI3OH0.ozEecDWueKpyJ_9n78B6f3-OjRa0hiL1DGQgnSjzh1g"
railway variables set JWT_SECRET="railway-jwt-secret-2024-production"
railway variables set FRONTEND_URL="https://your-app.vercel.app"

echo.
echo ✅ Environment variables set
echo.

echo 📋 Step 5: Deploy Backend
echo ========================================
echo.
echo Deploying optimized backend for Railway free tier...
railway up --detach

echo.
echo 🔄 Deployment in progress...
echo Waiting for deployment to complete...
timeout /t 60

echo.
echo 📋 Step 6: Test Deployment
echo ========================================
echo.
echo Getting Railway URL...
railway status

echo.
echo 🧪 Testing health endpoint...
echo Please test: https://z-app-backend-production-bdda.up.railway.app/health/ping
echo.
echo Expected response: {"status":"ok","timestamp":"..."}
echo.

echo 📋 Step 7: Verify Service
echo ========================================
echo.
echo Opening Railway dashboard...
railway open

echo.
echo ✅ Check deployment status in dashboard
echo ✅ Verify service is running
echo ✅ Test health endpoint
echo.

echo ========================================
echo 🎉 RAILWAY DEPLOYMENT FIX COMPLETE!
echo ========================================

echo.
echo 📊 NEXT STEPS:
echo   1. Verify backend is responding at health endpoint
echo   2. Update frontend environment variables
echo   3. Deploy frontend to Vercel (Step 3)
echo   4. Test full application
echo.

echo 💡 If Railway still fails, run: DEPLOY_TO_RENDER_BACKUP.bat
echo.
pause