# 🔧 Fixing Login Issue - CORS Problem

## Problem:
Your backend is blocking the mobile app due to CORS restrictions.

Mobile apps (Capacitor) don't send an `origin` header, so the backend rejects them.

## Solution:
I've updated the backend CORS configuration to allow mobile apps.

---

## ✅ What I Fixed:

Changed backend CORS to:
- ✅ Allow requests with no origin (mobile apps)
- ✅ Allow all origins (for mobile app flexibility)
- ✅ Still secure with credentials

---

## 🚀 Deploy Updated Backend:

### Option 1: Push to GitHub (Auto-deploys to Render)

```bash
git add backend/src/index.js
git commit -m "Fix CORS for mobile app"
git push origin main
```

Wait 2-3 minutes for Render to auto-deploy.

### Option 2: Manual Deploy on Render

1. Go to https://dashboard.render.com
2. Find your backend service (z-app-zn4)
3. Click **Manual Deploy** → **Deploy latest commit**
4. Wait 2-3 minutes

---

## 🧪 After Deploy:

1. Wait for backend to finish deploying
2. Open Z-App on phone
3. Try login again
4. Should work now!

---

## 💡 Alternative: Test Locally First

Want to test before deploying?

### Step 1: Start Backend Locally
```bash
npm run --prefix backend dev
```

### Step 2: Update APK to Use Local IP
Edit `frontend/.env.production`:
```env
VITE_API_BASE_URL=http://192.168.1.39:5001
VITE_API_URL=http://192.168.1.39:5001
```

### Step 3: Rebuild APK
```bash
npm run --prefix frontend build
cd frontend && npx cap sync android && cd android && .\gradlew.bat assembleDebug && cd ../../..
```

### Step 4: Install and Test
- Phone and computer on same WiFi
- Backend running on computer
- Login should work

---

## 🎯 Recommended: Deploy to Render

This way the app works anywhere, not just on your WiFi.

Let me know if you want me to help push to GitHub!
