@echo off
echo Clearing Vite cache and restarting...
cd frontend
rmdir /s /q node_modules\.vite 2>nul
rmdir /s /q dist 2>nul
echo Cache cleared!
echo.
echo Please restart your dev server with: npm run dev
pause
