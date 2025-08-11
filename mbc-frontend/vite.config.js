// frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      // ✨ FIX: Simplified proxy. Any request starting with '/api/v1'
      // will be forwarded to your backend server.
      '/api/v1': {
        target: 'http://localhost:5000', // Your local backend address
        changeOrigin: true,
        secure: false,
      },
    },
<<<<<<< HEAD

    server: {
      host: true,  // Allow access from network
      port: 5173,  // Local dev port
      open: true,  // Auto-open browser

      // Redirect API requests to backend
      proxy: {
        '/api/v1': {
          target: env.VITE_API_URL, // Set in .env
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
=======
  },
});
>>>>>>> c806d27 (updated env file)
