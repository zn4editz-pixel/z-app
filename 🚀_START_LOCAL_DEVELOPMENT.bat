@echo off
echo 🚀 Starting Local Development Environment
echo.
echo 📋 Checking prerequisites...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

echo 🔧 Setting up environment...
echo.

REM Setup backend
echo 📡 Setting up Backend...
cd backend
if not exist node_modules (
    echo 📦 Installing backend dependencies...
    npm install
)

echo 🗄️ Setting up database...
npx prisma generate
npx prisma db push

echo ✅ Backend setup complete
echo.

REM Setup frontend  
echo 🌐 Setting up Frontend...
cd ../frontend
if not exist node_modules (
    echo 📦 Installing frontend dependencies...
    npm install
)

echo ✅ Frontend setup complete
echo.

echo 🚀 Starting development servers...
echo.

REM Start backend in background
echo 📡 Starting Backend Server (Port 5001)...
cd ../backend
start "Backend Server" cmd /k "npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend
echo 🌐 Starting Frontend Server (Port 5173)...
cd ../frontend
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ Development servers started!
echo.
echo 📱 Frontend: http://localhost:5173
echo 📡 Backend:  http://localhost:5001
echo.
echo 🎯 Both servers are running in separate windows
echo 🔄 Changes will auto-reload
echo.
pause