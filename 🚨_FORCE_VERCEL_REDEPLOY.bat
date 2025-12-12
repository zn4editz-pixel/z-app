@echo off
echo 🚨 FORCE VERCEL REDEPLOY - Clear cache and redeploy
echo.
echo 🔧 Updated vercel.json to use @vercel/static-build
echo 📦 Root package.json is ready
echo 🗂️ All files are in root directory
echo.
echo 🚀 Forcing fresh deployment...

REM Add a timestamp to force cache invalidation
echo. >> README.md
echo ^<!-- Deployment timestamp: %date% %time% --^> >> README.md

git add .
git commit -m "🚨 Force Vercel redeploy - clear cache and use new config"
git push origin main

echo.
echo ✅ FORCED REDEPLOY INITIATED!
echo 🔄 Vercel will now use the new configuration
echo ⏱️  Wait 2-3 minutes for fresh build
echo 🌐 Check: https://z-app-official.vercel.app
echo.
echo 📋 What changed:
echo - Updated vercel.json to use @vercel/static-build
echo - Added timestamp to force cache invalidation
echo - All files are properly in root directory
echo.
pause