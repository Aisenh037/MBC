import { create } from "zustand";
import { persist } from 'zustand/middleware';
import apiClient from "../services/apiClient";
import { queryClient } from "../queryClient"; // <-- Import from the new file

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (credentials) => {
        // ... (login logic is correct)
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        // This will now work correctly
        queryClient.clear();
      },
      
      checkAuth: async () => {
        // ... (checkAuth logic is correct)
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);