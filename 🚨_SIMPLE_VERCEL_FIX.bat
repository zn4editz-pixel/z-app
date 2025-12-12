@echo off
echo 🚨 SIMPLE VERCEL FIX - Minimal configuration
echo.
echo 🔧 Using the simplest possible vercel.json
echo 📦 Letting Vercel auto-detect everything
echo.
echo 🚀 Deploying with minimal config...

git add .
git commit -m "🚨 Simple Vercel fix - minimal configuration"
git push origin main

echo.
echo ✅ SIMPLE FIX DEPLOYED!
echo 🌐 Check: https://z-app-official.vercel.app
echo.
pause