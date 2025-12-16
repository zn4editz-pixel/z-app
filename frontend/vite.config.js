import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser", // Better minification
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