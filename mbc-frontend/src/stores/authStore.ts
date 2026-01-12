// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { queryClient } from '../queryClient';
import { typedApiClient } from '../services/typedApiClient';
import { handleGlobalError } from '../utils/errorHandling';
import type { AuthUser, LoginCredentials } from '../types/auth';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean }>;
  register: (userData: any) => Promise<{ success: boolean }>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

interface AuthStore extends AuthState, AuthActions { }

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginCredentials): Promise<{ success: boolean }> => {
        set({ isLoading: true, error: null });

        try {
          const response = await typedApiClient.post('auth/login', credentials);
          const { accessToken, user } = response.data;

          set({
            token: accessToken,
            user,
            isAuthenticated: true,
            isLoading: false
          });

          return { success: true };
        } catch (err: any) {
          const enhancedError = handleGlobalError(err, { operation: 'login', credentials: credentials.email });
          set({ isLoading: false, error: enhancedError.userMessage });
          throw new Error(enhancedError.userMessage);
        }
      },

      register: async (userData: any): Promise<{ success: boolean }> => {
        set({ isLoading: true, error: null });

        try {
          await typedApiClient.post('auth/register', userData);
          set({ isLoading: false });
          return { success: true };
        } catch (err: any) {
          const enhancedError = handleGlobalError(err, { operation: 'register', email: userData.email });
          set({ isLoading: false, error: enhancedError.userMessage });
          throw new Error(enhancedError.userMessage);
        }
      },

      logout: (): void => {
        set({ user: null, token: null, isAuthenticated: false, error: null });

        // Clear react-query cache to avoid stale protected data
        try {
          queryClient.clear();
        } catch (e) {
          /* ignore */
        }
      },

      checkAuth: async (): Promise<boolean> => {
        const token = get().token;
        if (!token) {
          set({ user: null, token: null, isAuthenticated: false });
          return false;
        }

        try {
          const response = await typedApiClient.get('auth/me');
          const user = response.data as AuthUser;
          set({ user, isAuthenticated: true, token });
          return true;
        } catch (err: any) {
          // Token invalid/expired - clear
          get().logout();
          return false;
        }
      },

      clearError: (): void => {
        set({ error: null });
      },

      setLoading: (loading: boolean): void => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Configure the typed API client with auth store integration
typedApiClient.updateConfig({
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => {
    useAuthStore.getState().logout();
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  },
});
