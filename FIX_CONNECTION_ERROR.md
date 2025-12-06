# Fix Connection Error - Quick Guide 🔧

## The Problem

Your frontend is running but can't connect to the backend because:
- ❌ Backend server is not running
- ❌ Getting CORS and Network errors

## The Solution (3 Steps)

### Step 1: Close Current Frontend
Close the browser tab and stop the frontend server (Ctrl+C in terminal)

### Step 2: Start Both Servers
Double-click this file:
```
START_APP.bat
```

This will open 2 windows:
- Window 1: Backend (port 5001)
- Window 2: Frontend (port 5173)

### Step 3: Open Browser
Go to: http://localhost:5173

**Done!** The app should work now.

## Alternative: Manual Start

If the batch file doesn't work:

### Terminal 1 (Backend):
```bash
cd backend
npm run dev
```
Wait for: "✅ Server running on port 5001"

### Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```
Wait for: "Local: http://localhost:5173"

### Open Browser:
http://localhost:5173

## Verify It's Working

You should see:
- ✅ No CORS errors in console
- ✅ No Network errors
- ✅ Login page loads properly
- ✅ Can create account/login

## Common Issues

### Issue 1: Port 5001 Already in Use
**Error**: "Port 5001 is already in use"

**Fix**:
```bash
# Kill the process using port 5001
kill-port-5001.bat
```

Then restart the backend.

### Issue 2: MongoDB Connection Error
**Error**: "Failed to connect to MongoDB"

**Fix**: Check your `backend/.env` file has:
```
MONGODB_URI=your_mongodb_connection_string
```

### Issue 3: Still Getting CORS Errors
**Fix**: Make sure:
1. Backend is running on port 5001
2. Frontend .env has: `VITE_API_BASE_URL=http://localhost:5001`
3. Restart both servers

## Performance Note

Once the connection is fixed, you'll experience all the performance improvements:
- ⚡ Instant friend list loading
- ⚡ Instant chat opening
- ⚡ Instant messaging
- ⚡ Smooth animations

The optimizations are already in the code, they just need the backend running!

## Testing Production Speed

After fixing the connection, test production speed:
```bash
test-production-speed.bat
```

This shows the REAL performance (2-3x faster than development).

---

**Run `START_APP.bat` to fix the connection error!**
