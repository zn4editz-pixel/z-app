# 🔧 Redis Connection Fix

## Problem
Redis is failing to connect using individual credentials (HOST, PORT, PASSWORD).

## Solution
Use the full Redis URL format instead.

---

## Step 1: Get Full Redis URL from Upstash

1. Go to your Upstash dashboard: https://console.upstash.com
2. Click on your `z-app` database
3. Look for the connection string that looks like:
   ```
   redis://default:AUa6AAIncDI0GMJhN2M5YWViZGQ0Y40TQ5MjFmMDE4Yz...@measured-python-18106.upstash.io:6379
   ```
4. **Copy the ENTIRE URL** (starts with `redis://` or `rediss://`)

---

## Step 2: Add REDIS_URL to Render

1. Go to Render dashboard: https://dashboard.render.com
2. Click on `z-app-backend`
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Add:
   ```
   Key: REDIS_URL
   Value: redis://default:YOUR_PASSWORD@measured-python-18106.upstash.io:6379
   ```
   (Use the full URL you copied from Upstash)

6. **Important**: You can now DELETE the old variables:
   - Delete `REDIS_HOST`
   - Delete `REDIS_PORT`  
   - Delete `REDIS_PASSWORD`
   
   We only need `REDIS_URL` now.

7. Click **Save Changes**

---

## Step 3: Wait for Redeploy

Render will automatically redeploy (2-3 minutes).

---

## Step 4: Verify Connection

Check the logs for:
```
✅ Redis: Connected and ready
🔐 Rate Limiting: Redis (Distributed)
```

---

## Alternative: Use Upstash REST API

If the direct connection still fails, we can use Upstash's REST API instead (HTTP-based, more reliable).

Let me know if you want to try that approach!

---

## Your Redis URL Format

Based on what you shared earlier, your URL should be:
```
redis://default:AUa6AAIncDI0GMJhN2M5YWViZGQ0Y40TQ5MjFmMDE4YzcwMWNlMXAyMTgxMDY@measured-python-18106.upstash.io:6379
```

Copy this EXACT string and add it as `REDIS_URL` in Render!
