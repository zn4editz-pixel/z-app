# 🚀 How to Start the Servers

## The Problem
You're seeing CORS errors because the **backend server is not running**. The frontend is trying to connect to `http://localhost:5001/api` but nothing is listening on that port.

## Quick Solution

### Option 1: Use the Batch File (Easiest)
Just double-click this file in your project root:
```
start-dev.bat
```

This will automatically:
- Start the backend server on port 5001
- Start the frontend server on port 5173
- Open both in separate command windows

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## What You Should See

**Backend Terminal:**
```
🚀 Server running at http://localhost:5001
✅ MongoDB connected successfully
✅ Default admin created: admin@example.com
```

**Frontend Terminal:**
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## Verify It's Working

1. Open browser to: http://localhost:5173
2. Open DevTools Console (F12)
3. You should see NO CORS errors
4. The admin dashboard should load data properly

## Current Status

✅ Frontend is running on port 5173
❌ Backend is NOT running on port 5001 (this is why you see CORS errors)

## Next Steps

1. Run `start-dev.bat` or start both servers manually
2. Refresh your browser
3. The admin dashboard should now load all data correctly!

## Troubleshooting

If you still see errors after starting the backend:

1. **Check if backend is running:**
   - Open http://localhost:5001/health in browser
   - You should see: `{"status":"ok",...}`

2. **Check if MongoDB is connected:**
   - Look at backend terminal
   - Should say "MongoDB connected successfully"

3. **Check environment variables:**
   - Make sure `backend/.env` exists
   - Should have `MONGODB_URI` set

4. **Port already in use:**
   - If port 5001 is busy, kill the process:
   ```bash
   kill-port-5001.bat
   ```
   - Then start again

## Admin Login

Once both servers are running:
- Email: (check your backend/.env for ADMIN_EMAIL)
- Password: safwan123
- Go to: http://localhost:5173/admin

Enjoy your beautiful new admin dashboard! 🎉
