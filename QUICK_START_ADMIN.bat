@echo off
color 0A
echo ========================================
echo   Z-APP Admin Dashboard Quick Start
echo ========================================
echo.

echo Checking backend status...
curl -s http://localhost:5001/health >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend is already running!
    echo.
    echo Opening admin dashboard...
    start http://localhost:5173/admin
    echo.
    echo ✅ Done! Admin dashboard should open in your browser.
) else (
    echo ❌ Backend is not running!
    echo.
    echo Starting backend server...
    start "Z-APP Backend" cmd /k "cd backend && npm run dev"
    echo.
    echo ⏳ Waiting for backend to start (10 seconds)...
    timeout /t 10 /nobreak >nul
    echo.
    echo ✅ Backend started!
    echo.
    echo Opening admin dashboard...
    start http://localhost:5173/admin
    echo.
    echo ✅ Done! Admin dashboard should open in your browser.
)

echo.
echo ========================================
echo   Admin Dashboard Features:
echo ========================================
echo   ✨ Modern gradient graphs
echo   📊 Real-time statistics
echo   👥 Online/Offline users list
echo   🤖 AI moderation panel
echo   🔍 Search and filter users
echo   📈 Beautiful analytics charts
echo ========================================
echo.
echo Press any key to exit...
pause >nul
