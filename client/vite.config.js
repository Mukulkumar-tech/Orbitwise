import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: {
    port: 5173,
    // Requests go to a same-origin /api path in dev, so the refresh-token
    // cookie behaves exactly as it will in production behind one domain.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split the heavy, rarely-changing libraries out of the app chunk so a
        // code change does not invalidate 400kb of vendor cache.
        //
        // Recharts is deliberately absent. Naming it here forced it into a chunk
        // the entry HTML then modulepreloaded, so every visitor fetched 123 KB
        // gzipped of charting code for the admin dashboard. Left unnamed, Rollup
        // keeps it inside the lazily-loaded admin chunk that actually imports it.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
