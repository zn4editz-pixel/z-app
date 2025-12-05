@echo off
echo Testing Login API...
echo.

echo Test 1: Login with admin credentials
curl -X POST http://localhost:5001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"emailOrUsername\":\"admin\",\"password\":\"safwan123\"}"

echo.
echo.
echo Test 2: Login with wrong password
curl -X POST http://localhost:5001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"emailOrUsername\":\"admin\",\"password\":\"wrongpassword\"}"

echo.
echo.
pause
