@echo off
echo 🚨 VITE DEPENDENCY FIX - Moving Vite to regular dependencies
echo.
echo ❌ Error was: "Cannot find package 'vite'"
echo ✅ Fix: Moved vite and @vitejs/plugin-react to dependencies
echo ✅ Fix: Created simple vite.config.simple.js
echo ✅ Fix: Updated build script to use simple config
echo.
echo 🔧 Changes made:
echo - Moved vite from devDependencies to dependencies
echo - Moved @vitejs/plugin-react to dependencies
echo - Created simplified vite config
echo - Updated build command
echo.
echo 🚀 Pushing fix to trigger new build...

git add .
git commit -m "🚨 Fix Vite dependency - move to regular dependencies and simplify config"
git push origin main

echo.
echo ✅ VITE DEPENDENCY FIXED!
echo 🔄 Vercel will now find Vite in dependencies
echo ⏱️  Wait 2-3 minutes for new build
echo 🌐 Check: https://z-app-official.vercel.app
echo.
pause