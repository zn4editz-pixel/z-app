@echo off
echo ========================================
echo  Pushing Bug Fixes to GitHub
echo ========================================
echo.

echo Step 1: Checking Git status...
git status
echo.

echo Step 2: Adding all changed files...
git add .
echo.

echo Step 3: Committing changes...
git commit -F COMMIT_MESSAGE.txt
echo.

echo Step 4: Pushing to GitHub...
git push origin main
echo.

echo ========================================
echo  Push Complete!
echo ========================================
echo.
echo Files pushed:
echo - frontend/src/pages/StrangerChatPage.jsx
echo - frontend/src/components/Sidebar.jsx
echo - frontend/src/store/useAuthStore.js
echo - backend/src/lib/socket.js
echo - COMPREHENSIVE_AUDIT_AND_FIXES.md
echo - AUDIT_SUMMARY.md
echo - QUICK_HEALTH_CHECK.md
echo - ACTION_PLAN.md
echo - BUG_FIXES_APPLIED.md
echo - COMMIT_MESSAGE.txt
echo.
echo Next steps:
echo 1. Test stranger chat functionality
echo 2. Verify online status display
echo 3. Check console logs for debugging
echo.
pause
