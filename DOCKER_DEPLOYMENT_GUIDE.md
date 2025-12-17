# 🐳 DOCKER DEPLOYMENT GUIDE

## 🎯 **OVERVIEW**
Deploy your Z-App using Docker containers for maximum control, scalability, and portability. Perfect for VPS, cloud servers, or local production environments.

---

## 🚀 **QUICK START (5 MINUTES)**

### **Prerequisites**
- Docker and Docker Compose installed
- 2GB+ RAM
- 10GB+ disk space

### **One-Command Deployment**
```bash
# Clone repository
git clone https://github.com/zn4editz-pixel/z-app.git
cd z-app

# Configure environment
cp .env.docker.example .env.docker
# Edit .env.docker with your settings

# Deploy everything
docker-compose -f docker-compose.production.yml up -d

# Your app will be available at:
# Frontend: http://localhost (or your domain)
# Backend: http://localhost:5001
# Database: PostgreSQL on port 5432
```

---

## 📁 **DOCKER CONFIGURATION FILES**

### **1. Backend Dockerfile** (`backend/Dockerfile.production`)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && npx prisma generate
COPY . .
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app && mkdir -p /app/logs
USER nodejs
EXPOSE 5001
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5001/health/ping', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"
CMD ["npm", "run", "start:prod"]
```

### **2. Frontend Dockerfile** (`frontend/Dockerfile.production`)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.production.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

### **3. Docker Compose** (`docker-compose.production.yml`)
Complete production setup with PostgreSQL, Redis, Nginx, and health checks.

---

## ⚙️ **ENVIRONMENT CONFIGURATION**

### **Create `.env.docker`**
```env
# === DATABASE ===
POSTGRES_DB=z_app_production
POSTGRES_USER=z_app_user
POSTGRES_PASSWORD=your_secure_database_password_change_this

# === BACKEND ===
NODE_ENV=production
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters_long
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_admin_password

# === FRONTEND ===
FRONTEND_URL=https://yourdomain.com
CLIENT_URL=https://yourdomain.com

# === CLOUDINARY ===
CLOUDINARY_CLOUD_NAME=dsol2p21u
CLOUDINARY_API_KEY=455557543893756
CLOUDINARY_API_SECRET=MyvMZN6iRSisWvX5SL-tDMsWCv4

# === EMAIL ===
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password

# === REDIS (OPTIONAL) ===
REDIS_PASSWORD=your_secure_redis_password

# === SSL (OPTIONAL) ===
SSL_EMAIL=your_email@domain.com
DOMAIN=yourdomain.com
```

---

## 🚀 **DEPLOYMENT METHODS**

### **Method 1: Simple Deployment (Recommended)**
```bash
# 1. Clone repository
git clone https://github.com/zn4editz-pixel/z-app.git
cd z-app

# 2. Configure environment
cp .env.docker.example .env.docker
nano .env.docker  # Edit with your settings

# 3. Deploy
docker-compose -f docker-compose.production.yml up -d

# 4. Check status
docker-compose -f docker-compose.production.yml ps
```

### **Method 2: With SSL (Let's Encrypt)**
```bash
# 1. Install Certbot
sudo apt-get update
sudo apt-get install certbot

# 2. Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# 3. Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/key.pem
sudo chown $USER:$USER ./ssl/*.pem

# 4. Deploy with SSL
docker-compose -f docker-compose.production.yml up -d
```

### **Method 3: Development Mode**
```bash
# For development/testing
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 🔧 **DOCKER COMMANDS**

### **Basic Operations**
```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Stop all services
docker-compose -f docker-compose.production.yml down

# Restart specific service
docker-compose -f docker-compose.production.yml restart backend

# View logs
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend

# Check status
docker-compose -f docker-compose.production.yml ps

# Execute commands in container
docker-compose -f docker-compose.production.yml exec backend npm run prisma:studio
docker-compose -f docker-compose.production.yml exec postgres psql -U z_app_user -d z_app_production
```

### **Database Operations**
```bash
# Run database migrations
docker-compose -f docker-compose.production.yml exec backend npx prisma db push

# Create admin user
docker-compose -f docker-compose.production.yml exec backend node scripts/create-admin.js

# Backup database
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U z_app_user z_app_production > backup.sql

# Restore database
docker-compose -f docker-compose.production.yml exec -T postgres psql -U z_app_user z_app_production < backup.sql
```

### **Maintenance**
```bash
# Update application
git pull origin main
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# Clean up unused images
docker system prune -a

# View resource usage
docker stats

# Scale services
docker-compose -f docker-compose.production.yml up -d --scale backend=2
```

---

## 🌐 **NGINX CONFIGURATION**

### **Custom Domain Setup**
1. Point your domain to your server IP
2. Update `.env.docker` with your domain
3. Configure SSL certificates
4. Restart containers

### **Load Balancing**
```yaml
# Add to docker-compose.production.yml
services:
  backend:
    deploy:
      replicas: 3
  
  nginx:
    depends_on:
      - backend
```

---

## 📊 **MONITORING & HEALTH CHECKS**

### **Health Check Endpoints**
- **Backend**: `http://localhost:5001/health`
- **Frontend**: `http://localhost/health`
- **Database**: Built-in PostgreSQL health checks
- **Redis**: Built-in Redis health checks

### **Container Health Status**
```bash
# Check all container health
docker-compose -f docker-compose.production.yml ps

# View health check logs
docker inspect --format='{{json .State.Health}}' z-app-backend
```

### **Monitoring Setup**
```bash
# Add monitoring stack (optional)
docker run -d --name=grafana -p 3000:3000 grafana/grafana
docker run -d --name=prometheus -p 9090:9090 prom/prometheus
```

---

## 🔒 **SECURITY BEST PRACTICES**

### **1. Environment Security**
- Use strong passwords for all services
- Change default JWT secrets
- Use environment files, never hardcode secrets
- Regularly rotate passwords and secrets

### **2. Network Security**
```bash
# Create custom network
docker network create z-app-network

# Use in docker-compose.yml
networks:
  default:
    external:
      name: z-app-network
```

### **3. Container Security**
- Run containers as non-root user
- Use official base images only
- Regularly update base images
- Scan images for vulnerabilities

### **4. SSL/TLS**
- Always use HTTPS in production
- Use strong SSL certificates
- Configure proper security headers
- Enable HSTS

---

## 🚀 **SCALING & PERFORMANCE**

### **Horizontal Scaling**
```bash
# Scale backend instances
docker-compose -f docker-compose.production.yml up -d --scale backend=3

# Scale with load balancer
docker-compose -f docker-compose.production.yml up -d --scale backend=3 --scale nginx=1
```

### **Performance Optimization**
```yaml
# Add to docker-compose.production.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### **Database Optimization**
```bash
# Optimize PostgreSQL
docker-compose -f docker-compose.production.yml exec postgres psql -U z_app_user -d z_app_production -c "
  ALTER SYSTEM SET shared_buffers = '256MB';
  ALTER SYSTEM SET effective_cache_size = '1GB';
  SELECT pg_reload_conf();
"
```

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues**

#### **Port Conflicts**
```bash
# Check what's using ports
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :5001

# Kill conflicting processes
sudo fuser -k 80/tcp
sudo fuser -k 5001/tcp
```

#### **Permission Issues**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x deploy-production.sh

# Fix SSL certificate permissions
sudo chown -R $USER:$USER ./ssl/
chmod 600 ./ssl/*.pem
```

#### **Database Connection Issues**
```bash
# Check database logs
docker-compose -f docker-compose.production.yml logs postgres

# Test database connection
docker-compose -f docker-compose.production.yml exec postgres psql -U z_app_user -d z_app_production -c "SELECT 1;"
```

#### **Memory Issues**
```bash
# Check memory usage
docker stats

# Increase swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📋 **DEPLOYMENT CHECKLIST**

### **Pre-Deployment**
- [ ] Docker and Docker Compose installed
- [ ] Domain pointed to server (if using custom domain)
- [ ] SSL certificates obtained (if using HTTPS)
- [ ] Environment variables configured
- [ ] Firewall configured (ports 80, 443, 5001)

### **Deployment**
- [ ] Repository cloned
- [ ] Environment file created and configured
- [ ] Docker containers built and started
- [ ] Database migrations run
- [ ] Admin user created
- [ ] Health checks passing

### **Post-Deployment**
- [ ] Application accessible via browser
- [ ] User registration working
- [ ] Messaging functionality tested
- [ ] Video calls working
- [ ] Admin dashboard accessible
- [ ] SSL certificate valid (if using HTTPS)
- [ ] Monitoring setup (optional)
- [ ] Backup strategy implemented

---

## 🎉 **SUCCESS!**

Your Z-App is now running in Docker containers with:

- ✅ **Professional containerization** with health checks
- ✅ **PostgreSQL database** with automatic backups
- ✅ **Redis caching** for improved performance
- ✅ **Nginx reverse proxy** with SSL support
- ✅ **Horizontal scaling** ready
- ✅ **Production monitoring** and logging
- ✅ **Security hardening** and best practices

### **Access Your Application**
- **Frontend**: http://localhost (or https://yourdomain.com)
- **Backend API**: http://localhost:5001
- **Admin Dashboard**: http://localhost/admin
- **Database**: PostgreSQL on localhost:5432

Your Z-App is now production-ready and can handle thousands of concurrent users! 🚀

---

## 📞 **SUPPORT**

For issues or questions:
1. Check container logs: `docker-compose logs -f`
2. Verify health checks: `docker-compose ps`
3. Review this guide for troubleshooting steps
4. Check GitHub issues for known problems

**Happy deploying!** 🐳✨