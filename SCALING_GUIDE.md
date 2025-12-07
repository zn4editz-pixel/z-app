# Scaling Guide: 500K+ Concurrent Users

## Current Rate Limits (Updated)

| Endpoint | Limit | Window | Notes |
|----------|-------|--------|-------|
| General API | 1000 req | 15 min | ~1 req/sec per user |
| Auth (Login/Signup) | 20 attempts | 15 min | Prevents brute force |
| Messages | 100 msg | 1 min | Allows fast conversations |
| File Uploads | 50 uploads | 15 min | Images, voice, etc. |
| Friend Requests | 50 requests | 1 hour | Generous for active users |
| Reports | 10 reports | 1 hour | Prevents abuse |

## Architecture for 500K Users

### 1. **Database Optimization**

#### MongoDB Atlas Configuration
```javascript
// Recommended MongoDB Atlas Tier: M30 or higher
// - 8GB RAM
// - 2 vCPUs
// - Auto-scaling enabled
// - Read replicas for load distribution

// Connection pooling
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 100, // Increase pool size
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

#### Indexing Strategy
```javascript
// Add these indexes to your models:
User: email, username, isOnline
Message: senderId, receiverId, createdAt
Friend: userId, friendId, status
```

### 2. **Redis for Distributed Rate Limiting**

#### Install Redis
```bash
npm install rate-limit-redis ioredis
```

#### Redis Configuration
```javascript
// backend/src/lib/redis.js
import Redis from 'ioredis';

export const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.on('connect', () => console.log('✅ Redis connected'));
```

#### Update Rate Limiters
```javascript
// backend/src/middleware/security.js
import { RedisStore } from 'rate-limit-redis';
import { redisClient } from '../lib/redis.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:',
  }),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
```

### 3. **Load Balancing**

#### Horizontal Scaling
- Deploy multiple backend instances (3-5 servers minimum)
- Use Nginx or AWS ALB for load balancing
- Enable sticky sessions for Socket.io

#### Nginx Configuration
```nginx
upstream backend {
    ip_hash; # Sticky sessions for Socket.io
    server backend1.example.com:5001;
    server backend2.example.com:5001;
    server backend3.example.com:5001;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. **Socket.io Scaling**

#### Redis Adapter for Socket.io
```bash
npm install @socket.io/redis-adapter
```

```javascript
// backend/src/lib/socket.js
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

### 5. **CDN & Caching**

#### Cloudflare Setup
- Enable Cloudflare CDN for frontend assets
- Use Cloudflare's DDoS protection
- Enable rate limiting at CDN level

#### Cache Strategy
```javascript
// Cache user profiles, friend lists
// Use Redis with TTL
const cacheUser = async (userId, userData) => {
  await redisClient.setex(`user:${userId}`, 300, JSON.stringify(userData));
};
```

### 6. **Monitoring & Alerts**

#### Recommended Tools
- **Application Monitoring**: New Relic, Datadog, or PM2 Plus
- **Database Monitoring**: MongoDB Atlas built-in monitoring
- **Error Tracking**: Sentry
- **Uptime Monitoring**: UptimeRobot, Pingdom

#### Key Metrics to Monitor
- Request rate (req/sec)
- Response time (avg, p95, p99)
- Error rate (%)
- Database query time
- Memory usage
- CPU usage
- Active WebSocket connections

### 7. **Cost Estimation for 500K Users**

#### Infrastructure Costs (Monthly)
| Service | Tier | Cost |
|---------|------|------|
| MongoDB Atlas | M30 | $300 |
| Redis Cloud | 5GB | $50 |
| Backend Servers (3x) | 4GB RAM | $150 |
| CDN (Cloudflare) | Pro | $20 |
| Monitoring | Basic | $50 |
| **Total** | | **~$570/month** |

#### Free Tier Alternative (Up to 10K users)
- Render Free Tier: Backend + Frontend
- MongoDB Atlas Free: 512MB
- Redis Free Tier: 30MB
- **Total: $0/month**

### 8. **Performance Optimization**

#### Backend Optimizations
```javascript
// 1. Enable compression
import compression from 'compression';
app.use(compression());

// 2. Use connection pooling
// 3. Implement caching
// 4. Optimize database queries
// 5. Use CDN for static assets
```

#### Database Query Optimization
```javascript
// Bad: N+1 query problem
const users = await User.find();
for (const user of users) {
  const messages = await Message.find({ userId: user._id });
}

// Good: Use aggregation
const usersWithMessages = await User.aggregate([
  {
    $lookup: {
      from: 'messages',
      localField: '_id',
      foreignField: 'userId',
      as: 'messages'
    }
  }
]);
```

### 9. **Security at Scale**

#### Additional Security Measures
- Implement CAPTCHA for auth endpoints (hCaptcha, reCAPTCHA)
- Use JWT with short expiration (15 min) + refresh tokens
- Enable 2FA for admin accounts
- Regular security audits
- DDoS protection via Cloudflare

### 10. **Deployment Strategy**

#### Blue-Green Deployment
```bash
# Deploy new version to "green" environment
# Test thoroughly
# Switch traffic from "blue" to "green"
# Keep "blue" as rollback option
```

#### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
      - name: Deploy to production
        run: ./deploy.sh
```

## Quick Start: Immediate Improvements

1. **Push current changes**
   ```bash
   git push origin main
   ```

2. **Set environment variables in Render**
   - `VITE_API_BASE_URL=https://z-app-backend.onrender.com`

3. **Monitor performance**
   - Check Render metrics dashboard
   - Watch for rate limit hits

4. **Plan for Redis** (when you hit 10K+ users)
   - Sign up for Redis Cloud free tier
   - Implement distributed rate limiting

5. **Consider upgrading** (when you hit 50K+ users)
   - MongoDB Atlas: M10 tier ($57/month)
   - Render: Standard plan ($25/month per service)
   - Redis Cloud: 1GB plan ($15/month)

## Support & Resources

- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- Redis Cloud: https://redis.com/try-free/
- Render Docs: https://render.com/docs
- Socket.io Scaling: https://socket.io/docs/v4/using-multiple-nodes/

---

**Current Status**: Optimized for up to 50K concurrent users on free tier
**Next Step**: Add Redis when you reach 10K+ active users
