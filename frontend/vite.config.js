import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  esbuild: {
    drop: ['console', 'debugger'], // Remove console.* and debugger in production
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'zustand'],
          animations: ['framer-motion', 'gsap'],
          ui: ['daisyui', 'lucide-react', 'react-hot-toast'],
          utils: ['axios', 'socket.io-client']
        }
      }
    }
  },
});