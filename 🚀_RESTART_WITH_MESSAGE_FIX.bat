@echo off
echo 🚀 RESTARTING WITH MESSAGE SENDING FIX
echo ====================================
echo.

echo 🔧 Applied fixes:
echo ✅ Removed withCredentials from axios (CORS fix)
echo ✅ Updated backend CORS configuration
echo ✅ Made CORS more permissive for development
echo.

echo 📡 Step 1: Starting backend server...
cd backend
start "Backend Server" cmd /k "npm run dev"
echo ⏳ Waiting for backend to start...
timeout /t 8 /nobreak > nul
cd ..

echo.
echo 🧪 Step 2: Testing message API...
node test-message-fix.js

echo.
echo 📱 Step 3: Frontend instructions...
echo =====================================
echo 1. If frontend is running, restart it:
echo    cd frontend
echo    npm run dev
echo.
echo 2. Clear browser cache:
echo    - Press Ctrl+Shift+R (hard refresh)
echo    - Or F12 → Application → Clear Storage
echo.
echo 3. Login with credentials:
echo    Email: z4fwan77@gmail.com
echo    Password: admin123
echo.
echo 4. Try sending a message!
echo.

echo 💡 If messages still don't work:
echo ================================
echo 1. Check browser console (F12) for errors
echo 2. Make sure both servers are running
echo 3. Try logging out and back in
echo 4. Open test-frontend-messages.html for detailed testing
echo.

pause