/**
 * Response Formatter Utility
 * Standardizes API responses across all endpoints
 */

import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: PaginationMeta;
  meta?: Record<string, any>;
  timestamp: string;
  version?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  details?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
  requestId?: string;
}

/**
 * Success response formatter
 */
export const formatSuccessResponse = <T>(
  data: T,
  message?: string,
  pagination?: PaginationMeta,
  meta?: Record<string, any>
): StandardResponse<T> => {
  const response: StandardResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };

  if (message) {
    response.message = message;
  }

  if (pagination) {
    response.pagination = pagination;
  }

  if (meta) {
    response.meta = meta;
  }

  return response;
};

/**
 * Paginated response formatter
 */
export const formatPaginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string,
  meta?: Record<string, any>
): StandardResponse<T[]> => {
  const pages = Math.ceil(total / limit);
  
  const pagination: PaginationMeta = {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1
  };

  return formatSuccessResponse(data, message, pagination, meta);
};

/**
 * Created response (201)
 */
export const sendCreatedResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): Response => {
  return res.status(201).json(formatSuccessResponse(data, message));
};

/**
 * Success response (200)
 */
export const sendSuccessResponse = <T>(
  res: Response,
  data: T,
  message?: string
): Response => {
  return res.status(200).json(formatSuccessResponse(data, message));
};

/**
 * No content response (204)
 */
export const sendNoContentResponse = (res: Response): Response => {
  return res.status(204).send();
};

/**
 * Paginated response (200)
 */
export const sendPaginatedResponse = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string,
  meta?: Record<string, any>
): Response => {
  return res.status(200).json(
    formatPaginatedResponse(data, page, limit, total, message, meta)
  );
};

/**
 * Bad request response (400)
 */
export const sendBadRequestResponse = (
  res: Response,
  message: string = 'Bad request',
  details?: Array<{ field: string; message: string; value?: any }>
): Response => {
  const response: Partial<ErrorResponse> = {
    success: false,
    error: 'BadRequestError',
    message,
    statusCode: 400,
    timestamp: new Date().toISOString()
  };

  if (details) {
    response.details = details;
  }

  return res.status(400).json(response);
};

/**
 * Unauthorized response (401)
 */
export const sendUnauthorizedResponse = (
  res: Response,
  message: string = 'Unauthorized access'
): Response => {
  return res.status(401).json({
    success: false,
    error: 'UnauthorizedError',
    message,
    statusCode: 401,
    timestamp: new Date().toISOString()
  });
};

/**
 * Forbidden response (403)
 */
export const sendForbiddenResponse = (
  res: Response,
  message: string = 'Access denied'
): Response => {
  return res.status(403).json({
    success: false,
    error: 'ForbiddenError',
    message,
    statusCode: 403,
    timestamp: new Date().toISOString()
  });
};

/**
 * Not found response (404)
 */
export const sendNotFoundResponse = (
  res: Response,
  message: string = 'Resource not found'
): Response => {
  return res.status(404).json({
    success: false,
    error: 'NotFoundError',
    message,
    statusCode: 404,
    timestamp: new Date().toISOString()
  });
};

/**
 * Conflict response (409)
 */
export const sendConflictResponse = (
  res: Response,
  message: string = 'Resource conflict',
  details?: Array<{ field: string; message: string; value?: any }>
): Response => {
  const response: Partial<ErrorResponse> = {
    success: false,
    error: 'ConflictError',
    message,
    statusCode: 409,
    timestamp: new Date().toISOString()
  };

  if (details) {
    response.details = details;
  }

  return res.status(409).json(response);
};

/**
 * Validation error response (422)
 */
export const sendValidationErrorResponse = (
  res: Response,
  message: string = 'Validation failed',
  details: Array<{ field: string; message: string; value?: any }>
): Response => {
  return res.status(422).json({
    success: false,
    error: 'ValidationError',
    message,
    statusCode: 422,
    timestamp: new Date().toISOString(),
    details
  });
};

/**
 * Internal server error response (500)
 */
export const sendInternalServerErrorResponse = (
  res: Response,
  message: string = 'Internal server error'
): Response => {
  return res.status(500).json({
    success: false,
    error: 'InternalServerError',
    message,
    statusCode: 500,
    timestamp: new Date().toISOString()
  });
};

/**
 * Service unavailable response (503)
 */
export const sendServiceUnavailableResponse = (
  res: Response,
  message: string = 'Service temporarily unavailable'
): Response => {
  return res.status(503).json({
    success: false,
    error: 'ServiceUnavailableError',
    message,
    statusCode: 503,
    timestamp: new Date().toISOString()
  });
};

/**
 * HTTP Status Code constants
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

/**
 * Response headers for different content types
 */
export const RESPONSE_HEADERS = {
  JSON: { 'Content-Type': 'application/json' },
  XML: { 'Content-Type': 'application/xml' },
  CSV: { 'Content-Type': 'text/csv' },
  PDF: { 'Content-Type': 'application/pdf' },
  EXCEL: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
} as const;

/**
 * Middleware to add standard response methods to Express Response
 */
export const responseFormatter = (_req: any, res: Response, next: any) => {
  // Add helper methods to response object
  res.sendSuccess = (data: any, message?: string) => sendSuccessResponse(res, data, message);
  res.sendCreated = (data: any, message?: string) => sendCreatedResponse(res, data, message);
  res.sendPaginated = (data: any[], page: number, limit: number, total: number, message?: string, meta?: Record<string, any>) => 
    sendPaginatedResponse(res, data, page, limit, total, message, meta);
  res.sendBadRequest = (message?: string, details?: any) => sendBadRequestResponse(res, message, details);
  res.sendUnauthorized = (message?: string) => sendUnauthorizedResponse(res, message);
  res.sendForbidden = (message?: string) => sendForbiddenResponse(res, message);
  res.sendNotFound = (message?: string) => sendNotFoundResponse(res, message);
  res.sendConflict = (message?: string, details?: any) => sendConflictResponse(res, message, details);
  res.sendValidationError = (message?: string, details?: any) => sendValidationErrorResponse(res, message, details);
  res.sendInternalServerError = (message?: string) => sendInternalServerErrorResponse(res, message);
  res.sendServiceUnavailable = (message?: string) => sendServiceUnavailableResponse(res, message);

  next();
};

// Extend Express Response interface
declare global {
  namespace Express {
    interface Response {
      sendSuccess: <T>(data: T, message?: string) => Response;
      sendCreated: <T>(data: T, message?: string) => Response;
      sendPaginated: <T>(data: T[], page: number, limit: number, total: number, message?: string, meta?: Record<string, any>) => Response;
      sendBadRequest: (message?: string, details?: any) => Response;
      sendUnauthorized: (message?: string) => Response;
      sendForbidden: (message?: string) => Response;
      sendNotFound: (message?: string) => Response;
      sendConflict: (message?: string, details?: any) => Response;
      sendValidationError: (message?: string, details?: any) => Response;
      sendInternalServerError: (message?: string) => Response;
      sendServiceUnavailable: (message?: string) => Response;
    }
  }
}

export default {
  formatSuccessResponse,
  formatPaginatedResponse,
  sendSuccessResponse,
  sendCreatedResponse,
  sendPaginatedResponse,
  sendBadRequestResponse,
  sendUnauthorizedResponse,
  sendForbiddenResponse,
  sendNotFoundResponse,
  sendConflictResponse,
  sendValidationErrorResponse,
  sendInternalServerErrorResponse,
  sendServiceUnavailableResponse,
  responseFormatter,
  HTTP_STATUS,
  RESPONSE_HEADERS
};