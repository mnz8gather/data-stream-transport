import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/py': {
        target: 'http://localhost:51888',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/py/, ''),
      },
    },
  },
});
