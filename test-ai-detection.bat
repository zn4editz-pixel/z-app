@echo off
echo ========================================
echo AI MODERATION DETECTION TEST
echo ========================================
echo.
echo This will help you verify AI moderation is working
echo.
echo STEPS TO TEST:
echo.
echo 1. Start the development server (if not running):
echo    npm run dev
echo.
echo 2. Open browser console (F12)
echo.
echo 3. Go to Stranger Chat page
echo.
echo 4. Look for these console messages:
echo    - "Initializing AI moderation model..."
echo    - "NSFW detection model loaded successfully"
echo    - "AI moderation ready"
echo.
echo 5. Check for GREEN "AI Protected" badge on video
echo.
echo 6. When connected to stranger, watch console for:
echo    - "AI Check #1 - Status: connected"
echo    - "AI Predictions: Neutral: XX%, ..."
echo.
echo 7. Test with OBS screen share (inappropriate content)
echo.
echo 8. Should see warnings/auto-reports in console
echo.
echo ========================================
echo CONSOLE COMMANDS TO CHECK STATUS:
echo ========================================
echo.
echo Open browser console and run:
echo   localStorage.getItem('ai-moderation-enabled')
echo.
echo To manually test detection:
echo   // In console while on stranger chat page
echo   window.testAIModeration = true
echo.
echo ========================================
pause
