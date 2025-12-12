# 🚨 MESSAGE SENDING TROUBLESHOOTING GUIDE

## Quick Fixes (Try These First)

### 1. 🔄 Restart Everything
```bash
# Stop all servers (Ctrl+C in terminals)
# Then restart:

# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 2. 🧹 Clear Browser Data
- Press `F12` to open DevTools
- Right-click refresh button → "Empty Cache and Hard Reload"
- Or go to Application tab → Storage → Clear storage

### 3. 🔐 Re-login
- Logout and login again
- Use credentials: `z4fwan77@gmail.com` / `admin123`

## Detailed Diagnosis

### Step 1: Check Backend Status
```bash
# Run this command:
curl http://localhost:5001/api/health

# Expected: {"status":"OK","timestamp":"..."}
# If error: Backend is not running
```

**Fix:** Start backend server
```bash
cd backend
npm run dev
```

### Step 2: Check Frontend Connection
Open browser DevTools (F12) and look for:

#### Console Errors:
- ❌ `Failed to fetch` → Backend not running
- ❌ `CORS error` → Backend CORS issue  
- ❌ `401 Unauthorized` → Login again
- ❌ `Socket connection failed` → Socket issue

#### Network Tab:
- Check if API calls to `localhost:5001` are working
- Look for failed requests (red status codes)

### Step 3: Test Message Sending Manually

#### In Browser Console (F12):
```javascript
// Test if you're logged in
console.log(localStorage.getItem('authUser'));

// Test API call
fetch('/api/users/sidebar', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
}).then(r => r.json()).then(console.log);
```

### Step 4: Check Socket Connection

#### In Browser Console:
```javascript
// Check socket status
const authStore = window.__ZUSTAND_STORES__?.auth;
console.log('Socket connected:', authStore?.socket?.connected);
```

## Common Issues & Solutions

### Issue 1: "Backend not running"
**Symptoms:** Can't send messages, API errors
**Solution:**
```bash
cd backend
npm run dev
```

### Issue 2: "Socket connection failed"
**Symptoms:** Messages don't appear in real-time
**Solutions:**
1. Restart backend server
2. Clear browser cache
3. Check browser console for socket errors

### Issue 3: "Authentication failed"
**Symptoms:** 401 errors, can't access features
**Solutions:**
1. Logout and login again
2. Clear localStorage: `localStorage.clear()`
3. Check credentials: `z4fwan77@gmail.com` / `admin123`

### Issue 4: "CORS errors"
**Symptoms:** Network errors in browser
**Solution:** Check backend CORS configuration

### Issue 5: "Messages appear but don't send"
**Symptoms:** Messages show locally but don't reach other users
**Solutions:**
1. Check socket connection
2. Verify real-time events are working
3. Test with two browser windows

## Advanced Debugging

### Run Diagnostic Script
```bash
node diagnose-message-issue.js
```

### Check Backend Logs
Look at the terminal running the backend for:
- Socket connection messages
- API request logs
- Error messages

### Test with Two Users
1. Open two browser windows
2. Login as different users
3. Try sending messages between them
4. Check if messages appear in both windows

## Environment Check

### Frontend .env file should contain:
```
VITE_API_BASE_URL=http://localhost:5001
```

### Backend should be running on:
- Port: `5001`
- URL: `http://localhost:5001`

## Still Not Working?

### 1. Check Browser Compatibility
- Use Chrome or Firefox
- Disable browser extensions
- Try incognito mode

### 2. Check Network
- Disable VPN/proxy
- Check firewall settings
- Try different network

### 3. Reset Everything
```bash
# Stop all servers
# Clear browser data completely
# Restart computer
# Start servers again
```

### 4. Check System Resources
- Ensure enough RAM/CPU available
- Close other applications
- Check if ports 5001/5173 are available

## Get Help

If nothing works:
1. Copy any error messages from browser console
2. Check backend terminal for error logs
3. Note which step failed in this guide
4. Provide system info (OS, browser, Node version)

---

## Quick Test Commands

```bash
# Test backend health
curl http://localhost:5001/api/health

# Test authentication
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"z4fwan77@gmail.com","password":"admin123"}'

# Run full diagnostic
node diagnose-message-issue.js
```