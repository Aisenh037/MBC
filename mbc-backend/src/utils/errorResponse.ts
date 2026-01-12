/**
 * Error Response Utility
 * Custom error class for consistent error handling
 */

export class ErrorResponse extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ErrorResponse);
    }

    // Set the prototype explicitly to maintain instanceof checks
    Object.setPrototypeOf(this, ErrorResponse.prototype);
  }
}

export default ErrorResponse;