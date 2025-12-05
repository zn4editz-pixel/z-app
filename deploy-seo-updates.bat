@echo off
echo ========================================
echo Z-APP - Deploy SEO Updates to Render
echo ========================================
echo.

echo [1/5] Checking SEO files...
if exist "frontend\public\sitemap.xml" (
    echo [OK] sitemap.xml exists
) else (
    echo [ERROR] sitemap.xml missing!
    pause
    exit /b 1
)

if exist "frontend\public\robots.txt" (
    echo [OK] robots.txt exists
) else (
    echo [ERROR] robots.txt missing!
    pause
    exit /b 1
)
echo.

echo [2/5] Checking Git status...
git status
echo.

echo [3/5] Adding SEO files to Git...
git add frontend/public/sitemap.xml
git add frontend/public/robots.txt
git add frontend/index.html
git add GOOGLE_SEO_SETUP_GUIDE.md
echo [OK] Files staged
echo.

echo [4/5] Committing changes...
git commit -m "SEO: Add sitemap.xml, robots.txt, and improved meta tags for Google indexing"
if %errorlevel% neq 0 (
    echo [INFO] No changes to commit or commit failed
)
echo.

echo [5/5] Pushing to GitHub (triggers Render deployment)...
git push origin main
if %errorlevel% neq 0 (
    echo [ERROR] Push failed! Check your Git configuration.
    pause
    exit /b 1
)
echo.

echo ========================================
echo Deployment Initiated!
echo ========================================
echo.
echo Your SEO updates are being deployed to Render.
echo.
echo NEXT STEPS:
echo.
echo 1. Wait 5-10 minutes for Render to deploy
echo.
echo 2. Verify files are accessible:
echo    - https://z-app-beta-z.onrender.com/sitemap.xml
echo    - https://z-app-beta-z.onrender.com/robots.txt
echo.
echo 3. Set up Google Search Console:
echo    - Go to: https://search.google.com/search-console/
echo    - Add property: https://z-app-beta-z.onrender.com
echo    - Verify ownership (HTML tag method)
echo    - Submit sitemap: sitemap.xml
echo.
echo 4. Read the complete guide:
echo    - Open: GOOGLE_SEO_SETUP_GUIDE.md
echo.
echo ========================================
echo.

pause
