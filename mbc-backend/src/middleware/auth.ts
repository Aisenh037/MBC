/**
 * Authentication & Authorization Middleware
 * TypeScript implementation with Supabase integration
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { JWTPayload, AuthenticatedUser, Permission, DEFAULT_PERMISSIONS } from '@/types/auth';
import { UserRole } from '@prisma/client';
import { ErrorResponse } from '@/utils/errorResponse';
import config from '@/config/config';
import logger from '@/utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Initialize Supabase client
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

/**
 * Extract token from request headers or cookies
 */
const extractToken = (req: Request): string | null => {
  let token: string | null = null;

  // Check Authorization header first (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    const authHeader = req.headers.authorization;
    token = authHeader.split(' ')[1] || null;
  }
  // Check cookies as fallback
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  return token;
};

/**
 * Verify JWT token and extract payload
 */
const verifyToken = (token: string): JWTPayload => {
  try {
    if (!config.jwt.secret) {
      throw new Error('JWT secret is not configured');
    }
    
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ErrorResponse('Token has expired', 401);
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new ErrorResponse('Invalid token', 401);
    } else {
      throw new ErrorResponse('Token verification failed', 401);
    }
  }
};

/**
 * Get user permissions based on role
 */
const getUserPermissions = (role: UserRole): Permission[] => {
  return DEFAULT_PERMISSIONS[role] || [];
};

/**
 * Check if user has specific permission
 */
const hasPermission = (
  userPermissions: Permission[], 
  resource: string, 
  action: string,
  context?: Record<string, any>
): boolean => {
  return userPermissions.some(permission => {
    // Check for wildcard permissions (admin)
    if (permission.resource === '*' && permission.action === '*') {
      return true;
    }
    
    // Check resource match
    const resourceMatch = permission.resource === resource || permission.resource === '*';
    
    // Check action match
    const actionMatch = permission.action === action || permission.action === '*';
    
    if (!resourceMatch || !actionMatch) {
      return false;
    }
    
    // Check conditions if present
    if (permission.conditions && context) {
      return Object.entries(permission.conditions).every(([key, value]) => {
        if (value === 'self') {
          return context.userId === context[key];
        }
        return context[key] === value;
      });
    }
    
    return true;
  });
};

/**
 * Authentication middleware - protects routes
 */
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new ErrorResponse('Access denied. No token provided', 401);
    }

    // Verify JWT token
    const decoded = verifyToken(token);

    // Get user from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (userError || !userData) {
      logger.error('User not found in database:', userError);
      throw new ErrorResponse('User not found', 401);
    }

    // Check if user is active
    if (!userData.is_active) {
      throw new ErrorResponse('Account is deactivated', 401);
    }

    // Create authenticated user object
    const permissions = getUserPermissions(userData.role);
    const authenticatedUser: AuthenticatedUser = {
      ...userData,
      permissions,
      isAdmin: userData.role === UserRole.admin,
      isProfessor: userData.role === UserRole.professor,
      isStudent: userData.role === UserRole.student,
    };

    // Attach user to request
    req.user = authenticatedUser;

    // Log successful authentication
    logger.info(`User authenticated: ${userData.email} (${userData.role})`);

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error instanceof ErrorResponse) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  }
};

/**
 * Authorization middleware - checks user roles
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new ErrorResponse('Access denied. User not authenticated', 401);
      }

      if (!roles.includes(req.user.role)) {
        throw new ErrorResponse(
          `Access denied. Role '${req.user.role}' is not authorized to access this resource`,
          403
        );
      }

      logger.info(`User authorized: ${req.user.email} (${req.user.role}) for roles: ${roles.join(', ')}`);
      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      
      if (error instanceof ErrorResponse) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(403).json({
          success: false,
          error: 'Authorization failed'
        });
      }
    }
  };
};

/**
 * Permission-based authorization middleware
 */
export const requirePermission = (resource: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new ErrorResponse('Access denied. User not authenticated', 401);
      }

      const context = {
        userId: req.user.id,
        institutionId: req.user.institutionId,
        branchId: req.user.branchId,
        ...req.params,
        ...req.query
      };

      const hasAccess = hasPermission(req.user.permissions, resource, action, context);

      if (!hasAccess) {
        throw new ErrorResponse(
          `Access denied. Insufficient permissions for ${action} on ${resource}`,
          403
        );
      }

      logger.info(`Permission granted: ${req.user.email} - ${action} on ${resource}`);
      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      
      if (error instanceof ErrorResponse) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(403).json({
          success: false,
          error: 'Permission check failed'
        });
      }
    }
  };
};

/**
 * Tenant isolation middleware - ensures users can only access their institution's data
 */
export const enforceTenant = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw new ErrorResponse('Access denied. User not authenticated', 401);
    }

    // Admin users can access all institutions
    if (req.user.role === UserRole.admin) {
      next();
      return;
    }

    // For non-admin users, ensure they can only access their institution's data
    if (!req.user.institutionId) {
      throw new ErrorResponse('Access denied. User not associated with any institution', 403);
    }

    // Add institution filter to query parameters
    req.query.institutionId = req.user.institutionId;

    logger.info(`Tenant enforcement: ${req.user.email} limited to institution ${req.user.institutionId}`);
    next();
  } catch (error) {
    logger.error('Tenant enforcement error:', error);
    
    if (error instanceof ErrorResponse) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(403).json({
        success: false,
        error: 'Tenant enforcement failed'
      });
    }
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      // If token is provided, verify it
      const decoded = verifyToken(token);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      if (!userError && userData && userData.is_active) {
        const permissions = getUserPermissions(userData.role);
        const authenticatedUser: AuthenticatedUser = {
          ...userData,
          permissions,
          isAdmin: userData.role === UserRole.admin,
          isProfessor: userData.role === UserRole.professor,
          isStudent: userData.role === UserRole.student,
        };

        req.user = authenticatedUser;
        logger.info(`Optional auth: User authenticated: ${userData.email}`);
      }
    }

    // Continue regardless of authentication status
    next();
  } catch (error) {
    // Log error but don't fail the request
    logger.warn('Optional authentication failed:', error);
    next();
  }
};

/**
 * Refresh token middleware
 */
export const refreshToken = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ErrorResponse('Refresh token is required', 400);
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);

    // Get user from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (userError || !userData || !userData.is_active) {
      throw new ErrorResponse('Invalid refresh token', 401);
    }

    // Ensure JWT secret is defined
    if (!config.jwt.secret) {
      throw new Error('JWT secret is not configured');
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        userId: userData.id,
        email: userData.email,
        role: userData.role,
        institutionId: userData.institution_id,
        branchId: userData.branch_id
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as any
    );

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: config.jwt.expiresIn
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    
    if (error instanceof ErrorResponse) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Token refresh failed'
      });
    }
  }
};