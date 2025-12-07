@echo off
color 0E
echo ========================================
echo   Safe GitHub Push with Conflict Check
echo ========================================
echo.

echo Checking current branch...
git branch --show-current
echo.

echo Fetching latest changes from GitHub...
git fetch origin
echo.

echo Checking for conflicts...
git status
echo.

echo ========================================
echo   Choose an option:
echo ========================================
echo   1. Pull and merge (if there are remote changes)
echo   2. Force push (overwrite remote - use carefully!)
echo   3. Just push (if no conflicts)
echo   4. Cancel
echo ========================================
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Pulling latest changes...
    git pull origin main --no-rebase
    echo.
    echo Adding all changes...
    git add .
    echo.
    echo Creating commit...
    git commit -m "feat: Admin dashboard redesign - Modern graphs, AI enhancements, user lists"
    echo.
    echo Pushing to GitHub...
    git push origin main
    echo.
    echo ✅ Done!
)

if "%choice%"=="2" (
    echo.
    echo ⚠️ WARNING: This will overwrite remote changes!
    set /p confirm="Are you sure? (yes/no): "
    if /i "%confirm%"=="yes" (
        echo.
        echo Adding all changes...
        git add .
        echo.
        echo Creating commit...
        git commit -m "feat: Admin dashboard redesign - Modern graphs, AI enhancements, user lists"
        echo.
        echo Force pushing to GitHub...
        git push origin main --force
        echo.
        echo ✅ Force push completed!
    ) else (
        echo.
        echo ❌ Cancelled
    )
)

if "%choice%"=="3" (
    echo.
    echo Adding all changes...
    git add .
    echo.
    echo Creating commit...
    git commit -m "feat: Admin dashboard redesign - Modern graphs, AI enhancements, user lists"
    echo.
    echo Pushing to GitHub...
    git push origin main
    echo.
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Push successful!
    ) else (
        echo ❌ Push failed! Try option 1 to pull first.
    )
)

if "%choice%"=="4" (
    echo.
    echo ❌ Cancelled
)

echo.
pause
