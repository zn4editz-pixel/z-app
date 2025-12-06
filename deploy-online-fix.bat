@echo off
echo ========================================
echo Deploy Online Users Fix to Production
echo ========================================
echo.

echo This will:
echo 1. Stage the fixed admin controller
echo 2. Commit the changes
echo 3. Push to GitHub (triggers Render deploy)
echo.

echo Files to be deployed:
echo - backend/src/controllers/admin.controller.js
echo.

pause

echo.
echo Staging changes...
git add backend/src/controllers/admin.controller.js

echo.
echo Committing changes...
git commit -m "Fix: Online users count now uses real-time socket connections instead of non-existent database field"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo Deployment Initiated!
echo ========================================
echo.
echo Render will automatically detect the push and deploy.
echo.
echo Monitor deployment at:
echo https://dashboard.render.com
echo.
echo Check your backend service logs for:
echo - Build completion
echo - Server restart
echo - Socket connections
echo.
echo After deployment completes (~2-5 min):
echo 1. Visit: https://z-app-beta-z.onrender.com
echo 2. Login as admin
echo 3. Check Admin Dashboard "Online Now" count
echo.
echo ========================================
pause
