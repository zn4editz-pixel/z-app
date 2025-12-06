@echo off
cls
echo ========================================
echo   Deploy Blue Tick Fix
echo ========================================
echo.

echo This will fix the message read status (blue tick) display.
echo.
echo Changes:
echo  - Read messages now show BLUE double ticks
echo  - Delivered messages show GRAY double ticks
echo  - Sent messages show GRAY single tick
echo.

pause

echo.
echo [1/3] Staging changes...
git add frontend/src/components/ChatMessage.jsx
echo     Done!
echo.

echo [2/3] Committing...
git commit -m "Fix: Blue tick for read messages now displays correctly

- Read messages: Blue double ticks (✓✓)
- Delivered messages: Gray double ticks (✓✓)
- Sent messages: Gray single tick (✓)

This improves message status visibility for users."
echo     Done!
echo.

echo [3/3] Pushing to GitHub...
git push origin main
echo     Done!
echo.

echo ========================================
echo   Deployment Initiated!
echo ========================================
echo.
echo Render will rebuild the frontend (~2-3 minutes)
echo.
echo After deployment:
echo 1. Send a message
echo 2. Recipient opens chat
echo 3. Sender sees blue ticks appear!
echo.
echo Monitor: https://dashboard.render.com
echo.
pause
