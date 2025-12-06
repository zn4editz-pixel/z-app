@echo off
cls
echo ========================================
echo   DEPLOY ALL FIXES TO PRODUCTION
echo ========================================
echo.
echo This will fix:
echo  [CRITICAL] CORS login error
echo  [FIX] Online users count
echo  [FIX] Duplicate index warning
echo  [CLEANUP] Remove unused files
echo.
echo Files to deploy:
echo  - backend/src/lib/socket.js (CORS fix)
echo  - backend/src/controllers/admin.controller.js
echo  - backend/src/models/user.model.js
echo  - frontend/src/hooks/useSocketHandler.js (deleted)
echo.
echo ========================================
pause
echo.

echo [1/4] Staging changes...
git add backend/src/lib/socket.js
git add backend/src/controllers/admin.controller.js
git add backend/src/models/user.model.js
git add backend/package.json backend/package-lock.json
git add frontend/src/hooks/useSocketHandler.js
git add frontend/package-lock.json
echo     Done!
echo.

echo [2/4] Creating commit...
git commit -m "Fix: CORS login error, online users count, and cleanup

CRITICAL FIX:
- Added https://z-app-beta-z.onrender.com to Socket.IO CORS
- This fixes the login error on production

OTHER FIXES:
- Online users count now uses real-time socket connections
- Removed duplicate Mongoose index warning
- Deleted unused socket handler file
- Updated dependencies"
echo     Done!
echo.

echo [3/4] Pushing to GitHub...
git push origin main
echo     Done!
echo.

echo [4/4] Deployment initiated!
echo.
echo ========================================
echo   DEPLOYMENT IN PROGRESS
echo ========================================
echo.
echo Render is now building and deploying...
echo.
echo Timeline:
echo  - Backend build: ~2 minutes
echo  - Backend deploy: ~30 seconds
echo  - Total: ~3 minutes
echo.
echo Monitor at: https://dashboard.render.com
echo.
echo ========================================
echo   AFTER DEPLOYMENT (in ~3 minutes)
echo ========================================
echo.
echo 1. Visit: https://z-app-beta-z.onrender.com
echo 2. Try logging in
echo 3. Should work without CORS errors!
echo 4. Check admin dashboard for accurate online count
echo.
echo ========================================
pause
