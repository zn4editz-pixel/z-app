@echo off
echo 🚨 VITE COMMAND FIX - Adding npx to build commands
echo.
echo ❌ Error was: "vite: command not found"
echo ✅ Fix: Changed "vite build" to "npx vite build"
echo.
echo 🔧 Updated package.json scripts:
echo - build: npx vite build
echo - vercel-build: npx vite build
echo.
echo 🚀 Pushing fix to trigger new build...

git add .
git commit -m "🚨 Fix vite command not found - use npx vite build"
git push origin main

echo.
echo ✅ VITE COMMAND FIXED!
echo 🔄 Vercel will now use npx to run vite
echo ⏱️  Wait 2-3 minutes for new build
echo 🌐 Check: https://z-app-official.vercel.app
echo.
pause