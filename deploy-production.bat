@echo off
echo 🚀 PRODUCTION DEPLOYMENT SCRIPT
echo ================================

echo.
echo 📋 Step 1: Installing Dependencies...
call npm run install:all
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🔧 Step 2: Building Frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed
    pause
    exit /b 1
)
cd ..

echo.
echo 🗄️ Step 3: Database Setup...
cd backend
call npx prisma generate
call npx prisma db push
if %errorlevel% neq 0 (
    echo ❌ Database setup failed
    pause
    exit /b 1
)

echo.
echo 📊 Step 4: Applying Performance Indexes...
call node apply-indexes.js
if %errorlevel% neq 0 (
    echo ⚠️ Warning: Performance indexes failed (continuing...)
)

echo.
echo 🧪 Step 5: Running Production Tests...
call npm test --if-present
if %errorlevel% neq 0 (
    echo ⚠️ Warning: Tests failed (continuing...)
)

echo.
echo 🔍 Step 6: Security Audit...
call npm audit --audit-level=high
if %errorlevel% neq 0 (
    echo ⚠️ Warning: Security vulnerabilities found
    echo Please review and fix before production deployment
)

echo.
echo ✅ Step 7: Starting Production Server...
set NODE_ENV=production
call npm start

echo.
echo 🎉 PRODUCTION DEPLOYMENT COMPLETE!
echo Your application is now running in production mode.
echo.
echo 📊 Access your application at: http://localhost:5001
echo 🔧 Admin Dashboard: http://localhost:5001/admin
echo 📈 Health Check: http://localhost:5001/api/health
echo.
pause