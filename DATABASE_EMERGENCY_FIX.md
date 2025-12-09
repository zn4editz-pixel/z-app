# 🚨 DATABASE EMERGENCY FIX

## Critical Database Health Issues - IMMEDIATE ACTION REQUIRED

---

## 🔍 Quick Diagnosis

Run these commands to check your database health:

```bash
# Check database size
cd backend
npx prisma studio
# Or check via SQL
```

---

## ⚡ IMMEDIATE FIXES

### 1. Clean Up Old Data (URGENT)

```sql
-- Delete old messages (older than 30 days)
DELETE FROM "Message" 
WHERE "createdAt" < NOW() - INTERVAL '30 days';

-- Delete old reports (resolved, older than 90 days)
DELETE FROM "Report" 
WHERE status IN ('resolved', 'dismissed') 
AND "createdAt" < NOW() - INTERVAL '90 days';

-- Delete orphaned friend requests (older than 30 days)
DELETE FROM "FriendRequest" 
WHERE status = 'rejected' 
AND "createdAt" < NOW() - INTERVAL '30 days';

-- Vacuum database to reclaim space
VACUUM FULL ANALYZE;
```

### 2. Add Database Indexes (Performance Boost)

```sql
-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_message_sender ON "Message"("senderId");
CREATE INDEX IF NOT EXISTS idx_message_receiver ON "Message"("receiverId");
CREATE INDEX IF NOT EXISTS idx_message_created ON "Message"("createdAt");
CREATE INDEX IF NOT EXISTS idx_report_status ON "Report"("status");
CREATE INDEX IF NOT EXISTS idx_report_created ON "Report"("createdAt");
CREATE INDEX IF NOT EXISTS idx_user_online ON "User"("isOnline");
CREATE INDEX IF NOT EXISTS idx_user_created ON "User"("createdAt");
```

### 3. Optimize Prisma Queries

Update your Prisma queries to use pagination and limits:

```javascript
// BAD - Loads all messages
const messages = await prisma.message.findMany();

// GOOD - Loads only recent messages
const messages = await prisma.message.findMany({
  take: 50,
  orderBy: { createdAt: 'desc' }
});
```

---

## 🛠️ Automated Cleanup Script

Create this file: `backend/src/scripts/cleanup-database.js`

```javascript
import prisma from '../lib/prisma.js';

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...');
  
  try {
    // 1. Delete old messages (30+ days)
    const deletedMessages = await prisma.message.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });
    console.log(`✅ Deleted ${deletedMessages.count} old messages`);
    
    // 2. Delete resolved reports (90+ days)
    const deletedReports = await prisma.report.deleteMany({
      where: {
        status: { in: ['resolved', 'dismissed'] },
        createdAt: {
          lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      }
    });
    console.log(`✅ Deleted ${deletedReports.count} old reports`);
    
    // 3. Delete rejected friend requests (30+ days)
    const deletedRequests = await prisma.friendRequest.deleteMany({
      where: {
        status: 'rejected',
        createdAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });
    console.log(`✅ Deleted ${deletedRequests.count} old friend requests`);
    
    // 4. Clear expired suspensions
    const clearedSuspensions = await prisma.user.updateMany({
      where: {
        isSuspended: true,
        suspensionEndTime: {
          lt: new Date()
        }
      },
      data: {
        isSuspended: false,
        suspensionEndTime: null,
        suspensionReason: null
      }
    });
    console.log(`✅ Cleared ${clearedSuspensions.count} expired suspensions`);
    
    console.log('✅ Database cleanup completed!');
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDatabase();
```

Run it:
```bash
cd backend
node src/scripts/cleanup-database.js
```

---

## 📊 Database Optimization Settings

### Update Prisma Connection

In `backend/src/lib/prisma.js`:

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Connection pool optimization
  connection: {
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    }
  }
});

export default prisma;
```

---

## 🔄 Set Up Automatic Cleanup (Cron Job)

### Option 1: Node-Cron (Recommended)

Install:
```bash
cd backend
npm install node-cron
```

Add to `backend/src/index.js`:

```javascript
import cron from 'node-cron';
import { cleanupDatabase } from './scripts/cleanup-database.js';

// Run cleanup every day at 3 AM
cron.schedule('0 3 * * *', async () => {
  console.log('🧹 Running scheduled database cleanup...');
  await cleanupDatabase();
});
```

### Option 2: Manual Cleanup

Run this weekly:
```bash
cd backend
node src/scripts/cleanup-database.js
```

---

## 🚀 Performance Optimizations

### 1. Enable Query Caching

```javascript
// Use Redis for query caching
import { redisClient } from '../lib/redis.js';

async function getCachedUsers() {
  const cacheKey = 'users:all';
  
  // Try cache first
  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Query database
  const users = await prisma.user.findMany();
  
  // Cache for 5 minutes
  await redisClient.setex(cacheKey, 300, JSON.stringify(users));
  
  return users;
}
```

### 2. Limit Query Results

```javascript
// Always use pagination
const messages = await prisma.message.findMany({
  take: 50, // Limit to 50
  skip: page * 50, // Pagination
  orderBy: { createdAt: 'desc' }
});
```

### 3. Use Select to Reduce Data

```javascript
// BAD - Loads all fields
const users = await prisma.user.findMany();

// GOOD - Only load needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    username: true,
    profilePic: true
  }
});
```

---

## 📈 Monitor Database Health

### Add to Server Intelligence Center

The automatic bug detection already checks for:
- Expired suspensions
- High memory usage
- Stale reports

### Manual Checks

```sql
-- Check database size
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as size;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check connection count
SELECT count(*) FROM pg_stat_activity;
```

---

## ⚠️ Neon Database Limits

If you're using Neon (PostgreSQL):

**Free Tier Limits**:
- Storage: 512 MB
- Compute: 100 hours/month
- Connections: 100

**If Over Limit**:
1. Clean up old data (see above)
2. Upgrade to paid plan
3. Or migrate to another provider

---

## 🔧 Quick Fix Commands

Run these NOW:

```bash
# 1. Connect to your database
# (Use your Neon dashboard or psql)

# 2. Run cleanup queries
DELETE FROM "Message" WHERE "createdAt" < NOW() - INTERVAL '30 days';
DELETE FROM "Report" WHERE status IN ('resolved', 'dismissed') AND "createdAt" < NOW() - INTERVAL '90 days';
VACUUM FULL ANALYZE;

# 3. Add indexes
CREATE INDEX IF NOT EXISTS idx_message_created ON "Message"("createdAt");
CREATE INDEX IF NOT EXISTS idx_report_created ON "Report"("createdAt");

# 4. Check size
SELECT pg_size_pretty(pg_database_size(current_database()));
```

---

## 📞 Emergency Contacts

### If Database is Full:

1. **Immediate**: Delete old messages and reports
2. **Short-term**: Set up automatic cleanup
3. **Long-term**: Upgrade database plan or optimize queries

### Neon Dashboard:
- Go to: https://console.neon.tech
- Check: Storage usage
- Action: Upgrade if needed

---

## ✅ Success Checklist

After fixes, verify:
- [ ] Database size reduced
- [ ] Query times improved (< 100ms)
- [ ] No connection errors
- [ ] Server Intelligence shows "healthy"
- [ ] Automatic cleanup scheduled

---

## 🎯 Expected Results

**Before**:
- Database: 400+ MB (Critical)
- Query Time: 200+ ms (Slow)
- Status: Red (Critical)

**After**:
- Database: < 200 MB (Healthy)
- Query Time: < 50 ms (Fast)
- Status: Green (Healthy)

---

**Run the cleanup script NOW and your database will be healthy again!** 🚀
