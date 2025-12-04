# 🔧 Fix APK Login Issue

## Problem:
The APK shows "Login Failed" because it's trying to connect to `localhost:5001`, which doesn't exist on your phone.

---

## ✅ Solution 1: Test on Same WiFi (Quick)

Your phone and computer must be on the **same WiFi network**.

### Step 1: Start Backend on Your Computer
```bash
npm run --prefix backend dev
```

Make sure it's running on port 5001.

### Step 2: Allow Firewall Access
Windows will ask to allow Node.js through firewall - click **Allow**.

Or manually:
1. Windows Security → Firewall
2. Allow an app → Node.js
3. Check both Private and Public networks

### Step 3: Rebuild APK with Local IP

I've created `.env.production` with your computer's IP: `192.168.1.39`

```bash
npm run --prefix frontend build
cd frontend && npx cap sync android && cd ..
cd frontend/android && .\gradlew.bat assembleDebug && cd ../..
```

### Step 4: Install New APK
Copy the new `app-debug.apk` to your phone and install.

### Step 5: Test
- Make sure backend is running on your computer
- Make sure phone is on same WiFi
- Open Z-App on phone
- Login should work!

**Your Computer IP**: `192.168.1.39`
**Backend URL**: `http://192.168.1.39:5001`

---

## ✅ Solution 2: Deploy Backend (Production)

For the app to work anywhere (not just on WiFi), deploy your backend first.

### Step 1: Deploy Backend to Render

1. Go to https://render.com
2. Sign up/Login
3. Click **New +** → **Web Service**
4. Connect your GitHub repo
5. Configure:
   - **Name**: z-app-backend
   - **Root Directory**: backend
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
   - **Plan**: Free

6. Add Environment Variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your secret key
   - `NODE_ENV`: production
   - `PORT`: 5001
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary name
   - `CLOUDINARY_API_KEY`: Your API key
   - `CLOUDINARY_API_SECRET`: Your API secret

7. Click **Create Web Service**
8. Wait 5-10 minutes for deployment

### Step 2: Update Frontend with Backend URL

Edit `frontend/.env.production`:
```env
VITE_API_BASE_URL=https://z-app-backend.onrender.com
VITE_API_URL=https://z-app-backend.onrender.com
```

Replace with your actual Render URL.

### Step 3: Rebuild APK
```bash
npm run --prefix frontend build
cd frontend && npx cap sync android && cd ..
cd frontend/android && .\gradlew.bat assembleDebug && cd ../..
```

### Step 4: Install and Test
Now your app works anywhere with internet!

---

## 🔍 Troubleshooting:

### Login still fails with local IP:
1. **Check backend is running**:
   ```bash
   curl http://192.168.1.39:5001/api/auth/check
   ```

2. **Check firewall**:
   - Windows Defender Firewall
   - Allow Node.js on port 5001

3. **Check same WiFi**:
   - Phone and computer on same network
   - Not using mobile data

4. **Check IP hasn't changed**:
   ```bash
   ipconfig | findstr IPv4
   ```
   If different, update `.env.production` and rebuild

### Can't connect to backend:
1. **Ping from phone**:
   - Open browser on phone
   - Go to: `http://192.168.1.39:5001/api/auth/check`
   - Should see response

2. **Check backend logs**:
   - Look for incoming requests
   - Check for CORS errors

### CORS errors:
Backend should allow your IP. Check `backend/src/index.js`:
```javascript
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));
```

---

## 📱 Quick Test Commands:

### Rebuild APK with local IP:
```bash
npm run --prefix frontend build && cd frontend && npx cap sync android && cd android && .\gradlew.bat assembleDebug && cd ../../..
```

### Check your IP:
```bash
ipconfig | findstr IPv4
```

### Test backend from phone browser:
Open: `http://192.168.1.39:5001/api/auth/check`

---

## 🚀 Recommended Approach:

**For Testing**: Use Solution 1 (local IP)
**For Production**: Use Solution 2 (deploy backend)

Once backend is deployed, your app works everywhere!

---

## 📊 Current Configuration:

**Computer IP**: 192.168.1.39
**Backend Port**: 5001
**Frontend Build**: Uses `.env.production`
**APK Location**: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

---

## ✨ Next Steps:

1. **Start backend** on your computer
2. **Rebuild APK** with commands above
3. **Install** new APK on phone
4. **Test login** - should work!
5. **Deploy backend** for production use

Good luck! 🚀
