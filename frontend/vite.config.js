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
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 800,
    assetsInlineLimit: 2048,
    cssCodeSplit: true,
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
          'react-core': ['react', 'react-dom'],
          'react-router': ['react-router-dom'],
          'ui-components': ['lucide-react', 'react-hot-toast'],
          'state-management': ['zustand'],
          'network': ['axios', 'socket.io-client'],
          'animations': ['framer-motion', 'gsap'],
          'utils': ['@studio-freight/lenis', 'lenis'],
          'ai-models': ['@tensorflow/tfjs', 'nsfwjs']
        }
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      }
    },
    target: 'esnext',
    reportCompressedSize: false,
    cssMinify: true,
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
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      'zustand', 
      'axios', 
      'socket.io-client',
      'lucide-react',
      'react-hot-toast'
    ],
    exclude: ['@tensorflow/tfjs', 'nsfwjs']
  }
});