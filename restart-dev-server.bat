@echo off
echo ========================================
echo  RESTARTING DEV SERVER WITH CACHE CLEAR
echo ========================================
echo.

echo Step 1: Stopping any running dev servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Clearing Vite cache...
cd frontend
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo ✓ Vite cache cleared
) else (
    echo ✓ No Vite cache found
)

if exist "dist" (
    rmdir /s /q "dist"
    echo ✓ Dist folder cleared
) else (
    echo ✓ No dist folder found
)

echo.
echo Step 3: Starting dev server...
echo.
echo ========================================
echo  IMPORTANT: After server starts:
echo  1. Wait for "ready in X ms"
echo  2. Go to browser
echo  3. Press Ctrl+Shift+R to hard refresh
echo ========================================
echo.

start cmd /k "npm run dev"

echo.
echo Dev server is starting in a new window...
echo You can close this window now.
echo.
pause
