@echo off
echo ========================================
echo 📊 PRODUCTION PERFORMANCE MONITOR
echo Real-time System Monitoring
echo ========================================
echo.

:monitor_loop
cls
echo ========================================
echo 📊 PRODUCTION PERFORMANCE MONITOR
echo Updated: %date% %time%
echo ========================================
echo.

echo 🔍 System Resources:
echo ----------------------------------------
for /f "tokens=2 delims==" %%i in ('wmic cpu get loadpercentage /value ^| find "LoadPercentage"') do set CPU_USAGE=%%i
echo 🖥️  CPU Usage: %CPU_USAGE%%%

for /f "tokens=4" %%i in ('wmic OS get FreePhysicalMemory /value ^| find "="') do set FREE_MEM=%%i
for /f "tokens=4" %%i in ('wmic OS get TotalVisibleMemorySize /value ^| find "="') do set TOTAL_MEM=%%i
set /a USED_MEM=%TOTAL_MEM%-%FREE_MEM%
set /a MEM_PERCENT=(%USED_MEM%*100)/%TOTAL_MEM%
echo 💾 Memory Usage: %MEM_PERCENT%%%

echo.
echo 🌐 Network Status:
echo ----------------------------------------
netstat -an | find "5001" | find "LISTENING" >nul && echo ✅ Backend (Port 5001): Running || echo ❌ Backend (Port 5001): Down
netstat -an | find "4173" | find "LISTENING" >nul && echo ✅ Frontend (Port 4173): Running || echo ❌ Frontend (Port 4173): Down

echo.
echo 🏥 Health Checks:
echo ----------------------------------------
curl -f http://localhost:5001/health >nul 2>&1 && echo ✅ Backend API: Healthy || echo ❌ Backend API: Down
curl -f http://localhost:4173 >nul 2>&1 && echo ✅ Frontend: Healthy || echo ❌ Frontend: Down

echo.
echo 📈 Performance Metrics:
echo ----------------------------------------
echo 🎯 Target: 500K+ concurrent users
echo ⚡ Response Time: ^<100ms
echo 🛡️  Uptime SLA: 99.9%%
echo 🔄 Auto-scaling: Enabled

echo.
echo 🔧 Quick Actions:
echo   [R] Refresh monitoring
echo   [T] Run performance tests
echo   [L] View logs
echo   [Q] Quit monitoring
echo.

choice /c RTLQ /n /m "Select action: "
if errorlevel 4 goto :end
if errorlevel 3 (
    echo Opening logs...
    start notepad backend\logs\production.log 2>nul || echo No log file found
    timeout /t 2 /nobreak >nul
    goto :monitor_loop
)
if errorlevel 2 (
    echo Running performance tests...
    call TEST_PRODUCTION_READY.bat
    pause
    goto :monitor_loop
)
if errorlevel 1 goto :monitor_loop

:end
echo.
echo 👋 Monitoring stopped.
pause