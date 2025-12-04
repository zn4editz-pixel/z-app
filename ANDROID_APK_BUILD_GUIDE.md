# 🚀 Build Android APK - Complete Guide

## ✅ What's Been Configured:

1. ✅ Splash screen settings added
2. ✅ Custom app icon ready
3. ✅ Android-specific styling
4. ✅ Professional branding

---

## 📱 Step 1: Build Your React App

```bash
npm run --prefix frontend build
```

This creates the production build in `frontend/dist`

---

## 🔄 Step 2: Sync to Android

```bash
cd frontend
npx cap sync android
cd ..
```

This copies your built app to the Android project.

---

## 🎨 Step 3: Add Custom Icons & Splash Screen

### Option A: Use Android Studio (Easiest)

1. Open Android Studio
2. Open project: `frontend/android`
3. Wait for Gradle sync to complete

**Add App Icon:**
1. Right-click `app/res` folder
2. **New** → **Image Asset**
3. **Icon Type**: Launcher Icons (Adaptive and Legacy)
4. **Path**: Select your `z-app-logo.png`
5. Click **Next** → **Finish**

**Add Splash Screen:**
1. Right-click `app/res` folder
2. **New** → **Image Asset**
3. **Icon Type**: Launcher Icons
4. **Name**: `splash`
5. **Path**: Select your `z-app-logo.png`
6. Click **Next** → **Finish**

### Option B: Manual Setup (If Android Studio has issues)

I'll create the resources for you automatically - skip to Step 4!

---

## 🏗️ Step 4: Build APK

### Method 1: Using Android Studio (Recommended)

1. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait 2-5 minutes
3. Click **locate** when done
4. APK location: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

### Method 2: Using Command Line (Faster!)

```bash
cd frontend/android
gradlew assembleDebug
cd ../..
```

APK will be at: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📦 Step 5: Test Your APK

### On Real Device:
1. Copy `app-debug.apk` to your phone
2. Open the file
3. Allow "Install from unknown sources" if prompted
4. Install and test!

### On Emulator:
1. Open Android Studio
2. **Tools** → **Device Manager**
3. Create/Start an emulator
4. Drag APK file onto emulator
5. App installs automatically

---

## 🎯 Build Release APK (For Play Store)

### Step 1: Create Keystore (First Time Only)

```bash
cd frontend/android/app
keytool -genkey -v -keystore z-app-release.keystore -alias z-app -keyalg RSA -keysize 2048 -validity 10000
```

Enter:
- Password: (create strong password - SAVE THIS!)
- First and Last Name: Your name
- Organization: Z4FWN
- City, State, Country: Your info

**IMPORTANT**: Save the keystore file and password! You need them for updates.

### Step 2: Configure Signing

Create `frontend/android/key.properties`:
```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=z-app
storeFile=app/z-app-release.keystore
```

### Step 3: Build Release APK

```bash
cd frontend/android
gradlew assembleRelease
cd ../..
```

Release APK: `frontend/android/app/build/outputs/apk/release/app-release.apk`

---

## 🎨 Customize Your Android App

### Change App Name:
Edit `frontend/android/app/src/main/res/values/strings.xml`:
```xml
<resources>
    <string name="app_name">Z-App</string>
    <string name="title_activity_main">Z-App</string>
    <string name="package_name">com.z4fwn.zapp</string>
    <string name="custom_url_scheme">com.z4fwn.zapp</string>
</resources>
```

### Change Package Name:
Edit `frontend/capacitor.config.json`:
```json
{
  "appId": "com.yourcompany.yourapp"
}
```

Then run: `npx cap sync android`

### Change Theme Colors:
Edit `frontend/android/app/src/main/res/values/styles.xml`:
```xml
<item name="colorPrimary">#6366f1</item>
<item name="colorPrimaryDark">#4f46e5</item>
<item name="colorAccent">#6366f1</item>
```

---

## 🚀 Quick Build Commands

### Debug APK (for testing):
```bash
npm run --prefix frontend build
cd frontend
npx cap sync android
cd android
gradlew assembleDebug
cd ../../..
```

### Release APK (for Play Store):
```bash
npm run --prefix frontend build
cd frontend
npx cap sync android
cd android
gradlew assembleRelease
cd ../../..
```

---

## 📱 Upload to Google Play Store

### Requirements:
1. Google Play Console account ($25 one-time fee)
2. Release APK (signed)
3. App icon (512x512 PNG)
4. Feature graphic (1024x500 PNG)
5. Screenshots (at least 2)
6. Privacy policy URL

### Steps:
1. Go to: https://play.google.com/console
2. Create app
3. Fill store listing
4. Upload release APK
5. Complete content rating
6. Set pricing (Free/Paid)
7. Submit for review

Review takes 1-7 days.

---

## 🔧 Troubleshooting

### Gradle Sync Failed:
```bash
cd frontend/android
gradlew clean
cd ../..
```

### Build Failed:
1. Check Java version: `java -version` (need Java 17)
2. Update Gradle: Edit `frontend/android/gradle/wrapper/gradle-wrapper.properties`
3. Clean and rebuild

### APK Not Installing:
- Enable "Install from unknown sources" in phone settings
- Check if old version is installed (uninstall first)
- Make sure APK is not corrupted

---

## 🎉 Your APK Features:

✅ Custom app icon
✅ Professional splash screen
✅ Dark theme optimized
✅ Full-screen experience
✅ Offline support (PWA features)
✅ Push notifications ready
✅ Video/audio calls work
✅ Real-time chat
✅ All your features included!

---

## 📊 APK Info:

**Package Name**: com.z4fwn.zapp
**App Name**: Z-App
**Version**: 1.0.0
**Min Android**: 5.1 (API 22)
**Target Android**: 14 (API 34)
**Size**: ~10-20 MB

---

## 🚀 Next Steps:

1. **Build debug APK** to test on your phone
2. **Test all features** (chat, calls, notifications)
3. **Build release APK** when ready
4. **Upload to Play Store**
5. **Share with users!**

Good luck! 🎉
