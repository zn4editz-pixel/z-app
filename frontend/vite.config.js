import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure _redirects file is copied to dist
    copyPublicDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001', // Backend server
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5001', // for socket.io if used
        ws: true,
      },
    },
  },
});
