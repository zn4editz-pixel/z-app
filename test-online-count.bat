@echo off
echo ========================================
echo Testing Online Users Count
echo ========================================
echo.

echo Checking backend health...
curl -s http://localhost:5001/health
echo.
echo.

echo Checking admin stats (requires admin login)...
echo Note: You need to be logged in as admin to see this
echo Open your browser and:
echo 1. Login as admin
echo 2. Go to Admin Dashboard
echo 3. Check the "Online Now" count
echo.

echo Current socket connections on port 5001:
netstat -ano | findstr :5001 | findstr ESTABLISHED
echo.

echo ========================================
echo Test Complete
echo ========================================
pause
