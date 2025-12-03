# 📧 Email Setup Guide for Forgot Password

## Why Forgot Password Isn't Working:

The forgot password feature requires email credentials to be configured in Render.

---

## 🔧 Fix: Add Email Environment Variables to Render

### Step 1: Get Gmail App Password

1. **Go to your Google Account**: https://myaccount.google.com
2. **Click "Security"** (left sidebar)
3. **Enable 2-Step Verification** (if not already enabled)
4. **Go to "App passwords"**: https://myaccount.google.com/apppasswords
5. **Create new app password**:
   - App: Mail
   - Device: Other (Custom name) → Enter "Z-APP"
6. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)
7. **Remove spaces**: `abcdefghijklmnop`

### Step 2: Add to Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click on your backend service**: `z-app-zn4`
3. **Click "Environment"** (left sidebar)
4. **Add these variables**:

```
EMAIL_USER = your.email@gmail.com
EMAIL_PASS = abcdefghijklmnop
```

5. **Click "Save Changes"**
6. **Wait for auto-redeploy** (2-3 minutes)

---

## ✅ What Was Fixed in Code:

1. **Better error logging** - Now shows exactly what's wrong
2. **Fallback CLIENT_URL** - Uses FRONTEND_URL if CLIENT_URL not set
3. **Email verification** - Checks if credentials are configured
4. **Better error messages** - Tells you if authentication failed

---

## 🧪 Test After Setup:

1. **Go to your app**: https://z-app-zn4-1.onrender.com
2. **Click "Forgot Password"**
3. **Enter your email**
4. **Check your inbox** (and spam folder)
5. **Click the reset link**
6. **Enter new password**

---

## 🔍 Troubleshooting:

### Email Not Received?

**Check Render Logs**:
1. Render Dashboard → z-app-zn4
2. Logs tab
3. Look for:
   - ✅ `📧 Email sent to...` - Success!
   - ❌ `Email credentials not configured` - Add EMAIL_USER and EMAIL_PASS
   - ❌ `Authentication failed` - Check app password is correct

### Still Not Working?

**Common Issues**:
1. **Wrong app password** - Make sure you copied it correctly (no spaces)
2. **2-Step Verification not enabled** - Required for app passwords
3. **Using regular password** - Must use app password, not your Gmail password
4. **Gmail blocking** - Check Gmail security settings

---

## 📋 Environment Variables Checklist:

Make sure these are set in Render:

- [ ] `EMAIL_USER` - Your Gmail address
- [ ] `EMAIL_PASS` - Gmail app password (16 characters)
- [ ] `CLIENT_URL` or `FRONTEND_URL` - Your frontend URL

---

## 💡 Alternative: Use SendGrid (Optional)

If Gmail doesn't work, you can use SendGrid (free tier):

1. Sign up: https://sendgrid.com
2. Get API key
3. Update `sendEmail.js` to use SendGrid
4. Add `SENDGRID_API_KEY` to Render

---

**After adding EMAIL_USER and EMAIL_PASS to Render, forgot password will work!** 📧
