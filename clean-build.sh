#!/bin/bash
# Clean Build Script for Z-APP

echo "🧹 Cleaning previous builds..."
rm -rf frontend/dist
rm -rf frontend/node_modules/.vite
rm -rf frontend/.vercel

echo "📦 Installing dependencies..."
cd frontend
npm install

echo "🔧 Building application..."
npm run build

echo "✅ Build complete!"
echo "📁 Output directory: frontend/dist"

# Check for common issues
echo "🔍 Checking build output..."
if [ -d "dist/assets" ]; then
  echo "✅ Assets directory created"
  ls -la dist/assets/ | head -10
else
  echo "❌ Assets directory not found"
fi

if [ -f "dist/index.html" ]; then
  echo "✅ index.html created"
else
  echo "❌ index.html not found"
fi

echo "🎉 Build verification complete!"
