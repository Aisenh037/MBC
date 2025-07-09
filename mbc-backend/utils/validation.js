import { validationResult } from 'express-validator';
import ErrorResponse from './errorResponse.js';

/**
 * Validation middleware wrapper
 * @param {Array} validations - Array of validation chains
 * @returns {Array} - Middleware array
 */
export const validate = (validations) => {
  return [
    ...validations,
    (req, res, next) => {
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      const extractedErrors = {};
      errors.array().forEach(err => {
        extractedErrors[err.param] = err.msg;
      });

      throw new ErrorResponse(
        'Validation failed',
        422,
        { errors: extractedErrors }
      );
    }
  ];
};

/**
 * Sanitization middleware for MongoDB IDs
 */
export const sanitizeId = () => (req, res, next) => {
  if (req.params.id && !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ErrorResponse('Invalid ID format', 400);
  }
  next();
};
