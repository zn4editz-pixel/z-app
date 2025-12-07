# Oracle Cloud + Vercel Deployment Guide
**Complete Production Deployment for Z-App**

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Users                                                  │
│    ↓                                                    │
│  Vercel CDN (Frontend - React)                         │
│    ↓ HTTPS                                             │
│  Oracle Cloud VM (Backend - Node.js + Socket.io)      │
│    ↓                                                    │
│  MongoDB Atlas (Database)                              │
│  Cloudinary (Media Storage)                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

### 1. Oracle Cloud Account
- Sign up: https://www.oracle.com/cloud/free/
- No credit card required for Always Free tier
- Verify email and phone

### 2. Vercel Account
- Sign up: https://vercel.com/signup
- Connect your GitHub account

### 3. MongoDB Atlas
- Already set up ✅
- Connection string ready

### 4. Domain (Optional)
- Namecheap, GoDaddy, or Cloudflare
- Can use free Vercel subdomain initially

---

## 🚀 Part 1: Oracle Cloud Backend Setup

### Step 1: Create Oracle Cloud VM

1. **Login to Oracle Cloud Console**
   - Go to: https://cloud.oracle.com/

2. **Create Compute Instance**
   ```
   Navigation: Compute → Instances → Create Instance
   
   Configuration:
   - Name: z-app-backend
   - Image: Ubuntu 22.04 (Canonical)
   - Shape: VM.Standard.E2.1.Micro (Always Free)
   - Network: Create new VCN (default settings)
   - Add SSH Keys: Generate or upload your key
   - Boot Volume: 50GB (default)
   ```

3. **Save Your SSH Key**
   - Download the private key (.pem file)
   - Save it securely (you'll need it to connect)

4. **Note Your Public IP**
   - Copy the public IP address shown
   - Example: `123.456.789.012`

### Step 2: Configure Firewall Rules

1. **Open Required Ports**
   ```
   Navigation: Networking → Virtual Cloud Networks → Your VCN → Security Lists
   
   Add Ingress Rules:
   
   Rule 1 - HTTP:
   - Source: 0.0.0.0/0
   - Protocol: TCP
   - Destination Port: 80
   
   Rule 2 - HTTPS:
   - Source: 0.0.0.0/0
   - Protocol: TCP
   - Destination Port: 443
   
   Rule 3 - Backend API:
   - Source: 0.0.0.0/0
   - Protocol: TCP
   - Destination Port: 5001
   
   Rule 4 - SSH (already exists):
   - Source: 0.0.0.0/0
   - Protocol: TCP
   - Destination Port: 22
   ```

### Step 3: Connect to Your VM

**Windows (PowerShell):**
```powershell
# Set correct permissions for SSH key
icacls "path\to\your-key.pem" /inheritance:r
icacls "path\to\your-key.pem" /grant:r "%username%:R"

# Connect
ssh -i "path\to\your-key.pem" ubuntu@YOUR_PUBLIC_IP
```

**Mac/Linux:**
```bash
# Set correct permissions
chmod 400 path/to/your-key.pem

# Connect
ssh -i path/to/your-key.pem ubuntu@YOUR_PUBLIC_IP
```

### Step 4: Install Required Software

Once connected to your VM, run these commands:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Install Nginx (for reverse proxy)
sudo apt install -y nginx

# Install Certbot (for SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### Step 5: Clone and Setup Backend

```bash
# Create app directory
sudo mkdir -p /var/www/z-app
sudo chown -R ubuntu:ubuntu /var/www/z-app
cd /var/www/z-app

# Clone your repository
git clone https://github.com/YOUR_USERNAME/z-app.git .

# Navigate to backend
cd backend

# Install dependencies
npm install --production

# Create .env file
nano .env
```

**Backend .env Configuration:**
```env
# MongoDB
MONGODB_URI=your_mongodb_atlas_connection_string

# Server
PORT=5001
NODE_ENV=production

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Admin
ADMIN_EMAIL=your_admin_email@gmail.com
ADMIN_USERNAME=admin

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL (will update after Vercel deployment)
FRONTEND_URL=https://your-app.vercel.app
```

Save and exit (Ctrl+X, Y, Enter)

### Step 6: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/z-app
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name YOUR_PUBLIC_IP;  # Replace with your IP or domain

    # Increase timeouts for WebSocket
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.io
    location /socket.io {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
    }
}
```

Save and exit.

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/z-app /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### Step 7: Start Backend with PM2

```bash
# Navigate to backend directory
cd /var/www/z-app/backend

# Start with PM2
pm2 start src/index.js --name z-app-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy and run the command it outputs

# Check status
pm2 status
pm2 logs z-app-backend
```

### Step 8: Configure Ubuntu Firewall

```bash
# Allow required ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5001/tcp  # Backend (optional, Nginx proxies it)

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Step 9: Test Backend

```bash
# Test from VM
curl http://localhost:5001/health

# Test from outside (replace with your IP)
curl http://YOUR_PUBLIC_IP/health
```

You should see: `{"status":"ok","timestamp":"...","uptime":...}`

---

## 🌐 Part 2: Vercel Frontend Deployment

### Step 1: Prepare Frontend for Vercel

1. **Update Frontend Environment Variables**

Create `frontend/.env.production`:
```env
VITE_API_BASE_URL=http://YOUR_ORACLE_IP:5001
```

2. **Create Vercel Configuration**

Create `vercel.json` in root:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ],
  "env": {
    "VITE_API_BASE_URL": "http://YOUR_ORACLE_IP:5001"
  }
}
```

3. **Update package.json**

Add to root `package.json`:
```json
{
  "scripts": {
    "vercel-build": "cd frontend && npm install && npm run build"
  }
}
```

### Step 2: Deploy to Vercel

**Option A: Using Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from root directory
cd /path/to/z-app
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? z-app
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

**Option B: Using Vercel Dashboard (Recommended)**

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select "z-app"

3. **Configure Project**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Add Environment Variables**
   ```
   VITE_API_BASE_URL = http://YOUR_ORACLE_IP:5001
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Get your URL: `https://z-app-xxx.vercel.app`

### Step 3: Update Backend CORS

SSH back into Oracle VM:

```bash
# Edit backend .env
cd /var/www/z-app/backend
nano .env
```

Update:
```env
FRONTEND_URL=https://your-app.vercel.app
```

Update `backend/src/index.js` CORS origins:
```bash
nano src/index.js
```

Find the CORS section and add your Vercel URL:
```javascript
const allowedOrigins = [
	"https://your-app.vercel.app",  // Add this
	"http://localhost:5173",
];
```

Restart backend:
```bash
pm2 restart z-app-backend
pm2 logs z-app-backend
```

---

## 🔒 Part 3: SSL Certificate (HTTPS)

### Option A: Using Cloudflare (Recommended - Free)

1. **Add Domain to Cloudflare**
   - Sign up at cloudflare.com
   - Add your domain
   - Update nameservers at your registrar

2. **Configure DNS**
   ```
   Type: A
   Name: api (or backend)
   Content: YOUR_ORACLE_IP
   Proxy: Enabled (orange cloud)
   ```

3. **SSL/TLS Settings**
   - SSL/TLS → Overview → Full (strict)
   - Edge Certificates → Always Use HTTPS: On

4. **Update Vercel Environment**
   ```
   VITE_API_BASE_URL = https://api.yourdomain.com
   ```

### Option B: Using Let's Encrypt (Free)

```bash
# SSH into Oracle VM
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Follow prompts
# - Enter email
# - Agree to terms
# - Redirect HTTP to HTTPS: Yes

# Auto-renewal is set up automatically
# Test renewal
sudo certbot renew --dry-run
```

---

## 📊 Part 4: Monitoring & Maintenance

### PM2 Monitoring

```bash
# View logs
pm2 logs z-app-backend

# Monitor resources
pm2 monit

# Restart app
pm2 restart z-app-backend

# Stop app
pm2 stop z-app-backend

# View detailed info
pm2 info z-app-backend
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### System Resources

```bash
# Check disk space
df -h

# Check memory
free -h

# Check CPU
top

# Check running processes
ps aux | grep node
```

---

## 🔄 Part 5: Deployment Updates

### Update Backend

```bash
# SSH into Oracle VM
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP

# Navigate to app directory
cd /var/www/z-app

# Pull latest changes
git pull origin main

# Install new dependencies
cd backend
npm install --production

# Restart app
pm2 restart z-app-backend

# Check logs
pm2 logs z-app-backend --lines 50
```

### Update Frontend

**Automatic (Recommended):**
- Just push to GitHub main branch
- Vercel auto-deploys

**Manual:**
```bash
# From local machine
vercel --prod
```

---

## 🎯 Part 6: Custom Domain Setup

### 1. Configure Domain DNS

**For Backend (Oracle Cloud):**
```
Type: A
Name: api
Value: YOUR_ORACLE_IP
TTL: Auto
```

**For Frontend (Vercel):**
```
Vercel Dashboard → Project → Settings → Domains
Add: yourdomain.com
Follow Vercel's DNS instructions
```

### 2. Update Environment Variables

**Backend .env:**
```env
FRONTEND_URL=https://yourdomain.com
```

**Vercel Environment:**
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

### 3. Update Nginx

```bash
sudo nano /etc/nginx/sites-available/z-app
```

Change `server_name` to your domain:
```nginx
server_name api.yourdomain.com;
```

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Get SSL Certificate

```bash
sudo certbot --nginx -d api.yourdomain.com
```

---

## ✅ Verification Checklist

- [ ] Oracle VM is running
- [ ] Backend is accessible at `http://YOUR_IP:5001/health`
- [ ] Nginx is proxying requests
- [ ] PM2 is managing backend process
- [ ] Frontend is deployed on Vercel
- [ ] Frontend can connect to backend
- [ ] WebSocket connections work
- [ ] SSL certificates are installed (if using domain)
- [ ] CORS is configured correctly
- [ ] Environment variables are set
- [ ] MongoDB connection works
- [ ] Cloudinary uploads work
- [ ] Email sending works

---

## 🐛 Troubleshooting

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs z-app-backend --lines 100

# Check if port is in use
sudo lsof -i :5001

# Restart PM2
pm2 restart z-app-backend
```

### Frontend Can't Connect to Backend

1. Check CORS settings in backend
2. Verify `VITE_API_BASE_URL` in Vercel
3. Check Oracle firewall rules
4. Test backend directly: `curl http://YOUR_IP:5001/health`

### WebSocket Issues

1. Check Nginx WebSocket configuration
2. Verify Socket.io CORS settings
3. Check browser console for errors
4. Test with: `wscat -c ws://YOUR_IP:5001`

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

---

## 💰 Cost Breakdown

| Service | Cost | Resources |
|---------|------|-----------|
| Oracle Cloud | **FREE** | 1 VM, 1GB RAM, 50GB storage |
| Vercel | **FREE** | 100GB bandwidth, unlimited deployments |
| MongoDB Atlas | **FREE** | 512MB storage |
| Cloudinary | **FREE** | 25GB storage, 25GB bandwidth |
| **TOTAL** | **$0/month** | Production-grade! |

---

## 📚 Additional Resources

- [Oracle Cloud Docs](https://docs.oracle.com/en-us/iaas/Content/home.htm)
- [Vercel Docs](https://vercel.com/docs)
- [PM2 Docs](https://pm2.keymetrics.io/docs/)
- [Nginx Docs](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

---

## 🎉 Success!

Your Z-App is now running on:
- **Frontend**: `https://your-app.vercel.app` (or your domain)
- **Backend**: `http://YOUR_ORACLE_IP:5001` (or `https://api.yourdomain.com`)

**Next Steps:**
1. Test all features thoroughly
2. Set up monitoring (optional)
3. Configure backups (optional)
4. Add custom domain (optional)
5. Share with users! 🚀

---

**Need Help?** Check the troubleshooting section or review the logs!
