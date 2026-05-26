import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.', // Ensure root is the frontend directory
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'admin/admin': resolve(__dirname, 'admin/admin.html'),
        'admin/admin-login': resolve(__dirname, 'admin/admin-login.html'),
        payment: resolve(__dirname, 'payment.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        cars: resolve(__dirname, 'cars.html'),
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5501'
    }
  },
});
