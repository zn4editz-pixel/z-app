@echo off
echo 🚀 DEPLOYING TO VERCEL - Project restructured for root deployment
echo.
echo ✅ Files moved to root:
echo - package.json
echo - package-lock.json  
echo - index.html
echo - src/ directory
echo - public/ directory
echo - tailwind.config.js
echo - postcss.config.js
echo - .env.production
echo.
echo 🔧 Updated vercel.json for root deployment
echo 🌐 Backend: https://z-app-backend.onrender.com (LIVE)
echo 🌐 Frontend: https://z-app-official.vercel.app (DEPLOYING)
echo.
echo 🚀 Pushing to GitHub for auto-deployment...

git add .
git commit -m "🚀 Fix Vercel deployment - restructure project for root deployment"
git push origin main

echo.
echo ✅ DEPLOYMENT INITIATED!
echo ⏱️  Wait 2-3 minutes for Vercel to build and deploy
echo 🌐 Check: https://z-app-official.vercel.app
echo.
echo 🎯 Expected Result:
echo - Frontend loads successfully
echo - Connects to backend at z-app-backend.onrender.com
echo - All features work correctly
echo.
pause