@echo off
echo ========================================
echo Z-APP - SEO Setup Verification
echo ========================================
echo.

echo Checking if SEO files exist locally...
echo.

if exist "frontend\public\sitemap.xml" (
    echo [OK] sitemap.xml found
) else (
    echo [FAIL] sitemap.xml NOT found
)

if exist "frontend\public\robots.txt" (
    echo [OK] robots.txt found
) else (
    echo [FAIL] robots.txt NOT found
)

if exist "GOOGLE_SEO_SETUP_GUIDE.md" (
    echo [OK] SEO guide found
) else (
    echo [FAIL] SEO guide NOT found
)
echo.

echo ========================================
echo Testing URLs (requires internet)
echo ========================================
echo.

echo Opening sitemap.xml in browser...
start https://z-app-beta-z.onrender.com/sitemap.xml
timeout /t 2 >nul

echo Opening robots.txt in browser...
start https://z-app-beta-z.onrender.com/robots.txt
timeout /t 2 >nul

echo Opening main website...
start https://z-app-beta-z.onrender.com
echo.

echo ========================================
echo Manual Verification Checklist
echo ========================================
echo.
echo Check the opened browser tabs:
echo.
echo [ ] sitemap.xml loads correctly (shows XML)
echo [ ] robots.txt loads correctly (shows text)
echo [ ] Website loads without errors
echo [ ] Website has proper title in browser tab
echo [ ] No console errors (F12 to check)
echo.

echo ========================================
echo Google Search Console Setup
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Go to Google Search Console
echo    https://search.google.com/search-console/
echo.
echo 2. Add your property:
echo    https://z-app-beta-z.onrender.com
echo.
echo 3. Verify ownership using HTML tag method
echo.
echo 4. Submit sitemap: sitemap.xml
echo.
echo 5. Request indexing for main pages
echo.

echo Opening Google Search Console...
start https://search.google.com/search-console/
echo.

echo ========================================
echo SEO Tools
echo ========================================
echo.
echo Opening useful SEO tools...
echo.

echo 1. Google PageSpeed Insights
start https://pagespeed.web.dev/?url=https://z-app-beta-z.onrender.com
timeout /t 2 >nul

echo 2. Mobile-Friendly Test
start https://search.google.com/test/mobile-friendly?url=https://z-app-beta-z.onrender.com
echo.

echo ========================================
echo.
echo All verification tools opened!
echo Check each browser tab and follow the checklist.
echo.
echo For detailed instructions, read:
echo GOOGLE_SEO_SETUP_GUIDE.md
echo.

pause
