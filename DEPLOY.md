# Deployment Guide: Vercel + Railway

## Backend Deployment (Railway)

### 1. Sign up for Railway
- Go to https://railway.app
- Sign up with GitHub

### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your `z-app` repository
- Railway will auto-detect Node.js

### 3. Configure Environment Variables
Add these in Railway dashboard:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
NODE_ENV=production
PORT=5001
```

### 4. Get Your Backend URL
- After deployment, Railway gives you a URL like: `https://z-app-backend-production.up.railway.app`
- Copy this URL (you'll need it for Vercel)

---

## Frontend Deployment (Vercel)

### 1. Sign up for Vercel
- Go to https://vercel.com
- Sign up with GitHub

### 2. Import Project
- Click "Add New" → "Project"
- Import your `z-app` repository
- Vercel auto-detects Vite

### 3. Configure Build Settings
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 4. Add Environment Variable
Add this in Vercel dashboard:
```
VITE_API_BASE_URL=https://your-railway-backend-url.up.railway.app
```
(Use the Railway URL from step 4 above)

### 5. Deploy
- Click "Deploy"
- Vercel will build and deploy in ~2 minutes
- You'll get a URL like: `https://z-app.vercel.app`

---

## Update CORS in Backend

After getting your Vercel URL, update `backend/src/index.js`:

```javascript
const allowedOrigins = [
  "https://z-app.vercel.app", // Your Vercel URL
  "http://localhost:5173",
];
```

Then push to GitHub - Railway will auto-redeploy.

---

## Speed Comparison

**Before (Render):**
- Cold start: 30-60 seconds
- Spins down after 15 min

**After (Vercel + Railway):**
- Frontend: Instant (global CDN)
- Backend: Always on, no cold starts
- Total load time: 1-2 seconds

---

## Costs

- **Vercel**: FREE (100GB bandwidth/month)
- **Railway**: FREE ($5 credit/month = ~500 hours)
- **Total**: $0/month for moderate usage

---

## Quick Deploy Commands

```bash
# Push changes
git add .
git commit -m "Deploy to Vercel + Railway"
git push origin main

# Both platforms auto-deploy on push!
```
