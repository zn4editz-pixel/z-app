@echo off
echo 🔧 FIXING MESSAGE SENDING ISSUES
echo =================================
echo.

echo 📡 Step 1: Checking if backend is running...
curl -s http://localhost:5001/api/health > nul
if %errorlevel% neq 0 (
    echo ❌ Backend is not running!
    echo 🚀 Starting backend server...
    cd backend
    start "Backend Server" cmd /k "npm run dev"
    echo ⏳ Waiting for backend to start...
    timeout /t 10 /nobreak > nul
    cd ..
) else (
    echo ✅ Backend is running
)

echo.
echo 📱 Step 2: Checking frontend development server...
echo 💡 Make sure frontend is running on http://localhost:5173
echo 💡 If not, run: cd frontend && npm run dev

echo.
echo 🧪 Step 3: Running message API test...
node test-message-api.js

echo.
echo 🔍 Step 4: Common issues and solutions:
echo =====================================
echo 1. ❌ Backend not running → Run: cd backend && npm run dev
echo 2. ❌ Frontend not running → Run: cd frontend && npm run dev  
echo 3. ❌ Socket connection failed → Check browser console for errors
echo 4. ❌ Authentication failed → Clear browser storage and login again
echo 5. ❌ CORS errors → Check backend CORS configuration
echo.

echo 💡 QUICK FIXES:
echo ===============
echo • Clear browser cache and localStorage
echo • Refresh the page (F5)
echo • Check browser console for errors
echo • Make sure you're logged in
echo • Try sending a simple text message first
echo.

echo 🎯 If messages still don't send:
echo 1. Open browser DevTools (F12)
echo 2. Go to Console tab
echo 3. Try sending a message
echo 4. Look for any red error messages
echo 5. Check Network tab for failed requests
echo.

pause