#!/bin/bash

# Z-APP VPS Deployment Script
# For Ubuntu 22.04 LTS

set -e  # Exit on error

echo "=========================================="
echo "   Z-APP VPS Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Get domain name
read -p "Enter your domain name (e.g., z-app.com): " DOMAIN
read -p "Enter your email for SSL certificate: " EMAIL

print_info "Domain: $DOMAIN"
print_info "Email: $EMAIL"
echo ""

# Update system
print_info "Updating system packages..."
apt update && apt upgrade -y
print_success "System updated"

# Install Node.js 20
print_info "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
print_success "Node.js installed: $(node --version)"

# Install MongoDB
print_info "Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod
print_success "MongoDB installed and started"

# Install Nginx
print_info "Installing Nginx..."
apt install -y nginx
print_success "Nginx installed"

# Install PM2
print_info "Installing PM2..."
npm install -g pm2
print_success "PM2 installed"

# Install Git
print_info "Installing Git..."
apt install -y git
print_success "Git installed"

# Clone repository
print_info "Cloning Z-APP repository..."
cd /var/www
if [ -d "z-app" ]; then
    print_info "Directory exists, pulling latest changes..."
    cd z-app
    git pull
else
    git clone https://github.com/z4fwan/z-app-zn4.git z-app
    cd z-app
fi
print_success "Repository cloned"

# Setup backend
print_info "Setting up backend..."
cd backend
npm install

# Create .env file
print_info "Creating backend .env file..."
cat > .env << EOF
PORT=5001
MONGODB_URI=mongodb://localhost:27017/z-app
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production

# Update these with your actual values
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

ADMIN_EMAIL=admin@${DOMAIN}
ADMIN_USERNAME=admin

FRONTEND_URL=https://${DOMAIN}
CLIENT_URL=https://${DOMAIN}
EOF

print_success "Backend .env created"
print_info "⚠️  IMPORTANT: Edit /var/www/z-app/backend/.env with your actual credentials!"

# Start backend with PM2
print_info "Starting backend with PM2..."
pm2 delete z-app-backend 2>/dev/null || true
pm2 start src/index.js --name z-app-backend
pm2 save
pm2 startup
print_success "Backend started"

# Setup frontend
print_info "Setting up frontend..."
cd ../frontend
npm install

# Create .env.production
print_info "Creating frontend .env.production..."
cat > .env.production << EOF
VITE_API_URL=https://${DOMAIN}/api
VITE_API_BASE_URL=https://${DOMAIN}/api
EOF

# Build frontend
print_info "Building frontend..."
npm run build
print_success "Frontend built"

# Configure Nginx
print_info "Configuring Nginx..."
cat > /etc/nginx/sites-available/z-app << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Frontend
    location / {
        root /var/www/z-app/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    client_max_body_size 10M;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/z-app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
nginx -t
systemctl restart nginx
print_success "Nginx configured and restarted"

# Setup firewall
print_info "Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable
print_success "Firewall configured"

# Install SSL certificate
print_info "Installing SSL certificate..."
apt install -y certbot python3-certbot-nginx
certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email ${EMAIL} --redirect
print_success "SSL certificate installed"

# Setup auto-renewal
print_info "Setting up SSL auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer
print_success "SSL auto-renewal configured"

echo ""
echo "=========================================="
echo "   Deployment Complete! 🎉"
echo "=========================================="
echo ""
print_success "Your app is now live at: https://${DOMAIN}"
echo ""
echo "Next steps:"
echo "1. Edit /var/www/z-app/backend/.env with your actual credentials"
echo "2. Restart backend: pm2 restart z-app-backend"
echo "3. Test your app at: https://${DOMAIN}"
echo ""
echo "Useful commands:"
echo "  - View backend logs: pm2 logs z-app-backend"
echo "  - Restart backend: pm2 restart z-app-backend"
echo "  - View Nginx logs: tail -f /var/log/nginx/error.log"
echo "  - Check SSL: certbot certificates"
echo ""
print_info "Don't forget to update your DNS A records to point to this server's IP!"
echo ""
