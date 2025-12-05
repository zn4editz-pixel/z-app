@echo off
echo ========================================
echo Z-App Pre-Deployment Checklist
echo ========================================
echo.

echo Checking Node.js version...
node --version
echo.

echo Checking npm version...
npm --version
echo.

echo ========================================
echo Backend Checks
echo ========================================
echo.

echo Checking backend dependencies...
cd backend
if exist package.json (
    echo package.json found
    npm list --depth=0
) else (
    echo ERROR: package.json not found!
)
echo.

echo Checking for .env file...
if exist .env (
    echo .env file found
) else (
    echo WARNING: .env file not found! Copy from .env.example
)
echo.

echo Checking backend build...
if exist dist (
    echo dist folder found
) else (
    echo WARNING: dist folder not found (will be created on build)
)
echo.

cd ..

echo ========================================
echo Frontend Checks
echo ========================================
echo.

echo Checking frontend dependencies...
cd frontend
if exist package.json (
    echo package.json found
    npm list --depth=0
) else (
    echo ERROR: package.json not found!
)
echo.

echo Checking for .env files...
if exist .env (
    echo .env file found
) else (
    echo WARNING: .env file not found!
)
if exist .env.production (
    echo .env.production file found
) else (
    echo WARNING: .env.production file not found!
)
echo.

echo Checking frontend build...
if exist dist (
    echo dist folder found
) else (
    echo WARNING: dist folder not found (will be created on build)
)
echo.

cd ..

echo ========================================
echo Environment Variables Check
echo ========================================
echo.
echo Please verify these are set in your .env files:
echo.
echo Backend (.env):
echo - MONGODB_URI
echo - JWT_SECRET
echo - CLOUDINARY_CLOUD_NAME
echo - CLOUDINARY_API_KEY
echo - CLOUDINARY_API_SECRET
echo - ADMIN_EMAIL
echo - EMAIL_USER
echo - EMAIL_PASS
echo - FRONTEND_URL
echo.
echo Frontend (.env.production):
echo - VITE_API_BASE_URL
echo - VITE_API_URL
echo.

echo ========================================
echo Security Checks
echo ========================================
echo.

echo Checking for security vulnerabilities...
cd backend
npm audit
cd ..
echo.

cd frontend
npm audit
cd ..
echo.

echo ========================================
echo Build Test
echo ========================================
echo.
echo Would you like to test the build process? (Y/N)
set /p BUILD_TEST=
if /i "%BUILD_TEST%"=="Y" (
    echo Building frontend...
    cd frontend
    npm run build
    cd ..
    echo.
    echo Build complete! Check for errors above.
)
echo.

echo ========================================
echo Checklist Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Fix any errors or warnings above
echo 2. Commit and push to GitHub
echo 3. Deploy to Render
echo 4. Test all features in production
echo.
pause
