import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ErrorResponse } from '@/utils/errorResponse';
import logger from '@/utils/logger';

interface MongooseError extends Error {
  code?: number;
  keyValue?: Record<string, any>;
  errors?: Record<string, { message: string }>;
}

interface CustomError extends Error {
  statusCode?: number;
}

interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
}

interface StandardErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  details?: ValidationErrorDetail[];
  stack?: string;
  requestId?: string;
}

/**
 * Enhanced error handler with comprehensive error standardization
 * Provides consistent error responses across all API endpoints
 */
const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction): void => {
  let error: CustomError = { ...err };
  error.message = err.message;

  // Generate request ID for tracking
  const requestId = req.headers['x-request-id'] as string || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Log error with context
  logger.error('API Error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    requestId
  });

  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let errorType = 'InternalServerError';
  let details: ValidationErrorDetail[] | undefined;

  // Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    errorType = 'ValidationError';
    message = 'Request validation failed';
    details = err.errors.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      value: 'received' in issue ? issue.received : undefined
    }));
  }
  
  // Mongoose bad ObjectId
  else if (err.name === 'CastError') {
    statusCode = 404;
    errorType = 'NotFoundError';
    message = 'Resource not found';
    const field = err.path || 'id';
    const value = err.value || 'unknown';
    details = [{
      field,
      message: `Invalid ${field} format`,
      value
    }];
  }

  // Mongoose duplicate key
  else if ('code' in err && err.code === 11000) {
    const mongooseErr = err as MongooseError;
    statusCode = 409;
    errorType = 'ConflictError';
    const field = mongooseErr.keyValue ? Object.keys(mongooseErr.keyValue)[0] : 'field';
    const value = mongooseErr.keyValue && field ? mongooseErr.keyValue[field] : 'unknown';
    message = `Duplicate value: ${field} '${value}' already exists`;
    details = [{
      field: field || 'unknown',
      message: `${field || 'Field'} must be unique`,
      value
    }];
  }

  // Mongoose validation error
  else if (err.name === 'ValidationError') {
    const mongooseErr = err as MongooseError;
    statusCode = 400;
    errorType = 'ValidationError';
    message = 'Data validation failed';
    details = mongooseErr.errors 
      ? Object.entries(mongooseErr.errors).map(([field, error]) => ({
          field,
          message: error.message,
        }))
      : [];
  }
  
  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorType = 'UnauthorizedError';
    message = 'Invalid authentication token';
  }
  
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorType = 'UnauthorizedError';
    message = 'Authentication token has expired';
  }

  // Multer file upload errors
  else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    errorType = 'PayloadTooLargeError';
    message = 'File size exceeds the maximum allowed limit';
    details = [{
      field: 'file',
      message: 'File size must be less than 10MB'
    }];
  }

  else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    errorType = 'ValidationError';
    message = 'Unexpected file field';
    details = [{
      field: 'file',
      message: 'Invalid file field name or too many files'
    }];
  }

  // Rate limiting errors
  else if (err.status === 429) {
    statusCode = 429;
    errorType = 'TooManyRequestsError';
    message = 'Too many requests, please try again later';
  }

  // Supabase/PostgreSQL errors
  else if (err.code === '23505') { // Unique constraint violation
    statusCode = 409;
    errorType = 'ConflictError';
    message = 'Duplicate value violates unique constraint';
  }

  else if (err.code === '23503') { // Foreign key constraint violation
    statusCode = 400;
    errorType = 'ValidationError';
    message = 'Referenced resource does not exist';
  }

  else if (err.code === '23502') { // Not null constraint violation
    statusCode = 400;
    errorType = 'ValidationError';
    message = 'Required field is missing';
  }

  // Network/timeout errors
  else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    statusCode = 503;
    errorType = 'ServiceUnavailableError';
    message = 'External service temporarily unavailable';
  }

  // Custom ErrorResponse instances
  else if (err instanceof ErrorResponse) {
    statusCode = err.statusCode;
    errorType = getErrorTypeFromStatus(statusCode);
    message = err.message;
  }

  // Build standardized error response
  const errorResponse: StandardErrorResponse = {
    success: false,
    error: errorType,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    requestId
  };

  // Add validation details if present
  if (details && details.length > 0) {
    errorResponse.details = details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Set appropriate headers
  res.set({
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    'X-Error-Type': errorType
  });

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Get error type from HTTP status code
 */
const getErrorTypeFromStatus = (statusCode: number): string => {
  const errorTypes: Record<number, string> = {
    400: 'BadRequestError',
    401: 'UnauthorizedError',
    403: 'ForbiddenError',
    404: 'NotFoundError',
    405: 'MethodNotAllowedError',
    409: 'ConflictError',
    413: 'PayloadTooLargeError',
    422: 'UnprocessableEntityError',
    429: 'TooManyRequestsError',
    500: 'InternalServerError',
    501: 'NotImplementedError',
    502: 'BadGatewayError',
    503: 'ServiceUnavailableError',
    504: 'GatewayTimeoutError'
  };

  return errorTypes[statusCode] || 'UnknownError';
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new ErrorResponse(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

/**
 * Async error wrapper to catch async errors in route handlers
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default errorHandler;