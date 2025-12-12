@echo off
echo ========================================
echo 🚂 DEPLOYING TO RAILWAY - 100%% FREE
echo Backend Hosting with $5 Monthly Credit
echo ========================================

echo.
echo 💰 Railway FREE Tier Benefits:
echo   ✅ $5 credit/month ^(runs 24/7^)
echo   ✅ 1GB RAM, 1 vCPU
echo   ✅ Custom domains
echo   ✅ Auto-deployments
echo   ✅ SSL certificates
echo   ✅ Environment variables
echo   ✅ Metrics & logs
echo.

echo 📋 Step 1: Railway Account Setup
echo ========================================

echo 🌐 Please follow these steps:
echo.
echo 1. Go to https://railway.app
echo 2. Sign up with GitHub ^(FREE^)
echo 3. Verify your account
echo 4. Connect your GitHub repository
echo.
pause

echo.
echo 📋 Step 2: Project Deployment
echo ========================================

echo 📝 Creating Railway deployment configuration...

REM Create railway.json
(
    echo {
    echo   "$schema": "https://railway.app/railway.schema.json",
    echo   "build": {
    echo     "builder": "NIXPACKS",
    echo     "buildCommand": "cd backend && npm install"
    echo   },
    echo   "deploy": {
    echo     "startCommand": "cd backend && npm start",
    echo     "healthcheckPath": "/api/health",
    echo     "healthcheckTimeout": 100,
    echo     "restartPolicyType": "ON_FAILURE",
    echo     "restartPolicyMaxRetries": 10
    echo   },
    echo   "environments": {
    echo     "production": {
    echo       "variables": {
    echo         "NODE_ENV": "production",
    echo         "PORT": "5001"
    echo       }
    echo     }
    echo   }
    echo }
) > "railway.json"

REM Create nixpacks.toml for Railway
(
    echo [phases.setup]
    echo nixPkgs = ["nodejs-18_x", "npm-9_x"]
    echo.
    echo [phases.install]
    echo cmds = ["cd backend && npm ci"]
    echo.
    echo [phases.build]
    echo cmds = ["cd backend && npm run build ^|^| echo 'No build script'"]
    echo.
    echo [start]
    echo cmd = "cd backend && npm start"
) > "nixpacks.toml"

REM Create Dockerfile for Railway
(
    echo # 🚂 Railway FREE Tier Optimized
    echo FROM node:18-alpine
    echo.
    echo # Install curl for health checks
    echo RUN apk add --no-cache curl
    echo.
    echo # Set working directory
    echo WORKDIR /app
    echo.
    echo # Copy backend package files
    echo COPY backend/package*.json ./
    echo.
    echo # Install dependencies ^(production only for FREE tier^)
    echo RUN npm ci --only=production && npm cache clean --force
    echo.
    echo # Copy backend source
    echo COPY backend/ ./
    echo.
    echo # Create non-root user for security
    echo RUN addgroup -g 1001 -S nodejs
    echo RUN adduser -S nodejs -u 1001
    echo USER nodejs
    echo.
    echo # Expose port
    echo EXPOSE 5001
    echo.
    echo # Health check for Railway monitoring
    echo HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    echo   CMD curl -f http://localhost:5001/api/health ^|^| exit 1
    echo.
    echo # Start application
    echo CMD ["npm", "start"]
) > "Dockerfile"

echo ✅ Railway deployment files created

echo.
echo 📋 Step 3: Environment Variables Setup
echo ========================================

echo 📝 Environment variables to add in Railway dashboard:

echo.
echo NODE_ENV=production
echo PORT=5001
echo DATABASE_URL=^[Your Supabase Database URL^]
echo SUPABASE_URL=^[Your Supabase Project URL^]
echo SUPABASE_ANON_KEY=^[Your Supabase Anon Key^]
echo SUPABASE_SERVICE_KEY=^[Your Supabase Service Key^]
echo JWT_SECRET=^[Your JWT Secret^]
echo FRONTEND_URL=^[Your Vercel Frontend URL^]
echo RATE_LIMIT_WINDOW=15
echo RATE_LIMIT_MAX=1000

echo.
echo 📋 Step 4: Deployment Instructions
echo ========================================

echo 🚀 Manual Deployment Steps:
echo.
echo 1. In Railway Dashboard:
echo    - Click "New Project"
echo    - Select "Deploy from GitHub repo"
echo    - Choose your repository
echo    - Select backend folder as root
echo.
echo 2. Configure Environment:
echo    - Go to Variables tab
echo    - Add all environment variables above
echo    - Save configuration
echo.
echo 3. Deploy:
echo    - Railway will auto-deploy
echo    - Monitor logs for any issues
echo    - Get your Railway URL
echo.
echo 4. Test Deployment:
echo    - Visit: https://your-app.railway.app/api/health
echo    - Should return: {"status": "healthy"}
echo.

echo 📋 Step 5: Custom Domain ^(Optional - FREE^)
echo ========================================

echo 🌐 To add custom domain ^(FREE^):
echo.
echo 1. In Railway Dashboard:
echo    - Go to Settings ^> Domains
echo    - Click "Custom Domain"
echo    - Enter your domain
echo    - Update DNS records as shown
echo.
echo 2. SSL Certificate:
echo    - Automatically provided by Railway
echo    - No additional configuration needed
echo.

echo.
echo ========================================
echo 🎉 RAILWAY DEPLOYMENT READY!
echo ========================================

echo.
echo 💰 Cost: $0/month ^(FREE $5 credit^)
echo 🚀 Performance: 1GB RAM, 1 vCPU
echo 🌍 Global: Auto-scaling included
echo 🔒 Security: SSL certificates included
echo 📊 Monitoring: Built-in metrics & logs
echo.
echo 📋 Next Steps:
echo.
echo 1. Complete Railway deployment
echo 2. Test all API endpoints
echo 3. Update frontend environment variables
echo 4. Deploy frontend to Vercel ^(FREE^)
echo.
echo 🎯 Your backend will be live at:
echo https://your-app.railway.app
echo.
pause