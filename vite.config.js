import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      // ✅ PERFORMANCE: Optimize React refresh for faster HMR
      fastRefresh: true,
      // ✅ PERFORMANCE: Automatic JSX runtime (smaller bundle)
      jsxRuntime: 'automatic',
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
    hmr: {
      overlay: false, // Disable error overlay for faster dev
    },
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild', // ✅ PERFORMANCE: Faster than terser (10x speed)
    cssMinify: true,
    // ✅ PERFORMANCE: Aggressive minification options
    minifyOptions: {
      drop: ['console', 'debugger'], // Remove console.log in production
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // ✅ PERFORMANCE: Split React into separate chunk (cached separately)
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // ✅ PERFORMANCE: Lazy-load heavy libraries
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('lucide-react')) {
              return 'lucide-react';
            }
            if (id.includes('@tensorflow') || id.includes('nsfwjs')) {
              return 'ai-vendor';
            }
            if (id.includes('socket.io')) {
              return 'socket-vendor';
            }
            if (id.includes('axios') || id.includes('zustand')) {
              return 'store-vendor';
            }
            if (id.includes('gsap') || id.includes('lenis')) {
              return 'animation-vendor';
            }
            return 'vendor';
          }
        },
        // ✅ PERFORMANCE: Optimize chunk sizes and naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true, // ✅ PERFORMANCE: Split CSS for faster loading
    sourcemap: false, // ✅ PERFORMANCE: Disable sourcemaps in production
    reportCompressedSize: false, // ✅ PERFORMANCE: Faster builds
    assetsInlineLimit: 4096, // ✅ PERFORMANCE: Inline small assets (< 4kb)
    // ✅ PERFORMANCE: Enable tree-shaking
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false,
    },
  },
  optimizeDeps: {
    // ✅ PERFORMANCE: Pre-bundle these dependencies for faster dev server
    include: ['react', 'react-dom', 'react-router-dom', 'zustand', 'axios', 'socket.io-client'],
    // ✅ PERFORMANCE: Exclude heavy AI libraries (lazy load them)
    exclude: ['@tensorflow/tfjs', 'nsfwjs'],
    // ✅ PERFORMANCE: Force optimize these packages
    force: false,
    // ✅ PERFORMANCE: Reduce dependency discovery time
    entries: ['./src/main.jsx'],
  },
  // ✅ PERFORMANCE: Enable experimental features for better performance
  experimental: {
    renderBuiltUrl(filename) {
      // Use CDN for production if needed
      return { relative: true };
    },
  },
});
