/**
 * Validation Schemas
 * Joi schemas for request validation
 */

import Joi from 'joi';
import { UserRole } from '@prisma/client';

// ==============================================
// Common Validation Patterns
// ==============================================

const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .lowercase()
  .trim()
  .max(255)
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required',
    'string.max': 'Email must not exceed 255 characters'
  });

const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 128 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    'string.empty': 'Password is required'
  });

const uuidSchema = Joi.string()
  .uuid({ version: 'uuidv4' })
  .required()
  .messages({
    'string.guid': 'Must be a valid UUID',
    'string.empty': 'ID is required'
  });

const roleSchema = Joi.string()
  .valid(...Object.values(UserRole))
  .required()
  .messages({
    'any.only': `Role must be one of: ${Object.values(UserRole).join(', ')}`,
    'string.empty': 'Role is required'
  });

// ==============================================
// Authentication Schemas
// ==============================================

export const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string()
    .min(1)
    .max(128)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.max': 'Password must not exceed 128 characters'
    })
});

export const registerSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema,
  profile: Joi.object({
    firstName: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.empty': 'First name is required',
        'string.max': 'First name must not exceed 50 characters'
      }),
    lastName: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.empty': 'Last name is required',
        'string.max': 'Last name must not exceed 50 characters'
      }),
    phone: Joi.string()
      .pattern(/^\+?[\d\s\-\(\)]{10,15}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    dateOfBirth: Joi.date()
      .max('now')
      .optional()
      .messages({
        'date.max': 'Date of birth cannot be in the future'
      })
  }).required(),
  institutionId: uuidSchema.optional(),
  branchId: uuidSchema.optional()
});

export const forgotPasswordSchema = Joi.object({
  email: emailSchema
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .min(32)
    .max(256)
    .required()
    .messages({
      'string.empty': 'Reset token is required',
      'string.min': 'Invalid reset token format'
    }),
  password: passwordSchema
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .min(1)
    .max(128)
    .required()
    .messages({
      'string.empty': 'Current password is required'
    }),
  newPassword: passwordSchema
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Refresh token is required'
    })
});

// ==============================================
// User Management Schemas
// ==============================================

export const createUserSchema = Joi.object({
  email: emailSchema,
  role: roleSchema,
  profile: Joi.object({
    firstName: Joi.string().trim().min(1).max(50).required(),
    lastName: Joi.string().trim().min(1).max(50).required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]{10,15}$/).optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    avatar: Joi.string().uri().optional(),
    address: Joi.object({
      street: Joi.string().max(255).optional(),
      city: Joi.string().max(100).optional(),
      state: Joi.string().max(100).optional(),
      zipCode: Joi.string().max(20).optional(),
      country: Joi.string().max(100).optional()
    }).optional(),
    // Role-specific profile fields
    studentProfile: Joi.when('..role', {
      is: UserRole.student,
      then: Joi.object({
        rollNumber: Joi.string().trim().min(1).max(50).required(),
        admissionYear: Joi.number().integer().min(2000).max(new Date().getFullYear()).required(),
        currentSemester: Joi.number().integer().min(1).max(8).required(),
        gpa: Joi.number().min(0).max(10).optional(),
        parentContact: Joi.object({
          name: Joi.string().max(100).optional(),
          phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]{10,15}$/).optional(),
          email: Joi.string().email().optional()
        }).optional()
      }),
      otherwise: Joi.forbidden()
    }),
    professorProfile: Joi.when('..role', {
      is: UserRole.professor,
      then: Joi.object({
        employeeId: Joi.string().trim().min(1).max(50).required(),
        department: Joi.string().trim().min(1).max(100).required(),
        designation: Joi.string().trim().min(1).max(100).required(),
        specialization: Joi.array().items(Joi.string().max(100)).min(1).required(),
        officeHours: Joi.string().max(255).optional()
      }),
      otherwise: Joi.forbidden()
    }),
    adminProfile: Joi.when('..role', {
      is: UserRole.admin,
      then: Joi.object({
        department: Joi.string().trim().min(1).max(100).optional(),
        permissions: Joi.array().items(Joi.string()).optional()
      }),
      otherwise: Joi.forbidden()
    })
  }).required(),
  institutionId: uuidSchema.optional(),
  branchId: uuidSchema.optional(),
  password: passwordSchema.optional()
});

export const updateUserSchema = Joi.object({
  profile: Joi.object({
    firstName: Joi.string().trim().min(1).max(50).optional(),
    lastName: Joi.string().trim().min(1).max(50).optional(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]{10,15}$/).optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    avatar: Joi.string().uri().optional(),
    address: Joi.object({
      street: Joi.string().max(255).optional(),
      city: Joi.string().max(100).optional(),
      state: Joi.string().max(100).optional(),
      zipCode: Joi.string().max(20).optional(),
      country: Joi.string().max(100).optional()
    }).optional()
  }).optional(),
  institutionId: uuidSchema.optional(),
  branchId: uuidSchema.optional(),
  isActive: Joi.boolean().optional()
});

// ==============================================
// Query Parameter Schemas
// ==============================================

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().max(50).optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

export const userListQuerySchema = paginationSchema.keys({
  role: Joi.string().valid(...Object.values(UserRole)).optional(),
  institutionId: uuidSchema.optional(),
  branchId: uuidSchema.optional(),
  isActive: Joi.boolean().optional(),
  search: Joi.string().max(255).optional()
});

// ==============================================
// Parameter Schemas
// ==============================================

export const idParamSchema = Joi.object({
  id: uuidSchema
});

export const userIdParamSchema = Joi.object({
  userId: uuidSchema
});

// ==============================================
// File Upload Schemas
// ==============================================

export const fileUploadSchema = Joi.object({
  category: Joi.string()
    .valid('assignment', 'submission', 'profile', 'document')
    .required(),
  metadata: Joi.object().optional()
});

// ==============================================
// Course Management Schemas
// ==============================================

export const createCourseSchema = Joi.object({
  branchId: uuidSchema,
  name: Joi.string().trim().min(1).max(255).required(),
  code: Joi.string().trim().min(1).max(50).required(),
  credits: Joi.number().integer().min(1).max(6).required(),
  semester: Joi.number().integer().min(1).max(8).required(),
  description: Joi.string().max(1000).optional()
});

export const updateCourseSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional(),
  code: Joi.string().trim().min(1).max(50).optional(),
  credits: Joi.number().integer().min(1).max(6).optional(),
  semester: Joi.number().integer().min(1).max(8).optional(),
  description: Joi.string().max(1000).optional()
});

// ==============================================
// Assignment Schemas
// ==============================================

export const createAssignmentSchema = Joi.object({
  courseId: uuidSchema,
  title: Joi.string().trim().min(1).max(255).required(),
  description: Joi.string().max(2000).optional(),
  dueDate: Joi.date().greater('now').optional(),
  maxMarks: Joi.number().integer().min(1).max(1000).required(),
  fileAttachments: Joi.array().items(Joi.string().uri()).optional()
});

export const updateAssignmentSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).optional(),
  description: Joi.string().max(2000).optional(),
  dueDate: Joi.date().greater('now').optional(),
  maxMarks: Joi.number().integer().min(1).max(1000).optional(),
  fileAttachments: Joi.array().items(Joi.string().uri()).optional()
});

// ==============================================
// Notice Schemas
// ==============================================

export const createNoticeSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).required(),
  content: Joi.string().trim().min(1).max(5000).required(),
  targetAudience: Joi.array()
    .items(Joi.string().valid('all', 'students', 'professors', 'admin'))
    .min(1)
    .required(),
  priority: Joi.string()
    .valid('low', 'normal', 'high', 'urgent')
    .default('normal'),
  expiresAt: Joi.date().greater('now').optional()
});

export const updateNoticeSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).optional(),
  content: Joi.string().trim().min(1).max(5000).optional(),
  targetAudience: Joi.array()
    .items(Joi.string().valid('all', 'students', 'professors', 'admin'))
    .min(1)
    .optional(),
  priority: Joi.string()
    .valid('low', 'normal', 'high', 'urgent')
    .optional(),
  expiresAt: Joi.date().greater('now').optional()
});

// ==============================================
// AI Service Schemas
// ==============================================

export const sentimentAnalysisSchema = Joi.object({
  text: Joi.string()
    .trim()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'string.empty': 'Text is required for sentiment analysis',
      'string.max': 'Text must not exceed 5000 characters'
    })
});