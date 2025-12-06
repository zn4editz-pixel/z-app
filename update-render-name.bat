@echo off
echo ========================================
echo    Update Render Service Name
echo ========================================
echo.

echo Current Status:
echo   Old URL: z-app-beta-z.onrender.com
echo   New URL: z-app.onrender.com
echo   Logo: z-app-logo.png (configured)
echo.
echo ========================================
echo    What You Need to Do
echo ========================================
echo.

echo STEP 1: Change Render Service Name
echo ────────────────────────────────────
echo   1. Go to: https://dashboard.render.com
echo   2. Click your frontend service
echo   3. Go to Settings tab
echo   4. Change Name from: z-app-beta-z
echo   5. Change Name to: z-app
echo   6. Click Save Changes
echo.
pause

echo.
echo STEP 2: Update Backend Environment Variables
echo ────────────────────────────────────────────
echo   1. Go to your backend service
echo   2. Click Environment tab
echo   3. Update these variables:
echo      CLIENT_URL=https://z-app.onrender.com
echo      FRONTEND_URL=https://z-app.onrender.com
echo   4. Click Save Changes
echo.
pause

echo.
echo STEP 3: Deploy Code Changes
echo ────────────────────────────
echo.

set /p deploy="Deploy changes now? (y/n): "
if /i "%deploy%"=="y" (
    echo.
    echo Adding files...
    git add .
    
    echo Committing changes...
    git commit -m "Update branding and URLs for z-app.onrender.com"
    
    echo Pushing to GitHub...
    git push origin main
    
    echo.
    echo ✅ Code deployed! Render will auto-deploy.
) else (
    echo.
    echo Skipped deployment. Run these commands manually:
    echo   git add .
    echo   git commit -m "Update branding and URLs"
    echo   git push origin main
)

echo.
echo ========================================
echo    Opening Render Dashboard
echo ========================================
echo.

start https://dashboard.render.com

echo.
echo ========================================
echo    Summary
echo ========================================
echo.
echo ✅ Code updated with your z-app-logo.png
echo ✅ All URLs changed to z-app.onrender.com
echo ⏳ You need to change Render service name
echo ⏳ You need to update backend URLs
echo.
echo After completing steps 1 & 2:
echo   • Your URL will be: z-app.onrender.com
echo   • Your logo will show in Google
echo   • Everything will look professional
echo.
echo Read: CHANGE_RENDER_NAME.md for detailed guide
echo.
pause
