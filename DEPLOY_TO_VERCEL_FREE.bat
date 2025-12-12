@echo off
echo ========================================
echo ▲ DEPLOYING TO VERCEL - 100%% FREE
echo Frontend Hosting with Global CDN
echo ========================================

echo.
echo 💰 Vercel FREE Tier Benefits:
echo   ✅ Unlimited static sites
echo   ✅ 100GB bandwidth/month
echo   ✅ Global CDN ^(40+ locations^)
echo   ✅ Custom domains
echo   ✅ Auto-deployments
echo   ✅ SSL certificates
echo   ✅ Serverless functions
echo   ✅ Analytics included
echo.

echo 📋 Step 1: Vercel Account Setup
echo ========================================

echo 🌐 Please follow these steps:
echo.
echo 1. Go to https://vercel.com
echo 2. Sign up with GitHub ^(FREE^)
echo 3. Verify your account
echo 4. Install Vercel CLI: npm i -g vercel
echo.
pause

echo.
echo 📋 Step 2: Project Configuration
echo ========================================

echo 📝 Creating Vercel deployment configuration...

REM Create optimized vercel.json
(
    echo {
    echo   "version": 2,
    echo   "name": "zn4studio-chat-free",
    echo   "framework": "vite",
    echo   "buildCommand": "cd frontend && npm run build",
    echo   "outputDirectory": "frontend/dist",
    echo   "installCommand": "cd frontend && npm install",
    echo   "devCommand": "cd frontend && npm run dev",
    echo   "routes": [
    echo     {
    echo       "src": "/api/^(.*^)",
    echo       "dest": "https://your-backend.railway.app/api/$1"
    echo     },
    echo     {
    echo       "src": "/socket.io/^(.*^)",
    echo       "dest": "https://your-backend.railway.app/socket.io/$1"
    echo     },
    echo     {
    echo       "src": "/^(.*^)",
    echo       "dest": "/index.html"
    echo     }
    echo   ],
    echo   "headers": [
    echo     {
    echo       "source": "/^(.*^)",
    echo       "headers": [
    echo         {
    echo           "key": "X-Content-Type-Options",
    echo           "value": "nosniff"
    echo         },
    echo         {
    echo           "key": "X-Frame-Options",
    echo           "value": "DENY"
    echo         },
    echo         {
    echo           "key": "X-XSS-Protection",
    echo           "value": "1; mode=block"
    echo         },
    echo         {
    echo           "key": "Referrer-Policy",
    echo           "value": "strict-origin-when-cross-origin"
    echo         }
    echo       ]
    echo     },
    echo     {
    echo       "source": "/static/^(.*^)",
    echo       "headers": [
    echo         {
    echo           "key": "Cache-Control",
    echo           "value": "public, max-age=31536000, immutable"
    echo         }
    echo       ]
    echo     }
    echo   ],
    echo   "rewrites": [
    echo     {
    echo       "source": "/api/^(.*^)",
    echo       "destination": "https://your-backend.railway.app/api/$1"
    echo     }
    echo   ]
    echo }
) > "vercel.json"

REM Update frontend package.json for Vercel
cd frontend
if exist package.json (
    echo 📝 Updating package.json for Vercel...
    
    REM Create backup
    copy package.json package.json.backup
    
    REM Add Vercel build script
    powershell -Command "(Get-Content package.json) -replace '\"build\": \"vite build\"', '\"build\": \"vite build\", \"vercel-build\": \"npm run build\"' | Set-Content package.json"
)
cd ..

REM Create .vercelignore
(
    echo node_modules
    echo .env
    echo .env.local
    echo .env.*.local
    echo backend
    echo *.log
    echo .DS_Store
    echo .vscode
    echo .git
) > ".vercelignore"

echo ✅ Vercel deployment files created

echo.
echo 📋 Step 3: Environment Variables Setup
echo ========================================

echo 📝 Environment variables to add in Vercel dashboard:

echo.
echo VITE_API_URL=https://your-backend.railway.app/api
echo VITE_SOCKET_URL=https://your-backend.railway.app
echo VITE_SUPABASE_URL=^[Your Supabase Project URL^]
echo VITE_SUPABASE_ANON_KEY=^[Your Supabase Anon Key^]
echo VITE_CLOUDINARY_CLOUD_NAME=^[Your Cloudinary Cloud Name^]
echo VITE_CLOUDINARY_UPLOAD_PRESET=^[Your Upload Preset^]
echo VITE_EMAILJS_SERVICE_ID=^[Your EmailJS Service ID^]
echo VITE_EMAILJS_TEMPLATE_ID=^[Your EmailJS Template ID^]
echo VITE_EMAILJS_PUBLIC_KEY=^[Your EmailJS Public Key^]
echo VITE_APP_NAME=ZN4Studio Chat
echo VITE_APP_VERSION=2.0.0
echo VITE_ENVIRONMENT=production

echo.
echo 📋 Step 4: Deployment Instructions
echo ========================================

echo 🚀 Automatic Deployment ^(Recommended^):
echo.
echo 1. In Vercel Dashboard:
echo    - Click "New Project"
echo    - Import from GitHub
echo    - Select your repository
echo    - Framework Preset: Vite
echo    - Root Directory: frontend
echo.
echo 2. Build Settings:
echo    - Build Command: npm run build
echo    - Output Directory: dist
echo    - Install Command: npm install
echo.
echo 3. Environment Variables:
echo    - Add all variables listed above
echo    - Save configuration
echo.
echo 4. Deploy:
echo    - Click "Deploy"
echo    - Monitor build logs
echo    - Get your Vercel URL
echo.

echo 🚀 Manual Deployment ^(Alternative^):
echo.
echo 1. Install Vercel CLI:
echo    npm i -g vercel
echo.
echo 2. Login to Vercel:
echo    vercel login
echo.
echo 3. Deploy:
echo    cd frontend
echo    vercel --prod
echo.

echo 📋 Step 5: Custom Domain ^(Optional - FREE^)
echo ========================================

echo 🌐 To add custom domain ^(FREE^):
echo.
echo 1. In Vercel Dashboard:
echo    - Go to Project Settings ^> Domains
echo    - Add your domain
echo    - Update DNS records as shown
echo.
echo 2. SSL Certificate:
echo    - Automatically provided by Vercel
echo    - Includes wildcard SSL
echo.

echo 📋 Step 6: Performance Optimization ^(FREE^)
echo ========================================

echo ⚡ Vercel automatically provides:
echo.
echo ✅ Global CDN ^(40+ locations^)
echo ✅ Edge caching
echo ✅ Image optimization
echo ✅ Compression ^(Gzip/Brotli^)
echo ✅ HTTP/2 & HTTP/3
echo ✅ Smart bundling
echo ✅ Tree shaking
echo ✅ Code splitting
echo ✅ Prefetching
echo.

echo.
echo ========================================
echo 🎉 VERCEL DEPLOYMENT READY!
echo ========================================

echo.
echo 💰 Cost: $0/month ^(100GB bandwidth FREE^)
echo 🚀 Performance: Global CDN, sub-100ms
echo 🌍 Global: 40+ edge locations
echo 🔒 Security: SSL certificates included
echo 📊 Analytics: Built-in web analytics
echo.
echo 📋 Next Steps:
echo.
echo 1. Complete Vercel deployment
echo 2. Test frontend functionality
echo 3. Update Railway backend CORS settings
echo 4. Test full application flow
echo.
echo 🎯 Your frontend will be live at:
echo https://your-app.vercel.app
echo.
echo 🌐 Global Performance:
echo   - USA: ^<50ms
echo   - Europe: ^<50ms  
echo   - Asia: ^<100ms
echo   - Australia: ^<150ms
echo.
pause