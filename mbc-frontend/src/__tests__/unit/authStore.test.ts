/**
 * Auth Store Unit Tests
 * Comprehensive unit tests for Zustand auth store
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/stores/authStore';
import { testUtils } from '@/test/setup';

// Mock API calls
const mockApiCall = vi.fn();
vi.mock('@/services/typedApiClient', () => ({
  apiClient: {
    post: mockApiCall,
    get: mockApiCall
  }
}));

describe('AuthStore Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useAuthStore.getState().logout();
    localStorage.clear();
  });

  describe('initial state', () => {
    test('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('login', () => {
    test('should successfully login user', async () => {
      const mockUser = testUtils.createMockUser('student');
      const mockToken = 'mock-jwt-token';
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockResponse = testUtils.createMockApiResponse({
        user: mockUser,
        tokens: { accessToken: mockToken, refreshToken: 'refresh-token' }
      });

      mockApiCall.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login(credentials);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', mockToken);
      expect(localStorage.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token');
    });

    test('should handle login failure', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrong-password'
      };

      const mockError = new Error('Invalid credentials');
      mockApiCall.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login(credentials);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Invalid credentials');
    });

    test('should set loading state during login', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockApiCall.mockReturnValue(controlledPromise);

      const { result } = renderHook(() => useAuthStore());

      // Start login
      act(() => {
        result.current.login(credentials);
      });

      // Check loading state
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise(testUtils.createMockApiResponse({
          user: testUtils.createMockUser(),
          tokens: { accessToken: 'token', refreshToken: 'refresh' }
        }));
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    test('should successfully register user', async () => {
      const mockUser = testUtils.createMockUser('student');
      const mockToken = 'mock-jwt-token';
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'student' as const
      };

      const mockResponse = testUtils.createMockApiResponse({
        user: mockUser,
        tokens: { accessToken: mockToken, refreshToken: 'refresh-token' }
      });

      mockApiCall.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register(userData);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
    });

    test('should handle registration failure', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'student' as const
      };

      const mockError = new Error('User already exists');
      mockApiCall.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register(userData);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe('User already exists');
    });
  });

  describe('logout', () => {
    test('should successfully logout user', () => {
      const { result } = renderHook(() => useAuthStore());

      // First set some user data
      act(() => {
        result.current.setUser(testUtils.createMockUser(), 'mock-token');
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('refreshToken', () => {
    test('should successfully refresh token', async () => {
      const newToken = 'new-access-token';
      const mockResponse = testUtils.createMockApiResponse({
        accessToken: newToken
      });

      mockApiCall.mockResolvedValue(mockResponse);
      localStorage.getItem = vi.fn().mockReturnValue('refresh-token');

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(result.current.token).toBe(newToken);
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', newToken);
    });

    test('should handle refresh token failure', async () => {
      const mockError = new Error('Invalid refresh token');
      mockApiCall.mockRejectedValue(mockError);
      localStorage.getItem = vi.fn().mockReturnValue('invalid-refresh-token');

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('initializeAuth', () => {
    test('should initialize auth from localStorage', async () => {
      const mockUser = testUtils.createMockUser();
      const mockToken = 'stored-token';

      localStorage.getItem = vi.fn()
        .mockReturnValueOnce(mockToken) // auth_token
        .mockReturnValueOnce('refresh-token'); // refresh_token

      const mockResponse = testUtils.createMockApiResponse(mockUser);
      mockApiCall.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(result.current.token).toBe(mockToken);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    test('should handle initialization with invalid token', async () => {
      localStorage.getItem = vi.fn().mockReturnValue('invalid-token');
      mockApiCall.mockRejectedValue(new Error('Invalid token'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    test('should handle initialization with no stored token', async () => {
      localStorage.getItem = vi.fn().mockReturnValue(null);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockApiCall).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    test('should update user data', () => {
      const { result } = renderHook(() => useAuthStore());
      const initialUser = testUtils.createMockUser();
      const updatedData = { name: 'Updated Name' };

      // Set initial user
      act(() => {
        result.current.setUser(initialUser, 'token');
      });

      // Update user
      act(() => {
        result.current.updateUser(updatedData);
      });

      expect(result.current.user).toEqual({
        ...initialUser,
        ...updatedData
      });
    });

    test('should not update user if no user is set', () => {
      const { result } = renderHook(() => useAuthStore());
      const updatedData = { name: 'Updated Name' };

      act(() => {
        result.current.updateUser(updatedData);
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('clearError', () => {
    test('should clear error state', () => {
      const { result } = renderHook(() => useAuthStore());

      // Set error
      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('hasRole', () => {
    test('should return true for matching role', () => {
      const { result } = renderHook(() => useAuthStore());
      const user = testUtils.createMockUser('admin');

      act(() => {
        result.current.setUser(user, 'token');
      });

      expect(result.current.hasRole('admin')).toBe(true);
      expect(result.current.hasRole('student')).toBe(false);
    });

    test('should return false when no user is set', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.hasRole('admin')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    test('should return true if user has any of the specified roles', () => {
      const { result } = renderHook(() => useAuthStore());
      const user = testUtils.createMockUser('professor');

      act(() => {
        result.current.setUser(user, 'token');
      });

      expect(result.current.hasAnyRole(['admin', 'professor'])).toBe(true);
      expect(result.current.hasAnyRole(['admin', 'student'])).toBe(false);
    });

    test('should return false when no user is set', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.hasAnyRole(['admin', 'professor'])).toBe(false);
    });
  });
});