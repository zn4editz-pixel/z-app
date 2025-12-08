# 🚀 START HERE - Z-APP Setup Guide

Welcome to Z-APP! This guide will get you up and running in minutes.

## ✅ What's Been Done

Your app has been **completely migrated** from MongoDB to PostgreSQL with Prisma ORM. Everything is clean, optimized, and production-ready!

## 📋 Quick Setup (5 Minutes)

### Step 1: Verify Installation
```bash
verify-setup.bat
```

### Step 2: Configure Environment

**Create `backend/.env`:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/zapp"
JWT_SECRET="change-this-to-a-random-string"
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_API_SECRET="your-cloudinary-secret"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-gmail-app-password"
ADMIN_EMAIL="your-admin-email@gmail.com"
NODE_ENV="development"
PORT=5001
CLIENT_URL="http://localhost:5173"
```

**Create `frontend/.env`:**
```env
VITE_API_URL=http://localhost:5001
```

### Step 3: Get a Free PostgreSQL Database

**Option 1: Neon (Recommended)**
1. Go to https://neon.tech
2. Sign up (free)
3. Create new project
4. Copy connection string
5. Paste into `DATABASE_URL` in `backend/.env`

**Option 2: Supabase**
1. Go to https://supabase.com
2. Sign up (free)
3. Create new project
4. Go to Settings → Database
5. Copy connection string (use "Connection pooling" URL)
6. Paste into `DATABASE_URL` in `backend/.env`

**Option 3: Railway**
1. Go to https://railway.app
2. Sign up (free)
3. New Project → Add PostgreSQL
4. Copy connection string
5. Paste into `DATABASE_URL` in `backend/.env`

### Step 4: Start Development

```bash
quick-start.bat
```

This will:
- Install all dependencies
- Generate Prisma client
- Setup database schema
- Start backend (http://localhost:5001)
- Start frontend (http://localhost:5173)

### Step 5: Test Everything

```bash
node test-system.js
```

Should show all green checkmarks ✅

### Step 6: Seed Database (Optional)

```bash
cd backend
npm run seed
```

Creates test accounts:
- Admin: `ronaldo@gmail.com` / `safwan123`
- Admin: `z4fwan77@gmail.com` / `safwan123`
- Users: Various / `123456`

## 🎯 What to Do Next

### Development
1. Open http://localhost:5173
2. Sign up or login with seeded account
3. Test messaging, friends, profile updates
4. Check message status indicators (WhatsApp-style)

### Deployment
1. Read `DEPLOYMENT_GUIDE.md`
2. Choose platform (Railway recommended)
3. Push to GitHub
4. Deploy!

## 📚 Documentation

- **START_HERE.md** (this file) - Quick start guide
- **README.md** - Complete documentation
- **DEPLOYMENT_GUIDE.md** - Deploy to production
- **QUICK_REFERENCE.md** - Common commands
- **FINAL_SUMMARY.md** - What was done
- **PROJECT_STATUS.md** - Current status

## 🔧 Common Commands

```bash
# Verify setup
verify-setup.bat

# Quick start everything
quick-start.bat

# Test system health
node test-system.js

# Seed database
cd backend && npm run seed

# View database
cd backend && npx prisma studio

# Build for production
cd frontend && npm run build
```

## ❓ Troubleshooting

### "Prisma Client not generated"
```bash
cd backend
npx prisma generate
```

### "Database connection failed"
- Check your `DATABASE_URL` in `backend/.env`
- Make sure database exists
- Verify connection string format

### "Port already in use"
- Change `PORT` in `backend/.env` to 5002
- Or kill the process using port 5001

### Need Help?
1. Check `QUICK_REFERENCE.md` for common tasks
2. Check `DEPLOYMENT_GUIDE.md` for deployment issues
3. Run `node test-system.js` to diagnose problems

## ✅ Pre-Flight Checklist

Before you start coding:
- [ ] `verify-setup.bat` runs successfully
- [ ] `backend/.env` configured
- [ ] `frontend/.env` configured
- [ ] Database connection working
- [ ] `node test-system.js` passes
- [ ] `quick-start.bat` starts both servers
- [ ] Can access http://localhost:5173

## 🎉 You're Ready!

Your Z-APP is:
- ✅ Fully migrated to PostgreSQL + Prisma
- ✅ Clean and optimized
- ✅ Production-ready
- ✅ Well-documented
- ✅ Easy to deploy

**Happy coding! 🚀**

---

## 🚀 Quick Links

- **Development:** Run `quick-start.bat`
- **Testing:** Run `node test-system.js`
- **Database GUI:** Run `cd backend && npx prisma studio`
- **Deployment:** See `DEPLOYMENT_GUIDE.md`
- **Reference:** See `QUICK_REFERENCE.md`

---

**Need more details?** Check `README.md` for complete documentation.
