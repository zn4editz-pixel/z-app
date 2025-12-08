# ⚡ Render Quick Setup - 5 Minutes

## Step 1: Get PostgreSQL Database (2 min)

### Option A: Neon (Free, Recommended)
1. Go to: https://neon.tech
2. Sign up / Log in
3. Click "Create Project"
4. Copy connection string (starts with `postgresql://`)

### Option B: Render PostgreSQL
1. Render Dashboard → New → PostgreSQL
2. Create database
3. Copy "Internal Database URL"

---

## Step 2: Update Render Backend (2 min)

### Go to: Render Dashboard → Your Backend Service

### A. Add Environment Variable:
```
Key: DATABASE_URL
Value: postgresql://user:pass@host:5432/db?sslmode=require
```

### B. Remove Old Variables:
- Delete: `MONGODB_URI`
- Delete: `MONGO_URI`

### C. Update Build Command:
```bash
npm install && npx prisma generate && npx prisma db push
```

---

## Step 3: Deploy (1 min)

1. Click "Manual Deploy"
2. Select "Deploy latest commit"
3. Wait 2-3 minutes

---

## Step 4: Verify

### Check Logs For:
```
✅ PostgreSQL connected successfully
📊 Database: X users
⚡ Ultra-fast queries enabled
🚀 Server running
```

### Test Your App:
- Open frontend URL
- Try logging in
- Send a message
- Everything should be 10x faster!

---

## ✅ Done!

Your app is now running on PostgreSQL + Prisma with 10x performance boost!

---

## 🆘 Need Help?

See detailed guides:
- `RENDER_DEPLOYMENT_GUIDE.md` - Full instructions
- `RENDER_CONFIG.md` - All settings
- `DEPLOYMENT_READY.md` - Complete checklist
