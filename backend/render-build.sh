#!/bin/bash

# RENDER BUILD SCRIPT - SAFE DATABASE HANDLING
echo "🚀 Starting Render build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup schema for production
echo "🔧 Setting up production schema..."
node scripts/setup-schema.js

# Generate Prisma client
echo "⚙️ Generating Prisma client..."
npx prisma generate

# Skip database push in build - let the app handle it at runtime
echo "✅ Build completed successfully!"
echo "⚠️ Database migrations will be handled at runtime"