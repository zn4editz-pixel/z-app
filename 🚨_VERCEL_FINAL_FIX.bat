@echo off
echo 🚨 VERCEL FINAL FIX - Complete solution for deployment
echo.
echo 🎯 The Issue: Vercel can't find the frontend directory
echo 🔧 The Solution: Move frontend files to root OR fix vercel.json
echo.
echo Choose your approach:
echo 1. Quick Fix - Update vercel.json (Recommended)
echo 2. Full Restructure - Move files to root
echo.
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" goto quickfix
if "%choice%"=="2" goto restructure
goto end

:quickfix
echo.
echo 🚀 Applying Quick Fix...
echo.

REM Create a simple vercel.json that works with subdirectories
echo {> vercel.json
echo   "version": 2,>> vercel.json
echo   "builds": [>> vercel.json
echo     {>> vercel.json
echo       "src": "frontend/package.json",>> vercel.json
echo       "use": "@vercel/static-build",>> vercel.json
echo       "config": {>> vercel.json
echo         "distDir": "dist",>> vercel.json
echo         "framework": "vite">> vercel.json
echo       }>> vercel.json
echo     }>> vercel.json
echo   ],>> vercel.json
echo   "routes": [>> vercel.json
echo     {>> vercel.json
echo       "handle": "filesystem">> vercel.json
echo     },>> vercel.json
echo     {>> vercel.json
echo       "src": "/(.*)",>> vercel.json
echo       "dest": "/index.html">> vercel.json
echo     }>> vercel.json
echo   ]>> vercel.json
echo }>> vercel.json

echo ✅ Updated vercel.json for subdirectory support
goto push

:restructure
echo.
echo 🔄 Restructuring project...
echo.

REM Move all frontend files to root
copy "frontend\package.json" "." /Y
copy "frontend\package-lock.json" "." /Y
copy "frontend\index.html" "." /Y
copy "frontend\tailwind.config.js" "." /Y
copy "frontend\postcss.config.js" "." /Y

if exist "src" rmdir /s /q "src"
xcopy "frontend\src" "src" /E /I /Y

if exist "public" rmdir /s /q "public"
xcopy "frontend\public" "public" /E /I /Y

REM Update vercel.json for root structure
echo {> vercel.json
echo   "framework": "vite",>> vercel.json
echo   "buildCommand": "npm run build",>> vercel.json
echo   "outputDirectory": "dist",>> vercel.json
echo   "installCommand": "npm install",>> vercel.json
echo   "rewrites": [>> vercel.json
echo     {>> vercel.json
echo       "source": "/(.*)",>> vercel.json
echo       "destination": "/index.html">> vercel.json
echo     }>> vercel.json
echo   ]>> vercel.json
echo }>> vercel.json

echo ✅ Project restructured for root deployment

:push
echo.
echo 🚀 Pushing changes to GitHub...
git add .
git commit -m "🚨 Fix Vercel deployment structure and configuration"
git push origin main

echo.
echo ✅ Deployment fix applied!
echo 🌐 Vercel will auto-deploy in 2-3 minutes
echo 📱 Check: https://z-app-official.vercel.app
echo.

:end
pause