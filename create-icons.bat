@echo off
echo ========================================
echo    Creating Z-APP Icons
echo ========================================
echo.

echo I've created SVG icons for you!
echo.
echo Files created:
echo   - frontend/public/logo.svg (main logo)
echo   - frontend/public/icon-192.svg (PWA icon)
echo   - frontend/public/icon-512.svg (PWA icon)
echo.
echo ========================================
echo    How to Create PNG Versions (FREE)
echo ========================================
echo.
echo Option 1: Use Online Converter (Easiest)
echo   1. Go to: https://cloudconvert.com/svg-to-png
echo   2. Upload: frontend/public/logo.svg
echo   3. Set size: 512x512
echo   4. Download as: z-app-icon.png
echo   5. Save to: frontend/public/
echo.
echo Option 2: Use Canva (Free)
echo   1. Go to: https://www.canva.com
echo   2. Upload the SVG
echo   3. Download as PNG (512x512)
echo.
echo Option 3: Use Figma (Free)
echo   1. Go to: https://www.figma.com
echo   2. Import SVG
echo   3. Export as PNG
echo.
echo ========================================
echo    Change Render Service Name
echo ========================================
echo.
echo 1. Go to: https://dashboard.render.com
echo 2. Click your frontend service
echo 3. Go to Settings tab
echo 4. Change Name to: z-app
echo 5. Save Changes
echo.
echo Your new URL will be:
echo   https://z-app.onrender.com
echo.
echo Don't forget to update backend environment variables!
echo.
pause

echo.
echo Opening Render dashboard...
start https://dashboard.render.com

echo.
echo Opening SVG to PNG converter...
start https://cloudconvert.com/svg-to-png

echo.
echo All done! Check the files in frontend/public/
pause
