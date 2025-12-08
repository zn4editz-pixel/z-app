# Clear Service Worker (Fix Development Errors)

## The Problem

You're seeing these errors in development:
```
GET http://localhost:5173/@vite/client net::ERR_FAILED
GET http://localhost:5173/src/main.jsx net::ERR_FAILED
TypeError: Failed to fetch
```

This is because the service worker is caching files and interfering with Vite's hot module reloading.

## Quick Fix

### Option 1: Unregister in Browser (Recommended)

1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in the left sidebar
4. Find `localhost:5173`
5. Click **Unregister**
6. **Hard refresh** the page (Ctrl+Shift+R or Cmd+Shift+R)

### Option 2: Clear All Site Data

1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Storage** in the left sidebar
4. Click **Clear site data** button
5. Refresh the page

## What I Fixed

Updated `frontend/public/service-worker.js` to:
- ✅ Only activate in production (not on localhost)
- ✅ Skip caching in development
- ✅ Allow Vite HMR to work properly

## Verify It's Fixed

After unregistering, you should see:
```
✅ No service worker errors
✅ Vite HMR working
✅ Fast page reloads
```

## For Production

The service worker will still work in production:
- ✅ Caches static assets
- ✅ Offline support
- ✅ PWA functionality

---

**TL;DR:** Open DevTools → Application → Service Workers → Unregister → Hard Refresh
