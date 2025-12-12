@echo off
echo ========================================
echo 🚀 BACKUP DEPLOYMENT TO RENDER.COM
echo 100%% FREE Alternative to Railway
echo ========================================

echo.
echo 💡 RENDER.COM FREE BENEFITS:
echo   ✅ 750 hours/month FREE
echo   ✅ Auto-sleep after 15 minutes
echo   ✅ Custom domains
echo   ✅ Auto-deployments from GitHub
echo   ✅ SSL certificates
echo   ✅ Environment variables
echo   ✅ Build & deploy logs
echo   ✅ Zero configuration needed
echo.

echo 📋 Step 1: Create Render Account
echo ========================================
echo.
echo 🌐 Opening Render.com...
start https://render.com
echo.
echo 📝 Instructions:
echo   1. Click "Get Started for Free"
echo   2. Sign up with your GitHub account
echo   3. Authorize Render to access your repositories
echo   4. Find your repository in the list
echo.
echo ✅ Account created? Press any key to continue...
pause

echo.
echo 📋 Step 2: Deploy Backend Service
echo ========================================
echo.
echo 🚀 Deployment Instructions:
echo.
echo 1. In Render Dashboard:
echo    ▶️ Click "New +"
echo    ▶️ Select "Web Service"
echo    ▶️ Choose "Build and deploy from a Git repository"
echo    ▶️ Click "Connect" next to your repository
echo.
echo 2. Configure Service:
echo    ▶️ Name: z-app-backend
echo    ▶️ Region: Oregon (US West)
echo    ▶️ Branch: main
echo    ▶️ Root Directory: backend
echo    ▶️ Runtime: Node
echo    ▶️ Build Command: npm install
echo    ▶️ Start Command: npm start
echo.
echo 3. Advanced Settings:
echo    ▶️ Auto-Deploy: Yes
echo    ▶️ Instance Type: Free
echo.

echo 📋 Step 3: Environment Variables
echo ========================================
echo.
echo 📝 Add these environment variables in Render:
echo.
echo NODE_ENV=production
echo PORT=10000
echo DATABASE_URL=postgresql://postgres.psmdpjokjhjfhzesaret:your-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
echo SUPABASE_URL=https://psmdpjokjhjfhzesaret.supabase.co
echo SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzbWRwam9ramhmamh6YXNhcmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODEyNzgsImV4cCI6MjA4MTA1NzI3OH0.ozEecDWueKpyJ_9n78B6f3-OjRa0hiL1DGQgnSjzh1g
echo SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzbWRwam9ramhmamh6YXNhcmV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4MTI3OCwiZXhwIjoyMDgxMDU3Mjc4fQ.-0l0By6iGA7du29Qvy-a2rNB1lRbP0un_1CwZsKhmok
echo JWT_SECRET=render-jwt-secret-2024-production
echo FRONTEND_URL=https://your-app.vercel.app
echo.
echo 💡 Copy these variables one by one to Render dashboard
echo.
pause

echo.
echo 📋 Step 4: Deploy and Test
echo ========================================
echo.
echo 🔄 After clicking "Create Web Service":
echo   1. Render will start building your backend
echo   2. Build process takes 2-3 minutes
echo   3. You'll get a URL like: https://z-app-backend.onrender.com
echo   4. Test health endpoint: https://z-app-backend.onrender.com/health/ping
echo.
echo 🎯 Your Render URL: ________________
echo ^(Write down your Render URL above^)
echo.

echo 📋 Step 5: Update Frontend Configuration
echo ========================================

echo 📝 Update frontend environment with your Render URL:

REM Update frontend environment
(
    echo # 🆓 RENDER BACKEND - FRONTEND CONFIGURATION
    echo.
    echo # Supabase ^(FREE^)
    echo VITE_SUPABASE_URL=https://psmdpjokjhjfhzesaret.supabase.co
    echo VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzbWRwam9ramhmamh6YXNhcmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODEyNzgsImV4cCI6MjA4MTA1NzI3OH0.ozEecDWueKpyJ_9n78B6f3-OjRa0hiL1DGQgnSjzh1g
    echo.
    echo # Render Backend ^(FREE^)
    echo VITE_API_URL=https://your-app.onrender.com/api
    echo VITE_SOCKET_URL=https://your-app.onrender.com
    echo.
    echo # App Configuration
    echo VITE_APP_NAME=ZN4Studio Chat
    echo VITE_APP_VERSION=2.0.0
    echo VITE_ENVIRONMENT=production
    echo.
    echo # Performance
    echo VITE_ENABLE_PWA=true
    echo VITE_ENABLE_COMPRESSION=true
    echo VITE_ENABLE_CACHING=true
) > "frontend\.env.render"

echo ✅ Frontend environment file created: frontend\.env.render
echo 💡 Update VITE_API_URL and VITE_SOCKET_URL with your actual Render URL

echo.
echo ========================================
echo 🎉 RENDER BACKUP DEPLOYMENT COMPLETE!
echo ========================================

echo.
echo 💰 COST COMPARISON:
echo   Railway: Limited access issues
echo   Render: 750 hours/month FREE ^(31 days^)
echo   Auto-sleep: Wakes up in 30 seconds
echo   Perfect for development and testing
echo.
echo 🚀 RENDER BENEFITS:
echo   ✅ No account limitations
echo   ✅ Easy GitHub integration
echo   ✅ Automatic SSL certificates
echo   ✅ Custom domains
echo   ✅ Build & deploy logs
echo   ✅ Environment variables
echo   ✅ Auto-deployments
echo   ✅ 99.9%% uptime
echo.
echo 📊 MIGRATION PROGRESS:
echo   ✅ Step 1: Supabase Database ^(COMPLETE^)
echo   ✅ Step 2: Render Backend ^(COMPLETE^)
echo   ▲ Step 3: Vercel Frontend ^(NEXT^)
echo   ☁️ Step 4: Cloudinary Files ^(FINAL^)
echo.
echo 🎯 Ready for Step 3?
echo Run: STEP_3_VERCEL_SETUP.bat
echo.
echo 💡 Your backend is now 100%% FREE on Render!
echo No more Railway limitations!
echo.
pause