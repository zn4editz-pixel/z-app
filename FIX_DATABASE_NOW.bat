@echo off
echo ========================================
echo 🔧 FIXING DATABASE ISSUES NOW
echo ========================================
echo.

echo 🛑 Killing any running processes on port 5001...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5001" ^| find "LISTENING"') do (
    echo Killing process %%a
    taskkill /f /pid %%a 2>nul
)

echo.
echo 📦 Setting up backend dependencies...
cd backend
call npm install

echo.
echo 🗄️ Setting up SQLite database (NO LIMITS!)...
call npx prisma generate
call npx prisma db push

echo.
echo 👤 Creating admin user...
node setup-database.js

echo.
echo 🧪 Testing database...
node test-database.js

echo.
echo ✅ Database setup complete!
echo 📧 Admin Email: ronaldo@gmail.com
echo 🔑 Admin Password: safwan123
echo 🚀 Backend URL: http://localhost:5001
echo 👨‍💼 Admin Panel: http://localhost:5173/admin
echo.

echo 🚀 Starting backend server...
call npm run dev

pause