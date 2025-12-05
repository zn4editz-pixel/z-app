@echo off
echo ========================================
echo Z-APP - Production Deployment Script
echo ========================================
echo.

echo [Step 1/6] Running pre-deployment checks...
call pre-deployment-check.bat
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Pre-deployment checks failed!
    pause
    exit /b 1
)
echo.

echo [Step 2/6] Installing dependencies...
echo Installing backend dependencies...
cd backend
call npm install --production
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Backend dependency installation failed!
    cd ..
    pause
    exit /b 1
)
cd ..

echo Installing frontend dependencies...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Frontend dependency installation failed!
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo [Step 3/6] Building frontend...
cd frontend
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Frontend build failed!
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo [Step 4/6] Running security audit...
echo Checking backend...
cd backend
call npm audit --audit-level=high
cd ..

echo Checking frontend...
cd frontend
call npm audit --audit-level=high
cd ..
echo.

echo [Step 5/6] Committing to Git...
git add .
git commit -m "Production deployment - All features complete and tested"
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Git commit failed or no changes to commit
)
echo.

echo [Step 6/6] Pushing to GitHub...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Git push failed!
    echo Please check your Git configuration and try again.
    pause
    exit /b 1
)
echo.

echo ========================================
echo ✅ DEPLOYMENT PREPARATION COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Go to Render.com dashboard
echo 2. Trigger manual deploy for backend service
echo 3. Trigger manual deploy for frontend service
echo 4. Verify deployment logs
echo 5. Test the live application
echo.
echo Production URLs:
echo Backend: https://z-pp-main-com.onrender.com
echo Frontend: https://z-app-frontend-2-0.onrender.com
echo.
pause
