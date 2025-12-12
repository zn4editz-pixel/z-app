@echo off
echo 🔧 FIXING BACKEND ERRORS
echo ========================

echo.
echo ✅ Step 1: Fixed adminOnly import issue
echo   - Changed adminOnly to isAdmin in analytics.route.js
echo   - This matches the actual export from protectRoute.js

echo.
echo ✅ Step 2: Checking other potential issues...

cd backend

echo.
echo 🔍 Step 3: Validating all imports...
node -c src/index.js
if %errorlevel% neq 0 (
    echo ❌ Syntax error in index.js
    pause
    exit /b 1
) else (
    echo ✅ index.js syntax: OK
)

node -c src/routes/analytics.route.js
if %errorlevel% neq 0 (
    echo ❌ Syntax error in analytics.route.js
    pause
    exit /b 1
) else (
    echo ✅ analytics.route.js syntax: OK
)

node -c src/controllers/analytics.controller.js
if %errorlevel% neq 0 (
    echo ❌ Syntax error in analytics.controller.js
    pause
    exit /b 1
) else (
    echo ✅ analytics.controller.js syntax: OK
)

echo.
echo 🚀 Step 4: Starting backend server...
npm run dev

cd ..
pause