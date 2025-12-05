@echo off
echo ========================================
echo AI Content Moderation Test Script
echo ========================================
echo.

echo Checking if dependencies are installed...
cd frontend
call npm list nsfwjs @tensorflow/tfjs 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] AI moderation dependencies not found!
    echo Installing nsfwjs and @tensorflow/tfjs...
    call npm install nsfwjs @tensorflow/tfjs
) else (
    echo [OK] AI moderation dependencies installed
)
echo.

echo ========================================
echo Test Instructions:
echo ========================================
echo.
echo 1. Start the development servers:
echo    - Run: fix-and-start.bat
echo.
echo 2. Open Stranger Chat in two browsers:
echo    - Browser 1: Login as User A
echo    - Browser 2: Login as User B
echo.
echo 3. Start a video call between them
echo.
echo 4. Monitor the browser console:
echo    - Look for: "AI Moderation Alert"
echo    - Check violation counts
echo    - Watch for auto-disconnect
echo.
echo 5. Test scenarios:
echo    - Normal content: Should pass
echo    - Inappropriate content: Should trigger warnings
echo    - Multiple violations: Should auto-disconnect
echo    - High confidence: Should auto-report
echo.
echo ========================================
echo Configuration:
echo ========================================
echo.
echo File: frontend/src/utils/contentModeration.js
echo.
echo MODERATION_CONFIG = {
echo   enabled: true,
echo   checkInterval: 10000,        // 10 seconds
echo   confidenceThreshold: 0.6,    // 60%% to flag
echo   autoReportThreshold: 0.8,    // 80%% to auto-report
echo   maxViolations: 2             // Max warnings
echo }
echo.
echo To disable: Set enabled: false
echo.
echo ========================================
echo Rate Limiting Test:
echo ========================================
echo.
echo 1. Message Rate Limit:
echo    - Send 31 messages in 1 minute
echo    - 31st should be blocked
echo.
echo 2. Friend Request Limit:
echo    - Send 21 friend requests in 1 hour
echo    - 21st should be blocked
echo.
echo 3. Auth Rate Limit:
echo    - Try 6 login attempts in 15 minutes
echo    - 6th should be blocked
echo.
echo ========================================
echo.

cd ..
pause
