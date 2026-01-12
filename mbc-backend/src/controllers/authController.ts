/**
 * Authentication Controller
 * TypeScript implementation with comprehensive error handling
 */

import { Request, Response, NextFunction } from 'express';
import {
  authenticateUser,
  refreshAccessToken,
  initiatePasswordReset,
  resetUserPassword,
  logoutUser,
  getUserById
} from '@/services/authService';
import { LoginRequest, ForgotPasswordRequest, ResetPasswordRequest } from '@/types/api';
import { ErrorResponse } from '@/utils/errorResponse';
import logger from '@/utils/logger';

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const credentials: LoginRequest = req.body;

    // Validate required fields
    if (!credentials.email || !credentials.password) {
      throw new ErrorResponse('Email and password are required', 400);
    }

    // Authenticate user
    const result = await authenticateUser(credentials);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn
      },
      message: 'Login successful'
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ErrorResponse('User not authenticated', 401);
    }

    // Logout user
    await logoutUser(req.user.id);

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ErrorResponse('User not authenticated', 401);
    }

    // Get fresh user data
    const user = await getUserById(req.user.id);

    if (!user) {
      throw new ErrorResponse('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get me error:', error);
    next(error);
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let refreshToken = req.body.refreshToken;

    // Try to get refresh token from cookie if not in body
    if (!refreshToken && req.cookies.refreshToken) {
      refreshToken = req.cookies.refreshToken;
    }

    if (!refreshToken) {
      throw new ErrorResponse('Refresh token is required', 400);
    }

    // Refresh tokens
    const result = await refreshAccessToken({ refreshToken });

    // Update refresh token cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn
      },
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    next(error);
  }
};

/**
 * @desc    Forgot password
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const request: ForgotPasswordRequest = req.body;

    if (!request.email) {
      throw new ErrorResponse('Email is required', 400);
    }

    // Initiate password reset
    await initiatePasswordReset(request);

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    next(error);
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/v1/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const request: ResetPasswordRequest = req.body;

    if (!request.token || !request.password) {
      throw new ErrorResponse('Token and new password are required', 400);
    }

    // Reset password
    await resetUserPassword(request);

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    next(error);
  }
};

/**
 * @desc    Change password (for authenticated users)
 * @route   PUT /api/v1/auth/change-password
 * @access  Private
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ErrorResponse('User not authenticated', 401);
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ErrorResponse('Current password and new password are required', 400);
    }

    if (newPassword.length < 8) {
      throw new ErrorResponse('New password must be at least 8 characters long', 400);
    }

    // First verify current password by attempting login
    try {
      await authenticateUser({
        email: req.user.email,
        password: currentPassword
      });
    } catch (error) {
      throw new ErrorResponse('Current password is incorrect', 400);
    }

    // Update password using Supabase Auth admin API
    const { createClient } = await import('@supabase/supabase-js');
    const config = (await import('@/config/config')).default;
    const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

    const { error: updateError } = await supabase.auth.admin.updateUserById(req.user.id, {
      password: newPassword
    });

    if (updateError) {
      logger.error('Failed to update password:', updateError);
      throw new ErrorResponse('Failed to change password', 500);
    }

    logger.info(`Password changed successfully for user: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Change password error:', error);
    next(error);
  }
};

/**
 * @desc    Verify email (if email verification is enabled)
 * @route   POST /api/v1/auth/verify-email
 * @access  Public
 */
export const verifyEmail = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new ErrorResponse('Verification token is required', 400);
    }

    // Email verification logic would go here
    // This would typically involve verifying a token sent via email
    throw new ErrorResponse('Email verification functionality not yet implemented', 501);

  } catch (error) {
    logger.error('Email verification error:', error);
    next(error);
  }
};

/**
 * @desc    Resend email verification
 * @route   POST /api/v1/auth/resend-verification
 * @access  Public
 */
export const resendVerification = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ErrorResponse('Email is required', 400);
    }

    // Resend verification logic would go here
    throw new ErrorResponse('Email verification functionality not yet implemented', 501);

  } catch (error) {
    logger.error('Resend verification error:', error);
    next(error);
  }
};

/**
 * @desc    Get user sessions (for security dashboard)
 * @route   GET /api/v1/auth/sessions
 * @access  Private
 */
export const getUserSessions = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ErrorResponse('User not authenticated', 401);
    }

    // Session management logic would go here
    // This would return active sessions for the user
    throw new ErrorResponse('Session management functionality not yet implemented', 501);

  } catch (error) {
    logger.error('Get user sessions error:', error);
    next(error);
  }
};

/**
 * @desc    Revoke user session
 * @route   DELETE /api/v1/auth/sessions/:sessionId
 * @access  Private
 */
export const revokeSession = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ErrorResponse('User not authenticated', 401);
    }

    const { sessionId } = req.params;

    if (!sessionId) {
      throw new ErrorResponse('Session ID is required', 400);
    }

    // Session revocation logic would go here
    throw new ErrorResponse('Session management functionality not yet implemented', 501);

  } catch (error) {
    logger.error('Revoke session error:', error);
    next(error);
  }
};