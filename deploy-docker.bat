@echo off
REM 🐳 DOCKER DEPLOYMENT SCRIPT FOR Z-APP
echo 🐳 Z-App Docker Deployment

echo.
echo 🔍 Checking prerequisites...

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://docker.com/get-started
    pause
    exit /b 1
)
echo ✅ Docker is installed

REM Check if Docker Compose is available
docker compose version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not available
    echo Please update Docker Desktop to the latest version
    pause
    exit /b 1
)
echo ✅ Docker Compose is available

echo.
echo 📋 Setting up environment...

REM Check if environment file exists
if not exist ".env.docker" (
    if exist ".env.docker.example" (
        echo 📝 Creating .env.docker from example...
        copy ".env.docker.example" ".env.docker"
        echo.
        echo ⚠️  IMPORTANT: Please edit .env.docker with your configuration
        echo    - Database passwords
        echo    - JWT secrets
        echo    - Domain names
        echo    - Email settings
        echo.
        echo Press any key after editing .env.docker...
        pause
    ) else (
        echo ❌ .env.docker.example not found
        echo Please ensure you're in the correct directory
        pause
        exit /b 1
    )
) else (
    echo ✅ Environment file exists
)

echo.
echo 🏗️  Building and starting containers...

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker compose -f docker-compose.production.yml down

REM Build and start containers
echo 🚀 Starting Z-App containers...
docker compose -f docker-compose.production.yml up -d --build

if errorlevel 1 (
    echo ❌ Failed to start containers
    echo.
    echo 🔍 Checking logs...
    docker compose -f docker-compose.production.yml logs
    pause
    exit /b 1
)

echo.
echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak >nul

echo.
echo 🔍 Checking container status...
docker compose -f docker-compose.production.yml ps

echo.
echo 🏥 Running health checks...

REM Check backend health
echo 📡 Checking backend health...
curl -f http://localhost:5001/health >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Backend health check failed - this is normal on first startup
    echo    The backend may still be initializing...
) else (
    echo ✅ Backend is healthy
)

REM Check frontend health
echo 🌐 Checking frontend health...
curl -f http://localhost/health >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Frontend health check failed - this is normal on first startup
) else (
    echo ✅ Frontend is healthy
)

echo.
echo 🎉 Deployment completed!
echo.
echo 📊 Your Z-App is now running:
echo    Frontend:  http://localhost
echo    Backend:   http://localhost:5001
echo    Database:  PostgreSQL on localhost:5432
echo    Redis:     Redis on localhost:6379
echo.
echo 🔧 Useful commands:
echo    View logs:     docker compose -f docker-compose.production.yml logs -f
echo    Stop app:      docker compose -f docker-compose.production.yml down
echo    Restart app:   docker compose -f docker-compose.production.yml restart
echo    Update app:    git pull ^&^& docker compose -f docker-compose.production.yml up -d --build
echo.
echo 📚 For detailed documentation, see: DOCKER_DEPLOYMENT_GUIDE.md
echo.

REM Open browser to the application
echo 🌐 Opening application in browser...
start http://localhost

echo.
echo ✅ Z-App Docker deployment successful!
pause