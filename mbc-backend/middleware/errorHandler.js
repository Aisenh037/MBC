// middleware/errorHandler.js
import ErrorResponse from '../utils/errorResponse.js';

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

   
  console.error(err.stack.red);  
  
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue);
    const message = `Duplicate field value entered: '${field}' already exists.`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(messages.join(', '), 400);
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
      const message = 'Not authorized, token failed';
      error = new ErrorResponse(message, 401);
  }
   if (err.name === 'TokenExpiredError') {
      const message = 'Not authorized, token has expired';
      error = new ErrorResponse(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal Server Error'
  });
};

export default errorHandler;