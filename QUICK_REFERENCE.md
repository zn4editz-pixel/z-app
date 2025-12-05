# Z-App Quick Reference Guide

## 🚀 Quick Start Commands

### Development
```bash
# Install all dependencies
install-all.bat

# Start development servers
fix-and-start.bat

# Build everything
build-all.bat
```

### Testing
```bash
# Pre-deployment checks
pre-deployment-check.bat

# API testing
test-api.bat
```

### Deployment
```bash
# Push to GitHub
push-to-github.bat
```

---

## 📡 API Endpoints

### Health Check
```
GET /health
Response: { status: "ok", timestamp: "...", uptime: 3600 }
```

### Authentication
```
POST /api/auth/signup          - Register new user (Rate limited: 5/15min)
POST /api/auth/login           - Login (Rate limited: 5/15min)
POST /api/auth/logout          - Logout
GET  /api/auth/check           - Check auth status
POST /api/auth/forgot-password - Request password reset (Rate limited: 5/15min)
```

### Messages
```
GET    /api/messages/:userId   - Get messages with user
POST   /api/messages/send/:id  - Send message (Rate limited: 30/min)
PUT    /api/messages/read/:id  - Mark messages as read
POST   /api/messages/reaction/:id - Add reaction
DELETE /api/messages/reaction/:id - Remove reaction
DELETE /api/messages/message/:id  - Delete message
```

### Users
```
GET  /api/users              - Get all users
GET  /api/users/:id          - Get user by ID
PUT  /api/users/profile      - Update profile
```

### Friends
```
GET    /api/friends/requests - Get friend requests
POST   /api/friends/request  - Send friend request (Rate limited: 20/hour)
PUT    /api/friends/accept   - Accept friend request
DELETE /api/friends/reject   - Reject friend request
DELETE /api/friends/:id      - Remove friend
```

### Admin
```
GET    /api/admin/users      - Get all users (Admin only)
PUT    /api/admin/suspend    - Suspend user (Admin only)
PUT    /api/admin/block      - Block user (Admin only)
DELETE /api/admin/user/:id   - Delete user (Admin only)
```

---

## 🔌 Socket Events

### Connection
```javascript
// Client connects
socket.emit("register-user", userId);

// Server responds
socket.on("getOnlineUsers", (userIds) => {});
```

### Private Chat
```javascript
// Send message (handled by HTTP API)
// Receive message
socket.on("newMessage", (message) => {});

// Typing indicators
socket.emit("typing", { receiverId });
socket.emit("stopTyping", { receiverId });
socket.on("typing", ({ senderId }) => {});
socket.on("stopTyping", ({ senderId }) => {});
```

### Private Calls
```javascript
// Initiate call
socket.emit("private:initiate-call", { receiverId, callerInfo, callType });

// Incoming call
socket.on("private:incoming-call", ({ callerId, callerInfo, callType }) => {});

// Accept call
socket.emit("private:call-accepted", { callerId, acceptorInfo });
socket.on("private:call-accepted", ({ acceptorId, acceptorInfo }) => {});

// Reject call
socket.emit("private:reject-call", { callerId, reason });
socket.on("private:call-rejected", ({ rejectorId, reason }) => {});

// End call
socket.emit("private:end-call", { targetUserId });
socket.on("private:call-ended", ({ userId }) => {});

// WebRTC signaling
socket.emit("private:offer", { receiverId, sdp });
socket.emit("private:answer", { callerId, sdp });
socket.emit("private:ice-candidate", { targetUserId, candidate });
```

### Stranger Chat
```javascript
// Join queue
socket.emit("stranger:joinQueue", { userId, nickname, profilePic });

// Waiting/Matched
socket.on("stranger:waiting", () => {});
socket.on("stranger:matched", ({ partnerId, partnerUserId }) => {});

// Chat
socket.emit("stranger:chatMessage", { message });
socket.on("stranger:chatMessage", ({ message }) => {});

// Skip/Disconnect
socket.emit("stranger:skip", {});
socket.on("stranger:disconnected", () => {});

// Friend request
socket.emit("stranger:addFriend", {});
socket.on("stranger:friendRequest", ({ userData }) => {});

// Report
socket.emit("stranger:report", { reporterId, reason, description, screenshot });
```

---

## 🔐 Environment Variables

### Backend (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/chat-app

# Server
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Security
JWT_SECRET=your-secret-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Frontend (.env.production)
```env
VITE_API_BASE_URL=https://your-backend.onrender.com
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## 🛡️ Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 100 requests | 15 minutes |
| Auth (login/signup) | 5 requests | 15 minutes |
| Messages | 30 messages | 1 minute |
| File Uploads | 10 uploads | 15 minutes |
| Friend Requests | 20 requests | 1 hour |
| Reports | 5 reports | 1 hour |

---

## 🎨 Theme Colors

### Primary Colors
- Orange: `#FF6B35` (brand color)
- Dark: `#1A1A1A`
- Light: `#FFFFFF`

### Status Colors
- Success: `#10B981` (green)
- Error: `#EF4444` (red)
- Warning: `#F59E0B` (amber)
- Info: `#3B82F6` (blue)

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) { }

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) { }

/* Desktop */
@media (min-width: 1025px) { }
```

---

## 🔧 Common Issues & Solutions

### Issue: Rate limit exceeded
**Solution:** Wait for the time window to reset or adjust limits in `backend/src/middleware/security.js`

### Issue: Socket not connecting
**Solution:** 
1. Check VITE_API_BASE_URL in .env
2. Verify backend is running
3. Check CORS settings

### Issue: Images not uploading
**Solution:**
1. Verify Cloudinary credentials
2. Check file size (<50MB)
3. Ensure proper content type

### Issue: Messages not delivering
**Solution:**
1. Check socket connection
2. Verify user is online
3. Check message status in database

---

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:5001/health
```

### Check Online Users
```javascript
// In browser console
socket.emit("register-user", "YOUR_USER_ID");
socket.on("getOnlineUsers", console.log);
```

### Check Rate Limits
```bash
# Headers show rate limit info
curl -I http://localhost:5001/api/auth/login
# Look for: RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
```

---

## 🐛 Debugging

### Backend Logs
```bash
# In backend terminal
# Look for:
# ✅ Success messages
# ❌ Error messages
# 📞 Call events
# 💬 Message events
```

### Frontend Console
```javascript
// Enable debug mode
localStorage.setItem('debug', 'true');

// Check socket connection
console.log(socket.connected);

// Check auth state
console.log(useAuthStore.getState());
```

### Database Queries
```javascript
// In MongoDB shell
use chat_db

// Check users
db.users.find().pretty()

// Check messages
db.messages.find().sort({createdAt: -1}).limit(10).pretty()

// Check online status
db.users.find({isOnline: true}).count()
```

---

## 🚀 Performance Tips

### Frontend
1. Use React DevTools Profiler
2. Check Network tab for slow requests
3. Monitor bundle size
4. Use Lighthouse for audits

### Backend
1. Monitor response times
2. Check database query performance
3. Watch memory usage
4. Monitor socket connections

---

## 📚 Documentation Files

- `README.md` - Project overview
- `PRODUCTION_READINESS_CHECKLIST.md` - Deployment checklist
- `SECURITY_IMPROVEMENTS.md` - Security details
- `OPTIMIZATION_GUIDE.md` - Performance optimization
- `COMPREHENSIVE_IMPROVEMENTS_SUMMARY.md` - All changes
- `RENDER_DEPLOYMENT_GUIDE.md` - Deployment instructions
- `QUICK_START_TESTING.md` - Testing guide
- `FEATURE_MESSAGE_INTERACTIONS.md` - Message features
- `AI_CONTENT_MODERATION.md` - Moderation system

---

## 🆘 Emergency Procedures

### Server Down
1. Check /health endpoint
2. Review error logs
3. Verify database connection
4. Restart server
5. Check environment variables

### High Error Rate
1. Check error logs
2. Review recent deployments
3. Check rate limit violations
4. Verify external services (Cloudinary, MongoDB)

### Performance Issues
1. Check database indexes
2. Monitor memory usage
3. Review slow queries
4. Check socket connections
5. Consider scaling

---

## 📞 Support

### Resources
- GitHub Issues: Report bugs
- Documentation: Check guides
- Logs: Review error messages
- Community: Ask questions

### Useful Commands
```bash
# Check Node version
node --version

# Check npm version
npm --version

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

**Last Updated:** December 5, 2024
**Version:** 2.0
