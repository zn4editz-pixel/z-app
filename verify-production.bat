@echo off
echo ========================================
echo Verify Production Deployment
echo ========================================
echo.

echo Checking backend health...
curl -s https://z-app-backend.onrender.com/health
echo.
echo.

echo Checking if backend is responding...
curl -s -o nul -w "Status Code: %%{http_code}\n" https://z-app-backend.onrender.com/health
echo.

echo ========================================
echo Manual Verification Steps:
echo ========================================
echo.
echo 1. Open: https://z-app-beta-z.onrender.com
echo 2. Login as admin
echo 3. Go to Admin Dashboard
echo 4. Check "Online Now" count
echo.
echo 5. Open incognito window
echo 6. Login with different user
echo 7. Refresh admin dashboard
echo 8. Count should increase by 1
echo.
echo ========================================
echo Production URLs:
echo ========================================
echo Frontend: https://z-app-beta-z.onrender.com
echo Backend:  https://z-app-backend.onrender.com
echo Health:   https://z-app-backend.onrender.com/health
echo.
pause
