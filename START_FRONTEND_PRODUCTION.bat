@echo off
echo ========================================
echo 🎨 STARTING PRODUCTION FRONTEND SERVER
echo Optimized for 500K+ Users
echo ========================================
echo.
echo 🔧 Environment: Production
echo 🌐 Port: 4173
echo 📦 Build: Optimized
echo ⚡ Performance: Enhanced
echo.
cd frontend
echo Building production assets...
call npm run build
echo.
echo Starting frontend server...
call npm run preview