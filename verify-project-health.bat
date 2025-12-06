@echo off
echo ========================================
echo PROJECT HEALTH CHECK
echo ========================================
echo.

echo [1/6] Checking Node.js version...
node --version
echo.

echo [2/6] Checking npm version...
npm --version
echo.

echo [3/6] Checking backend dependencies...
cd backend
if exist node_modules (
    echo ✓ Backend dependencies installed
) else (
    echo ✗ Backend dependencies missing - run: npm install
)
cd ..
echo.

echo [4/6] Checking frontend dependencies...
cd frontend
if exist node_modules (
    echo ✓ Frontend dependencies installed
) else (
    echo ✗ Frontend dependencies missing - run: npm install
)
cd ..
echo.

echo [5/6] Checking environment files...
if exist backend\.env (
    echo ✓ Backend .env exists
) else (
    echo ✗ Backend .env missing - copy from .env.example
)

if exist frontend\.env (
    echo ✓ Frontend .env exists
) else (
    echo ✗ Frontend .env missing
)
echo.

echo [6/6] Checking build output...
if exist backend\dist (
    echo ✓ Production build exists
) else (
    echo ✗ Production build missing - run: npm run build in frontend
)
echo.

echo ========================================
echo HEALTH CHECK COMPLETE
echo ========================================
pause
