# Z-APP Quick Reference Guide

## 🚀 Quick Commands

### Development
```bash
# Verify setup
verify-setup.bat

# Quick start (installs everything and starts servers)
quick-start.bat

# Manual start
cd backend && npm run dev
cd frontend && npm run dev

# Test system health
node test-system.js
```

### Database
```bash
cd backend

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Open database GUI
npx prisma studio

# Seed database with test users
npm run seed

# Reset database (⚠️ deletes all data)
npx prisma db push --force-reset
```

### Build & Deploy
```bash
# Build frontend
cd frontend && npm run build

# Build everything
cd backend && npm run build && npm run build:frontend

# Start production
cd backend && npm start
```

## 📝 Environment Variables

### backend/.env
```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
REDIS_URL="redis://host:6379"
JWT_SECRET="your-secret"
CLOUDINARY_CLOUD_NAME="name"
CLOUDINARY_API_KEY="key"
CLOUDINARY_API_SECRET="secret"
EMAIL_USER="email@gmail.com"
EMAIL_PASS="app-password"
ADMIN_EMAIL="admin@example.com"
NODE_ENV="development"
PORT=5001
CLIENT_URL="http://localhost:5173"
```

### frontend/.env
```env
VITE_API_URL=http://localhost:5001
```

## 🧪 Testing

### Health Check
```bash
node test-system.js
```

### Manual Testing
1. Open http://localhost:5173
2. Sign up with test account
3. Test messaging
4. Test friend requests
5. Test profile updates

### Test Accounts (after seeding)
- Admin: `ronaldo@gmail.com` / `safwan123`
- Admin: `z4fwan77@gmail.com` / `safwan123`
- Users: Various / `123456`

## 🚀 Deployment

### Railway (Recommended)
1. Push to GitHub
2. Connect Railway to repo
3. Add PostgreSQL database
4. Add Redis (optional)
5. Set environment variables
6. Deploy!

### Render
1. Create Web Service
2. Add PostgreSQL
3. Add Redis (optional)
4. Configure build/start commands
5. Set environment variables
6. Deploy!

## 📊 Database Schema

### Models
- **User** - Auth, profiles, friends
- **Message** - Messages, status, call logs
- **FriendRequest** - Friend management
- **Report** - User reports
- **AdminNotification** - Admin alerts

### Prisma Commands
```bash
# View schema
cat backend/prisma/schema.prisma

# Generate client
npx prisma generate

# Push changes
npx prisma db push

# Create migration
npx prisma migrate dev --name description

# Open GUI
npx prisma studio
```

## 🔧 Troubleshooting

### "Prisma Client not generated"
```bash
cd backend
npx prisma generate
```

### "Database connection failed"
- Check DATABASE_URL format
- Ensure database exists
- Verify network access
- Check SSL mode

### "Redis connection failed"
- Redis is optional
- Check REDIS_URL format
- Verify Redis is running

### "Frontend not loading"
```bash
cd frontend
npm run build
# Check backend/dist folder exists
```

### "Port already in use"
```bash
# Windows
netstat -ano | findstr :5001
taskkill /PID <pid> /F

# Change port in backend/.env
PORT=5002
```

## 📁 Project Structure

```
z-app/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, security
│   │   ├── routes/         # API routes
│   │   ├── lib/            # Prisma, Socket.io, Redis
│   │   ├── seeds/          # Database seeding
│   │   └── index.js        # Main server
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── .env                # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Zustand stores
│   │   └── lib/            # Utilities
│   └── .env                # Environment variables
│
├── docs/
│   └── archive/            # Old documentation
│
├── README.md               # Main docs
├── DEPLOYMENT_GUIDE.md     # Deploy instructions
├── FINAL_SUMMARY.md        # Migration summary
├── test-system.js          # Health check
├── quick-start.bat         # Quick setup
└── verify-setup.bat        # Setup verification
```

## 🔗 Important Files

### Documentation
- `README.md` - Main documentation
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `FINAL_SUMMARY.md` - Migration summary
- `PROJECT_STATUS.md` - Current status
- `QUICK_REFERENCE.md` - This file

### Scripts
- `test-system.js` - System health check
- `quick-start.bat` - Quick development setup
- `verify-setup.bat` - Verify installation

### Configuration
- `backend/prisma/schema.prisma` - Database schema
- `backend/.env` - Backend config
- `frontend/.env` - Frontend config
- `docker-compose.yml` - Docker setup
- `railway.json` - Railway config
- `render.yaml` - Render config

## 📞 Support

### Documentation
- Main: `README.md`
- Deploy: `DEPLOYMENT_GUIDE.md`
- Status: `PROJECT_STATUS.md`
- Summary: `FINAL_SUMMARY.md`

### Tools
- Health Check: `node test-system.js`
- Quick Start: `quick-start.bat`
- Verify Setup: `verify-setup.bat`
- Seed DB: `cd backend && npm run seed`

### Prisma
- Docs: https://www.prisma.io/docs
- Studio: `npx prisma studio`
- Schema: `backend/prisma/schema.prisma`

## 🎯 Common Tasks

### Add New User
```bash
cd backend
npm run seed
# Or manually through Prisma Studio
npx prisma studio
```

### View Database
```bash
cd backend
npx prisma studio
# Opens GUI at http://localhost:5555
```

### Clear All Data
```bash
cd backend
npx prisma db push --force-reset
npm run seed  # Re-seed if needed
```

### Update Schema
1. Edit `backend/prisma/schema.prisma`
2. Run `npx prisma db push`
3. Run `npx prisma generate`
4. Restart server

### Check Logs
```bash
# Development
# Logs appear in terminal

# Production (Railway/Render)
# Check platform dashboard
```

## ✅ Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Redis configured (optional)
- [ ] Cloudinary configured
- [ ] Email service configured
- [ ] `node test-system.js` passes
- [ ] Local testing complete
- [ ] Code pushed to GitHub
- [ ] Production env vars set
- [ ] Database schema pushed
- [ ] Frontend built

## 🎉 Success!

Your Z-APP is ready to go! 🚀

For detailed information, see:
- `README.md` - Complete documentation
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `FINAL_SUMMARY.md` - What was done
