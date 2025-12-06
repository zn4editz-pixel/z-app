@echo off
echo ========================================
echo    Z-APP Docker Deployment
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not installed!
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo Docker is installed.
echo.

REM Check if .env file exists
if not exist .env (
    echo Creating .env file from template...
    copy .env.docker .env
    echo.
    echo IMPORTANT: Please edit .env file with your actual credentials!
    echo Press any key to open .env file...
    pause >nul
    notepad .env
    echo.
    echo After updating .env, press any key to continue...
    pause >nul
)

echo.
echo Building Docker images...
docker-compose build

if errorlevel 1 (
    echo.
    echo Error: Docker build failed!
    pause
    exit /b 1
)

echo.
echo Starting containers...
docker-compose up -d

if errorlevel 1 (
    echo.
    echo Error: Failed to start containers!
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Deployment Complete!
echo ========================================
echo.
echo Your app is running at:
echo   Frontend: http://localhost
echo   Backend: http://localhost:5001
echo   MongoDB: localhost:27017
echo.
echo Useful commands:
echo   View logs: docker-compose logs -f
echo   Stop: docker-compose down
echo   Restart: docker-compose restart
echo   View status: docker-compose ps
echo.
echo To view logs now, press any key...
pause >nul
docker-compose logs -f
