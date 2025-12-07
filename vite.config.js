import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
  build: {
    // Optimize build output
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'store-vendor': ['zustand'],
          'ai-vendor': ['@tensorflow/tfjs', 'nsfwjs'],
          // Feature chunks
          'chat': [
            './src/pages/HomePage.jsx',
            './src/components/ChatContainer.jsx',
            './src/components/ChatMessage.jsx',
          ],
          'stranger': ['./src/pages/StrangerChatPage.jsx'],
          'admin': ['./src/pages/AdminDashboard.jsx'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand'],
    exclude: ['@tensorflow/tfjs', 'nsfwjs'], // Load AI libs on demand
  },
});
