/**
 * Input Validation Utilities
 * Comprehensive validation helpers for API endpoints
 */

import { z } from 'zod';

// Common validation patterns
export const ValidationPatterns = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  ROLL_NUMBER: /^[A-Z0-9]{6,12}$/,
  EMPLOYEE_ID: /^[A-Z0-9]{4,10}$/,
  COURSE_CODE: /^[A-Z]{2,4}\d{3,4}$/,
  ACADEMIC_YEAR: /^\d{4}-\d{4}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  ALPHA_SPACES: /^[a-zA-Z\s]+$/,
  NUMERIC: /^\d+$/,
  DECIMAL: /^\d+(\.\d{1,2})?$/
};

// Common Zod schemas
export const CommonSchemas = {
  uuid: z.string().uuid('Invalid UUID format'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(ValidationPatterns.PHONE, 'Invalid phone number format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(ValidationPatterns.PASSWORD, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  rollNumber: z.string().regex(ValidationPatterns.ROLL_NUMBER, 'Invalid roll number format'),
  employeeId: z.string().regex(ValidationPatterns.EMPLOYEE_ID, 'Invalid employee ID format'),
  courseCode: z.string().regex(ValidationPatterns.COURSE_CODE, 'Invalid course code format'),
  academicYear: z.string().regex(ValidationPatterns.ACADEMIC_YEAR, 'Invalid academic year format (YYYY-YYYY)'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(ValidationPatterns.ALPHA_SPACES, 'Name can only contain letters and spaces'),
  positiveInteger: z.number().int().positive('Must be a positive integer'),
  nonNegativeInteger: z.number().int().min(0, 'Must be a non-negative integer'),
  percentage: z.number().min(0, 'Percentage must be at least 0').max(100, 'Percentage must not exceed 100'),
  semester: z.number().int().min(1, 'Semester must be at least 1').max(8, 'Semester must not exceed 8'),
  credits: z.number().int().min(1, 'Credits must be at least 1').max(6, 'Credits must not exceed 6'),
  dateString: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  futureDate: z.string().refine((date) => new Date(date) > new Date(), 'Date must be in the future'),
  pastDate: z.string().refine((date) => new Date(date) < new Date(), 'Date must be in the past')
};

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit must not exceed 100').default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional()
});

// File upload validation
export const fileUploadSchema = z.object({
  category: z.enum(['assignment', 'submission', 'profile', 'document']),
  assignmentId: CommonSchemas.uuid.optional(),
  documentCategory: z.enum(['syllabus', 'notice', 'policy', 'form', 'other']).optional()
}).refine((data) => {
  if ((data.category === 'assignment' || data.category === 'submission') && !data.assignmentId) {
    return false;
  }
  if (data.category === 'document' && !data.documentCategory) {
    return false;
  }
  return true;
}, {
  message: 'assignmentId is required for assignment/submission uploads, documentCategory is required for document uploads'
});

// User role validation
export const userRoleSchema = z.enum(['admin', 'professor', 'student']);

// Student validation schemas
export const createStudentSchema = z.object({
  email: CommonSchemas.email,
  password: CommonSchemas.password,
  rollNumber: CommonSchemas.rollNumber,
  firstName: CommonSchemas.name,
  lastName: CommonSchemas.name,
  phone: CommonSchemas.phone.optional(),
  dateOfBirth: CommonSchemas.dateString.optional(),
  address: z.string().max(200, 'Address must not exceed 200 characters').optional(),
  institutionId: CommonSchemas.uuid,
  branchId: CommonSchemas.uuid,
  semester: CommonSchemas.semester,
  academicYear: CommonSchemas.academicYear
});

export const updateStudentSchema = createStudentSchema.partial().omit({ email: true, password: true });

// Professor validation schemas
export const createProfessorSchema = z.object({
  email: CommonSchemas.email,
  password: CommonSchemas.password,
  employeeId: CommonSchemas.employeeId,
  firstName: CommonSchemas.name,
  lastName: CommonSchemas.name,
  phone: CommonSchemas.phone.optional(),
  department: z.string().min(2, 'Department must be at least 2 characters').max(50, 'Department must not exceed 50 characters'),
  designation: z.string().min(2, 'Designation must be at least 2 characters').max(50, 'Designation must not exceed 50 characters'),
  qualification: z.string().max(100, 'Qualification must not exceed 100 characters').optional(),
  experience: CommonSchemas.nonNegativeInteger.optional(),
  institutionId: CommonSchemas.uuid
});

export const updateProfessorSchema = createProfessorSchema.partial().omit({ email: true, password: true });

// Course validation schemas
export const createCourseSchema = z.object({
  code: CommonSchemas.courseCode,
  name: z.string().min(3, 'Course name must be at least 3 characters').max(100, 'Course name must not exceed 100 characters'),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
  credits: CommonSchemas.credits,
  semester: CommonSchemas.semester,
  academicYear: CommonSchemas.academicYear,
  professorId: CommonSchemas.uuid,
  institutionId: CommonSchemas.uuid,
  branchId: CommonSchemas.uuid
});

export const updateCourseSchema = createCourseSchema.partial();

// Assignment validation schemas
export const createAssignmentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must not exceed 100 characters'),
  description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
  instructions: z.string().max(2000, 'Instructions must not exceed 2000 characters').optional(),
  dueDate: CommonSchemas.futureDate,
  maxMarks: CommonSchemas.positiveInteger,
  courseId: CommonSchemas.uuid,
  institutionId: CommonSchemas.uuid
});

export const updateAssignmentSchema = createAssignmentSchema.partial().extend({
  dueDate: CommonSchemas.dateString.optional() // Allow past dates for updates
});

// Attendance validation schemas
export const markAttendanceSchema = z.object({
  studentId: CommonSchemas.uuid,
  courseId: CommonSchemas.uuid,
  date: CommonSchemas.dateString,
  status: z.enum(['present', 'absent', 'late']),
  remarks: z.string().max(200, 'Remarks must not exceed 200 characters').optional()
});

// Marks validation schemas
export const addMarksSchema = z.object({
  studentId: CommonSchemas.uuid,
  assignmentId: CommonSchemas.uuid,
  marksObtained: CommonSchemas.nonNegativeInteger,
  feedback: z.string().max(500, 'Feedback must not exceed 500 characters').optional()
}).refine((_data) => {
  // This would need to be validated against the assignment's maxMarks in the controller
  return true;
}, {
  message: 'Marks obtained cannot exceed maximum marks for the assignment'
});

// Notice validation schemas
export const createNoticeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must not exceed 100 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters').max(2000, 'Content must not exceed 2000 characters'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  targetAudience: z.enum(['all', 'students', 'professors', 'admins']).default('all'),
  expiryDate: CommonSchemas.futureDate.optional(),
  institutionId: CommonSchemas.uuid,
  branchId: CommonSchemas.uuid.optional()
});

export const updateNoticeSchema = createNoticeSchema.partial().extend({
  expiryDate: CommonSchemas.dateString.optional() // Allow past dates for updates
});

// Query parameter validation
export const queryParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  filter: z.string().optional(),
  startDate: CommonSchemas.dateString.optional(),
  endDate: CommonSchemas.dateString.optional(),
  status: z.string().optional(),
  category: z.string().optional()
});

// Bulk operation validation
export const bulkOperationSchema = z.object({
  operation: z.enum(['create', 'update', 'delete']),
  data: z.array(z.record(z.any())).min(1, 'At least one item is required').max(100, 'Maximum 100 items allowed per bulk operation')
});

// Custom validation functions
export const validateAcademicYear = (year: string): boolean => {
  const match = year.match(/^(\d{4})-(\d{4})$/);
  if (!match || !match[1] || !match[2]) return false;
  
  const startYear = parseInt(match[1]);
  const endYear = parseInt(match[2]);
  
  return endYear === startYear + 1;
};

export const validateDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start < end;
};

export const validateFileSize = (size: number, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
};

export const validateFileType = (mimeType: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(mimeType);
};

// Sanitization functions
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const sanitizePhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

// Export all schemas for easy access
export const ValidationSchemas = {
  pagination: paginationSchema,
  fileUpload: fileUploadSchema,
  userRole: userRoleSchema,
  createStudent: createStudentSchema,
  updateStudent: updateStudentSchema,
  createProfessor: createProfessorSchema,
  updateProfessor: updateProfessorSchema,
  createCourse: createCourseSchema,
  updateCourse: updateCourseSchema,
  createAssignment: createAssignmentSchema,
  updateAssignment: updateAssignmentSchema,
  markAttendance: markAttendanceSchema,
  addMarks: addMarksSchema,
  createNotice: createNoticeSchema,
  updateNotice: updateNoticeSchema,
  queryParams: queryParamsSchema,
  bulkOperation: bulkOperationSchema
};

export default {
  ValidationPatterns,
  CommonSchemas,
  ValidationSchemas,
  validateAcademicYear,
  validateDateRange,
  validateFileSize,
  validateFileType,
  sanitizeString,
  sanitizeEmail,
  sanitizePhone
};