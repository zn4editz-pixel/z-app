@echo off
echo ========================================
echo 🚀 QUICK START - COMPLETE PROJECT
echo ========================================
echo.

echo 📦 Step 1: Setting up backend...
cd backend
call npm install
call npx prisma generate
call npx prisma db push
node setup-database.js

echo.
echo 🧪 Step 2: Testing database...
node test-database.js

echo.
echo 🎨 Step 3: Setting up frontend...
cd ../frontend
call npm install

echo.
echo ✅ Setup complete! 
echo.
echo 🔑 ADMIN LOGIN CREDENTIALS:
echo    📧 Email: ronaldo@gmail.com
echo    🔐 Password: safwan123
echo.
echo 🚀 Starting servers...
echo    Backend: http://localhost:5001
echo    Frontend: http://localhost:5173
echo    Admin Panel: http://localhost:5173/admin
echo.

start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak > nul
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo 🎉 Both servers are starting!
echo 📱 Open http://localhost:5173 in your browser
echo 👨‍💼 Admin panel: http://localhost:5173/admin

pause