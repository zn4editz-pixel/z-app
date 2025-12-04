@echo off
echo ========================================
echo Building Z-App APK
echo ========================================
echo.

echo [1/3] Building frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)
echo.

echo [2/3] Syncing with Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)
echo.

echo [3/3] Opening Android Studio...
call npx cap open android
echo.

echo ========================================
echo Build preparation complete!
echo ========================================
echo.
echo Next steps in Android Studio:
echo 1. Wait for Gradle sync to finish
echo 2. Go to: Build ^> Build Bundle(s) / APK(s) ^> Build APK(s)
echo 3. Wait for build to complete
echo 4. Find APK at: frontend\android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
