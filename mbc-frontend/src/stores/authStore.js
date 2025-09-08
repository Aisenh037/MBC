// stores/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/apiClient';
import { queryClient } from '../queryClient';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: JSON.parse(localStorage.getItem('auth-user')) || null,
      token: localStorage.getItem('auth-token') || null,
      isAuthenticated: !!localStorage.getItem('auth-token'),

      // Login: call backend, save token and user, update state
      login: async (credentials) => {
        try {
          const res = await apiClient.post('/auth/login', credentials);
          const { token, data: user } = res.data;
          // Save in localStorage and state (persist will also store, but keep these explicit for clarity)
          localStorage.setItem('auth-token', token);
          localStorage.setItem('auth-user', JSON.stringify(user));
          set({ token, user, isAuthenticated: true });
          return { success: true };
        } catch (err) {
          // bubble error so UI can show message
          const message = err.response?.data?.message || err.message || 'Login failed';
          throw new Error(message);
        }
      },

      // Logout: clear storage and in-memory state
      logout: () => {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
        set({ user: null, token: null, isAuthenticated: false });
        // Clear react-query cache to avoid stale protected data
        try { queryClient.clear(); } catch (e) { /* ignore */ }
      },

      // Check auth: validate token by hitting /auth/me
      checkAuth: async () => {
        const token = get().token || localStorage.getItem('auth-token');
        if (!token) {
          set({ user: null, token: null, isAuthenticated: false });
          return false;
        }

        try {
          // apiClient will read token from interceptor (we rely on that)
          const res = await apiClient.get('/auth/me');
          const user = res.data.data;
          localStorage.setItem('auth-user', JSON.stringify(user));
          set({ user, isAuthenticated: true, token });
          return true;
        } catch (err) {
          // Token invalid/expired - clear
          set({ user: null, token: null, isAuthenticated: false });
          localStorage.removeItem('auth-token');
          localStorage.removeItem('auth-user');
          return false;
        }
      },
    }),
    {
      name: 'auth-storage', // persisted key
      // You can optionally use serialize/deserialize to encrypt or transform
    }
  )
);
