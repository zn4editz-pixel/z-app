# 🏥 Quick Health Check Guide
**Run this checklist before deploying to production**

---

## ✅ Pre-Deployment Health Check

### 1. Environment Variables Check

**Backend (.env):**
```bash
# Navigate to backend folder
cd backend

# Check if .env exists
dir .env

# Verify all required variables are set:
# - PORT
# - MONGODB_URI
# - JWT_SECRET
# - NODE_ENV
# - CLOUDINARY_CLOUD_NAME
# - CLOUDINARY_API_KEY
# - CLOUDINARY_API_SECRET
# - EMAIL_USER
# - EMAIL_PASS
# - ADMIN_EMAIL
# - FRONTEND_URL
```

**Frontend (.env):**
```bash
# Navigate to frontend folder
cd frontend

# Check if .env exists
dir .env

# Verify VITE_API_URL is set correctly
```

### 2. Dependencies Check

**Backend:**
```bash
cd backend
npm install
npm audit
```

**Frontend:**
```bash
cd frontend
npm install
npm audit
```

### 3. Build Test

**Frontend Build:**
```bash
cd frontend
npm run build
```

**Expected Output:**
- ✅ Build completes without errors
- ✅ dist folder created
- ✅ Assets optimized

### 4. Database Connection Test

**Start Backend:**
```bash
cd backend
npm run dev
```

**Check Console for:**
- ✅ "MongoDB connected successfully"
- ✅ "Server running at http://localhost:5001"
- ✅ "Socket.io initialized"

### 5. API Health Check

**Open browser or use curl:**
```bash
curl http://localhost:5001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-07T...",
  "uptime": 123.456,
  "environment": "development"
}
```

### 6. Frontend Test

**Start Frontend:**
```bash
cd frontend
npm run dev
```

**Check:**
- ✅ Opens at http://localhost:5173
- ✅ No console errors
- ✅ Login page loads
- ✅ Assets load correctly

### 7. Feature Testing Checklist

**Authentication:**
- [ ] Sign up new user
- [ ] Login with credentials
- [ ] Logout
- [ ] Forgot password flow
- [ ] Reset password

**Messaging:**
- [ ] Send text message
- [ ] Send image
- [ ] Send voice message
- [ ] Add reaction
- [ ] Delete message
- [ ] See online status
- [ ] Typing indicator works

**Friend System:**
- [ ] Send friend request
- [ ] Accept friend request
- [ ] Reject friend request
- [ ] Unfriend user
- [ ] View friend list

**Video/Audio Calls:**
- [ ] Initiate video call
- [ ] Accept incoming call
- [ ] Reject call
- [ ] End call
- [ ] Toggle camera
- [ ] Toggle microphone

**Stranger Chat:**
- [ ] Join queue
- [ ] Match with stranger
- [ ] Send messages
- [ ] Skip stranger
- [ ] Add friend from stranger chat
- [ ] Report user

**Admin Dashboard (if admin):**
- [ ] View statistics
- [ ] Manage users
- [ ] Review reports
- [ ] Handle verification requests
- [ ] Send notifications

**Mobile Responsiveness:**
- [ ] Test on mobile device
- [ ] Touch gestures work
- [ ] Bottom navigation visible
- [ ] All features accessible

### 8. Performance Check

**Lighthouse Audit:**
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run audit
4. Check scores:
   - Performance: 70+ ✅
   - Accessibility: 90+ ✅
   - Best Practices: 90+ ✅
   - SEO: 90+ ✅

### 9. Security Check

**Verify:**
- [ ] JWT tokens working
- [ ] Rate limiting active
- [ ] CORS configured
- [ ] Helmet headers present
- [ ] No sensitive data in console
- [ ] No API keys in frontend code

### 10. Error Handling Check

**Test Error Scenarios:**
- [ ] Invalid login credentials
- [ ] Network disconnection
- [ ] Invalid file upload
- [ ] Expired JWT token
- [ ] Rate limit exceeded
- [ ] Invalid API requests

---

## 🚨 Common Issues & Solutions

### Issue: MongoDB Connection Failed
**Solution:**
```bash
# Check MongoDB URI in .env
# Ensure MongoDB is running (local) or accessible (Atlas)
# Verify network connectivity
```

### Issue: Frontend Can't Connect to Backend
**Solution:**
```bash
# Check VITE_API_URL in frontend/.env
# Ensure backend is running
# Check CORS configuration
# Verify firewall settings
```

### Issue: Cloudinary Upload Fails
**Solution:**
```bash
# Verify Cloudinary credentials in backend/.env
# Check Cloudinary account status
# Ensure API keys are correct
```

### Issue: Email Not Sending
**Solution:**
```bash
# Verify EMAIL_USER and EMAIL_PASS in backend/.env
# For Gmail: Enable "Less secure app access" or use App Password
# Check email service status
```

### Issue: Socket Connection Fails
**Solution:**
```bash
# Check WebSocket support in browser
# Verify CORS configuration
# Check firewall/proxy settings
# Ensure backend is running
```

---

## 📊 Health Check Results

### ✅ All Systems Operational
- Backend: Running
- Frontend: Running
- Database: Connected
- Socket.IO: Active
- Cloudinary: Connected
- Email: Configured

### ⚠️ Warnings (Non-Critical)
- Redis not configured (optional for <10K users)
- Debug route still active (can be removed)

### ❌ Critical Issues
- None found! 🎉

---

## 🚀 Ready to Deploy?

If all checks pass:
1. ✅ Set NODE_ENV=production
2. ✅ Update FRONTEND_URL to production URL
3. ✅ Update VITE_API_URL to production API
4. ✅ Build frontend: `npm run build`
5. ✅ Deploy backend to hosting service
6. ✅ Deploy frontend to hosting service
7. ✅ Test production deployment
8. ✅ Monitor for errors

---

## 📞 Support

If you encounter issues:
1. Check error logs
2. Review environment variables
3. Verify network connectivity
4. Check service status
5. Review documentation

---

**Last Updated:** December 7, 2024  
**Status:** ✅ All Systems Go!
