# 🚨 URGENT: Update Environment Variables

## ❌ Current Issues Fixed:
1. **CORS Errors**: Backend not allowing Vercel frontend requests
2. **API Connection**: Frontend using placeholder URLs instead of actual backend
3. **Environment Variables**: Both platforms need updated URLs

## 🔧 IMMEDIATE ACTIONS REQUIRED:

### 1. Update Render Backend Environment Variables

Go to your Render dashboard → `z-app-backend` service → Environment tab and update:

```bash
# Frontend URLs (CRITICAL - UPDATE THESE!)
CLIENT_URL=https://z-app-official.vercel.app
FRONTEND_URL=https://z-app-official.vercel.app

# Security (CHANGE THESE!)
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters_long_for_production_render
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_admin_password_change_this

# Other required variables
NODE_ENV=production
PORT=10000
RENDER=true
DATABASE_URL=postgresql://s4fwan_x:tZrL_-MUluvmSdrFNEy5rw@iron-orc-11183.jxf.gcp-europe-west3.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=dsol2p21u
CLOUDINARY_API_KEY=455557543893756
CLOUDINARY_API_SECRET=MyvMZN6iRSisWvX5SL-tDMsWCv4
```

### 2. Update Vercel Frontend Environment Variables

Go to your Vercel dashboard → `z-app-official` project → Settings → Environment Variables and add:

```bash
# API Configuration (CRITICAL!)
VITE_API_BASE_URL=https://z-app-backend.onrender.com
VITE_API_URL=https://z-app-backend.onrender.com

# App Configuration
VITE_APP_NAME=Z-App
VITE_APP_VERSION=5.0
VITE_ENVIRONMENT=production

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_PWA=true

# Vercel Specific
VERCEL=1
VERCEL_ENV=production
```

## 🚀 After Updating Environment Variables:

### Step 1: Redeploy Backend (Render)
1. Go to Render dashboard → `z-app-backend`
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait for deployment to complete

### Step 2: Redeploy Frontend (Vercel)
1. Go to Vercel dashboard → `z-app-official`
2. Go to "Deployments" tab
3. Click "Redeploy" on the latest deployment
4. Wait for deployment to complete

## ✅ Expected Results:

### Backend Logs Should Show:
```
✅ Using production schema (CockroachDB for Render)
🔗 Allowed CORS origins: [
  'https://z-app-official.vercel.app',
  'https://z-app-official.vercel.app'
]
🚀 Server running on port 10000
✅ Socket handlers initialized
```

### Frontend Should Work:
- ✅ No CORS errors in browser console
- ✅ API calls to `https://z-app-backend.onrender.com/api/*` working
- ✅ Login/signup functionality working
- ✅ Real-time messaging working

## 🔍 Testing Steps:

1. **Health Check**: Visit `https://z-app-backend.onrender.com/health/ping`
   - Should return: `{"status":"ok","timestamp":"...","database":"connected"}`

2. **Frontend**: Visit `https://z-app-official.vercel.app/login`
   - Should load without CORS errors
   - Should be able to register/login

3. **API Connection**: Check browser console
   - No CORS errors
   - API calls should succeed

## 🚨 If Still Not Working:

### Check Backend Logs:
1. Go to Render dashboard → `z-app-backend` → Logs
2. Look for CORS messages: `🌐 CORS request from origin: https://z-app-official.vercel.app`
3. Should see: `✅ CORS allowed for: https://z-app-official.vercel.app`

### Check Frontend Network Tab:
1. Open browser DevTools → Network tab
2. Try to login
3. API calls should go to `https://z-app-backend.onrender.com/api/*`
4. Should return 200 status codes, not CORS errors

## 📋 Quick Checklist:
- [ ] Updated `CLIENT_URL` and `FRONTEND_URL` on Render
- [ ] Updated `VITE_API_BASE_URL` on Vercel
- [ ] Redeployed backend on Render
- [ ] Redeployed frontend on Vercel
- [ ] Tested health endpoint
- [ ] Tested login functionality
- [ ] No CORS errors in console

## 🎯 Priority Order:
1. **FIRST**: Update Render environment variables (especially CLIENT_URL/FRONTEND_URL)
2. **SECOND**: Update Vercel environment variables (especially VITE_API_BASE_URL)
3. **THIRD**: Redeploy both services
4. **FOURTH**: Test the connection

This should resolve all CORS and API connection issues! 🚀