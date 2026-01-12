// src/api/auth.ts
import api from './axios';
import type { LoginCredentials, RegisterData, AuthResponse } from '../types/auth';
import type { ApiResponse, User } from '../types/api';

export const login = (credentials: LoginCredentials): Promise<{ data: AuthResponse }> => 
  api.post('/auth/login', credentials);

export const register = (userData: RegisterData): Promise<{ data: ApiResponse<User> }> => 
  api.post('/auth/register', userData);

export const getProfile = (): Promise<{ data: ApiResponse<User> }> => 
  api.get('/users/me');