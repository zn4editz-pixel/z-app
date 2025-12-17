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
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split node_modules into smaller chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion') || id.includes('gsap')) {
              return 'animations';
            }
            if (id.includes('socket.io') || id.includes('axios')) {
              return 'network';
            }
            if (id.includes('lucide-react') || id.includes('react-hot-toast')) {
              return 'ui-components';
            }
            if (id.includes('zustand') || id.includes('react-router')) {
              return 'state-routing';
            }
            return 'vendor';
          }
          
          // Split large application modules
          if (id.includes('/src/pages/')) {
            return 'pages';
          }
          if (id.includes('/src/components/')) {
            return 'components';
          }
          if (id.includes('/src/store/')) {
            return 'stores';
          }
        }
      }
    }
  },
});