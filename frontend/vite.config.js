import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      // Fix JSX runtime issues
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      // Ensure proper JSX handling
      include: "**/*.{jsx,tsx}",
    })
  ],
  esbuild: {
    // Drop console logs and debugger in production for security
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    jsx: 'automatic',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    // Fix module resolution and MIME types
    rollupOptions: {
      external: [],
      output: {
        // Ensure all JS files have .js extension (not .jsx)
        entryFileNames: (chunkInfo) => {
          return `assets/${chunkInfo.name}-[hash].js`;
        },
        chunkFileNames: (chunkInfo) => {
          return `assets/${chunkInfo.name}-[hash].js`;
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
        // Simpler chunking to avoid MIME type issues
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui': ['lucide-react', 'react-hot-toast'],
          'state': ['zustand'],
          'network': ['axios', 'socket.io-client']
        }
      }
    },
    // Ensure proper module format
    target: 'esnext',
    minify: 'esbuild',
    // Force proper file extensions
    assetsInlineLimit: 0,
  },
  // Fix module resolution
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  // Fix server configuration
  server: {
    port: 5173,
    host: true
  }
});