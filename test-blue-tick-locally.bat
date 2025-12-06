@echo off
cls
echo ========================================
echo   Test Blue Tick Locally
echo ========================================
echo.

echo This will start the development servers and help you test the blue tick feature.
echo.

echo Step 1: Start Backend
echo.
start cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak > nul

echo Step 2: Start Frontend
echo.
start cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak > nul

echo.
echo ========================================
echo   Testing Instructions
echo ========================================
echo.
echo 1. Wait for both servers to start (~30 seconds)
echo.
echo 2. Open TWO browser windows:
echo    Window 1: http://localhost:5173 (User A)
echo    Window 2: http://localhost:5173 (Incognito - User B)
echo.
echo 3. Open Console (F12) in BOTH windows
echo.
echo 4. Login with different accounts in each window
echo.
echo 5. Test Flow:
echo    a) User A sends message to User B
echo    b) Check User A's console - should see single tick
echo    c) User B opens chat with User A
echo    d) Check User B's console for:
echo       "📘 Calling markMessagesAsRead API"
echo    e) Check User A's console for:
echo       "📘 Received messagesRead event"
echo       "📘 Updating message ... to read status"
echo    f) Check User A's chat - ticks should turn BLUE
echo.
echo 6. Look for these logs:
echo    📘 = Blue tick related logs
echo    ✅ = Success
echo    ❌ = Error
echo.
echo ========================================
echo   What to Check
echo ========================================
echo.
echo In User A's browser (sender):
echo  - Message shows ✓ (gray) after sending
echo  - Message shows ✓✓ (gray) when delivered
echo  - Message shows ✓✓ (BLUE) when User B opens chat
echo.
echo In User B's browser (receiver):
echo  - Console shows "Calling markMessagesAsRead API"
echo  - Console shows "API Response: Marked X messages"
echo.
echo ========================================
echo   Common Issues
echo ========================================
echo.
echo Issue 1: No blue ticks appear
echo  - Check if "messagesRead" event is received
echo  - Look for "Updating message" logs
echo  - Verify socket is connected
echo.
echo Issue 2: API not called
echo  - Check if chat is opened
echo  - Look for errors in console
echo  - Verify user is logged in
echo.
echo Issue 3: Event received but no update
echo  - Check receiverId vs readBy in logs
echo  - Verify message status before update
echo  - Look for ObjectId comparison issues
echo.
echo ========================================
pause
