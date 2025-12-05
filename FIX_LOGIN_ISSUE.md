# Fix Login Issue on Production

## Problem
Login is failing because the backend doesn't have the correct frontend URL configured.

## Solution

### Step 1: Update Backend Environment Variables on Render

Go to your backend service on Render: https://dashboard.render.com/

1. Click on your **z-app-backend** service
2. Go to **Environment** tab
3. Add/Update these environment variables:

```
FRONTEND_URL=https://z-app-beta-z.onrender.com
CLIENT_URL=https://z-app-beta-z.onrender.com
```

4. Click **Save Changes**
5. The backend will automatically redeploy

### Step 2: Update Frontend Environment Variables (if needed)

Go to your frontend service on Render:

1. Click on your **z-app-frontend** service (or whatever it's named)
2. Go to **Environment** tab
3. Verify these variables are set:

```
VITE_API_BASE_URL=https://z-app-backend.onrender.com
VITE_API_URL=https://z-app-backend.onrender.com
```

4. If you made changes, click **Save Changes**

### Step 3: Manual Deploy (if auto-deploy doesn't trigger)

If the services don't automatically redeploy:

1. Go to each service
2. Click **Manual Deploy** → **Deploy latest commit**

### Step 4: Test Login

After both services are deployed:

1. Go to https://z-app-beta-z.onrender.com
2. Try to login or signup
3. Check browser console for any errors (F12 → Console tab)

## What Was Fixed in Code

I've already updated the backend code to include your new frontend URL in the allowed origins:

```javascript
const allowedOrigins = [
	FRONTEND_URL,
	"https://z-app-beta-z.onrender.com",  // ✅ Added
	"https://z-pp-main-com.onrender.com",
	"http://localhost:5173",
];
```

## Common Issues

### Issue 1: Cookies Not Being Set
**Symptom**: Login seems to work but you're immediately logged out
**Solution**: Make sure `NODE_ENV=production` is set on backend

### Issue 2: CORS Errors
**Symptom**: Browser console shows CORS errors
**Solution**: Verify FRONTEND_URL is set correctly on backend

### Issue 3: 401 Unauthorized
**Symptom**: All API requests return 401
**Solution**: Clear browser cookies and try again

## Quick Test Commands

Test if backend is running:
```bash
curl https://z-app-backend.onrender.com/health
```

Test if frontend can reach backend:
```bash
curl https://z-app-backend.onrender.com/api/auth/check
```

## Need Help?

If login still doesn't work after these steps:

1. Check Render logs for both services
2. Check browser console (F12) for errors
3. Try in incognito/private mode
4. Clear all cookies and cache
