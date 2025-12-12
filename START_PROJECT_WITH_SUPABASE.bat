@echo off
color 0E
title Z-App - Supabase Powered Chat Application

echo.
echo  ███████╗      █████╗ ██████╗ ██████╗ 
echo  ╚══███╔╝     ██╔══██╗██╔══██╗██╔══██╗
echo    ███╔╝█████╗███████║██████╔╝██████╔╝
echo   ███╔╝ ╚════╝██╔══██║██╔═══╝ ██╔═══╝ 
echo  ███████╗     ██║  ██║██║     ██║     
echo  ╚══════╝     ╚═╝  ╚═╝╚═╝     ╚═╝     
echo.
echo 🚀 STARTING YOUR PROJECT WITH SUPABASE POWER!
echo.
echo ✅ Database: Supabase PostgreSQL (500MB FREE)
echo ✅ Performance: Ultra-fast with Redis caching
echo ✅ Features: Golden admin panel + Stranger chat
echo.

REM Check if Supabase is configured
if not exist "backend\.env" (
    echo ❌ Supabase not configured yet!
    echo.
    echo 🔧 Please run MIGRATE_TO_SUPABASE.bat first
    echo 🌐 Or follow SETUP_SUPABASE_STEP_BY_STEP.md
    pause
    exit /b
)

echo 🔧 Testing Supabase connection...
cd backend
node test-supabase-connection.js

echo.
echo 🚀 Starting backend server...
start "Z-App Backend (Supabase)" cmd /k "npm run dev"

echo.
echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo 🎨 Starting frontend...
cd ..\frontend
start "Z-App Frontend" cmd /k "npm run dev"

echo.
echo 🎉 YOUR PROJECT IS ALIVE!
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔧 Backend:  http://localhost:5001
echo 👑 Admin:    http://localhost:5173 (login: ronaldo@gmail.com / safwan123)
echo.
echo ✨ Features Ready:
echo    🎨 Beautiful golden admin panel with animations
echo    💬 Real-time chat with friends
echo    📹 Stranger video chat (Omegle-style)
echo    👥 Friend request system
echo    📊 User analytics and reports
echo    🛡️ AI content moderation
echo    📱 Mobile responsive design
echo.
echo 🚀 Powered by Supabase - 500MB FREE + Unlimited API!
echo.
pause