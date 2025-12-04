# Fix "Not Found" Error on Render (SPA Routing Issue)

## Problem
When you refresh any page other than the home page on your Render-hosted React app, you get a "Not Found" error.

## Why This Happens
React Router handles routing on the client side, but when you refresh, the browser makes a request to the server for that specific route (e.g., `/profile`). The server doesn't know about this route, so it returns a 404 error.

## Solution

### ✅ Method 1: Render Dashboard (Easiest)

1. **Go to Render Dashboard:** https://dashboard.render.com
2. **Select your frontend service** (Static Site)
3. Click **"Settings"** tab
4. Scroll down to **"Redirects/Rewrites"** section
5. Click **"Add Rule"**
6. Configure:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** `Rewrite`
7. Click **"Save Changes"**
8. Render will automatically redeploy

### ✅ Method 2: Update Build Command

If Method 1 doesn't work:

1. Go to your frontend service on Render
2. Click **"Settings"**
3. Find **"Build Command"**
4. Update to:
   ```bash
   npm install && npm run build && echo '/*    /index.html   200' > dist/_redirects
   ```
5. Click **"Save Changes"**
6. Click **"Manual Deploy"** → **"Deploy latest commit"**

### ✅ Method 3: Verify _redirects File

The `_redirects` file should already exist in `frontend/public/_redirects`:

```
/*    /index.html   200
```

This file is automatically copied to the `dist` folder during build. If it's not working:

1. Check Render build logs to ensure the file is being copied
2. Verify the file exists in the deployed `dist` folder
3. Make sure the build command includes the public folder

### ✅ Method 4: Use render.yaml (Automated)

I've already created a `render.yaml` file in your project root. To use it:

1. **Delete your existing services** on Render (or keep them)
2. Go to Render Dashboard
3. Click **"New"** → **"Blueprint"**
4. Select your repository: `zn4editz-pixel/z-app`
5. Render will automatically detect `render.yaml` and configure everything

The `render.yaml` includes this configuration:
```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

## Verify the Fix

After applying any method:

1. Visit your frontend URL
2. Navigate to different pages (e.g., `/profile`, `/settings`)
3. Refresh the page (F5 or Ctrl+R)
4. The page should load correctly without "Not Found" error

## Additional Checks

### Check Build Logs
1. Go to your frontend service on Render
2. Click **"Logs"** tab
3. Look for the build output
4. Verify `_redirects` file is in the dist folder

### Check Deployed Files
In the build logs, you should see:
```
dist/
  index.html
  _redirects
  assets/
    ...
```

## Common Issues

### Issue: Still getting 404 after applying fix
**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Try in incognito/private mode
3. Wait 2-3 minutes for Render to fully deploy
4. Check if the rewrite rule was saved correctly

### Issue: _redirects file not found in dist
**Solution:**
1. Verify `frontend/public/_redirects` exists
2. Check `vite.config.js` has `copyPublicDir: true`
3. Rebuild locally to test: `npm run build`
4. Check if `dist/_redirects` exists after local build

### Issue: Works on home page but not on other routes
**Solution:**
This confirms the SPA routing issue. Apply Method 1 or 2 above.

## Testing Locally

To test if the fix works locally:

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Serve the dist folder:
   ```bash
   npx serve dist
   ```

3. Navigate to different routes and refresh
4. Should work without errors

## Backend CORS Configuration

Also ensure your backend allows the frontend URL. Check `backend/src/index.js`:

```javascript
const allowedOrigins = [
  FRONTEND_URL,
  "https://your-frontend-url.onrender.com",
  "http://localhost:5173",
];
```

## Final Checklist

- [ ] `_redirects` file exists in `frontend/public/`
- [ ] Rewrite rule added in Render dashboard
- [ ] Frontend redeployed after changes
- [ ] Browser cache cleared
- [ ] Tested in incognito mode
- [ ] All routes work after refresh
- [ ] Backend CORS includes frontend URL

## Success!

Once fixed, you should be able to:
- ✅ Navigate to any page
- ✅ Refresh without errors
- ✅ Share direct links to any page
- ✅ Use browser back/forward buttons

---

**Need more help?** Check Render docs: https://render.com/docs/deploy-create-react-app
