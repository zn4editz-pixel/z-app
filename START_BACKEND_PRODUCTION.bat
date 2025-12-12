@echo off
echo ========================================
echo 🚀 STARTING PRODUCTION BACKEND SERVER
echo Optimized for 500K+ Users
echo ========================================
echo.
echo 🔧 Environment: Production
echo 🌐 Port: 5001
echo 📊 Clustering: Enabled
echo ⚡ Performance: Optimized
echo.
cd backend
set NODE_ENV=production
echo Starting backend server...
node src/index.js