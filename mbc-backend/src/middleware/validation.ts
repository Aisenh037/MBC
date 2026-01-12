/**
 * Request Validation Middleware
 * TypeScript implementation using Joi and Zod for schema validation
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { z } from 'zod';
import { ErrorResponse } from '@/utils/errorResponse';
import logger from '@/utils/logger';

/**
 * Validate request data against Joi schema
 */
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      const { error, value } = schema.validate(req.body, {
        abortEarly: false, // Return all validation errors
        stripUnknown: true, // Remove unknown fields
        convert: true // Convert types when possible
      });

      if (error) {
        const errorMessages = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message.replace(/"/g, ''),
          value: detail.context?.value
        }));

        logger.warn('Request validation failed:', {
          path: req.path,
          method: req.method,
          errors: errorMessages,
          body: req.body
        });

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errorMessages
        });
        return;
      }

      // Replace request body with validated and sanitized data
      req.body = value;
      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      next(new ErrorResponse('Validation error', 500));
    }
  };
};

/**
 * Validate request data against Zod schema
 */
export const validateRequestZod = (schema: z.ZodSchema | string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      let zodSchema: z.ZodSchema;
      
      // If schema is a string, import it from schemas
      if (typeof schema === 'string') {
        const { schemas } = require('@/utils/zodSchemas');
        zodSchema = schemas[schema];
        
        if (!zodSchema) {
          logger.error(`Validation schema '${schema}' not found`);
          next(new ErrorResponse('Invalid validation schema', 500));
          return;
        }
      } else {
        zodSchema = schema;
      }

      // Validate request body
      const result = zodSchema.safeParse(req.body);

      if (!result.success) {
        const errorMessages = result.error.errors.map(error => ({
          field: error.path.join('.'),
          message: error.message,
          value: error.code
        }));

        logger.warn('Request validation failed:', {
          path: req.path,
          method: req.method,
          errors: errorMessages,
          body: req.body
        });

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errorMessages
        });
        return;
      }

      // Replace request body with validated and sanitized data
      req.body = result.data;
      next();
    } catch (error) {
      logger.error('Zod validation middleware error:', error);
      next(new ErrorResponse('Validation error', 500));
    }
  };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message.replace(/"/g, ''),
          value: detail.context?.value
        }));

        logger.warn('Query validation failed:', {
          path: req.path,
          method: req.method,
          errors: errorMessages,
          query: req.query
        });

        res.status(400).json({
          success: false,
          error: 'Query validation failed',
          details: errorMessages
        });
        return;
      }

      req.query = value;
      next();
    } catch (error) {
      logger.error('Query validation middleware error:', error);
      next(new ErrorResponse('Query validation error', 500));
    }
  };
};

/**
 * Validate route parameters
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message.replace(/"/g, ''),
          value: detail.context?.value
        }));

        logger.warn('Params validation failed:', {
          path: req.path,
          method: req.method,
          errors: errorMessages,
          params: req.params
        });

        res.status(400).json({
          success: false,
          error: 'Parameter validation failed',
          details: errorMessages
        });
        return;
      }

      req.params = value;
      next();
    } catch (error) {
      logger.error('Params validation middleware error:', error);
      next(new ErrorResponse('Parameter validation error', 500));
    }
  };
};

/**
 * Sanitize request data to prevent XSS and injection attacks
 */
export const sanitizeRequest = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    // Basic sanitization - remove potentially dangerous characters
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .replace(/on\w+\s*=/gi, '') // Remove event handlers
          .trim();
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      }
      
      return obj;
    };

    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    next();
  } catch (error) {
    logger.error('Request sanitization error:', error);
    next(new ErrorResponse('Request sanitization failed', 500));
  }
};

/**
 * Rate limiting validation (basic implementation)
 */
export const validateRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const clientId = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      
      const clientData = requests.get(clientId);
      
      if (!clientData || now > clientData.resetTime) {
        // Reset or initialize client data
        requests.set(clientId, {
          count: 1,
          resetTime: now + windowMs
        });
        next();
        return;
      }
      
      if (clientData.count >= maxRequests) {
        logger.warn(`Rate limit exceeded for client: ${clientId}`);
        res.status(429).json({
          success: false,
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((clientData.resetTime - now) / 1000)} seconds.`
        });
        return;
      }
      
      clientData.count++;
      next();
    } catch (error) {
      logger.error('Rate limiting error:', error);
      next(new ErrorResponse('Rate limiting failed', 500));
    }
  };
};