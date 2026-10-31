import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/navodaya-clap': {
        target: process.env.NAVODAYA_CLAP_API_URL ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});