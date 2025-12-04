@echo off
echo ========================================
echo    Z-APP - Complete Build Script
echo ========================================
echo.

echo [1/4] Installing dependencies...
echo.
cd frontend
call npm install
cd ..

echo.
echo [2/4] Building frontend...
echo.
cd frontend
call npm run build
cd ..

echo.
echo [3/4] Syncing with Capacitor...
echo.
cd frontend
call npx cap sync
cd ..

echo.
echo [4/4] Build complete!
echo.
echo ========================================
echo    Build Summary
echo ========================================
echo.
echo ✅ Frontend built successfully
echo ✅ Capacitor synced
echo.
echo Next steps:
echo 1. For Web: Deploy 'frontend/dist' folder
echo 2. For Android: Run 'npx cap open android' in frontend folder
echo 3. For iOS: Run 'npx cap open ios' in frontend folder
echo.
echo ========================================
pause
