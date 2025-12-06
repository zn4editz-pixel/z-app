@echo off
echo ========================================
echo STARTING Z-APP (Frontend + Backend)
echo ========================================
echo.
echo This will start both frontend and backend servers
echo.
echo Backend will run on: http://localhost:5001
echo Frontend will run on: http://localhost:5173
echo.
echo ========================================
pause
echo.
echo Starting Backend Server...
echo.
start cmd /k "cd backend && npm run dev"
timeout /t 3
echo.
echo Starting Frontend Server...
echo.
start cmd /k "cd frontend && npm run dev"
echo.
echo ========================================
echo SERVERS STARTED!
echo ========================================
echo.
echo Backend: http://localhost:5001
echo Frontend: http://localhost:5173
echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
echo ========================================
pause
