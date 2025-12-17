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
    // Don't drop console in production for debugging
    drop: process.env.NODE_ENV === 'production' ? ['debugger'] : [],
    jsx: 'automatic',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    // Fix module resolution
    rollupOptions: {
      external: [],
      output: {
        // Simpler chunking to avoid MIME type issues
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui': ['lucide-react', 'react-hot-toast'],
          'state': ['zustand'],
          'network': ['axios', 'socket.io-client']
        },
        // Ensure proper file extensions
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Fix module format
    target: 'esnext',
    minify: 'esbuild',
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