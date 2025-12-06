@echo off
echo ========================================
echo Deploy All Fixes to Production
echo ========================================
echo.

echo Changes to be deployed:
echo.
echo CRITICAL FIX:
echo - CORS configuration (socket.js) - FIXES LOGIN ISSUE
echo.
echo BACKEND FIXES:
echo - Online users count (admin.controller.js)
echo - Duplicate index removed (user.model.js)
echo - Updated dependencies (package.json)
echo.
echo FRONTEND FIXES:
echo - Removed unused socket handler
echo - Updated admin dashboard components
echo.

pause

echo.
echo ========================================
echo Step 1: Staging Changes
echo ========================================
echo.

git add backend/src/lib/socket.js
git add backend/src/controllers/admin.controller.js
git add backend/src/models/user.model.js
git add backend/package.json
git add backend/package-lock.json
git add frontend/src/hooks/useSocketHandler.js
git add frontend/src/components/admin/
git add frontend/src/pages/AdminDashboard.jsx
git add frontend/package-lock.json

echo Changes staged successfully!
echo.

echo ========================================
echo Step 2: Committing Changes
echo ========================================
echo.

git commit -m "Fix: CORS, online users count, and remove duplicate index

CRITICAL:
- Added production frontend URL to Socket.IO CORS (fixes login)

FIXES:
- Fixed online users count to use real-time socket connections
- Removed duplicate Mongoose index warning on username field
- Deleted unused socket handler with incorrect env variable
- Updated dependencies (jsonwebtoken, dotenv)
- Updated admin dashboard components

This fixes login CORS errors and online users count issues."

echo.
echo Commit created successfully!
echo.

echo ========================================
echo Step 3: Pushing to GitHub
echo ========================================
echo.

git push origin main

echo.
echo ========================================
echo Deployment Initiated!
echo ========================================
echo.
echo Render will automatically:
echo 1. Detect the push
echo 2. Build the backend
echo 3. Build the frontend
echo 4. Deploy both services
echo.
echo This usually takes 2-5 minutes.
echo.
echo Monitor at: https://dashboard.render.com
echo.
echo ========================================
echo After Deployment Completes:
echo ========================================
echo.
echo 1. Wait for both services to show "Live"
echo 2. Run: verify-production.bat
echo 3. Or manually test:
echo    - Visit: https://z-app-beta-z.onrender.com
echo    - Login as admin
echo    - Check Admin Dashboard
echo    - Verify "Online Now" count is accurate
echo.
echo ========================================
pause
