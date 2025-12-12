@echo off
color 0E
title Z-App Admin Dashboard - DaisyUI Theme

echo.
echo  █████╗ ██████╗ ███╗   ███╗██╗███╗   ██╗    ██████╗  █████╗ ███╗   ██╗███████╗██╗     
echo ██╔══██╗██╔══██╗████╗ ████║██║████╗  ██║    ██╔══██╗██╔══██╗████╗  ██║██╔════╝██║     
echo ███████║██║  ██║██╔████╔██║██║██╔██╗ ██║    ██████╔╝███████║██╔██╗ ██║█████╗  ██║     
echo ██╔══██║██║  ██║██║╚██╔╝██║██║██║╚██╗██║    ██╔═══╝ ██╔══██║██║╚██╗██║██╔══╝  ██║     
echo ██║  ██║██████╔╝██║ ╚═╝ ██║██║██║ ╚████║    ██║     ██║  ██║██║ ╚████║███████╗███████╗
echo ╚═╝  ╚═╝╚═════╝ ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝    ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝
echo.
echo 🎨 BEAUTIFUL DAISYUI ADMIN DASHBOARD
echo.
echo ✅ Features:
echo    🎨 Beautiful DaisyUI gradient theme
echo    📊 Real-time dashboard with stats
echo    👥 User management system
echo    🛡️ AI moderation panel
echo    📋 Reports management
echo    ✅ Verification requests
echo    🔔 Notifications system
echo    🧠 Server intelligence center
echo.

REM Check if backend is running
echo 🔧 Checking backend status...
curl -s http://localhost:5001/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend not running. Starting backend...
    cd backend
    start "Z-App Backend" cmd /k "npm run dev"
    cd ..
    echo ⏳ Waiting for backend to start...
    timeout /t 5 /nobreak > nul
) else (
    echo ✅ Backend is already running
)

echo 🎨 Starting frontend...
cd frontend
start "Z-App Frontend" cmd /k "npm run dev"
cd ..

echo.
echo 🎉 ADMIN DASHBOARD READY!
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔧 Backend:  http://localhost:5001
echo 👑 Admin:    http://localhost:5173/admin
echo.
echo 🔑 Login Credentials:
echo    📧 Email: ronaldo@gmail.com
echo    🔐 Password: safwan123
echo.
echo ✨ Features Available:
echo    🎨 Beautiful DaisyUI gradient theme
echo    📊 Dashboard with animated stats cards
echo    👥 User management with real-time status
echo    🛡️ AI moderation with confidence scores
echo    📋 Reports management system
echo    ✅ Verification request handling
echo    🔔 Notification broadcasting
echo    🧠 Server intelligence monitoring
echo    📈 Real-time analytics
echo.
echo 🚀 Your beautiful admin dashboard is now live!
echo.
pause