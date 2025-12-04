# 🚀 Quick Build Guide - Z-APP

## 📱 Build Android APK (5 Minutes)

### Option 1: Automated Build
```bash
# Run the build script
build-all.bat

# Then open Android Studio
cd frontend
npx cap open android

# In Android Studio:
# Build > Build Bundle(s) / APK(s) > Build APK(s)
```

### Option 2: Manual Build
```bash
# Step 1: Build frontend
cd frontend
npm run build

# Step 2: Sync with Capacitor
npx cap sync android

# Step 3: Open Android Studio
npx cap open android

# Step 4: In Android Studio
# Build > Build Bundle(s) / APK(s) > Build APK(s)
```

### APK Location
After building, find your APK at:
```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🌐 Deploy Web App

### Deploy to Render
1. Push code to GitHub
2. Go to Render.com
3. Create new Static Site
4. Connect GitHub repo
5. Set build command: `cd frontend && npm install && npm run build`
6. Set publish directory: `frontend/dist`
7. Add environment variable: `VITE_API_BASE_URL=https://your-backend-url.com`
8. Deploy!

### Deploy to Vercel
```bash
cd frontend
vercel --prod
```

### Deploy to Netlify
```bash
cd frontend
netlify deploy --prod --dir=dist
```

---

## 🔧 Environment Setup

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-super-secret-jwt-key-here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://your-frontend-url.com
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
```

### Frontend (.env.production)
```env
VITE_API_BASE_URL=https://z-om-backend-4bod.onrender.com
```

---

## ✅ Pre-Build Checklist

- [ ] Backend deployed and running
- [ ] MongoDB connected
- [ ] Cloudinary configured
- [ ] Environment variables set
- [ ] CORS origins updated
- [ ] Frontend .env.production configured
- [ ] All dependencies installed

---

## 🧪 Test Before Deploy

### Test Locally
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Test at: http://localhost:5173
```

### Test Production Build
```bash
cd frontend
npm run build
npm run preview
# Test at: http://localhost:4173
```

---

## 📦 Build Commands Reference

### Frontend
```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Check for errors
```

### Capacitor
```bash
npx cap sync         # Sync web code to native
npx cap sync android # Sync to Android only
npx cap sync ios     # Sync to iOS only
npx cap open android # Open Android Studio
npx cap open ios     # Open Xcode
npx cap update       # Update Capacitor
```

### Backend
```bash
npm run dev          # Development with nodemon
npm start            # Production server
```

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Capacitor Sync Issues
```bash
cd frontend
npx cap sync --force
```

### Android Studio Issues
1. File > Invalidate Caches / Restart
2. Build > Clean Project
3. Build > Rebuild Project

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5001 | xargs kill -9
```

---

## 📱 APK Signing (Release Build)

### Generate Keystore
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### Configure Gradle
Add to `frontend/android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword 'your-password'
            keyAlias 'my-key-alias'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### Build Release APK
```bash
cd frontend/android
./gradlew assembleRelease
```

---

## 🎯 Quick Commands

### Full Build (Everything)
```bash
build-all.bat
```

### Just Frontend
```bash
cd frontend && npm run build
```

### Just Android Sync
```bash
cd frontend && npx cap sync android
```

### Open Android Studio
```bash
cd frontend && npx cap open android
```

---

## 📊 Build Time Estimates

| Task | Time |
|------|------|
| Install dependencies | 2-3 min |
| Build frontend | 1-2 min |
| Sync Capacitor | 30 sec |
| Build APK in Android Studio | 2-3 min |
| **Total** | **5-8 min** |

---

## 🎉 Success!

After building, you'll have:
- ✅ Production-ready web app
- ✅ Android APK file
- ✅ All features working
- ✅ Optimized performance

---

**Need Help?**
- Check `100_PERCENT_COMPLETE.md` for full documentation
- Review `TOKEN_AUTH_COMPLETE.md` for auth details
- See `ALL_BUGS_TO_FIX.md` for known issues (all fixed!)

**Ready to launch! 🚀**
