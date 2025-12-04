# Render Deployment Guide for Z-APP

## 🚀 Deploy Your Full-Stack App to Render

### Prerequisites
- ✅ Code pushed to GitHub: https://github.com/z4fwan/z-app-zn4
- ✅ Render account (sign up at https://render.com)

---

## Step 1: Deploy Backend (Web Service)

### 1.1 Create New Web Service
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select repository: **z4fwan/z-app-zn4**

### 1.2 Configure Backend Service
```
Name: z-app-backend
Region: Choose closest to you (e.g., Oregon, Frankfurt)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
Instance Type: Free (or paid for better performance)
```

### 1.3 Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"** and add these:

```env
MONGODB_URI=mongodb+srv://z4fwan77:OCc9YMeaZxBf5gRi@cluster0.9rlfy9u.mongodb.net/chat_db?retryWrites=true&w=majority&appName=Cluster0
PORT=5001
JWT_SECRET=myscretkey
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=dsol2p21u
CLOUDINARY_API_KEY=455557543893756
CLOUDINARY_API_SECRET=MyvMZN6iRSisWvX5SL-tDMsWCv4
ADMIN_EMAIL=ronaldo@gmail.com
EMAIL_USER=z4fwan77@gmail.com
EMAIL_PASS=adpl whrp rkmg glrv
ADMIN_USERNAME=admin
CLIENT_URL=https://YOUR-FRONTEND-URL.onrender.com
FRONTEND_URL=https://YOUR-FRONTEND-URL.onrender.com
```

**Note:** You'll update `CLIENT_URL` and `FRONTEND_URL` after deploying the frontend.

### 1.4 Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Copy your backend URL (e.g., `https://z-app-backend.onrender.com`)

---

## Step 2: Update Frontend Configuration

### 2.1 Update Production Environment
Update `frontend/.env.production` with your backend URL:

```env
VITE_API_BASE_URL=https://YOUR-BACKEND-URL.onrender.com
VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com
```

### 2.2 Push Changes
```bash
git add frontend/.env.production
git commit -m "Update production API URL"
git push origin main
```

---

## Step 3: Deploy Frontend (Static Site)

### 3.1 Create New Static Site
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Static Site"**
3. Select repository: **z4fwan/z-app-zn4**

### 3.2 Configure Frontend Service
```
Name: z-app-frontend
Branch: main
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

### 3.3 Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**:

```env
VITE_API_BASE_URL=https://YOUR-BACKEND-URL.onrender.com
VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com
```

### 3.4 Deploy
1. Click **"Create Static Site"**
2. Wait for deployment (5-10 minutes)
3. Copy your frontend URL (e.g., `https://z-app-frontend.onrender.com`)

---

## Step 4: Update Backend with Frontend URL

### 4.1 Update Backend Environment Variables
1. Go to your backend service on Render
2. Click **"Environment"** tab
3. Update these variables:
   ```
   CLIENT_URL=https://YOUR-FRONTEND-URL.onrender.com
   FRONTEND_URL=https://YOUR-FRONTEND-URL.onrender.com
   ```
4. Click **"Save Changes"**
5. Backend will automatically redeploy

---

## Step 5: Update CORS in Backend Code

Make sure your backend allows the frontend URL. Check `backend/src/index.js`:

```javascript
const allowedOrigins = [
  FRONTEND_URL,
  "https://YOUR-FRONTEND-URL.onrender.com",
  "http://localhost:5173",
];
```

If you need to update this, push the changes:
```bash
git add backend/src/index.js
git commit -m "Update CORS for production"
git push origin main
```

---

## Step 6: Test Your Deployment

### 6.1 Test Backend
Visit: `https://YOUR-BACKEND-URL.onrender.com`

You should see:
```json
{
  "message": "API is running",
  "status": "production"
}
```

### 6.2 Test Frontend
1. Visit: `https://YOUR-FRONTEND-URL.onrender.com`
2. Create a test account
3. Try logging in
4. Test messaging
5. Test video calls

---

## 🔧 Troubleshooting

### Issue: Backend not connecting to MongoDB
**Solution:**
1. Check MongoDB Atlas whitelist (allow all IPs: 0.0.0.0/0)
2. Verify MONGODB_URI in environment variables
3. Check backend logs in Render dashboard

### Issue: Frontend can't connect to backend
**Solution:**
1. Verify VITE_API_URL is correct
2. Check CORS settings in backend
3. Check browser console for errors
4. Verify backend is running (check Render dashboard)

### Issue: Socket.IO not connecting
**Solution:**
1. Ensure backend URL is correct in frontend
2. Check that backend allows WebSocket connections
3. Verify CORS includes your frontend URL
4. Check Render logs for connection errors

### Issue: Video calls not working
**Solution:**
1. Ensure HTTPS is enabled (Render provides this automatically)
2. Check browser permissions for camera/microphone
3. Verify STUN servers are accessible
4. Check browser console for WebRTC errors

### Issue: "Service Unavailable" on Render
**Solution:**
1. Free tier services sleep after 15 minutes of inactivity
2. First request will wake it up (takes 30-60 seconds)
3. Consider upgrading to paid tier for always-on service

---

## 📊 Monitoring Your App

### Render Dashboard
- View logs: Click on service → "Logs" tab
- Monitor metrics: Click on service → "Metrics" tab
- Check events: Click on service → "Events" tab

### Important Metrics to Watch
- Response time
- Error rate
- Memory usage
- CPU usage

---

## 🔒 Security Checklist

- [ ] MongoDB Atlas IP whitelist configured
- [ ] Environment variables set correctly
- [ ] JWT_SECRET is secure (change from default)
- [ ] CORS configured properly
- [ ] HTTPS enabled (automatic on Render)
- [ ] Sensitive data not in code (use env vars)

---

## 💰 Cost Considerations

### Free Tier Limitations
- Backend: 750 hours/month (sleeps after 15 min inactivity)
- Frontend: Unlimited bandwidth
- Both: Services spin down after inactivity

### Upgrade Recommendations
For production use, consider:
- **Starter Plan ($7/month):** Always-on, no sleep
- **Standard Plan ($25/month):** Better performance, more resources

---

## 🚀 Going Live Checklist

- [ ] Backend deployed and running
- [ ] Frontend deployed and running
- [ ] Environment variables configured
- [ ] CORS configured correctly
- [ ] MongoDB connection working
- [ ] User registration working
- [ ] Login/logout working
- [ ] Messaging working
- [ ] Video calls working
- [ ] Admin dashboard accessible
- [ ] Email notifications working
- [ ] Custom domain configured (optional)

---

## 📝 Post-Deployment

### Custom Domain (Optional)
1. Go to your static site on Render
2. Click "Settings" → "Custom Domain"
3. Add your domain
4. Update DNS records as instructed

### SSL Certificate
- Render provides free SSL certificates automatically
- No configuration needed

### Monitoring
- Set up uptime monitoring (e.g., UptimeRobot)
- Configure error tracking (e.g., Sentry)
- Set up analytics (e.g., Google Analytics)

---

## 🎉 Success!

Your Z-APP is now live! Share your URLs:
- **Frontend:** https://YOUR-FRONTEND-URL.onrender.com
- **Backend:** https://YOUR-BACKEND-URL.onrender.com

---

## 📞 Need Help?

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Your project docs: Check the other .md files in your repo

**Happy Deploying! 🚀**
