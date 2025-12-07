# Redis Setup Guide for 500K Users

## Option 1: Upstash (Recommended - Free Tier Available)

### Step 1: Create Upstash Account
1. Go to https://upstash.com
2. Sign up with GitHub or email
3. Click "Create Database"
4. Select "Redis" → "Global" (for best performance)
5. Name it: `z-app-redis`

### Step 2: Get Connection Details
After creating the database, you'll see:
- **Endpoint**: `your-db-name.upstash.io`
- **Port**: `6379` or `6380`
- **Password**: `your-password-here`

### Step 3: Add to Render Environment Variables
Go to your Render backend service → Environment:
```
REDIS_HOST=your-db-name.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-password-here
```

### Step 4: Redeploy
Click "Manual Deploy" → "Deploy latest commit"

---

## Option 2: Redis Cloud (Redis Labs)

### Step 1: Create Redis Cloud Account
1. Go to https://redis.com/try-free/
2. Sign up for free tier (30MB)
3. Create new subscription
4. Create new database

### Step 2: Get Connection Details
- **Endpoint**: `redis-xxxxx.c1.us-east-1-2.ec2.cloud.redislabs.com`
- **Port**: `12345`
- **Password**: From "Security" tab

### Step 3: Add to Render
Same as Upstash - add to environment variables

---

## Option 3: Render Redis (Paid)

### Step 1: Add Redis Service
1. In Render dashboard, click "New +"
2. Select "Redis"
3. Name it: `z-app-redis`
4. Select plan (starts at $7/month)

### Step 2: Connect to Backend
Render will provide:
- **Internal Redis URL**: `redis://...`

### Step 3: Update Backend Environment
```
REDIS_HOST=internal-redis-url
REDIS_PORT=6379
REDIS_PASSWORD=auto-generated
```

---

## Testing Redis Connection

### Local Testing
```bash
# Install Redis locally (Windows)
# Download from: https://github.com/microsoftarchive/redis/releases

# Or use Docker
docker run -d -p 6379:6379 redis:alpine

# Update backend/.env
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD= (leave empty for local)

# Start backend
cd backend
npm run dev
```

### Check Logs
Look for these messages in your backend logs:
```
✅ Redis: Connected and ready
🔐 Rate Limiting: Redis (Distributed)
✅ Socket.io: Redis adapter enabled (Multi-server support)
```

---

## Free Tier Limits

| Provider | Storage | Connections | Bandwidth | Cost |
|----------|---------|-------------|-----------|------|
| **Upstash** | 10,000 commands/day | Unlimited | Unlimited | FREE |
| **Redis Cloud** | 30MB | 30 | 30MB/day | FREE |
| **Render** | 25MB | 25 | Unlimited | $7/month |

**Recommendation**: Start with **Upstash** (best free tier)

---

## When Do You Need Redis?

| Users | Redis Needed? | Why |
|-------|---------------|-----|
| 0 - 10K | ❌ No | Single server handles it |
| 10K - 50K | ⚠️ Optional | Improves performance |
| 50K+ | ✅ Required | Multiple servers need coordination |
| 500K+ | ✅ Required | Essential for distributed rate limiting |

---

## Performance Impact

### Without Redis (Single Server)
- Rate limiting: In-memory (lost on restart)
- Socket.io: Single server only
- Max users: ~50K concurrent

### With Redis (Multi-Server)
- Rate limiting: Distributed across all servers
- Socket.io: Works across multiple servers
- Max users: 500K+ concurrent
- Horizontal scaling: Add more servers as needed

---

## Troubleshooting

### Redis Connection Failed
```
❌ Redis Error: connect ECONNREFUSED
```
**Solution**: Check REDIS_HOST, REDIS_PORT, REDIS_PASSWORD are correct

### Rate Limiting Not Working
```
🔐 Rate Limiting: Memory (Single Server)
```
**Solution**: Redis not connected. Check environment variables.

### Socket.io Not Scaling
```
⚠️ Socket.io: Running in single-server mode (no Redis)
```
**Solution**: Add Redis configuration and redeploy.

---

## Next Steps After Redis Setup

1. ✅ Redis connected
2. Deploy multiple backend instances (3-5 servers)
3. Add load balancer (Nginx or AWS ALB)
4. Monitor with New Relic/Datadog
5. Scale to 500K+ users! 🚀

---

## Support

- Upstash Docs: https://docs.upstash.com/redis
- Redis Cloud Docs: https://docs.redis.com/latest/
- Render Redis: https://render.com/docs/redis

**Need help?** Check the logs for specific error messages.
