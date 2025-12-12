@echo off
echo 🚀 APPLYING PERFORMANCE OPTIMIZATIONS...
echo.

echo ✅ 1. Installing performance dependencies...
cd frontend
npm install --save-dev @vitejs/plugin-react-swc
cd ../backend
npm install compression helmet express-rate-limit

echo.
echo ✅ 2. Optimizing Vite configuration...
cd ../frontend

echo.
echo ✅ 3. Applying database optimizations...
cd ../backend
echo Applying database indexes...
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyOptimizations() {
  try {
    console.log('📊 Applying database optimizations...');
  