// middleware/validation.js
import ErrorResponse from '../utils/errorResponse.js';

export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, {
    abortEarly: false,  
    allowUnknown: true,  
  });
  
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return next(new ErrorResponse(errorMessage, 400));
  }
  
  next();
};