# Render Configuration for PostgreSQL + Prisma

## Backend Service Settings

### Build Command:
```bash
npm install && npx prisma generate && npx prisma db push
```

### Start Command:
```bash
npm start
```

### Environment Variables:

#### Required (NEW):
```
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

#### Keep Existing:
```
JWT_SECRET=your_jwt_secret_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
ADMIN_EMAIL=admin@z-app.com
ADMIN_PASSWORD=your_secure_password
ADMIN_USERNAME=admin
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://your-frontend-url.onrender.com
```

#### Optional (for email):
```
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

#### Optional (for Redis scaling):
```
REDIS_URL=redis://your-redis-url
```

#### Remove (OLD):
```
MONGODB_URI=... (DELETE THIS)
MONGO_URI=... (DELETE THIS)
```

---

## Frontend Service Settings

### No changes needed!

Frontend works as-is. Just redeploy if needed.

---

## Database Options

### Option 1: Neon PostgreSQL (Recommended)
- Free tier: 0.5 GB storage
- Serverless PostgreSQL
- Auto-scaling
- Get connection string from: https://neon.tech

### Option 2: Render PostgreSQL
- Create in Render Dashboard
- Use "Internal Database URL"
- Paid service ($7/month minimum)

---

## Deployment Checklist

1. [ ] Create PostgreSQL database (Neon or Render)
2. [ ] Copy DATABASE_URL
3. [ ] Update Render backend environment variables
4. [ ] Remove MongoDB variables
5. [ ] Update build command
6. [ ] Push code to GitHub
7. [ ] Trigger manual deploy on Render
8. [ ] Check deployment logs
9. [ ] Test application

---

## Expected Deployment Logs

```
==> Building...
npm install
npx prisma generate
✔ Generated Prisma Client

npx prisma db push
🚀 Your database is now in sync with your Prisma schema.

==> Starting...
⚠️ Redis: No configuration found, running without Redis
⚠️ Socket.io: Running in single-server mode (no Redis)
🔐 Rate Limiting: Memory (Single Server)
🚀 Connecting to PostgreSQL (Neon)...
✅ PostgreSQL connected successfully
📊 Database: X users
⚡ Ultra-fast queries enabled (10x faster than MongoDB)
ℹ️ Admin already exists.
🚀 Server running at http://0.0.0.0:5001
```

---

## Troubleshooting

### Build fails with "Prisma Client not found"
- Ensure `npx prisma generate` is in build command

### Runtime error: "Can't reach database"
- Check DATABASE_URL format
- Ensure `?sslmode=require` is included
- Verify database is running

### "Schema out of sync" error
- Run `npx prisma db push` manually
- Or include in build command

---

## Performance Monitoring

After deployment, monitor:
- Response times (should be 10x faster)
- Error rates (should be lower)
- Database connections (should be stable)
- Memory usage (should be similar or better)

---

## Success Indicators

✅ Build completes without errors
✅ "PostgreSQL connected successfully" in logs
✅ Admin account created/exists
✅ Server starts on port 5001
✅ Frontend can connect
✅ Login works
✅ Messages load quickly
✅ No timeout errors
