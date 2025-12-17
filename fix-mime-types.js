/**
 * MIME Type Fix Script
 * Fixes the "Expected JavaScript-or-Wasm module script but server responded with MIME type 'text/jsx'" error
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing MIME Type Issues...');

// 1. Update Vercel configuration
const vercelConfig = {
  "version": 2,
  "buildCommand": "cd frontend && npm install && npm run clean && npm run vercel-build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/assets/(.*\\.js)$",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/javascript; charset=utf-8"
        }
      ]
    },
    {
      "source": "/assets/(.*\\.mjs)$",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/javascript; charset=utf-8"
        }
      ]
    },
    {
      "source": "/assets/(.*\\.jsx)$",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/javascript; charset=utf-8"
        }
      ]
    },
    {
      "source": "/assets/(.*\\.ts)$",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/javascript; charset=utf-8"
        }
      ]
    },
    {
      "source": "/assets/(.*\\.tsx)$",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/javascript; charset=utf-8"
        }
      ]
    },
    {
      "source": "/assets/(.*\\.css)$",
      "headers": [
        {
          "key": "Content-Type",
          "value": "text/css; charset=utf-8"
        }
      ]
    },
    {
      "source": "/(.*\\.js)$",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/javascript; charset=utf-8"
        }
      ]
    },
    {
      "source": "/(.*\\.mjs)$",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/javascript; charset=utf-8"
        }
      ]
    },
    {
      "source": "/(.*\\.jsx)$",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/javascript; charset=utf-8"
        }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://z-app-backend.onrender.com wss://z-app-backend.onrender.com https://res.cloudinary.com;"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ],
  "env": {
    "VITE_API_BASE_URL": "https://z-app-backend.onrender.com",
    "VITE_API_URL": "https://z-app-backend.onrender.com",
    "VITE_APP_NAME": "Z-App",
    "VITE_ENVIRONMENT": "production",
    "VITE_BUILD_TIME": "$VERCEL_GIT_COMMIT_SHA"
  }
};

// 2. Update _headers file
const headersContent = `# MIME Type Headers for JavaScript files
/assets/*.js
  Content-Type: application/javascript; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

/assets/*.mjs
  Content-Type: application/javascript; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

/assets/*.jsx
  Content-Type: application/javascript; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Content-Type: application/javascript; charset=utf-8

/*.mjs
  Content-Type: application/javascript; charset=utf-8

/*.jsx
  Content-Type: application/javascript; charset=utf-8

# CSS Files
/assets/*.css
  Content-Type: text/css; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

# Security Headers
/index.html
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

# Global Security
/*
  X-Content-Type-Options: nosniff
`;

// 3. Enhanced Vite config
const viteConfigContent = `import { defineConfig } from "vite";
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

try {
  // Write files
  fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
  console.log('✅ Updated vercel.json with correct MIME types');
  
  fs.writeFileSync('frontend/public/_headers', headersContent);
  console.log('✅ Updated _headers file');
  
  fs.writeFileSync('frontend/vite.config.js', viteConfigContent);
  console.log('✅ Updated vite.config.js');
  
  console.log('\n🎉 MIME Type fixes applied successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Commit and push changes to GitHub');
  console.log('2. Vercel will auto-deploy with correct MIME types');
  console.log('3. Test the application after deployment');
  
} catch (error) {
  console.error('❌ Error applying fixes:', error);
}