# Z-APP Deployment Guide
**Complete PostgreSQL + Prisma Migration - Production Ready**

## 🎯 Quick Start

### 1. Prerequisites
- Node.js 20+
- PostgreSQL database (Neon/Supabase/Railway recommended)
- Redis instance (Upstash recommended, optional but recommended)
- Cloudinary account
- Email service (Gmail/SendGrid)

### 2. Environment Setup

Create `backend/.env`:
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Redis (Optional but recommended)
REDIS_URL="redis://default:password@host:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Email
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="Z-APP <noreply@yourapp.com>"

# App
NODE_ENV="production"
PORT=5001
CLIENT_URL="https://your-frontend-url.com"
```

Create `frontend/.env.production`:
```env
VITE_API_URL=https://your-backend-url.com
```

### 3. Installation & Build

```bash
# Install all dependencies
npm run install:all

# Generate Prisma client
cd backend
npx prisma generate

# Push database schema (creates tables)
npx prisma db push

# Build frontend
cd ../frontend
npm run build

# Frontend will be copied to backend/dist automatically
```

### 4. Start Production Server

```bash
cd backend
npm start
```

The server will serve both API and frontend from port 5001.

## 🚀 Platform-Specific Deployment

### Railway (Recommended)

1. **Create New Project**
   - Connect your GitHub repository
   - Railway will auto-detect the monorepo

2. **Add PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically set `DATABASE_URL`

3. **Add Redis (Optional)**
   - Click "New" → "Database" → "Redis"
   - Railway will automatically set `REDIS_URL`

4. **Configure Service**
   - Root Directory: `/backend`
   - Build Command: `npm install && npx prisma generate && npx prisma db push && npm run build:frontend`
   - Start Command: `npm start`

5. **Add Environment Variables**
   - Add all variables from `.env` example above
   - Railway provides `DATABASE_URL` and `REDIS_URL` automatically

6. **Deploy**
   - Push to GitHub
   - Railway auto-deploys on every push

### Render

1. **Create Web Service**
   - Connect repository
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate && npx prisma db push && cd ../frontend && npm install && npm run build`
   - Start Command: `npm start`

2. **Add PostgreSQL Database**
   - Create new PostgreSQL database
   - Copy Internal Database URL to `DATABASE_URL`

3. **Add Redis (Optional)**
   - Create new Redis instance
   - Copy Internal Redis URL to `REDIS_URL`

4. **Environment Variables**
   - Add all required variables in Render dashboard

### Vercel (Frontend) + Railway (Backend)

**Backend on Railway:**
- Follow Railway instructions above

**Frontend on Vercel:**
1. Import repository
2. Framework: Vite
3. Root Directory: `frontend`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment Variable: `VITE_API_URL=https://your-railway-backend.up.railway.app`

## 🧪 Testing Before Deployment

Run the health check script:
```bash
node test-system.js
```

This will verify:
- ✅ Database connection
- ✅ Redis connection (if configured)
- ✅ Prisma schema
- ✅ Environment variables

## 📊 Database Management

### View Database
```bash
cd backend
npx prisma studio
```

### Reset Database (⚠️ Deletes all data)
```bash
npx prisma db push --force-reset
```

### Backup Database
```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup.sql
```

## 🔧 Troubleshooting

### "Prisma Client not generated"
```bash
cd backend
npx prisma generate
```

### "Database connection failed"
- Check `DATABASE_URL` format
- Ensure database allows external connections
- Verify SSL mode (`?sslmode=require` for most cloud providers)

### "Redis connection failed"
- Redis is optional, app will work without it
- Check `REDIS_URL` format
- For Upstash: Use the full connection string with password

### "Frontend not loading"
- Ensure frontend was built: `cd frontend && npm run build`
- Check that `backend/dist` folder exists
- Verify `CLIENT_URL` in backend `.env`

## 🎉 Post-Deployment

1. **Create Admin Account**
   - Sign up through the app
   - Manually set `isVerified: true` in database

2. **Test Features**
   - User registration/login
   - Real-time messaging
   - Friend requests
   - Profile updates
   - File uploads

3. **Monitor Logs**
   - Check platform logs for errors
   - Monitor database connections
   - Watch Redis memory usage

## 🔐 Security Checklist

- ✅ Change `JWT_SECRET` to a strong random string
- ✅ Use environment variables for all secrets
- ✅ Enable CORS only for your domain
- ✅ Use HTTPS in production
- ✅ Enable rate limiting (already configured)
- ✅ Keep dependencies updated

## 📈 Scaling

### Database
- Use connection pooling (Prisma handles this)
- Add read replicas for heavy read workloads
- Monitor query performance with Prisma Studio

### Redis
- Essential for multi-server deployments
- Handles Socket.io adapter for real-time features
- Caches frequently accessed data

### Application
- Railway/Render auto-scale based on traffic
- Use CDN for static assets (Cloudinary for images)
- Enable compression (already configured)

## 🆘 Support

If you encounter issues:
1. Check logs in your deployment platform
2. Run `node test-system.js` locally
3. Verify all environment variables are set
4. Check database connection string format

---

**Migration Complete!** 🎉
- MongoDB → PostgreSQL ✅
- Mongoose → Prisma ✅
- Message Status Indicators ✅
- Profile Fixes ✅
- Redis Integration ✅
- Production Ready ✅
