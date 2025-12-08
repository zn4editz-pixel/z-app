@echo off
echo ========================================
echo  Final Push to GitHub
echo ========================================
echo.

echo Checking git status...
git status
echo.

echo Adding modified files...
git add frontend/src/store/useChatStore.js
git add backend/src/lib/socket.js
git add frontend/src/pages/StrangerChatPage.jsx
git add frontend/src/store/useAuthStore.js
git add frontend/src/components/Sidebar.jsx
echo.

echo Committing changes...
git commit -F FINAL_COMMIT_MESSAGE.txt
echo.

echo Pushing to GitHub...
git push origin main
echo.

echo ========================================
echo  Push Complete!
echo ========================================
echo.
echo Files pushed:
echo - frontend/src/store/useChatStore.js (CRITICAL FIX)
echo - backend/src/lib/socket.js
echo - frontend/src/pages/StrangerChatPage.jsx
echo - frontend/src/store/useAuthStore.js
echo - frontend/src/components/Sidebar.jsx
echo.
pause
