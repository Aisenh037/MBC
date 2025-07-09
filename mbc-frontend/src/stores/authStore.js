import { create } from 'zustand';
import axios from 'axios';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  loading: false,
  error: null,

  // Login logic with enhanced error handling
  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axios.post('/api/v1/auth/login', credentials, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });

      const user = data?.user || data;
      localStorage.setItem('user', JSON.stringify(user)); // Save user in localStorage
      set({ user, loading: false });
      return user;
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      set({ loading: false, error: errorMsg });
      throw new Error(errorMsg);
    }
  },

  // Logout logic with added cleanup
  logout: async () => {
    try {
      await axios.post('/api/v1/auth/logout', {}, { withCredentials: true });
    } catch (err) {
      console.error('Logout failed:', err); // Optional logging for debugging
    } finally {
      localStorage.removeItem('user');
      set({ user: null, error: null });
    }
  },

  // Helper function to get error message
  getErrorMessage: (err) => {
    // Check for common error sources
    if (err.response) {
      return err.response?.data?.message || 'Something went wrong. Please try again.';
    }
    if (err.request) {
      return 'Network error. Please check your internet connection.';
    }
    return err.message || 'An unexpected error occurred.';
  },

  // Clear error message when required
  clearError: () => set({ error: null }),

  // Optional: Add method to check if the user is authenticated (useful for session persistence)
  isAuthenticated: () => !!JSON.parse(localStorage.getItem('user')),
}));

