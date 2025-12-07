@echo off
echo Testing Backend Connection...
echo.

echo Checking if backend is running on port 5001...
curl -s http://localhost:5001/health

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Backend is running!
    echo.
    echo Testing API endpoints...
    echo.
    echo 1. Health Check:
    curl -s http://localhost:5001/health
    echo.
    echo.
    echo 2. API Base:
    curl -s http://localhost:5001/api
    echo.
) else (
    echo.
    echo ❌ Backend is NOT running!
    echo.
    echo Please start the backend server first:
    echo   cd backend
    echo   npm run dev
    echo.
    echo Or use: start-dev.bat
)

echo.
pause
