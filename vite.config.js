import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        'admin/admin': resolve(__dirname, 'public/admin/admin.html'),
        'admin/admin-login': resolve(__dirname, 'public/admin/admin-login.html'),
        payment: resolve(__dirname, 'public/payment.html'),
        dashboard: resolve(__dirname, 'public/dashboard.html'),
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
