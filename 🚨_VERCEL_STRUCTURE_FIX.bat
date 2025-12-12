@echo off
echo 🚨 VERCEL STRUCTURE FIX - Moving frontend files to root
echo.
echo 🔧 Restructuring project for Vercel deployment...
echo.

REM Copy frontend files to root
echo Copying package.json to root...
copy "frontend\package.json" "package.json" /Y

echo Copying package-lock.json to root...
copy "frontend\package-lock.json" "package-lock.json" /Y

echo Copying vite.config.js to root...
copy "vite.config.js" "vite.config.js" /Y

echo Copying src directory...
if exist "src" rmdir /s /q "src"
xcopy "frontend\src" "src" /E /I /Y

echo Copying public directory...
if exist "public" rmdir /s /q "public"
xcopy "frontend\public" "public" /E /I /Y

echo Copying index.html...
copy "frontend\index.html" "index.html" /Y

echo Copying tailwind.config.js...
copy "frontend\tailwind.config.js" "tailwind.config.js" /Y

echo Copying postcss.config.js if exists...
if exist "frontend\postcss.config.js" copy "frontend\postcss.config.js" "postcss.config.js" /Y

echo.
echo ✅ Project restructured for Vercel!
echo 🚀 Pushing changes to GitHub...
echo.

git add .
git commit -m "🚨 Restructure project for Vercel - move frontend to root"
git push origin main

echo.
echo ✅ Changes pushed! Vercel will auto-deploy.
echo 🌐 Check deployment at: https://z-app-official.vercel.app
echo.
pause