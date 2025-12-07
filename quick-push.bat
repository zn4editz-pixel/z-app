@echo off
echo Pushing to GitHub...
git add . && git commit -m "feat: Admin dashboard redesign with modern graphs and enhanced UI" && git push origin main
if %ERRORLEVEL% EQU 0 (
    echo ✅ Successfully pushed to GitHub!
) else (
    echo ❌ Push failed. Run push-to-github-safe.bat for more options.
)
pause
