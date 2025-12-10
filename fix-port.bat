@echo off
echo 🔧 Fixing Port 5001 Issue...
echo.

echo Step 1: Finding process using port 5001...
netstat -ano | findstr :5001

echo.
echo Step 2: Kill the process (you'll need to run this manually)
echo Copy the PID number from above and run:
echo taskkill /PID [PID_NUMBER] /F
echo.
echo Or press Ctrl+C to cancel and use a different port
echo.

pause

echo Step 3: Starting server...
cd backend
npm run dev