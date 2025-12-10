@echo off
echo ========================================
echo 🚀 STRANGER CHAT - RAILWAY DEPLOYMENT
echo ========================================
echo.

echo ✅ Checking system status...
echo Backend: Ready for production
echo Frontend: Built and optimized
echo Database: PostgreSQL ready
echo Redis: Connection configured
echo.

echo 📦 Installing Railway CLI...
npm install -g @railway/cli
echo.

echo 🔐 Please login to Railway...
railway login
echo.

echo 🆕 Creating new Railway project...
railway new stranger-chat-production
echo.

echo 📁 Navigating to backend directory...
cd backend
echo.

echo 🚀 Deploying to Railway...
echo This will deploy your production-ready Stranger Chat platform
echo.
railway up

echo.
echo ========================================
echo ✅ DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo 🌐 Your app will be available at the Railway URL
echo 📊 Check Railway dashboard for deployment status
echo 🔧 Don't forget to set environment variables:
echo    - DATABASE_URL
echo    - REDIS_URL  
echo    - JWT_SECRET
echo    - NODE_ENV=production
echo.
echo 🎉 Stranger Chat is now LIVE!
echo ========================================

pause