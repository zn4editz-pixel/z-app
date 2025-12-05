# 🔧 Fixing 500 Internal Server Error on Render

## 🚨 Problem
Getting "500 Internal Server Error" when accessing your deployed app on Render.

## 🔍 Root Causes

### 1. Missing Environment Variables ⚠️ (Most Common)
**Symptom**: Server crashes on startup
**Fix**: Set all required environment variables on Render

### 2. MongoDB Connection Failed
**Symptom**: Server can't connect to database
**Fix**: Verify MongoDB Atlas connection string and IP whitelist

### 3. Frontend Build Missing
**Symptom**: Server looking for `dist` folder that doesn't exist
**Fix**: Ensure build command creates and moves dist folder

### 4. Dependencies Not Installed
**Symptom**: Module not found errors
**Fix**: Check build logs for npm install errors

## ✅ Step-by-Step Fix

### Step 1: Check Render Logs
1. Go to https://dashboard.render.com
2. Click on your backend service
3. Click "Logs" tab
4. Look for error messages (usually at the bottom)

**Common Error Messages**:
```
❌ MongooseError: The `uri` parameter to `openUri()` must be a string
   → Missing MONGODB_URI environment variable

❌ Error: Cannot find module 'express-rate-limit'
   → Dependencies not installed

❌ ENOENT: no such file or directory, stat '../dist/index.html'
   → Frontend build missing
```

### Step 2: Set Environment Variables

Go to your backend service on Render → Environment tab → Add these:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat_db

# Server
PORT=5001
NODE_ENV=production

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=noreply@z-app.com

# Admin
ADMIN_EMAIL=ronaldo@gmail.com
ADMIN_USERNAME=admin

# Frontend URL
CLIENT_URL=https://z-app-beta-z.onrender.com
FRONTEND_URL=https://z-app-beta-z.onrender.com
```

**⚠️ Important**: After adding/changing environment variables, click "Save Changes" and the service will automatically redeploy.

### Step 3: Verify Build Settings

#### Backend Service Settings:
```yaml
Build Command:
npm install && npm run build:frontend

Start Command:
node src/index.js

Root Directory:
backend
```

#### Build Script in package.json:
```json
{
  "scripts": {
    "build:frontend": "cd ../frontend && npm install && npm run build && mv dist ../backend/"
  }
}
```

### Step 4: Check MongoDB Atlas

1. Go to MongoDB Atlas dashboard
2. Click "Network Access"
3. Make sure IP whitelist includes:
   - `0.0.0.0/0` (Allow from anywhere)
   - OR add Render's IP addresses

4. Click "Database Access"
5. Verify user has read/write permissions

### Step 5: Manual Redeploy

1. Go to Render dashboard
2. Click your backend service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for build to complete
5. Check logs for errors

## 🔍 Debugging Checklist

### Environment Variables
- [ ] MONGODB_URI is set and correct
- [ ] JWT_SECRET is set (min 32 characters)
- [ ] CLOUDINARY credentials are set
- [ ] EMAIL credentials are set
- [ ] ADMIN_EMAIL is set
- [ ] CLIENT_URL matches your frontend URL
- [ ] NODE_ENV is set to "production"

### MongoDB Atlas
- [ ] IP whitelist allows Render (0.0.0.0/0)
- [ ] Database user exists
- [ ] Database user has correct permissions
- [ ] Connection string is correct
- [ ] Database name is correct

### Build Process
- [ ] Build command runs successfully
- [ ] Frontend builds without errors
- [ ] dist folder is created
- [ ] dist folder is moved to backend
- [ ] No build errors in logs

### Dependencies
- [ ] All dependencies in package.json
- [ ] npm install runs successfully
- [ ] No missing module errors
- [ ] express-rate-limit installed
- [ ] helmet installed
- [ ] express-mongo-sanitize installed

## 🎯 Quick Fix Commands

### If Build Fails:
```bash
# Clear build cache on Render
Settings → Clear Build Cache → Clear Cache
```

### If Environment Variables Changed:
```bash
# Render auto-redeploys when you save env vars
# Just click "Save Changes" in Environment tab
```

### If Still Not Working:
```bash
# Check health endpoint
curl https://z-pp-main-com.onrender.com/health

# Should return:
{
  "status": "ok",
  "timestamp": "2024-12-05T...",
  "uptime": 123,
  "environment": "production"
}
```

## 📊 Common Error Solutions

### Error: "Cannot find module 'express-rate-limit'"
**Solution**: 
```bash
# Add to backend/package.json dependencies:
"express-rate-limit": "^8.2.1",
"helmet": "^8.1.0",
"express-mongo-sanitize": "^2.2.0"

# Then redeploy
```

### Error: "ENOENT: no such file or directory, stat '../dist/index.html'"
**Solution**:
```bash
# Update build command to:
npm install && cd ../frontend && npm install && npm run build && mv dist ../backend/

# Or update backend/package.json:
"scripts": {
  "build:frontend": "cd ../frontend && npm install && npm run build && mv dist ../backend/"
}
```

### Error: "MongooseError: The `uri` parameter must be a string"
**Solution**:
```bash
# Set MONGODB_URI environment variable on Render
# Format: mongodb+srv://username:password@cluster.mongodb.net/dbname
```

### Error: "listen EADDRINUSE: address already in use"
**Solution**:
```bash
# This shouldn't happen on Render
# If it does, restart the service:
# Render Dashboard → Service → Manual Deploy → Clear build cache & deploy
```

## 🚀 After Fixing

### Test Your Deployment:
1. **Health Check**: 
   ```
   https://z-pp-main-com.onrender.com/health
   ```
   Should return: `{"status":"ok",...}`

2. **Frontend**:
   ```
   https://z-app-beta-z.onrender.com
   ```
   Should load the login page

3. **API Test**:
   ```bash
   curl https://z-pp-main-com.onrender.com/api/auth/check
   ```
   Should return 401 (expected, means API is working)

### Monitor Logs:
- Keep Render logs open
- Watch for any errors
- Check MongoDB Atlas metrics
- Monitor response times

## 📝 Prevention

### Before Each Deployment:
1. Test locally first
2. Check all environment variables
3. Verify MongoDB connection
4. Test build process locally
5. Check for any console errors

### Regular Maintenance:
- Update dependencies monthly
- Monitor error logs
- Check database performance
- Review security settings
- Test all features after deployment

## 🆘 Still Not Working?

### Check These:
1. **Render Status**: https://status.render.com
2. **MongoDB Atlas Status**: Check if service is down
3. **Cloudinary Status**: Check if service is down
4. **Build Logs**: Look for specific error messages
5. **Runtime Logs**: Check for crash loops

### Get Help:
1. Copy full error message from logs
2. Check which line is causing the error
3. Verify that file/module exists
4. Check if environment variable is used

---

## ✅ Final Checklist

Before marking as resolved:
- [ ] Health endpoint returns 200 OK
- [ ] Frontend loads without errors
- [ ] Can register new account
- [ ] Can login successfully
- [ ] Can send messages
- [ ] WebSocket connects
- [ ] Images upload to Cloudinary
- [ ] Email notifications work
- [ ] Admin dashboard accessible

---

**Status**: Troubleshooting Guide
**Last Updated**: December 5, 2024
**Your Issue**: 500 Internal Server Error on z-app-beta-z.onrender.com

**Next Steps**:
1. Check Render logs for specific error
2. Verify all environment variables are set
3. Ensure MongoDB connection is working
4. Redeploy if needed
