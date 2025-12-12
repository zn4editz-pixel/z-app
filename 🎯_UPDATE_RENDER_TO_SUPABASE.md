# 🎯 UPDATE RENDER TO SUPABASE
## Fix Database Connection for Supabase Migration

### 🔍 **CURRENT ISSUE**
Render is trying to connect to old database: `ep-wispy-mud-a1h6xwvk-pooler.ap-southeast-1.aws.neon.tech`
But you've migrated to Supabase: `psmdpjokjhjfhzesaret.supabase.co`

---

## 🚀 **IMMEDIATE FIX: UPDATE DATABASE_URL**

### **Step 1: Go to Render Environment Tab**
1. In your Render dashboard
2. Click **Environment** tab
3. Find **DATABASE_URL** variable

### **Step 2: Update DATABASE_URL to Supabase**
Replace the current DATABASE_URL with:
```
postgresql://postgres.psmdpjokjhjfhzesaret:npg_lv8I7ATcFuHLaep-wispy-mud-a1h6xwvk@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### **Step 3: Verify Other Supabase Variables**
Make sure these are also set:
```
SUPABASE_URL=https://psmdpjokjhjfhzesaret.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzbWRwam9ramhmamh6YXNhcmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODEyNzgsImV4cCI6MjA4MTA1NzI3OH0.ozEecDWueKpyJ_9n78B6f3-OjRa0hiL1DGQgnSjzh1g
```

### **Step 4: Manual Deploy**
1. Click **Manual Deploy**
2. Deploy latest commit
3. Wait for successful build

---

## 🎯 **ALTERNATIVE: SKIP DATABASE OPERATIONS**

If you want to avoid database operations during build:

### **Update Build Command to:**
```
npm install && npx prisma generate
```
(Remove `&& npx prisma db push`)

This will:
- ✅ Install dependencies
- ✅ Generate Prisma client
- ❌ Skip database push (which is causing the error)

---

## 📊 **EXPECTED RESULT**

After updating DATABASE_URL:
- ✅ Build should complete successfully
- ✅ Backend connects to Supabase
- ✅ Health endpoint returns JSON: `{"status":"ok"}`
- ✅ Ready for Step 3 (Vercel frontend)

---

## 🚨 **QUICK ACTION**

**Choose one:**

**Option A (Recommended)**: Update DATABASE_URL to Supabase
**Option B**: Update Build Command to skip database operations

Both will fix the build failure!

**Which option do you prefer?**