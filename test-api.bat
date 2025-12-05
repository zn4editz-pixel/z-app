@echo off
echo ========================================
echo Z-App API Testing Script
echo ========================================
echo.

set API_URL=http://localhost:5001

echo Testing Health Check Endpoint...
curl -X GET %API_URL%/health
echo.
echo.

echo Testing Rate Limiting (Auth)...
echo Attempting 6 login requests (should block after 5)...
for /L %%i in (1,1,6) do (
    echo Attempt %%i:
    curl -X POST %API_URL%/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"wrong\"}"
    echo.
)
echo.

echo ========================================
echo Test Complete!
echo ========================================
pause
