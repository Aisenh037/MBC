// utils/validation.js
import Joi from 'joi';
import ErrorResponse from './errorResponse.js';

//   A reusable validation middleware function
export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    return next(new ErrorResponse(errorMessage, 400));
  }
  next();
};

// ---  existing schemas ---

export const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'teacher', 'student').required(),
  // Add other fields as necessary based on role
  scholarNo: Joi.string().when('role', { is: 'student', then: Joi.required() }),
  employeeId: Joi.string().when('role', { is: 'teacher', then: Joi.required() }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});