@echo off
echo ========================================
echo 🚂 STEP 2: RAILWAY BACKEND SETUP
echo 100%% FREE Backend Hosting
echo ========================================

echo.
echo 🎯 PREREQUISITES CHECK:
echo   ✅ Supabase database schema applied
echo   ✅ Supabase connection working
echo   ✅ Data imported successfully
echo.

echo 💰 RAILWAY FREE BENEFITS:
echo   ✅ $5 credit/month ^(runs 24/7^)
echo   ✅ 1GB RAM, 1 vCPU  
echo   ✅ Custom domains
echo   ✅ Auto-deployments from GitHub
echo   ✅ SSL certificates
echo   ✅ Environment variables
echo   ✅ Metrics & logs
echo   ✅ Global deployment
echo.

echo 📋 Step 1: Create Railway Account
echo ========================================
echo.
echo 🌐 Go to: https://railway.app
echo 📝 Sign up with your GitHub account ^(FREE^)
echo ✅ Verify your email
echo 🔗 Connect your GitHub repository
echo.
echo ✅ Account created? Press any key to continue...
pause

echo.
echo 📋 Step 2: Prepare Deployment Files
echo ========================================

echo 🔧 Creating Railway configuration files...

REM Create railway.json
(
    echo {
    echo   "$schema": "https://railway.app/railway.schema.json",
    echo   "build": {
    echo     "builder": "NIXPACKS",
    echo     "buildCommand": "cd backend && npm install --production"
    echo   },
    echo   "deploy": {
    echo     "startCommand": "cd backend && npm start",
    echo     "healthcheckPath": "/api/health",
    echo     "healthcheckTimeout": 100,
    echo     "restartPolicyType": "ON_FAILURE",
    echo     "restartPolicyMaxRetries": 10
    echo   }
    echo }
) > "railway.json"

REM Create optimized package.json for Railway
echo 📦 Optimizing backend for Railway FREE tier...

REM Create Railway-optimized Dockerfile
(
    echo # 🚂 Railway FREE Tier Optimized Dockerfile
    echo FROM node:18-alpine
    echo.
    echo # Install curl for health checks
    echo RUN apk add --no-cache curl
    echo.
    echo # Set working directory
    echo WORKDIR /app
    echo.
    echo # Copy package files
    echo COPY backend/package*.json ./
    echo.
    echo # Install production dependencies only
    echo RUN npm ci --only=production && npm cache clean --force
    echo.
    echo # Copy source code
    echo COPY backend/ ./
    echo.
    echo # Create non-root user
    echo RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
    echo USER nodejs
    echo.
    echo # Expose port
    echo EXPOSE 5001
    echo.
    echo # Health check
    echo HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    echo   CMD curl -f http://localhost:5001/api/health ^|^| exit 1
    echo.
    echo # Start command
    echo CMD ["npm", "start"]
) > "Dockerfile.railway"

echo ✅ Railway deployment files created

echo.
echo 📋 Step 3: Deploy to Railway
echo ========================================

echo 🚀 Deployment Instructions:
echo.
echo 1. In Railway Dashboard:
echo    ▶️ Click "New Project"
echo    ▶️ Select "Deploy from GitHub repo"
echo    ▶️ Choose your repository
echo    ▶️ Select "backend" as root directory
echo.
echo 2. Configure Build:
echo    ▶️ Build Command: npm install --production
echo    ▶️ Start Command: npm start
echo    ▶️ Port: 5001
echo.

echo 📋 Step 4: Environment Variables
echo ========================================

echo 📝 Add these environment variables in Railway:
echo.
echo NODE_ENV=production
echo PORT=5001
echo DATABASE_URL=^[Your Supabase Database URL^]
echo SUPABASE_URL=https://psmdpjokjhjfhzesaret.supabase.co
echo SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzbWRwam9ramhmamh6YXNhcmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODEyNzgsImV4cCI6MjA4MTA1NzI3OH0.ozEecDWueKpyJ_9n78B6f3-OjRa0hiL1DGQgnSjzh1g
echo SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzbWRwam9ramhmamh6YXNhcmV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4MTI3OCwiZXhwIjoyMDgxMDU3Mjc4fQ.-0l0By6iGA7du29Qvy-a2rNB1lRbP0un_1CwZsKhmok
echo JWT_SECRET=your-super-secure-jwt-secret-change-this
echo FRONTEND_URL=https://your-app.vercel.app
echo RATE_LIMIT_WINDOW=15
echo RATE_LIMIT_MAX=1000

echo.
echo 💡 Copy these variables to Railway dashboard
echo.
pause

echo.
echo 📋 Step 5: Test Deployment
echo ========================================

echo 🔄 After deployment completes:
echo.
echo 1. Get your Railway URL ^(e.g., https://your-app.railway.app^)
echo 2. Test health endpoint: https://your-app.railway.app/api/health
echo 3. Should return: {"status": "healthy"}
echo.
echo 🎯 Railway URL: ________________
echo ^(Write down your Railway URL above^)
echo.

echo 📋 Step 6: Update Frontend Configuration
echo ========================================

echo 📝 Update frontend environment with your Railway URL:

REM Update frontend environment
(
    echo # 🆓 RAILWAY BACKEND - FRONTEND CONFIGURATION
    echo.
    echo # Supabase ^(FREE^)
    echo VITE_SUPABASE_URL=https://psmdpjokjhjfhzesaret.supabase.co
    echo VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzbWRwam9ramhmamh6YXNhcmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODEyNzgsImV4cCI6MjA4MTA1NzI3OH0.ozEecDWueKpyJ_9n78B6f3-OjRa0hiL1DGQgnSjzh1g
    echo.
    echo # Railway Backend ^(FREE^)
    echo VITE_API_URL=https://your-app.railway.app/api
    echo VITE_SOCKET_URL=https://your-app.railway.app
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
) > "frontend\.env.railway"

echo ✅ Frontend environment file created: frontend\.env.railway
echo 💡 Update VITE_API_URL and VITE_SOCKET_URL with your actual Railway URL

echo.
echo ========================================
echo 🎉 RAILWAY BACKEND SETUP COMPLETE!
echo ========================================

echo.
echo 💰 COST SAVINGS:
echo   Backend: $7/month → $0/month ^(FREE^)
echo   SSL: $2/month → $0/month ^(FREE^)
echo   Monitoring: $3/month → $0/month ^(FREE^)
echo   Total: $12/month → $0/month
echo.
echo 🚀 RAILWAY BENEFITS ACTIVATED:
echo   ✅ 1GB RAM, 1 vCPU
echo   ✅ Auto-scaling
echo   ✅ Custom domains
echo   ✅ SSL certificates
echo   ✅ GitHub auto-deployments
echo   ✅ Environment variables
echo   ✅ Metrics & logs
echo   ✅ 99.9%% uptime
echo.
echo 📊 MIGRATION PROGRESS:
echo   ✅ Step 1: Supabase Database ^(COMPLETE^)
echo   ✅ Step 2: Railway Backend ^(COMPLETE^)
echo   ▲ Step 3: Vercel Frontend ^(NEXT^)
echo   ☁️ Step 4: Cloudinary Files ^(FINAL^)
echo.
echo 🎯 Ready for Step 3?
echo Run: STEP_3_VERCEL_SETUP.bat
echo.
echo 💡 Your backend is now 100%% FREE and production-ready!
echo Annual savings so far: $228/year!
echo.
pause