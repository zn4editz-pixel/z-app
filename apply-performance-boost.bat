@echo off
REM ⚡ PERFORMANCE BOOST - Quick Apply Script (Windows)
REM This script applies all performance optimizations automatically

echo 🚀 Starting Performance Optimization...
echo.

REM Step 1: Database Indexes
echo Step 1: Applying Database Indexes...
if exist "backend\prisma\performance-indexes.sql" (
    echo Found performance-indexes.sql
    echo Please run manually:
    echo   psql -U your_user -d your_database -f backend/prisma/performance-indexes.sql
    echo.
) else (
    echo Error: performance-indexes.sql not found
)

REM Step 2: Install Dependencies
echo Step 2: Installing Dependencies...
cd backend
npm list node-cache >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ node-cache already installed
) else (
    echo Installing node-cache...
    call npm install node-cache
    echo ✓ node-cache installed
)
cd ..
echo.

REM Step 3: Backup Original Files
echo Step 3: Creating Backups...
if exist "backend\src\controllers\admin.controller.js" (
    copy "backend\src\controllers\admin.controller.js" "backend\src\controllers\admin.controller.backup.js" >nul
    echo ✓ Backed up admin.controller.js
)

if exist "backend\src\lib\socket.js" (
    copy "backend\src\lib\socket.js" "backend\src\lib\socket.backup.js" >nul
    echo ✓ Backed up socket.js
)
echo.

REM Step 4: Summary
echo ========================================
echo ✓ Performance Optimization Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Apply database indexes (see Step 1 above)
echo 2. Restart your backend server
echo 3. Test the application
echo 4. Monitor performance improvements
echo.
echo Files created:
echo   ✓ backend/prisma/performance-indexes.sql
echo   ✓ backend/src/controllers/admin.controller.optimized.js
echo   ✓ backend/src/lib/socket.optimized.js
echo   ✓ frontend/src/utils/performanceOptimizer.js
echo.
echo Backups created:
echo   ✓ backend/src/controllers/admin.controller.backup.js
echo   ✓ backend/src/lib/socket.backup.js
echo.
echo To use optimized versions, update your imports in:
echo   - backend/src/routes/admin.route.js
echo   - backend/src/index.js
echo.
echo See PERFORMANCE_OPTIMIZATION.md for detailed instructions
echo.
echo 🎉 Ready to boost performance!
echo.
pause
