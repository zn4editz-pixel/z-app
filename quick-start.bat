@echo off
echo ========================================
echo Z-APP Quick Start
echo ========================================
echo.

echo [1/4] Installing dependencies...
call npm install
cd backend && call npm install
cd ../frontend && call npm install
cd ..

echo.
echo [2/4] Generating Prisma client...
cd backend
call npx prisma generate

echo.
echo [3/4] Setting up database...
call npx prisma db push

echo.
echo [4/4] Starting servers...
echo.
echo Backend: http://localhost:5001
echo Frontend: http://localhost:5173
echo.
echo Opening two terminals...
start cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Servers starting!
echo ========================================
pause
