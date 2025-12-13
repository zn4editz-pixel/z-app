@echo off
echo 🔧 Creating Admin User with Prisma...
echo.

cd backend
node create-admin-with-prisma.js

echo.
echo ✅ Admin setup complete!
echo.
echo 🚀 Next steps:
echo 1. Start the backend: npm run dev
echo 2. Start the frontend: npm run dev (in frontend folder)
echo 3. Login at: http://localhost:5173/login
echo 4. Access admin at: http://localhost:5173/admin
echo.
echo 📧 Admin Credentials:
echo    Email: z4fwan77@gmail.com
echo    Password: admin123
echo.
pause