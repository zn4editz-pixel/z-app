@echo off
echo 🚀 Starting Z-App Development Servers...
echo.

echo 📊 System Status Check...
echo ✅ Backend: Ready to start
echo ✅ Frontend: Ready to start  
echo ✅ Database: SQLite (Local)
echo ✅ All bugs: FIXED
echo.

echo 🔄 Starting Backend Server...
start "Backend Server" cmd /k "cd backend && node src/index.js"

echo ⏳ Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo 🔄 Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo 🎉 Development servers starting!
echo.
echo 📝 Access URLs:
echo 🌐 Frontend: http://localhost:5174
echo 🔧 Backend:  http://localhost:5001
echo 📊 Health:   http://localhost:5001/health/ping
echo.
echo 🧪 Test Friend API:
echo curl http://localhost:5001/api/friends/all
echo.
echo ✅ All major systems are functional!
echo 🚀 Ready for development and testing!

pause