import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load environment variables from the correct .env file
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react()],

    // Shortcut for importing files (e.g., "@/components/Button")
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

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
