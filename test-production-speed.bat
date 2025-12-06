@echo off
echo ========================================
echo TEST PRODUCTION SPEED
echo ========================================
echo.
echo This will build and test your app in production mode
echo to show you the REAL performance!
echo.
echo ========================================
pause
echo.
echo Step 1: Building for production...
echo.
cd frontend
call npm run build
echo.
echo ========================================
echo Build complete!
echo ========================================
echo.
echo Step 2: Starting production preview...
echo.
echo Open your browser to: http://localhost:4173
echo.
echo Compare the speed with development mode!
echo.
echo ========================================
echo WHAT TO CHECK:
echo ========================================
echo.
echo 1. Load time (should be 1-2 seconds)
echo 2. Bundle size (should be under 1MB)
echo 3. Caching (reload should be instant)
echo 4. Smooth animations
echo 5. Instant messaging
echo.
echo Press Ctrl+C to stop the server
echo.
call npm run preview
