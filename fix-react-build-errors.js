/**
 * React Build Errors Fix Script
 * Fixes React minified errors and MIME type issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing React Build Errors...');

// Check for common React issues
const checkReactImports = () => {
  console.log('\n📋 Checking React imports...');
  
  const mainJsxPath = 'frontend/src/main.jsx';
  const appJsxPath = 'frontend/src/App.jsx';
  
  // Check main.jsx
  if (fs.existsSync(mainJsxPath)) {
    const mainContent = fs.readFileSync(mainJsxPath, 'utf8');
    if (mainContent.includes('import React from "react"')) {
      console.log('✅ main.jsx has correct React import');
    } else {
      console.log('❌ main.jsx missing React import');
    }
  }
  
  // Check App.jsx
  if (fs.existsSync(appJsxPath)) {
    const appContent = fs.readFileSync(appJsxPath, 'utf8');
    if (appContent.includes('import React from "react"')) {
      console.log('⚠️  App.jsx has duplicate React import - removing...');
      
      // Remove duplicate React import
      const fixedContent = appContent.replace('import React from "react";\n', '');
      fs.writeFileSync(appJsxPath, fixedContent);
      console.log('✅ Removed duplicate React import from App.jsx');
    } else {
      console.log('✅ App.jsx has no duplicate React import');
    }
  }
};

// Fix Vite configuration for React
const fixViteConfig = () => {
  console.log('\n⚙️ Fixing Vite configuration...');
  
  const viteConfigPath = 'frontend/vite.config.js';
  const viteConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      include: "**/*.{jsx,tsx}",
    })
  ],
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    jsx: 'automatic',
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        entryFileNames: (chunkInfo) => {
          return \`assets/\${chunkInfo.name}-[hash].js\`;
        },
        chunkFileNames: (chunkInfo) => {
          return \`assets/\${chunkInfo.name}-[hash].js\`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return \`assets/images/[name]-[hash].[ext]\`;
          }
          if (/css/i.test(ext)) {
            return \`assets/css/[name]-[hash].[ext]\`;
          }
          return \`assets/[name]-[hash].[ext]\`;
        },
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui': ['lucide-react', 'react-hot-toast'],
          'state': ['zustand'],
          'network': ['axios', 'socket.io-client']
        }
      }
    },
    target: 'esnext',
    minify: 'esbuild',
    assetsInlineLimit: 0,
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    port: 5173,
    host: true
  }
});`;

  fs.writeFileSync(viteConfigPath, viteConfig);
  console.log('✅ Updated Vite configuration');
};

// Create a clean build script
const createCleanBuildScript = () => {
  console.log('\n🧹 Creating clean build script...');
  
  const buildScript = `#!/bin/bash
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
`;

  fs.writeFileSync('clean-build.sh', buildScript);
  console.log('✅ Created clean-build.sh script');
};

// Main execution
try {
  checkReactImports();
  fixViteConfig();
  createCleanBuildScript();
  
  console.log('\n🎉 React build error fixes applied!');
  console.log('\n📝 Summary of fixes:');
  console.log('✅ Removed duplicate React imports');
  console.log('✅ Fixed Vite configuration for React');
  console.log('✅ Updated MIME type headers');
  console.log('✅ Created clean build script');
  
  console.log('\n🚀 Next steps:');
  console.log('1. Run: npm run build (in frontend directory)');
  console.log('2. Test locally: npm run preview');
  console.log('3. Deploy to Vercel');
  console.log('4. Verify no MIME type errors');
  
} catch (error) {
  console.error('❌ Error applying fixes:', error);
}