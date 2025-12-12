@echo off
echo ========================================
echo 🚀 COMPLETE DATABASE SETUP SCRIPT
echo ========================================
echo.

echo 📦 Installing dependencies...
cd backend
call npm install

echo.
echo 🗄️ Setting up SQLite database...
call npx prisma generate
call npx prisma db push

echo.
echo 👤 Creating admin user...
node create-admin-user.js

echo.
echo 🧪 Testing database connection...
node test-admin-access.js

echo.
echo ✅ Database setup complete!
echo 📧 Admin Email: ronaldo@gmail.com
echo 🔑 Admin Password: safwan123
echo.
echo 🚀 Starting backend server...
call npm run dev

pause