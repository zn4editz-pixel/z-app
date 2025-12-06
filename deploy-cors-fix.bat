@echo off
echo ========================================
echo Deploy CORS Fix to Production
echo ========================================
echo.

echo URGENT FIX: Adding production frontend URL to CORS whitelist
echo.
echo This fixes the login error:
echo "Access to XMLHttpRequest has been blocked by CORS policy"
echo.

pause

echo.
echo Staging CORS fix...
git add backend/src/lib/socket.js

echo.
echo Committing...
git commit -m "Fix: Add production frontend URL to Socket.IO CORS whitelist

Added https://z-app-beta-z.onrender.com to allowed origins.
This fixes the CORS error preventing login on production."

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo CORS Fix Deployed!
echo ========================================
echo.
echo Render will rebuild the backend (~2-3 minutes)
echo.
echo After deployment:
echo 1. Wait for backend to show "Live" on Render
echo 2. Try logging in again at: https://z-app-beta-z.onrender.com
echo 3. The CORS error should be gone
echo.
echo Monitor: https://dashboard.render.com
echo.
pause
