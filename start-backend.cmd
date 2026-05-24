@echo off
cd /d "C:\Users\z4fwa\OneDrive\Pictures\Documents\z-app\backend"
set NODE_ENV=development
set PORT=5001
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/zapp?schema=public
set JWT_SECRET=dev-jwt
set CLIENT_URL=http://localhost:5173
set FRONTEND_URL=http://localhost:5173
node src/index.js
