import { body, param, validationResult } from 'express-validator';

// Student registration validation
export const validateStudentRegistration = [
  body('rollNumber').matches(/^[0-9]{2}[A-Z]{3}[0-9]{4}$/),
  body('email').matches(/^.+@(nit|iit).+\..+$/i),
  body('department').isIn(['CSE', 'ECE', 'ME', 'CE', 'Mathematics', 'Physics']),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Course code validation
export const validateCourseCode = [
  param('code').matches(/^[A-Z]{2,3}[0-9]{3}$/),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid course code format' });
    }
    next();
  }
];

// Placement application validation
export const validatePlacementApplication = [
  body('company').notEmpty(),
  body('studentId').isMongoId(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Company name and valid student ID required'
      });
    }
    next();
  }
];
