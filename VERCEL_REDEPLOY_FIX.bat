@echo off
echo 🚀 VERCEL FRONTEND FIX - Redeploying with correct backend URL
echo.
echo ✅ Backend is live at: https://z-app-backend.onrender.com
echo ✅ Frontend should be at: https://z-app-official.vercel.app
echo.
echo 🔧 Fixes applied:
echo - Added fallback backend URL in axios.js
echo - Added fallback socket URL in auth store
echo - Environment variables will be set in Vercel dashboard
echo.
echo 📝 IMPORTANT: You need to set these environment variables in Vercel:
echo.
echo Go to: https://vercel.com/dashboard
echo 1. Select your z-app-official project
echo 2. Go to Settings ^> Environment Variables
echo 3. Add: VITE_API_BASE_URL = https://z-app-backend.onrender.com
echo 4. Add: VITE_NODE_ENV = production
echo 5. Redeploy from Deployments tab
echo.
echo 🚀 Pushing changes to GitHub to trigger auto-deploy...
echo.

git add .
git commit -m "🔧 Fix frontend-backend connection for Vercel deployment"
git push origin main

echo.
echo ✅ Changes pushed! Vercel will auto-deploy.
echo 🌐 Check your deployment at: https://z-app-official.vercel.app
echo.
pause