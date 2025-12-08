@echo off
echo ========================================
echo Z-APP Setup Verification
echo ========================================
echo.

echo [1/5] Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    pause
    exit /b 1
)

echo.
echo [2/5] Checking backend dependencies...
if not exist "backend\node_modules" (
    echo WARNING: Backend dependencies not installed
    echo Run: cd backend ^&^& npm install
) else (
    echo OK: Backend dependencies found
)

echo.
echo [3/5] Checking frontend dependencies...
if not exist "frontend\node_modules" (
    echo WARNING: Frontend dependencies not installed
    echo Run: cd frontend ^&^& npm install
) else (
    echo OK: Frontend dependencies found
)

echo.
echo [4/5] Checking environment files...
if not exist "backend\.env" (
    echo WARNING: backend\.env not found
    echo Copy backend\.env.example to backend\.env and configure it
) else (
    echo OK: backend\.env found
)

if not exist "frontend\.env" (
    echo WARNING: frontend\.env not found
    echo Create frontend\.env with VITE_API_URL
) else (
    echo OK: frontend\.env found
)

echo.
echo [5/5] Checking Prisma client...
if not exist "backend\node_modules\.prisma" (
    echo WARNING: Prisma client not generated
    echo Run: cd backend ^&^& npx prisma generate
) else (
    echo OK: Prisma client generated
)

echo.
echo ========================================
echo Verification Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Configure backend\.env and frontend\.env
echo 2. Run: node test-system.js
echo 3. Run: quick-start.bat
echo.
pause
