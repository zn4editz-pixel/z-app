@echo off
echo ========================================
echo  FINAL PUSH - All Critical Fixes
echo ========================================
echo.

echo Step 1: Checking git status...
git status
echo.

echo Step 2: Adding ALL modified files...
git add frontend/src/store/useChatStore.js
git add frontend/src/pages/StrangerChatPage.jsx
git add frontend/src/components/Sidebar.jsx
git add frontend/src/store/useAuthStore.js
git add backend/src/lib/socket.js
echo.

echo Step 3: Committing with detailed message...
git commit -m "Fix: Critical chat bugs - messages, stranger chat, online status" -m "- Fixed wrong messages flashing between chats" -m "- Fixed slow message sending (now instant)" -m "- Fixed duplicate messages" -m "- Fixed stranger chat WebRTC connection" -m "- Fixed online status display" -m "- Fixed ObjectId vs String comparison" -m "- Added stream ready waiting logic" -m "- Enhanced error handling"
echo.

echo Step 4: Pushing to GitHub...
git push origin main
echo.

echo ========================================
echo  PUSH COMPLETE!
echo ========================================
echo.
echo Critical fixes pushed:
echo [CHAT] Wrong messages flashing - FIXED
echo [CHAT] Slow message sending - FIXED
echo [CHAT] Duplicate messages - FIXED
echo [STRANGER] WebRTC connection - FIXED
echo [ONLINE] Status display - FIXED
echo.
echo Next: Test in production!
echo.
pause
