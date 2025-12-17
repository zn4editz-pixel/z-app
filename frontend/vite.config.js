import { defineConfig } from "vite";
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
          const name = chunkInfo.name.replace(/\.jsx?$/, '');
          return `assets/${name}-[hash].js`;
        },
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name.replace(/\.jsx?$/, '');
          return `assets/${name}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash].[ext]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash].[ext]`;
          }
          return `assets/[name]-[hash].[ext]`;
        },
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui': ['lucide-react', 'react-hot-toast'],
          'state': ['zustand'],
          'network': ['axios', 'socket.io-client'],
          'animations': ['framer-motion', 'gsap'],
          'utils': ['@studio-freight/lenis', 'lenis']
        }
      }
    },
    target: 'esnext',
    minify: 'esbuild',
    assetsInlineLimit: 4096, // Inline small assets
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    port: 5173,
    host: true
  },
  // Performance optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand', 'axios', 'socket.io-client']
  }
});