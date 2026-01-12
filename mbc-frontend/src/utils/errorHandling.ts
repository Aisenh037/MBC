import type { ApiError } from '../types/api';

// Error classification
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Enhanced error interface
export interface EnhancedError extends ApiError {
  type: ErrorType;
  severity: ErrorSeverity;
  userMessage: string;
  canRetry: boolean;
  retryAfter?: number;
  context?: Record<string, any>;
}

// Error classification function
export const classifyError = (error: ApiError, context?: Record<string, any>): EnhancedError => {
  let type: ErrorType;
  let severity: ErrorSeverity;
  let userMessage: string;
  let canRetry: boolean;
  let retryAfter: number | undefined;

  // Classify by status code
  if (error.status === 0) {
    type = ErrorType.NETWORK;
    severity = ErrorSeverity.HIGH;
    userMessage = 'Network connection failed. Please check your internet connection.';
    canRetry = true;
    retryAfter = 5000; // 5 seconds
  } else if (error.status === 401) {
    type = ErrorType.AUTHENTICATION;
    severity = ErrorSeverity.HIGH;
    userMessage = 'Your session has expired. Please log in again.';
    canRetry = false;
  } else if (error.status === 403) {
    type = ErrorType.AUTHORIZATION;
    severity = ErrorSeverity.MEDIUM;
    userMessage = 'You do not have permission to perform this action.';
    canRetry = false;
  } else if (error.status === 404) {
    type = ErrorType.NOT_FOUND;
    severity = ErrorSeverity.LOW;
    userMessage = 'The requested resource was not found.';
    canRetry = false;
  } else if (error.status >= 400 && error.status < 500) {
    type = ErrorType.VALIDATION;
    severity = ErrorSeverity.MEDIUM;
    userMessage = error.message || 'Invalid request. Please check your input.';
    canRetry = false;
  } else if (error.status >= 500) {
    type = ErrorType.SERVER;
    severity = ErrorSeverity.HIGH;
    userMessage = 'Server error occurred. Please try again later.';
    canRetry = true;
    retryAfter = 10000; // 10 seconds
  } else {
    type = ErrorType.UNKNOWN;
    severity = ErrorSeverity.MEDIUM;
    userMessage = 'An unexpected error occurred. Please try again.';
    canRetry = true;
  }

  // Override with specific error codes if available
  if (error.code) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        type = ErrorType.NETWORK;
        severity = ErrorSeverity.HIGH;
        userMessage = 'Network connection failed. Please check your internet connection.';
        canRetry = true;
        retryAfter = 5000;
        break;
      case 'TIMEOUT':
        type = ErrorType.NETWORK;
        severity = ErrorSeverity.MEDIUM;
        userMessage = 'Request timed out. Please try again.';
        canRetry = true;
        retryAfter = 3000;
        break;
      case 'RATE_LIMITED':
        type = ErrorType.VALIDATION;
        severity = ErrorSeverity.MEDIUM;
        userMessage = 'Too many requests. Please wait a moment before trying again.';
        canRetry = true;
        retryAfter = 30000; // 30 seconds
        break;
      case 'MAINTENANCE':
        type = ErrorType.SERVER;
        severity = ErrorSeverity.HIGH;
        userMessage = 'System is under maintenance. Please try again later.';
        canRetry = true;
        retryAfter = 60000; // 1 minute
        break;
    }
  }

  return {
    ...error,
    type,
    severity,
    userMessage,
    canRetry,
    retryAfter,
    context,
  };
};

// Error logging function
export const logError = (error: EnhancedError): void => {
  const logData = {
    timestamp: new Date().toISOString(),
    type: error.type,
    severity: error.severity,
    status: error.status,
    message: error.message,
    code: error.code,
    context: error.context,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 API Error [${error.severity}]`);
    console.error('Error Details:', logData);
    console.groupEnd();
  }

  // Send to error tracking service in production
  if (process.env.NODE_ENV === 'production' && error.severity !== ErrorSeverity.LOW) {
    // Example: Send to Sentry, LogRocket, or custom error tracking
    // errorTrackingService.captureError(logData);
  }
};

// Error notification function
export const notifyError = (error: EnhancedError, notificationFn?: (message: string, type: string) => void): void => {
  if (notificationFn) {
    const notificationType = error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH 
      ? 'error' 
      : 'warning';
    
    notificationFn(error.userMessage, notificationType);
  }
};

// Retry logic
export const shouldRetry = (error: EnhancedError, attemptCount: number, maxAttempts: number = 3): boolean => {
  if (!error.canRetry || attemptCount >= maxAttempts) {
    return false;
  }

  // Don't retry client errors (4xx) except for specific cases
  if (error.status >= 400 && error.status < 500) {
    return error.code === 'RATE_LIMITED' || error.status === 408 || error.status === 429;
  }

  // Retry server errors and network errors
  return error.status >= 500 || error.status === 0;
};

// Exponential backoff calculation
export const calculateBackoff = (attemptCount: number, baseDelay: number = 1000): number => {
  const exponentialDelay = baseDelay * Math.pow(2, attemptCount - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
  return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
};

// Error boundary helper
export const createErrorBoundaryFallback = (error: EnhancedError) => {
  return {
    title: getErrorTitle(error),
    message: error.userMessage,
    canRetry: error.canRetry,
    severity: error.severity,
    actions: getErrorActions(error),
  };
};

// Get error title based on type
const getErrorTitle = (error: EnhancedError): string => {
  switch (error.type) {
    case ErrorType.NETWORK:
      return 'Connection Problem';
    case ErrorType.AUTHENTICATION:
      return 'Authentication Required';
    case ErrorType.AUTHORIZATION:
      return 'Access Denied';
    case ErrorType.VALIDATION:
      return 'Invalid Request';
    case ErrorType.NOT_FOUND:
      return 'Not Found';
    case ErrorType.SERVER:
      return 'Server Error';
    default:
      return 'Something Went Wrong';
  }
};

// Get suggested actions based on error type
const getErrorActions = (error: EnhancedError): string[] => {
  const actions: string[] = [];

  switch (error.type) {
    case ErrorType.NETWORK:
      actions.push('Check your internet connection');
      actions.push('Try refreshing the page');
      break;
    case ErrorType.AUTHENTICATION:
      actions.push('Log in again');
      actions.push('Clear browser cache');
      break;
    case ErrorType.AUTHORIZATION:
      actions.push('Contact your administrator');
      actions.push('Check your permissions');
      break;
    case ErrorType.VALIDATION:
      actions.push('Check your input');
      actions.push('Review the form requirements');
      break;
    case ErrorType.NOT_FOUND:
      actions.push('Check the URL');
      actions.push('Go back to the previous page');
      break;
    case ErrorType.SERVER:
      actions.push('Try again in a few minutes');
      actions.push('Contact support if the problem persists');
      break;
    default:
      actions.push('Try refreshing the page');
      actions.push('Contact support if the problem persists');
  }

  if (error.canRetry) {
    actions.unshift('Try again');
  }

  return actions;
};

// Error context helpers
export const createErrorContext = (
  operation: string,
  data?: any,
  userId?: string
): Record<string, any> => {
  return {
    operation,
    data: data ? JSON.stringify(data).substring(0, 1000) : undefined, // Limit data size
    userId,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };
};

// Global error handler
export const handleGlobalError = (
  error: ApiError,
  context?: Record<string, any>,
  notificationFn?: (message: string, type: string) => void
): EnhancedError => {
  const enhancedError = classifyError(error, context);
  
  logError(enhancedError);
  notifyError(enhancedError, notificationFn);
  
  return enhancedError;
};

export default {
  classifyError,
  logError,
  notifyError,
  shouldRetry,
  calculateBackoff,
  createErrorBoundaryFallback,
  createErrorContext,
  handleGlobalError,
};