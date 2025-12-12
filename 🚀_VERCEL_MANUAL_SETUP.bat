@echo off
echo 🚀 VERCEL MANUAL SETUP - Complete Configuration
echo.
echo 📋 ENVIRONMENT VARIABLES TO ADD IN VERCEL DASHBOARD:
echo.
echo Go to: https://vercel.com/dashboard
echo Select: z-app-official project
echo Go to: Settings ^> Environment Variables
echo.
echo Add these variables:
echo ================================
echo VITE_API_BASE_URL = https://z-app-backend.onrender.com
echo VITE_API_URL = https://z-app-backend.onrender.com
echo VITE_NODE_ENV = production
echo VITE_ENABLE_ANALYTICS = true
echo VITE_ENABLE_ERROR_REPORTING = true
echo VITE_ENABLE_PWA = true
echo VITE_ENABLE_COMPRESSION = true
echo NODE_ENV = production
echo ================================
echo.
echo 🔧 BUILD SETTINGS TO CONFIGURE:
echo.
echo Go to: Settings ^> General ^> Build ^& Output Settings
echo.
echo Framework Preset: Vite
echo Build Command: npm run build
echo Output Directory: dist
echo Install Command: npm install
echo Node.js Version: 18.x
echo Root Directory: . (leave empty)
echo.
echo 🔄 AFTER SETTING UP:
echo 1. Go to Deployments tab
echo 2. Click three dots on latest deployment
echo 3. Click "Redeploy"
echo 4. Uncheck "Use existing Build Cache"
echo 5. Click "Redeploy"
echo.
echo 🌐 TEST URL: https://z-app-official.vercel.app
echo.
pause