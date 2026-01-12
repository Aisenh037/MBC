/**
 * Auth Service Unit Tests
 * Comprehensive unit tests for authentication service
 */

import { describe, test, expect, beforeEach, vi } from '@jest/globals';
import authService from '@/services/authService';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
vi.mock('@supabase/supabase-js');
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn()
};

(createClient as any).mockReturnValue(mockSupabase);

describe('AuthService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerUser', () => {
    test('should successfully register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'student'
      };

      const hashedPassword = 'hashed_password';
      const mockUser = {
        id: 'user-id',
        email: userData.email,
        name: userData.name,
        role: userData.role
      };

      (bcrypt.hash as any).mockResolvedValue(hashedPassword);
      mockSupabase.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await authService.registerUser(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role
      });
      expect(result).toEqual(mockUser);
    });

    test('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'student'
      };

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key value' }
      });

      await expect(authService.registerUser(userData)).rejects.toThrow();
    });
  });

  describe('loginUser', () => {
    test('should successfully login with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 'user-id',
        email: credentials.email,
        password: 'hashed_password',
        name: 'Test User',
        role: 'student'
      };

      const mockTokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token'
      };

      mockSupabase.single.mockResolvedValue({ data: mockUser, error: null });
      (bcrypt.compare as any).mockResolvedValue(true);
      (jwt.sign as any)
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken);

      const result = await authService.loginUser(credentials);

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('email', credentials.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, mockUser.password);
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role
        },
        tokens: mockTokens
      });
    });

    test('should throw error for invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrong_password'
      };

      const mockUser = {
        id: 'user-id',
        email: credentials.email,
        password: 'hashed_password',
        name: 'Test User',
        role: 'student'
      };

      mockSupabase.single.mockResolvedValue({ data: mockUser, error: null });
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(authService.loginUser(credentials)).rejects.toThrow('Invalid credentials');
    });

    test('should throw error for non-existent user', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'User not found' } });

      await expect(authService.loginUser(credentials)).rejects.toThrow();
    });
  });

  describe('verifyToken', () => {
    test('should successfully verify valid token', async () => {
      const token = 'valid_token';
      const mockPayload = {
        userId: 'user-id',
        email: 'test@example.com',
        role: 'student'
      };

      (jwt.verify as any).mockReturnValue(mockPayload);

      const result = await authService.verifyToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(result).toEqual(mockPayload);
    });

    test('should throw error for invalid token', async () => {
      const token = 'invalid_token';

      (jwt.verify as any).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.verifyToken(token)).rejects.toThrow('Invalid token');
    });
  });

  describe('refreshToken', () => {
    test('should successfully refresh valid refresh token', async () => {
      const refreshToken = 'valid_refresh_token';
      const mockPayload = {
        userId: 'user-id',
        email: 'test@example.com',
        role: 'student'
      };
      const newAccessToken = 'new_access_token';

      (jwt.verify as any).mockReturnValue(mockPayload);
      (jwt.sign as any).mockReturnValue(newAccessToken);

      const result = await authService.refreshToken(refreshToken);

      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, process.env.JWT_REFRESH_SECRET);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockPayload.userId, email: mockPayload.email, role: mockPayload.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );
      expect(result).toEqual({ accessToken: newAccessToken });
    });

    test('should throw error for invalid refresh token', async () => {
      const refreshToken = 'invalid_refresh_token';

      (jwt.verify as any).mockImplementation(() => {
        throw new Error('Invalid refresh token');
      });

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('changePassword', () => {
    test('should successfully change password', async () => {
      const userId = 'user-id';
      const oldPassword = 'old_password';
      const newPassword = 'new_password';
      const hashedNewPassword = 'hashed_new_password';

      const mockUser = {
        id: userId,
        password: 'hashed_old_password'
      };

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockUser, error: null })
        .mockResolvedValueOnce({ data: { id: userId }, error: null });
      
      (bcrypt.compare as any).mockResolvedValue(true);
      (bcrypt.hash as any).mockResolvedValue(hashedNewPassword);

      const result = await authService.changePassword(userId, oldPassword, newPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(oldPassword, mockUser.password);
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(mockSupabase.update).toHaveBeenCalledWith({ password: hashedNewPassword });
      expect(result).toBe(true);
    });

    test('should throw error for incorrect old password', async () => {
      const userId = 'user-id';
      const oldPassword = 'wrong_old_password';
      const newPassword = 'new_password';

      const mockUser = {
        id: userId,
        password: 'hashed_old_password'
      };

      mockSupabase.single.mockResolvedValue({ data: mockUser, error: null });
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(authService.changePassword(userId, oldPassword, newPassword))
        .rejects.toThrow('Current password is incorrect');
    });
  });

  describe('resetPassword', () => {
    test('should successfully initiate password reset', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: 'user-id',
        email: email,
        name: 'Test User'
      };

      mockSupabase.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await authService.resetPassword(email);

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.select).toHaveBeenCalledWith('id, email, name');
      expect(mockSupabase.eq).toHaveBeenCalledWith('email', email);
      expect(result).toBe(true);
    });

    test('should throw error for non-existent email', async () => {
      const email = 'nonexistent@example.com';

      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'User not found' } });

      await expect(authService.resetPassword(email)).rejects.toThrow();
    });
  });
});