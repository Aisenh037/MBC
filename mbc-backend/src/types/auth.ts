// ==============================================
// Authentication & Authorization Types
// ==============================================

import type { UserRole } from '@prisma/client';
import { UserRole as UserRoleEnum } from '@prisma/client';
import type { User } from './database';
import { Request } from 'express';

// ==============================================
// JWT Token Types
// ==============================================

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  institutionId?: string;
  branchId?: string;
  iat: number;
  exp: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ==============================================
// Authentication Context
// ==============================================

export interface AuthenticatedUser extends User {
  // Additional computed fields for authenticated context
  permissions: Permission[];
  isAdmin: boolean;
  isProfessor: boolean;
  isStudent: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface AuthContext {
  user: AuthenticatedUser;
  token: string;
  isAuthenticated: boolean;
}

// ==============================================
// Permission System
// ==============================================

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export type ResourceType = 
  | 'user'
  | 'student' 
  | 'professor'
  | 'course'
  | 'assignment'
  | 'submission'
  | 'attendance'
  | 'notice'
  | 'institution'
  | 'branch'
  | 'analytics'
  | 'system';

export type ActionType = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'list'
  | 'manage';

// ==============================================
// Role-Based Access Control
// ==============================================

export interface RolePermissions {
  [UserRole.admin]: Permission[];
  [UserRole.professor]: Permission[];
  [UserRole.student]: Permission[];
}

// Default permissions for each role
export const DEFAULT_PERMISSIONS: RolePermissions = {
  [UserRoleEnum.admin]: [
    { resource: '*', action: '*' }, // Admin has all permissions
  ],
  [UserRoleEnum.professor]: [
    { resource: 'course', action: 'read' },
    { resource: 'course', action: 'update', conditions: { professorId: 'self' } },
    { resource: 'assignment', action: '*', conditions: { professorId: 'self' } },
    { resource: 'submission', action: 'read', conditions: { courseId: 'assigned' } },
    { resource: 'submission', action: 'update', conditions: { courseId: 'assigned' } },
    { resource: 'attendance', action: '*', conditions: { courseId: 'assigned' } },
    { resource: 'student', action: 'read', conditions: { courseId: 'assigned' } },
    { resource: 'notice', action: 'create' },
    { resource: 'notice', action: 'update', conditions: { authorId: 'self' } },
    { resource: 'analytics', action: 'read', conditions: { courseId: 'assigned' } },
  ],
  [UserRoleEnum.student]: [
    { resource: 'course', action: 'read', conditions: { enrolled: true } },
    { resource: 'assignment', action: 'read', conditions: { enrolled: true } },
    { resource: 'submission', action: '*', conditions: { studentId: 'self' } },
    { resource: 'attendance', action: 'read', conditions: { studentId: 'self' } },
    { resource: 'notice', action: 'read' },
    { resource: 'user', action: 'read', conditions: { userId: 'self' } },
    { resource: 'user', action: 'update', conditions: { userId: 'self' } },
  ],
};

// ==============================================
// Session Management
// ==============================================

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  lastAccessedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

export interface SessionData {
  userId: string;
  email: string;
  role: UserRole;
  institutionId?: string;
  branchId?: string;
  permissions: Permission[];
  lastActivity: Date;
}

// ==============================================
// Password & Security
// ==============================================

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // days
  preventReuse: number; // number of previous passwords to check
}

export interface SecuritySettings {
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  requireEmailVerification: boolean;
  enableTwoFactor: boolean;
}

// ==============================================
// Audit & Logging
// ==============================================

export interface AuditLogEntry {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}