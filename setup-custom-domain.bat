@echo off
echo ========================================
echo    Z-APP Custom Domain Setup Wizard
echo ========================================
echo.

:MENU
echo Choose your deployment option:
echo.
echo 1. Render + Custom Domain (Easiest)
echo 2. DigitalOcean VPS (Full Control)
echo 3. Vercel + Railway (Modern Stack)
echo 4. View Domain Providers
echo 5. Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto RENDER
if "%choice%"=="2" goto VPS
if "%choice%"=="3" goto VERCEL
if "%choice%"=="4" goto PROVIDERS
if "%choice%"=="5" goto END

echo Invalid choice. Please try again.
goto MENU

:RENDER
echo.
echo ========================================
echo    Render + Custom Domain Setup
echo ========================================
echo.
echo Step 1: Buy a domain
echo   - Recommended: Namecheap.com ($10/year)
echo   - Or: Cloudflare, GoDaddy, Google Domains
echo.
set /p domain="Enter your domain name (e.g., z-app.com): "
echo.
echo Step 2: Configure on Render
echo   1. Go to: https://dashboard.render.com
echo   2. Select your frontend service
echo   3. Settings -^> Custom Domain
echo   4. Add domain: %domain%
echo.
echo Step 3: Update DNS
echo   Add this CNAME record at your domain provider:
echo   Type: CNAME
echo   Name: www
echo   Value: [Your-Render-URL].onrender.com
echo.
echo Step 4: Update backend environment variables
echo   CLIENT_URL=https://%domain%
echo   FRONTEND_URL=https://%domain%
echo.
pause
echo.
echo Opening Render dashboard...
start https://dashboard.render.com
echo.
echo Opening DNS checker...
start https://dnschecker.org
echo.
echo Setup guide opened in browser!
echo Check CUSTOM_DOMAIN_SETUP.md for detailed instructions.
pause
goto MENU

:VPS
echo.
echo ========================================
echo    DigitalOcean VPS Setup
echo ========================================
echo.
echo This will guide you through VPS deployment.
echo.
set /p domain="Enter your domain name: "
set /p ip="Enter your VPS IP address: "
echo.
echo Creating deployment script...

(
echo #!/bin/bash
echo # Z-APP VPS Deployment Script
echo.
echo echo "Installing dependencies..."
echo apt update ^&^& apt upgrade -y
echo.
echo # Install Node.js
echo curl -fsSL https://deb.nodesource.com/setup_20.x ^| bash -
echo apt install -y nodejs
echo.
echo # Install MongoDB
echo wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc ^| apt-key add -
echo echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" ^| tee /etc/apt/sources.list.d/mongodb-org-6.0.list
echo apt update
echo apt install -y mongodb-org
echo systemctl start mongod
echo systemctl enable mongod
echo.
echo # Install Nginx and PM2
echo apt install -y nginx
echo npm install -g pm2
echo.
echo echo "Cloning repository..."
echo cd /var/www
echo git clone https://github.com/z4fwan/z-app-zn4.git z-app
echo cd z-app
echo.
echo echo "Setting up backend..."
echo cd backend
echo npm install
echo.
echo echo "Setting up frontend..."
echo cd ../frontend
echo npm install
echo npm run build
echo.
echo echo "Configuring Nginx..."
echo # Nginx config will be created
echo.
echo echo "Installing SSL certificate..."
echo apt install -y certbot python3-certbot-nginx
echo certbot --nginx -d %domain% -d www.%domain%
echo.
echo echo "Starting application..."
echo cd /var/www/z-app/backend
echo pm2 start src/index.js --name z-app-backend
echo pm2 save
echo pm2 startup
echo.
echo echo "Setup complete!"
echo echo "Your app is now live at https://%domain%"
) > vps-deploy.sh

echo.
echo Deployment script created: vps-deploy.sh
echo.
echo Next steps:
echo 1. Update DNS A records to point to: %ip%
echo 2. Copy vps-deploy.sh to your server
echo 3. Run: bash vps-deploy.sh
echo.
echo Opening DigitalOcean...
start https://www.digitalocean.com
pause
goto MENU

:VERCEL
echo.
echo ========================================
echo    Vercel + Railway Setup
echo ========================================
echo.
set /p domain="Enter your domain name: "
echo.
echo Step 1: Deploy Backend to Railway
echo   1. Go to: https://railway.app
echo   2. New Project -^> Deploy from GitHub
echo   3. Select: z4fwan/z-app-zn4
echo   4. Root Directory: backend
echo.
pause
echo.
echo Step 2: Deploy Frontend to Vercel
echo   1. Go to: https://vercel.com
echo   2. Import Project -^> GitHub
echo   3. Select: z4fwan/z-app-zn4
echo   4. Root Directory: frontend
echo.
pause
echo.
echo Step 3: Add Custom Domain
echo   1. Vercel Project -^> Settings -^> Domains
echo   2. Add: %domain%
echo   3. Update DNS as instructed
echo.
echo Opening Railway...
start https://railway.app
timeout /t 2 >nul
echo Opening Vercel...
start https://vercel.com
echo.
pause
goto MENU

:PROVIDERS
echo.
echo ========================================
echo    Domain Providers
echo ========================================
echo.
echo 1. Namecheap - $8.88/year (Recommended)
echo    https://www.namecheap.com
echo.
echo 2. Cloudflare - $9.15/year (Best DNS)
echo    https://www.cloudflare.com/products/registrar/
echo.
echo 3. Porkbun - $9.13/year (Good value)
echo    https://porkbun.com
echo.
echo 4. Google Domains - $12/year (Simple)
echo    https://domains.google
echo.
set /p open="Open Namecheap? (y/n): "
if /i "%open%"=="y" start https://www.namecheap.com
echo.
pause
goto MENU

:END
echo.
echo Thank you for using Z-APP Custom Domain Setup!
echo Check CUSTOM_DOMAIN_SETUP.md for detailed instructions.
echo.
pause
exit
