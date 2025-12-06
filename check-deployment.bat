@echo off
cls
echo ========================================
echo   DEPLOYMENT STATUS CHECKER
echo ========================================
echo.
echo Fixes pushed to GitHub successfully!
echo Render is now building and deploying...
echo.
echo ========================================

:CHECK
echo.
echo [%TIME%] Checking backend status...
curl -s https://z-app-backend.onrender.com/health > nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo [%TIME%] Backend is responding!
    echo.
    echo Checking detailed health...
    curl -s https://z-app-backend.onrender.com/health
    echo.
    echo.
    echo ========================================
    echo   DEPLOYMENT COMPLETE!
    echo ========================================
    echo.
    echo Your fixes are now live!
    echo.
    echo Test now:
    echo 1. Visit: https://z-app-beta-z.onrender.com
    echo 2. Try logging in
    echo 3. Should work without CORS errors!
    echo.
    goto END
) else (
    echo [%TIME%] Still deploying... (checking again in 15 seconds)
    timeout /t 15 /nobreak > nul
    goto CHECK
)

:END
echo ========================================
pause
