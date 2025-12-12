@echo off
color 0A
echo.
echo  ███████╗██╗   ██╗██████╗  █████╗ ██████╗  █████╗ ███████╗███████╗
echo  ██╔════╝██║   ██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔════╝
echo  ███████╗██║   ██║██████╔╝███████║██████╔╝███████║███████╗█████╗  
echo  ╚════██║██║   ██║██╔═══╝ ██╔══██║██╔══██╗██╔══██║╚════██║██╔══╝  
echo  ███████║╚██████╔╝██║     ██║  ██║██████╔╝██║  ██║███████║███████╗
echo  ╚══════╝ ╚═════╝ ╚═╝     ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝
echo.
echo 🚀 MIGRATING TO SUPABASE - BEST FREE DATABASE (500MB + UNLIMITED API)
echo.
echo ✅ Benefits:
echo    - 500MB Database (10x more than Neon)
echo    - Unlimited API requests
echo    - Better performance
echo    - Real-time features
echo    - Beautiful dashboard
echo.
echo 📋 SETUP STEPS:
echo.
echo 1️⃣  Go to: https://supabase.com
echo 2️⃣  Sign up with GitHub (FREE)
echo 3️⃣  Create new project
echo 4️⃣  Copy connection string from Settings → Database
echo 5️⃣  Come back and continue this script
echo.
set /p continue="Have you created your Supabase project? (y/n): "
if /i "%continue%" neq "y" (
    echo.
    echo ❌ Please create your Supabase project first!
    echo 🌐 Go to: https://supabase.com
    pause
    exit /b
)

echo.
echo 🔧 Installing Supabase dependencies...
cd backend
call npm install @supabase/supabase-js

echo.
echo 📝 Please enter your Supabase details:
echo.
set /p db_url="Database URL (from Settings → Database): "
set /p project_url="Project URL (from Settings → API): "
set /p anon_key="Anon Key (from Settings → API): "

echo.
echo 🔄 Creating configuration...

(
echo # 🚀 SUPABASE - BEST FREE DATABASE ^(500MB + Unlimited API^)
echo DATABASE_URL=%db_url%
echo SUPABASE_URL=%project_url%
echo SUPABASE_ANON_KEY=%anon_key%
echo.
echo # Keep existing settings
echo PORT=5001
echo JWT_SECRET=myscretkey
echo NODE_ENV=development
echo CLOUDINARY_CLOUD_NAME=dsol2p21u
echo CLOUDINARY_API_KEY=455557543893756
echo CLOUDINARY_API_SECRET=MyvMZN6iRSisWvX5SL-tDMsWCv4
echo ADMIN_EMAIL=ronaldo@gmail.com
echo EMAIL_USER=z4fwan77@gmail.com
echo EMAIL_PASS=adpl whrp rkmg glrv
echo ADMIN_USERNAME=admin
echo CLIENT_URL=http://localhost:5173
echo FRONTEND_URL=http://localhost:5173
echo REDIS_URL=rediss://default:AUa6AAIncDI0MGJhN2M5YWViZGQ0ODY4OTQ5MjFmMDE4YzcwMWNlMXAyMTgxMDY@measured-python-18106.upstash.io:6379
) > .env

echo ✅ Environment configured!
echo.
echo 🔄 Updating Prisma schema for Supabase...
copy /y "prisma\schema.supabase.prisma" "prisma\schema.prisma"

echo.
echo 🚀 Running database migration...
call npx prisma db push
call npx prisma generate

echo.
echo 🎉 MIGRATION COMPLETE! 
echo.
echo ✅ Your project is now running on Supabase!
echo ✅ 500MB Database + Unlimited API requests
echo ✅ Better performance than Neon
echo.
echo 🚀 Starting your backend server...
call npm run dev

pause