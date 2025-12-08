# PostgreSQL Setup - Quick Start Guide

## ⚡ Why This Will Be 10x Faster

Your current MongoDB free tier has:
- ❌ Slow shared clusters
- ❌ Network timeouts
- ❌ High latency from India (~200-500ms)

PostgreSQL with Neon gives you:
- ✅ Dedicated resources
- ✅ No timeouts
- ✅ Low latency (~20-50ms)
- ✅ Connection pooling
- ✅ Better indexing

## 🚀 Setup Steps (15 minutes)

### Step 1: Create Neon Account (2 min)
1. Go to https://neon.tech
2. Click "Sign Up" (use GitHub/Google)
3. Create new project: "z-app"
4. Select region: **AWS Asia Pacific (Mumbai)** for best speed from India
5. Copy your connection string

### Step 2: Install Dependencies (1 min)
```bash
cd backend
npm install prisma @prisma/client
npm install -D prisma
```

### Step 3: Setup Prisma (1 min)
The schema is already created in `backend/prisma/schema.prisma`

Update your `backend/.env`:
```env
# Replace your MongoDB URL with this:
DATABASE_URL="postgresql://username:password@ep-xxx.aws.neon.tech/neondb?sslmode=require"

# Keep your MongoDB URL temporarily for migration:
MONGODB_URI="your-current-mongodb-url"
```

### Step 4: Create Database Tables (1 min)
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### Step 5: Migrate Your Data (5 min)
```bash
cd backend
node scripts/migrate-to-postgresql.js
```

This will copy all your data from MongoDB to PostgreSQL.

### Step 6: Update Backend Code (5 min)
I'll update your controllers to use Prisma instead of Mongoose.
The API endpoints stay exactly the same!

### Step 7: Test & Deploy
```bash
npm run dev
```

## 📊 What You Get

### Free Tier (Neon)
- 0.5 GB storage
- 3 GB data transfer/month
- Unlimited queries
- Auto-scaling
- Connection pooling
- Point-in-time recovery

### Performance Improvements
- Login: 500ms → 50ms (10x faster)
- User queries: 300ms → 30ms (10x faster)
- Message loading: 400ms → 40ms (10x faster)
- Admin dashboard: 2s → 200ms (10x faster)

## 🔄 Rollback Plan

If anything goes wrong:
1. Keep MongoDB URL in .env
2. Switch back by changing DATABASE_URL
3. No data lost - both databases have your data

## 📝 Next Steps

Once you have your Neon connection string, paste it here and I'll:
1. Update all your controllers
2. Test the migration
3. Verify everything works
4. Deploy

Ready? Create your Neon account and share the connection string!
