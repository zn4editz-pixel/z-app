@echo off
echo 🔥 TESTING REAL-TIME FEATURES
echo =============================
echo.

echo 📡 Starting backend server...
cd backend
start "Backend Server" cmd /k "npm run dev"

echo ⏳ Waiting for backend to start...
timeout /t 10 /nobreak > nul

echo 🧪 Running real-time tests...
cd ..
node test-realtime-features.js

echo.
echo ✅ Real-time features test completed!
echo Check the output above for results.
pause