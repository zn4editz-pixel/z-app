@echo off
REM 🚀 RENDER + VERCEL DEPLOYMENT SCRIPT
echo 🚀 Z-App Render + Vercel Deployment Setup

echo.
echo 📋 DEPLOYMENT CHECKLIST:
echo ✅ 1. Create Render account at render.com
echo ✅ 2. Create Vercel account at vercel.com  
echo ✅ 3. Connect both to your GitHub repository
echo.

echo 🔧 RENDER BACKEND SETUP:
echo 1. Create PostgreSQL database on Render
echo 2. Create Web Service with these settings:
echo    - Root Directory: backend
echo    - Build Command: npm install ^&^& npx prisma generate
echo    - Start Command: npm start
echo    - Environment: Node
echo.

echo 📋 RENDER ENVIRONMENT VARIABLES:
echo Copy from: backend/.env.render
type backend\.env.render
echo.

echo 🌐 VERCEL FRONTEND SETUP:
echo 1. Import repository to Vercel
echo 2. Set Framework: Vite
echo 3. Set Root Directory: frontend
echo 4. Set Build Command: npm run build
echo 5. Set Output Directory: dist
echo.

echo 📋 VERCEL ENVIRONMENT VARIABLES:
echo Copy from: frontend/.env.vercel
type frontend\.env.vercel
echo.

echo 🎯 NEXT STEPS:
echo 1. Deploy backend on Render (get the URL)
echo 2. Update VITE_API_BASE_URL in Vercel with Render URL
echo 3. Deploy frontend on Vercel (get the URL)
echo 4. Update CLIENT_URL and FRONTEND_URL in Render with Vercel URL
echo 5. Redeploy backend to apply CORS changes
echo.

echo 📚 DETAILED GUIDE: See RENDER_VERCEL_DEPLOYMENT.md
echo.

echo 🎉 Your Z-App will be live at:
echo Backend:  https://your-backend-name.onrender.com
echo Frontend: https://your-app-name.vercel.app
echo.

pause