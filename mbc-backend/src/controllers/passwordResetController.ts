/**
 * Password Reset Controller
 * Enhanced password reset functionality with email notifications
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { ErrorResponse } from '@/utils/errorResponse';
import { validateRequestZod } from '@/middleware/validation';
import { notificationService } from '../services/notificationService';
import { ApiResponse } from '@/types/api';
import { config } from '@/config/config';
import logger from '@/utils/logger';

// Initialize Supabase client
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

// Validation schemas
const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
});

/**
 * Request password reset
 * @route POST /api/v1/auth/forgot-password
 * @access Public
 */
export const forgotPassword = [
  validateRequestZod(forgotPasswordSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;

      // Check if user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, profile, is_active')
        .eq('email', email.toLowerCase())
        .single();

      // Always return success to prevent email enumeration
      const response: ApiResponse<{}> = {
        success: true,
        data: {},
        message: 'If an account with that email exists, a password reset link has been sent.'
      };

      if (userError || !user) {
        logger.info(`Password reset requested for non-existent email: ${email}`);
        res.status(200).json(response);
        return;
      }

      if (!user.is_active) {
        logger.info(`Password reset requested for inactive account: ${email}`);
        res.status(200).json(response);
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store reset token in database
      const { error: tokenError } = await supabase
        .from('password_reset_tokens')
        .upsert({
          user_id: user.id,
          token_hash: resetTokenHash,
          expires_at: resetTokenExpiry.toISOString(),
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (tokenError) {
        logger.error('Failed to store password reset token:', tokenError);
        throw new ErrorResponse('Failed to process password reset request', 500);
      }

      // Send password reset email
      try {
        const userName = user.profile?.firstName || user.email.split('@')[0];
        await notificationService.sendPasswordResetEmail(user.email, resetToken);
        
        logger.info(`Password reset email sent to: ${user.email}`);
      } catch (emailError) {
        logger.error('Failed to send password reset email:', emailError);
        // Don't fail the request if email fails, but log it
      }

      res.status(200).json(response);
    } catch (error) {
      logger.error('Forgot password error:', error);
      next(error);
    }
  }
];

/**
 * Reset password with token
 * @route POST /api/v1/auth/reset-password
 * @access Public
 */
export const resetPassword = [
  validateRequestZod(resetPasswordSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, password } = req.body;

      // Hash the token to compare with stored hash
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Find valid reset token
      const { data: resetTokenData, error: tokenError } = await supabase
        .from('password_reset_tokens')
        .select(`
          *,
          user:users(id, email, profile, is_active)
        `)
        .eq('token_hash', tokenHash)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (tokenError || !resetTokenData) {
        throw new ErrorResponse('Invalid or expired reset token', 400);
      }

      if (!resetTokenData.user.is_active) {
        throw new ErrorResponse('Account is not active', 400);
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Update user password
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', resetTokenData.user.id);

      if (updateError) {
        logger.error('Failed to update user password:', updateError);
        throw new ErrorResponse('Failed to reset password', 500);
      }

      // Delete the used reset token
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('user_id', resetTokenData.user.id);

      // Send confirmation email
      try {
        const userName = resetTokenData.user.profile?.firstName || resetTokenData.user.email.split('@')[0];
        await notificationService.sendEmail({
          to: resetTokenData.user.email,
          subject: 'Password Reset Successful - MBC Department',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1976d2;">Password Reset Successful</h2>
              <p>Dear ${userName},</p>
              <p>Your password has been successfully reset for the MBC Department Management System.</p>
              <p>If you did not request this password reset, please contact our support team immediately.</p>
              <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
                <p><strong>Security Tips:</strong></p>
                <ul>
                  <li>Use a strong, unique password</li>
                  <li>Don't share your password with anyone</li>
                  <li>Log out from shared computers</li>
                </ul>
              </div>
              <p>You can now log in with your new password.</p>
              <p>Best regards,<br>MBC Department Team</p>
            </div>
          `
        });
      } catch (emailError) {
        logger.error('Failed to send password reset confirmation email:', emailError);
        // Don't fail the request if email fails
      }

      logger.info(`Password reset successful for user: ${resetTokenData.user.email}`);

      const response: ApiResponse<{}> = {
        success: true,
        data: {},
        message: 'Password reset successful. You can now log in with your new password.'
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Reset password error:', error);
      next(error);
    }
  }
];

/**
 * Change password (authenticated user)
 * @route POST /api/v1/auth/change-password
 * @access Private
 */
export const changePassword = [
  validateRequestZod(changePasswordSchema),
  async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new ErrorResponse('Authentication required', 401);
      }

      // Get user with current password hash
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, password_hash, profile, is_active')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new ErrorResponse('User not found', 404);
      }

      if (!user.is_active) {
        throw new ErrorResponse('Account is not active', 400);
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        throw new ErrorResponse('Current password is incorrect', 400);
      }

      // Check if new password is different from current
      const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
      if (isSamePassword) {
        throw new ErrorResponse('New password must be different from current password', 400);
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: hashedNewPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        logger.error('Failed to update password:', updateError);
        throw new ErrorResponse('Failed to change password', 500);
      }

      // Send confirmation email
      try {
        const userName = user.profile?.firstName || user.email.split('@')[0];
        await notificationService.sendEmail({
          to: user.email,
          subject: 'Password Changed - MBC Department',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1976d2;">Password Changed Successfully</h2>
              <p>Dear ${userName},</p>
              <p>Your password has been successfully changed for the MBC Department Management System.</p>
              <p><strong>Changed on:</strong> ${new Date().toLocaleString()}</p>
              <p>If you did not make this change, please contact our support team immediately.</p>
              <div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
                <p><strong>Security Alert:</strong> If this wasn't you, your account may be compromised.</p>
              </div>
              <p>Best regards,<br>MBC Department Team</p>
            </div>
          `
        });
      } catch (emailError) {
        logger.error('Failed to send password change confirmation email:', emailError);
        // Don't fail the request if email fails
      }

      logger.info(`Password changed successfully for user: ${user.email}`);

      const response: ApiResponse<{}> = {
        success: true,
        data: {},
        message: 'Password changed successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Change password error:', error);
      next(error);
    }
  }
];

/**
 * Validate reset token
 * @route GET /api/v1/auth/validate-reset-token/:token
 * @access Public
 */
export const validateResetToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      throw new ErrorResponse('Reset token is required', 400);
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Check if token exists and is not expired
    const { data: resetTokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('expires_at, user:users(email, is_active)')
      .eq('token_hash', tokenHash)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !resetTokenData) {
      throw new ErrorResponse('Invalid or expired reset token', 400);
    }

    const user = Array.isArray(resetTokenData.user) ? resetTokenData.user[0] : resetTokenData.user;
    if (!user.is_active) {
      throw new ErrorResponse('Account is not active', 400);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        valid: true,
        email: user.email,
        expiresAt: resetTokenData.expires_at
      },
      message: 'Reset token is valid'
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Validate reset token error:', error);
    next(error);
  }
};