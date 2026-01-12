/**
 * Authentication Service
 * TypeScript implementation with Supabase integration
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { JWTPayload, TokenPair, AuthenticatedUser } from '@/types/auth';
import { LoginRequest, LoginResponse, RefreshTokenRequest, ForgotPasswordRequest, ResetPasswordRequest } from '@/types/api';
import { UserRole } from '@prisma/client';
import { ErrorResponse } from '@/utils/errorResponse';
import config from '@/config/config';
import logger from '@/utils/logger';

// Initialize Supabase client
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

/**
 * Generate JWT tokens (access and refresh)
 */
const generateTokens = (user: any): TokenPair => {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    role: user.role,
    institutionId: user.institution_id,
    branchId: user.branch_id
  };

  // Ensure secrets are defined
  if (!config.jwt.secret || !config.jwt.refreshSecret) {
    throw new Error('JWT secrets are not configured');
  }

  const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as any);
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn } as any);

  return {
    accessToken,
    refreshToken,
    expiresIn: parseInt(config.jwt.expiresIn.replace(/\D/g, '')) * 60 // Convert to seconds
  };
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Create safe user object (without sensitive data)
 */
const createSafeUser = (user: any): Omit<AuthenticatedUser, 'permissions' | 'isAdmin' | 'isProfessor' | 'isStudent'> => {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    profile: user.profile,
    institutionId: user.institution_id,
    branchId: user.branch_id,
    isActive: user.is_active,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at)
  };
};

/**
 * Authenticate user with email and password
 */
export const authenticateUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const { email, password } = credentials;

  if (!email || !password) {
    throw new ErrorResponse('Email and password are required', 400);
  }

  try {
    // Get user from Supabase with password
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      logger.warn(`Login attempt failed for email: ${email} - User not found`);
      throw new ErrorResponse('Invalid credentials', 401);
    }

    // Check if user is active
    if (!user.is_active) {
      logger.warn(`Login attempt failed for email: ${email} - Account deactivated`);
      throw new ErrorResponse('Account is deactivated', 401);
    }

    // Get password hash from auth.users table (Supabase Auth)
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id);

    if (authError || !authUser.user) {
      logger.error(`Auth user lookup failed for ${email}:`, authError);
      throw new ErrorResponse('Authentication failed', 401);
    }

    // For Supabase Auth, we'll use the built-in authentication
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError || !signInData.user) {
      logger.warn(`Login attempt failed for email: ${email} - Invalid password`);
      throw new ErrorResponse('Invalid credentials', 401);
    }

    // Generate our custom JWT tokens
    const tokens = generateTokens(user);

    // Update last login timestamp
    await supabase
      .from('users')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    logger.info(`User authenticated successfully: ${email} (${user.role})`);

    return {
      user: createSafeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn
    };
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    
    logger.error('Authentication error:', error);
    throw new ErrorResponse('Authentication failed', 500);
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (request: RefreshTokenRequest): Promise<Omit<LoginResponse, 'user'>> => {
  const { refreshToken } = request;

  if (!refreshToken) {
    throw new ErrorResponse('Refresh token is required', 400);
  }

  try {
    // Ensure refresh secret is defined
    if (!config.jwt.refreshSecret) {
      throw new ErrorResponse('JWT refresh secret is not configured', 500);
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as JWTPayload;

    // Get user from database to ensure they still exist and are active
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user || !user.is_active) {
      throw new ErrorResponse('Invalid refresh token', 401);
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    logger.info(`Token refreshed for user: ${user.email}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ErrorResponse('Refresh token has expired', 401);
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new ErrorResponse('Invalid refresh token', 401);
    } else if (error instanceof ErrorResponse) {
      throw error;
    }
    
    logger.error('Token refresh error:', error);
    throw new ErrorResponse('Token refresh failed', 500);
  }
};

/**
 * Initiate password reset process
 */
export const initiatePasswordReset = async (request: ForgotPasswordRequest): Promise<void> => {
  const { email } = request;

  if (!email) {
    throw new ErrorResponse('Email is required', 400);
  }

  try {
    // Check if user exists
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, is_active')
      .eq('email', email.toLowerCase())
      .single();

    // Don't reveal if user exists for security reasons
    if (error || !user || !user.is_active) {
      logger.warn(`Password reset requested for non-existent/inactive email: ${email}`);
      return; // Return success even if user doesn't exist
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store reset token in database
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .upsert({
        user_id: user.id,
        token: hashedToken,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    if (tokenError) {
      logger.error('Failed to store password reset token:', tokenError);
      throw new ErrorResponse('Failed to initiate password reset', 500);
    }

    // Use Supabase Auth's built-in password reset
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${config.frontend.url}/reset-password?token=${resetToken}`
    });

    if (resetError) {
      logger.error('Supabase password reset failed:', resetError);
      // Don't throw error to avoid revealing user existence
    }

    logger.info(`Password reset initiated for email: ${email}`);
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    
    logger.error('Password reset initiation error:', error);
    throw new ErrorResponse('Failed to initiate password reset', 500);
  }
};

/**
 * Reset user password using reset token
 */
export const resetUserPassword = async (request: ResetPasswordRequest): Promise<void> => {
  const { token, password } = request;

  if (!token || !password) {
    throw new ErrorResponse('Token and new password are required', 400);
  }

  // Validate password strength
  if (password.length < 8) {
    throw new ErrorResponse('Password must be at least 8 characters long', 400);
  }

  try {
    // Hash the provided token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at')
      .eq('token', hashedToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      throw new ErrorResponse('Invalid or expired reset token', 400);
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', tokenData.user_id)
      .single();

    if (userError || !user) {
      throw new ErrorResponse('User not found', 404);
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: password
    });

    if (updateError) {
      logger.error('Failed to update password in Supabase Auth:', updateError);
      throw new ErrorResponse('Failed to reset password', 500);
    }

    // Delete used reset token
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('token', hashedToken);

    // Delete all other reset tokens for this user
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', user.id);

    logger.info(`Password reset completed for user: ${user.email}`);
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    
    logger.error('Password reset error:', error);
    throw new ErrorResponse('Password reset failed', 500);
  }
};

/**
 * Logout user (invalidate tokens)
 */
export const logoutUser = async (userId: string): Promise<void> => {
  try {
    // Sign out from Supabase Auth
    const { error } = await supabase.auth.admin.signOut(userId);

    if (error) {
      logger.warn('Supabase logout error:', error);
    }

    // In a production system, you might want to maintain a token blacklist
    // For now, we rely on short token expiration times

    logger.info(`User logged out: ${userId}`);
  } catch (error) {
    logger.error('Logout error:', error);
    throw new ErrorResponse('Logout failed', 500);
  }
};

/**
 * Validate user session
 */
export const validateSession = async (userId: string): Promise<boolean> => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, is_active')
      .eq('id', userId)
      .single();

    return !error && user && user.is_active;
  } catch (error) {
    logger.error('Session validation error:', error);
    return false;
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<AuthenticatedUser | null> => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return null;
    }

    return {
      ...createSafeUser(user),
      permissions: [], // Will be populated by middleware
      isAdmin: user.role === UserRole.admin,
      isProfessor: user.role === UserRole.professor,
      isStudent: user.role === UserRole.student
    };
  } catch (error) {
    logger.error('Get user by ID error:', error);
    return null;
  }
};