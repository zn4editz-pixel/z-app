@echo off
echo ========================================
echo   PUSHING ALL UPDATES TO GITHUB
echo ========================================
echo.

echo Step 1: Adding all files...
git add .

echo.
echo Step 2: Committing changes...
git commit -m "feat: Major UI/UX improvements and performance optimizations - Fixed touch scrolling on all devices - Optimized verification request system - Redesigned chat reactions (Instagram style) - Fixed Stranger Chat layout (no scrolling) - Redesigned friend call page - Changed all buttons to outline style - Improved chat panel theme - Fixed video delay with hardware acceleration"

echo.
echo Step 3: Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo   PUSH COMPLETE!
echo ========================================
pause
