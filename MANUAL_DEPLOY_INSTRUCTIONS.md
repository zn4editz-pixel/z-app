# Manual Deploy Instructions

## Current Situation
The code has been pushed to GitHub, but Render may not have automatically detected the changes yet.

## Solution: Trigger Manual Deploy

### Step 1: Go to Render Dashboard
Visit: https://dashboard.render.com

### Step 2: Select Your Backend Service
1. Click on **"z-app-backend"** service
2. You should see your service dashboard

### Step 3: Trigger Manual Deploy
1. Look for the **"Manual Deploy"** button (top right)
2. Click it
3. Select **"Deploy latest commit"**
4. Click **"Deploy"**

### Step 4: Monitor the Build
1. Watch the **"Events"** tab
2. You'll see:
   - "Build started"
   - "Build succeeded"
   - "Deploy started"
   - "Deploy live"

### Step 5: Wait for Completion
- Build time: ~2-3 minutes
- Deploy time: ~30 seconds
- Total: ~3-4 minutes

### Step 6: Test
1. Wait for status to show **"Live"**
2. Visit: https://z-app-beta-z.onrender.com
3. Hard refresh (Ctrl+Shift+R)
4. Try logging in
5. Should work without CORS errors!

## Alternative: Check Auto-Deploy Settings

If manual deploy doesn't work, check:

1. Go to your service settings
2. Look for **"Auto-Deploy"** setting
3. Make sure it's set to **"Yes"**
4. Branch should be **"main"**

## Verify Latest Commit

In Render dashboard:
1. Check the **"Latest Deploy"** section
2. Should show commit: **bee0dc2**
3. Message: "Fix: CORS login error..."

If it shows an older commit, that's why the fix isn't live yet.

## After Successful Deploy

The backend health endpoint will show a fresh uptime (less than 1 minute):
```json
{
  "status": "ok",
  "uptime": 45.123,  // Should be low number
  "environment": "production"
}
```

Then test login - CORS error will be gone!

---

**Need Help?**
- Check Render logs for build errors
- Verify GitHub webhook is configured
- Contact Render support if auto-deploy isn't working
