# 🌐 Custom Domain Setup Guide for Z-APP

## Complete Guide to Host Z-APP on Your Own Domain

This guide covers everything you need to host your app on a custom domain like `z-app.com` or `myapp.com`.

---

## 📋 Table of Contents

1. [Option 1: Custom Domain with Render (Easiest)](#option-1-custom-domain-with-render)
2. [Option 2: Self-Host on VPS (Full Control)](#option-2-self-host-on-vps)
3. [Option 3: Deploy to Vercel + Railway](#option-3-vercel--railway)
4. [Domain Providers Comparison](#domain-providers)
5. [SSL Certificate Setup](#ssl-certificate)

---

## Option 1: Custom Domain with Render (Easiest) ⭐

**Cost**: ~$10-15/year for domain + Free/Paid Render hosting  
**Time**: 30 minutes  
**Difficulty**: Easy

### Step 1: Buy a Domain

Choose a domain provider:

| Provider | Price/Year | Pros |
|----------|-----------|------|
| **Namecheap** | $8-12 | Cheapest, easy DNS |
| **Cloudflare** | $9-10 | Free CDN, best DNS |
| **GoDaddy** | $12-20 | Popular, support |
| **Google Domains** | $12 | Simple, reliable |

**Recommended**: Namecheap or Cloudflare

### Step 2: Configure Domain on Render

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Select your **frontend service** (z-app-frontend)

2. **Add Custom Domain**
   - Click "Settings" tab
   - Scroll to "Custom Domain"
   - Click "Add Custom Domain"
   - Enter your domain: `z-app.com` or `www.z-app.com`

3. **Get DNS Records**
   Render will show you records like:
   ```
   Type: CNAME
   Name: www (or @)
   Value: z-app-frontend.onrender.com
   ```

### Step 3: Update DNS at Your Domain Provider

#### For Namecheap:
1. Login to Namecheap
2. Go to "Domain List" → Click "Manage"
3. Go to "Advanced DNS" tab
4. Add these records:

```
Type: CNAME Record
Host: www
Value: z-app-frontend.onrender.com
TTL: Automatic

Type: URL Redirect Record (optional)
Host: @
Value: http://www.z-app.com
```

#### For Cloudflare:
1. Login to Cloudflare
2. Select your domain
3. Go to "DNS" → "Records"
4. Add record:

```
Type: CNAME
Name: www (or @)
Target: z-app-frontend.onrender.com
Proxy status: Proxied (orange cloud)
```

### Step 4: Wait for DNS Propagation

- **Time**: 5 minutes to 48 hours (usually 15-30 minutes)
- **Check status**: https://dnschecker.org

### Step 5: Update Backend URLs

Update your backend environment variables on Render:

```env
CLIENT_URL=https://www.z-app.com
FRONTEND_URL=https://www.z-app.com
```

### Step 6: SSL Certificate (Automatic)

Render automatically provides free SSL certificates via Let's Encrypt.
- Your site will be accessible at: `https://www.z-app.com`
- Certificate renews automatically

✅ **Done! Your app is now on your custom domain!**

---

## Option 2: Self-Host on VPS (Full Control) 🖥️

**Cost**: $5-10/month  
**Time**: 2-3 hours  
**Difficulty**: Medium

### Best VPS Providers

| Provider | Price/Month | Specs |
|----------|-------------|-------|
| **DigitalOcean** | $6 | 1GB RAM, 25GB SSD |
| **Linode** | $5 | 1GB RAM, 25GB SSD |
| **Vultr** | $5 | 1GB RAM, 25GB SSD |
| **AWS Lightsail** | $5 | 1GB RAM, 40GB SSD |

**Recommended**: DigitalOcean (easiest for beginners)

### Complete Setup Steps

I'll create deployment scripts for you...



### A. DigitalOcean Deployment (Recommended)

#### 1. Create Droplet

1. **Sign up**: https://www.digitalocean.com
2. **Create Droplet**:
   - Image: Ubuntu 22.04 LTS
   - Plan: Basic $6/month (1GB RAM)
   - Region: Choose closest to your users
   - Authentication: SSH Key (recommended) or Password
   - Hostname: z-app

3. **Get your IP address**: e.g., `123.45.67.89`

#### 2. Point Domain to Server

In your domain provider's DNS settings:

```
Type: A Record
Name: @
Value: 123.45.67.89
TTL: 3600

Type: A Record
Name: www
Value: 123.45.67.89
TTL: 3600
```

#### 3. Connect to Server

```bash
ssh root@123.45.67.89
```

#### 4. Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# Install Nginx
apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2

# Install Git
apt install -y git
```

#### 5. Clone and Setup Your App

```bash
# Clone repository
cd /var/www
git clone https://github.com/z4fwan/z-app-zn4.git z-app
cd z-app

# Setup backend
cd backend
npm install

# Create .env file
cat > .env << EOF
PORT=5001
MONGODB_URI=mongodb://localhost:27017/z-app
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

ADMIN_EMAIL=admin@z-app.com
ADMIN_USERNAME=admin

FRONTEND_URL=https://z-app.com
CLIENT_URL=https://z-app.com
EOF

# Start backend with PM2
pm2 start src/index.js --name z-app-backend
pm2 save
pm2 startup

# Setup frontend
cd ../frontend
npm install

# Create .env.production
cat > .env.production << EOF
VITE_API_URL=https://z-app.com/api
VITE_API_BASE_URL=https://z-app.com/api
EOF

# Build frontend
npm run build
```

#### 6. Configure Nginx

```bash
# Create Nginx configuration
cat > /etc/nginx/sites-available/z-app << 'EOF'
server {
    listen 80;
    server_name z-app.com www.z-app.com;

    # Frontend
    location / {
        root /var/www/z-app/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

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

    # WebSocket for Socket.io
    location /socket.io {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/z-app /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx
```

#### 7. Setup SSL with Let's Encrypt (Free HTTPS)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d z-app.com -d www.z-app.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose redirect HTTP to HTTPS (option 2)

# Auto-renewal is configured automatically
# Test renewal:
certbot renew --dry-run
```

#### 8. Setup Firewall

```bash
# Configure UFW
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

✅ **Done! Your app is now live at https://z-app.com**

---

## Option 3: Vercel + Railway (Modern Stack) 🚀

**Cost**: Free tier available, ~$5-10/month for production  
**Time**: 30 minutes  
**Difficulty**: Easy

### Why This Stack?
- **Vercel**: Best for React/frontend (free SSL, CDN, auto-deploy)
- **Railway**: Easy backend hosting (free $5 credit/month)

### Step 1: Deploy Backend to Railway

1. **Sign up**: https://railway.app
2. **New Project** → **Deploy from GitHub**
3. **Select repository**: z4fwan/z-app-zn4
4. **Configure**:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

5. **Add Environment Variables**:
```env
PORT=5001
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
EMAIL_USER=your_email
EMAIL_PASS=your_password
ADMIN_EMAIL=admin@z-app.com
ADMIN_USERNAME=admin
FRONTEND_URL=https://z-app.com
CLIENT_URL=https://z-app.com
```

6. **Get Railway URL**: e.g., `z-app-backend.up.railway.app`

### Step 2: Deploy Frontend to Vercel

1. **Sign up**: https://vercel.com
2. **Import Project** → **GitHub**
3. **Select repository**: z4fwan/z-app-zn4
4. **Configure**:
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Environment Variables**:
```env
VITE_API_URL=https://z-app-backend.up.railway.app
VITE_API_BASE_URL=https://z-app-backend.up.railway.app
```

6. **Deploy**

### Step 3: Add Custom Domain to Vercel

1. **Go to Project Settings** → **Domains**
2. **Add Domain**: `z-app.com`
3. **Configure DNS** at your domain provider:

```
Type: A Record
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

4. **SSL**: Automatic via Vercel

✅ **Done! Your app is live with auto-deployments on every push!**

---

## 🌍 Domain Providers Comparison

### Namecheap (Recommended for Beginners)
- **Price**: $8.88/year (.com)
- **Pros**: Cheap, free WhoisGuard, easy DNS
- **Cons**: Support can be slow
- **Link**: https://www.namecheap.com

### Cloudflare Registrar (Best Value)
- **Price**: $9.15/year (.com) - at cost pricing
- **Pros**: Free CDN, DDoS protection, best DNS
- **Cons**: Must transfer domain (can't register new)
- **Link**: https://www.cloudflare.com/products/registrar/

### Google Domains
- **Price**: $12/year (.com)
- **Pros**: Simple, reliable, Google integration
- **Cons**: More expensive
- **Link**: https://domains.google

### Porkbun (Hidden Gem)
- **Price**: $9.13/year (.com)
- **Pros**: Cheap, free SSL, free WhoisGuard
- **Cons**: Less known
- **Link**: https://porkbun.com

---

## 🔒 SSL Certificate Options

### 1. Let's Encrypt (Free) ✅
- **Cost**: Free
- **Renewal**: Every 90 days (automatic)
- **Best for**: Self-hosted VPS
- **Setup**: Certbot (see VPS guide above)

### 2. Cloudflare SSL (Free) ✅
- **Cost**: Free
- **Type**: Flexible, Full, or Full (Strict)
- **Best for**: Any setup
- **Setup**: Add site to Cloudflare, enable SSL

### 3. Platform SSL (Free) ✅
- **Render**: Automatic Let's Encrypt
- **Vercel**: Automatic
- **Railway**: Automatic
- **Best for**: Platform hosting

---

## 📊 Cost Comparison

### Option 1: Render + Custom Domain
- Domain: $10/year
- Render Free Tier: $0/month
- **Total**: $10/year (or $7-25/month for paid tier)

### Option 2: VPS Self-Hosted
- Domain: $10/year
- DigitalOcean: $6/month
- **Total**: $82/year ($6.83/month)

### Option 3: Vercel + Railway
- Domain: $10/year
- Vercel: Free (hobby) or $20/month (pro)
- Railway: $5/month (after free credit)
- **Total**: $70/year or $30/month

---

## 🚀 Quick Start Commands

### Check DNS Propagation
```bash
# Windows
nslookup z-app.com

# Check globally
# Visit: https://dnschecker.org
```

### Test SSL Certificate
```bash
# Visit: https://www.ssllabs.com/ssltest/
```

### Monitor Uptime
- **UptimeRobot**: https://uptimerobot.com (free)
- **Pingdom**: https://www.pingdom.com

---

## 🔧 Troubleshooting

### Domain not resolving
- Wait 24-48 hours for DNS propagation
- Clear DNS cache: `ipconfig /flushdns` (Windows)
- Check DNS: https://dnschecker.org

### SSL certificate error
- Wait for certificate generation (5-10 minutes)
- Check domain DNS is correct
- Verify A/CNAME records point to correct server

### Backend not connecting
- Check CORS settings include your domain
- Verify environment variables
- Check firewall allows port 5001 (VPS)

### WebSocket connection failed
- Ensure Nginx proxy_pass includes socket.io
- Check backend allows WebSocket upgrade
- Verify no firewall blocking WebSocket

---

## 📝 Post-Setup Checklist

- [ ] Domain purchased and DNS configured
- [ ] SSL certificate active (HTTPS working)
- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Environment variables configured
- [ ] CORS allows your domain
- [ ] WebSocket connections working
- [ ] Test user registration
- [ ] Test login/logout
- [ ] Test messaging
- [ ] Test video calls
- [ ] Setup monitoring (UptimeRobot)
- [ ] Configure backups (if self-hosted)

---

## 🎯 Recommended Setup for You

Based on your needs, I recommend:

### For Quick Launch (Today):
**Option 1: Render + Custom Domain**
- Buy domain from Namecheap ($10)
- Add to Render (free)
- Total time: 30 minutes
- Total cost: $10/year

### For Best Performance:
**Option 3: Vercel + Railway**
- Modern stack
- Auto-deployments
- Great performance
- Total cost: $10/year + $5/month

### For Full Control:
**Option 2: DigitalOcean VPS**
- Complete control
- Better for scaling
- Learn server management
- Total cost: $82/year

---

## 📞 Need Help?

Run the setup script I created:
```bash
setup-custom-domain.bat
```

This will guide you through the process step-by-step!

---

**Ready to launch? Let's get your domain live! 🚀**
