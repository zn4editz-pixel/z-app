@echo off
echo ========================================
echo   PUSHING ALL UPDATES TO GITHUB
echo ========================================
echo.

echo [1/4] Adding all modified files...
git add .

echo.
echo [2/4] Committing changes...
git commit -F GITHUB_PUSH_MESSAGE.txt

echo.
echo [3/4] Pushing to GitHub...
git push origin main

echo.
echo [4/4] Done!
echo ========================================
echo   ALL UPDATES PUSHED TO GITHUB!
echo ========================================
echo.
pause
