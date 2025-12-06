@echo off
cls
echo ========================================
echo   RENDER DEPLOYMENT STATUS
echo ========================================
echo.

echo Checking backend health...
echo.

powershell -Command "try { $response = Invoke-WebRequest -Uri 'https://z-app-backend.onrender.com/health' -UseBasicParsing; $content = $response.Content | ConvertFrom-Json; Write-Host 'Status:' $content.status; Write-Host 'Uptime:' $content.uptime 'seconds'; Write-Host 'Environment:' $content.environment; Write-Host ''; if ($content.uptime -lt 120) { Write-Host 'NEW DEPLOYMENT DETECTED!' -ForegroundColor Green; Write-Host 'The backend was recently restarted.' -ForegroundColor Green; Write-Host 'Your fixes should be live now!' -ForegroundColor Green } else { Write-Host 'OLD VERSION STILL RUNNING' -ForegroundColor Yellow; Write-Host 'Uptime is' $content.uptime 'seconds' -ForegroundColor Yellow; Write-Host 'Render has not deployed the new version yet.' -ForegroundColor Yellow; Write-Host ''; Write-Host 'ACTION REQUIRED:' -ForegroundColor Red; Write-Host '1. Go to https://dashboard.render.com' -ForegroundColor White; Write-Host '2. Select z-app-backend service' -ForegroundColor White; Write-Host '3. Click Manual Deploy button' -ForegroundColor White; Write-Host '4. Select Deploy latest commit' -ForegroundColor White } } catch { Write-Host 'Error checking backend:' $_.Exception.Message -ForegroundColor Red }"

echo.
echo ========================================
echo.
echo Latest commit pushed: bee0dc2
echo Message: Fix CORS login error
echo.
echo If uptime is high (over 2 minutes), you need to:
echo 1. Manually trigger deploy on Render
echo 2. See MANUAL_DEPLOY_INSTRUCTIONS.md
echo.
pause
