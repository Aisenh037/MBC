// utils/errorResponse.js
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    // Capturing the stack trace to help in debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorResponse;