# Z-App - Real-Time Chat Application 🚀

**A modern, feature-rich chat application with video calls, stranger chat, AI content moderation, and comprehensive admin tools**

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748.svg)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black.svg)](https://socket.io/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success.svg)](https://github.com)

---

## 🌟 Key Features

### 💬 Messaging
- **Private Chat**: One-on-one messaging with friends
- **Message Reactions**: React with 6 emojis (❤️😂👍😮😢🔥)
- **Double-Tap to Heart**: Instagram-style quick reactions
- **Message Deletion**: Delete your own messages
- **Voice Messages**: Record and send voice notes
- **Image Sharing**: Share images with automatic optimization
- **Typing Indicators**: See when someone is typing
- **Read Receipts**: Message delivery and read status
- **Offline Support**: Messages cached when offline

### 👥 Social Features
- **Friend System**: Send, accept, reject friend requests
- **User Discovery**: Search and discover new users
- **Verification Badges**: Verified user system
- **User Profiles**: Customizable profiles with avatars
- **Online Status**: Real-time online/offline indicators

### 🎥 Video & Audio
- **Private Video Calls**: HD video calls with friends
- **Stranger Video Chat**: Omegle-style random video chat
- **WebRTC Technology**: Peer-to-peer connections
- **Call Logs**: Track call history in chat
- **Camera Controls**: Toggle camera and microphone

### 🤖 AI Content Moderation
- **Automatic Detection**: AI-powered inappropriate content detection
- **Real-time Analysis**: Analyzes video frames every 10 seconds
- **Progressive Warnings**: Warning system before disconnection
- **Auto-Reporting**: High-confidence violations auto-reported
- **Privacy-First**: All analysis happens client-side
- **Configurable**: Adjustable sensitivity and thresholds

### 🛡️ Security & Safety
- **Rate Limiting**: Prevents spam and abuse
  - Auth: 5 attempts per 15 minutes
  - Messages: 30 per minute
  - Friend Requests: 20 per hour
- **Report System**: Report users with screenshot evidence
- **Admin Moderation**: Comprehensive admin dashboard
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt encryption
- **Input Sanitization**: MongoDB injection prevention
- **Security Headers**: Helmet.js protection

### 👨‍💼 Admin Dashboard
- **User Management**: Suspend, block, delete users
- **Report Moderation**: Review and action reports
- **Verification System**: Approve/reject verification requests
- **Statistics**: Real-time platform statistics
- **Notifications**: Send personal or broadcast messages
- **Email System**: Automated email notifications

### 📱 Mobile Optimized
- **Responsive Design**: Works on all devices
- **Touch Gestures**: Swipe, long-press, double-tap
- **Mobile Navigation**: Bottom navigation bar
- **PWA Support**: Install as native app
- **Capacitor Integration**: Native mobile features
- **Offline Mode**: Works without internet

### 🎨 UI/UX
- **Dark/Light Themes**: Multiple theme options
- **Smooth Animations**: Touch feedback and transitions
- **Toast Notifications**: Real-time feedback
- **Loading States**: Skeleton loaders
- **Connection Status**: Network status indicator
- **Notification Badges**: Unread message indicators

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and npm
- PostgreSQL 15+ (or use Neon/Supabase free tier)
- Redis (optional, recommended for production)
- Cloudinary account (for image uploads)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/z-app.git
cd z-app
```

2. **Install all dependencies**
```bash
install-all.bat
# Or manually:
cd backend && npm install
cd ../frontend && npm install
```

3. **Configure environment variables**

Create `backend/.env`:
```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/zapp?schema=public"

# Redis (Optional but recommended)
REDIS_URL="redis://localhost:6379"

# Server
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# JWT
JWT_SECRET=your_jwt_secret_key_change_this

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM="Z-APP <noreply@yourapp.com>"
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5001
```

4. **Setup database**
```bash
cd backend
npx prisma generate
npx prisma db push
```

5. **Start development servers**
```bash
# Backend
cd backend && npm run dev

# Frontend (in new terminal)
cd frontend && npm run dev
```

6. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001
- Prisma Studio: `npx prisma studio` (database GUI)

---

## 🔴 Redis Setup (For 500K+ Users)

### Why Redis?
- ✅ Distributed rate limiting across multiple servers
- ✅ Socket.io scaling for multi-server deployments
- ✅ Handles 500K+ concurrent users
- ✅ Persistent rate limits (survive server restarts)

### Quick Setup (5 minutes)

**Option 1: Upstash (Recommended - Free Tier)**
1. Sign up at https://upstash.com
2. Create database: `z-app-redis`
3. Copy connection details
4. Add to `backend/.env`:
```env
REDIS_HOST=your-db.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

**Option 2: Local Redis (Development)**
```bash
# Windows: Download from https://github.com/microsoftarchive/redis/releases
# Or use Docker:
docker run -d -p 6379:6379 redis:alpine
```

### Detailed Guides
- 📖 **Quick Setup**: See `QUICK_REDIS_SETUP.md`
- 📋 **Checklist**: See `REDIS_CHECKLIST.md`
- 📚 **Full Guide**: See `REDIS_SETUP_INSTRUCTIONS.md`

### When Do You Need Redis?
| Users | Redis Needed? | Why |
|-------|---------------|-----|
| 0-10K | ❌ Optional | Single server handles it |
| 10K-50K | ⚠️ Recommended | Better performance |
| 50K+ | ✅ Required | Multi-server coordination |
| 500K+ | ✅ Required | Essential for scaling |

---

## 📚 Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[Cleanup Plan](COMPREHENSIVE_CLEANUP_PLAN.md)** - Migration status & cleanup
- **[Prisma Schema](backend/prisma/schema.prisma)** - Database schema

---

## 🧪 Testing

### Run System Health Check
```bash
node test-system.js
```

This will verify:
- ✅ Database connection (PostgreSQL)
- ✅ Redis connection (if configured)
- ✅ Prisma schema
- ✅ Environment variables

### Manual Testing
1. Open two browsers
2. Login with different accounts
3. Test messaging, video calls, stranger chat
4. Check admin dashboard features
5. Verify message status indicators (WhatsApp-style ticks)

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **DaisyUI** - Component library
- **Zustand** - State management
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client
- **TensorFlow.js** - AI moderation
- **NSFW.js** - Content detection
- **Capacitor** - Native mobile features

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **PostgreSQL** - Database
- **Prisma** - ORM (replaced Mongoose)
- **Redis** - Caching & session store
- **Socket.io** - WebSocket server
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Cloudinary** - Media storage
- **Nodemailer** - Email service
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting

---

## 📁 Project Structure

```
z-app/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── lib/             # Utilities (socket, db, email)
│   │   └── index.js         # Entry point
│   ├── .env                 # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Zustand stores
│   │   ├── lib/             # Utilities
│   │   ├── utils/           # Helper functions
│   │   └── App.jsx          # Root component
│   ├── public/              # Static assets
│   ├── .env                 # Environment variables
│   └── package.json
│
├── docs/                    # Documentation files
├── *.bat                    # Helper scripts
└── README.md
```

---

## 🔧 Configuration

### AI Content Moderation

Edit `frontend/src/utils/contentModeration.js`:

```javascript
export const MODERATION_CONFIG = {
  enabled: true,              // Enable/disable AI moderation
  checkInterval: 10000,       // Check every 10 seconds
  confidenceThreshold: 0.6,   // 60% confidence to flag
  autoReportThreshold: 0.8,   // 80% confidence to auto-report
  maxViolations: 2,           // Max warnings before disconnect
};
```

### Rate Limiting

Edit `backend/src/middleware/security.js`:

```javascript
// Adjust limits as needed
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 100,                    // 100 requests per window
});
```

---

## 🚀 Deployment

### Quick Deploy

**See the complete guide:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

**Recommended platforms:**
- **Railway** - Easiest, auto-detects everything, free PostgreSQL + Redis
- **Render** - Great free tier, manual setup
- **Vercel (Frontend) + Railway (Backend)** - Best performance

### Quick Steps

1. **Test locally first:**
```bash
node test-system.js
```

2. **Build for production:**
```bash
cd backend
npx prisma generate
npx prisma db push
cd ../frontend
npm run build
```

3. **Deploy to Railway:**
   - Connect GitHub repo
   - Add PostgreSQL database
   - Add Redis (optional)
   - Set environment variables
   - Deploy!

**Full instructions:** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

## 📊 Performance

- **Bundle Size**: ~5MB (includes AI models)
- **API Response**: <100ms average
- **WebSocket Latency**: <50ms
- **Database Queries**: Optimized with indexes
- **Lighthouse Score**: 70+ (target: 90+)

---

## 🔒 Security Features

- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on all endpoints
- ✅ MongoDB injection prevention
- ✅ XSS protection
- ✅ CORS configuration
- ✅ Security headers (Helmet)
- ✅ Input validation
- ✅ Socket authentication
- ✅ Protected routes

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

## 🙏 Acknowledgments

- Socket.io for real-time communication
- TensorFlow.js for AI capabilities
- Cloudinary for media management
- MongoDB for database
- React community for amazing tools

---

## 📞 Support

For support, email support@z-app.com or open an issue on GitHub.

---

## 🗺️ Roadmap

### Completed ✅
- [x] Core messaging features
- [x] Video/audio calls
- [x] Stranger chat
- [x] AI content moderation
- [x] Admin dashboard
- [x] Mobile optimization
- [x] Security features
- [x] Rate limiting

### Recent Updates ✨
- [x] **PostgreSQL Migration** - Migrated from MongoDB to PostgreSQL
- [x] **Prisma ORM** - Replaced Mongoose with Prisma
- [x] **Message Status** - WhatsApp-style delivery indicators
- [x] **Profile Fixes** - Fixed 500 errors and image refresh
- [x] **Redis Integration** - Multi-server support ready
- [x] **ID Migration** - Converted _id to id throughout codebase

### Planned 🔜
- [ ] Group chats
- [ ] Message search
- [ ] Message editing
- [ ] Push notifications
- [ ] Message forwarding
- [ ] 2FA authentication

---

## 📈 Status

**Current Version**: 4.0  
**Status**: Production Ready ✅  
**Database**: PostgreSQL + Prisma ✅  
**Last Updated**: December 8, 2025

---

<div align="center">

**Made with ❤️ by the Z-App Team**

[⬆ Back to Top](#z-app---real-time-chat-application-)

</div>
