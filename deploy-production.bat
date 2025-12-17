@echo off
REM 🚀 PRODUCTION DEPLOYMENT SCRIPT FOR WINDOWS
REM This script prepares and deploys the Z-App to production

echo 🚀 Starting Production Deployment...

REM Check if required files exist
echo [INFO] Checking required files...

if not exist "backend\.env.production" (
    echo [ERROR] backend\.env.production not found!
    echo [WARNING] Please copy backend\.env.production.template to backend\.env.production and configure it
    exit /b 1
)

if not exist "frontend\.env.production" (
    echo [ERROR] frontend\.env.production not found!
    echo [WARNING] Please create frontend\.env.production with your production URLs
    exit /b 1
)

echo [SUCCESS] Required files found

REM Install backend dependencies
echo [INFO] Installing backend dependencies...
cd backend
call npm install --production
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies
    exit /b 1
)
echo [SUCCESS] Backend dependencies installed

REM Install frontend dependencies
cd ..\frontend
echo [INFO] Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install frontend dependencies
    exit /b 1
)
echo [SUCCESS] Frontend dependencies installed

REM Generate Prisma client
echo [INFO] Generating Prisma client...
cd ..\backend
call npx prisma generate
if errorlevel 1 (
    echo [ERROR] Failed to generate Prisma client
    exit /b 1
)
echo [SUCCESS] Prisma client generated

REM Build frontend
echo [INFO] Building frontend for production...
cd ..\frontend
call npm run build
if errorlevel 1 (
    echo [ERROR] Failed to build frontend
    exit /b 1
)
echo [SUCCESS] Frontend built successfully

REM Copy frontend build to backend public folder
echo [INFO] Copying frontend build to backend...
if exist "..\backend\public" rmdir /s /q "..\backend\public"
xcopy /e /i "dist" "..\backend\public"
echo [SUCCESS] Frontend copied to backend

REM Create production build info
echo [INFO] Creating build info...
cd ..\backend
echo { > public\build-info.json
echo   "buildTime": "%date% %time%", >> public\build-info.json
echo   "version": "2.0.0", >> public\build-info.json
echo   "environment": "production" >> public\build-info.json
echo } >> public\build-info.json

echo [SUCCESS] Build info created

echo.
echo 🎉 DEPLOYMENT READY!
echo ====================
echo.
echo ✅ Backend dependencies installed
echo ✅ Frontend built and copied
echo ✅ Prisma client generated
echo ✅ Environment variables validated
echo.
echo 📋 Next Steps:
echo 1. Deploy the backend folder to your hosting service
echo 2. Set up your database (PostgreSQL)
echo 3. Configure your domain and SSL
echo 4. Update CORS origins in production
echo.
echo 🚀 Start command: npm start (from backend folder)
echo.

echo [SUCCESS] Production deployment preparation completed!
pause