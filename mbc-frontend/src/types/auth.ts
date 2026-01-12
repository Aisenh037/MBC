/**
 * Authentication Types
 * Types related to authentication and authorization
 */

import { UserRole } from './api';

// Authentication User (simplified version for auth state)
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  institutionId?: string;
  branchId?: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

// Login/Register Types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
  };
  institutionId?: string;
  branchId?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Auth Response Types
export interface AuthResponse {
  success: boolean;
  data: AuthUser;
  token: string;
  refreshToken?: string;
  message?: string;
}

export interface TokenResponse {
  token: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface TokenPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  institutionId?: string;
  branchId?: string;
  iat: number;
  exp: number;
}

// Auth Store Types
export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  forgotPassword: (data: ForgotPasswordData) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (data: ResetPasswordData) => Promise<{ success: boolean; message?: string }>;
  changePassword: (data: ChangePasswordData) => Promise<{ success: boolean; message?: string }>;
  refreshAuthToken: () => Promise<boolean>;
  updateProfile: (updates: Partial<AuthUser['profile']>) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
}

export interface AuthStore extends AuthState, AuthActions {}

// Permission Types
export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  conditions?: Record<string, any>;
}

export interface RolePermissions {
  [key: string]: Permission[];
}

// Session Types
export interface SessionInfo {
  id: string;
  userId: string;
  deviceInfo?: {
    userAgent: string;
    ip: string;
    location?: string;
  };
  createdAt: string;
  lastActivity: string;
  isActive: boolean;
}

// OAuth Types (for future use)
export interface OAuthProvider {
  name: string;
  clientId: string;
  redirectUri: string;
  scope: string[];
}

export interface OAuthResponse {
  provider: string;
  code: string;
  state?: string;
}

// Two-Factor Authentication Types (for future use)
export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  token: string;
  code: string;
}

// Password Policy Types
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge?: number; // days
  preventReuse?: number; // number of previous passwords to check
}

// Account Security Types
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  passwordLastChanged: string;
  loginNotifications: boolean;
  sessionTimeout: number; // minutes
  allowedDevices?: string[];
}

// Auth Context Types (for React Context)
export interface AuthContextType extends AuthStore {
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  isOwner: (resourceUserId: string) => boolean;
}

// Route Protection Types
export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermissions?: Permission[];
  fallback?: React.ComponentType;
  redirectTo?: string;
}

// Auth Guard Types
export interface AuthGuardConfig {
  requireAuth: boolean;
  allowedRoles?: UserRole[];
  requiredPermissions?: Permission[];
  redirectTo?: string;
  onUnauthorized?: () => void;
}

// Login Form Types
export interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  loading?: boolean;
  error?: string;
  showRememberMe?: boolean;
  showForgotPassword?: boolean;
  redirectTo?: string;
}

export interface RegisterFormProps {
  onSubmit: (data: RegisterData) => Promise<void>;
  loading?: boolean;
  error?: string;
  availableRoles?: UserRole[];
  requireInstitution?: boolean;
}

// Auth API Types
export interface AuthApiClient {
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  me: () => Promise<{ data: AuthUser }>;
  forgotPassword: (data: ForgotPasswordData) => Promise<{ success: boolean; message: string }>;
  resetPassword: (data: ResetPasswordData) => Promise<{ success: boolean; message: string }>;
  changePassword: (data: ChangePasswordData) => Promise<{ success: boolean; message: string }>;
  refreshToken: (refreshToken: string) => Promise<TokenResponse>;
  verifyEmail: (token: string) => Promise<{ success: boolean; message: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; message: string }>;
}

// Auth Hooks Types
export interface UseAuthReturn extends AuthStore {
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  isOwner: (resourceUserId: string) => boolean;
}

export interface UseLoginReturn {
  login: (credentials: LoginCredentials) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export interface UseRegisterReturn {
  register: (data: RegisterData) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

// Auth Event Types
export interface AuthEvent {
  type: 'login' | 'logout' | 'token_refresh' | 'session_expired' | 'unauthorized';
  timestamp: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface AuthEventHandler {
  (event: AuthEvent): void;
}

// Storage Types
export interface AuthStorage {
  getToken: () => string | null;
  setToken: (token: string) => void;
  removeToken: () => void;
  getRefreshToken: () => string | null;
  setRefreshToken: (token: string) => void;
  removeRefreshToken: () => void;
  getUser: () => AuthUser | null;
  setUser: (user: AuthUser) => void;
  removeUser: () => void;
  clear: () => void;
}