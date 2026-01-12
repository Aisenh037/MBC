/**
 * Zod Validation Schemas
 * TypeScript-first schema validation with Zod
 */

import { z } from 'zod';

// ==============================================
// Common Validation Patterns
// ==============================================

export const emailSchema = z
  .string()
  .email('Please provide a valid email address')
  .max(255, 'Email must not exceed 255 characters')
  .transform(val => val.toLowerCase().trim());

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

export const uuidSchema = z
  .string()
  .uuid('Must be a valid UUID');

export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Please provide a valid phone number')
  .min(10, 'Phone number must be at least 10 digits')
  .max(20, 'Phone number must not exceed 20 characters')
  .optional();

// ==============================================
// Authentication Schemas
// ==============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: z.enum(['admin', 'professor', 'student']),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

// ==============================================
// Student Schemas
// ==============================================

export const createStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: emailSchema,
  phone: phoneSchema,
  rollNumber: z.string().min(1, 'Roll number is required').max(20),
  branchId: uuidSchema,
  semester: z.number().int().min(1).max(8),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY'),
  dateOfBirth: z.string().datetime().optional(),
  address: z.string().max(500).optional(),
  guardianName: z.string().max(100).optional(),
  guardianPhone: phoneSchema,
});

export const updateStudentSchema = createStudentSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const bulkImportStudentsSchema = z.object({
  students: z.array(createStudentSchema),
  overwriteExisting: z.boolean().default(false),
});

// ==============================================
// Professor Schemas
// ==============================================

export const createProfessorSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: emailSchema,
  phone: phoneSchema,
  employeeId: z.string().min(1, 'Employee ID is required').max(20),
  department: z.string().min(1, 'Department is required').max(100),
  designation: z.string().min(1, 'Designation is required').max(100),
  qualification: z.string().max(200).optional(),
  experience: z.number().int().min(0).max(50).optional(),
  dateOfJoining: z.string().datetime().optional(),
  specialization: z.string().max(200).optional(),
});

export const updateProfessorSchema = createProfessorSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ==============================================
// Course Schemas
// ==============================================

export const createCourseSchema = z.object({
  code: z.string().min(1, 'Course code is required').max(20),
  name: z.string().min(1, 'Course name is required').max(200),
  description: z.string().max(1000).optional(),
  credits: z.number().int().min(1).max(10),
  semester: z.number().int().min(1).max(8),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY'),
  branchId: uuidSchema,
  professorId: uuidSchema,
  syllabus: z.string().max(5000).optional(),
  prerequisites: z.array(z.string()).optional(),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ==============================================
// Assignment Schemas
// ==============================================

export const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Assignment title is required').max(200),
  description: z.string().max(2000).optional(),
  courseId: uuidSchema,
  dueDate: z.string().datetime(),
  maxMarks: z.number().int().min(1).max(1000),
  instructions: z.string().max(5000).optional(),
  attachments: z.array(z.string()).optional(),
  submissionType: z.enum(['file', 'text', 'both']).default('both'),
  allowLateSubmission: z.boolean().default(false),
  lateSubmissionPenalty: z.number().min(0).max(100).optional(),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

export const submitAssignmentSchema = z.object({
  submissionText: z.string().max(10000).optional(),
  fileUrls: z.array(z.string().url()).optional(),
}).refine(
  data => data.submissionText || (data.fileUrls && data.fileUrls.length > 0),
  'Either submission text or file attachments are required'
);

// ==============================================
// Notice Schemas
// ==============================================

export const createNoticeSchema = z.object({
  title: z.string().min(1, 'Notice title is required').max(200),
  content: z.string().min(1, 'Notice content is required').max(5000),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  targetAudience: z.enum(['all', 'students', 'professors', 'specific']).default('all'),
  targetGroups: z.array(z.string()).optional(),
  expiryDate: z.string().datetime().optional(),
  attachments: z.array(z.string()).optional(),
  isUrgent: z.boolean().default(false),
});

export const updateNoticeSchema = createNoticeSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ==============================================
// File Upload Schemas
// ==============================================

export const fileUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.enum(['assignment', 'profile', 'document', 'notice']),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
});

// ==============================================
// Query Parameter Schemas
// ==============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const searchSchema = z.object({
  search: z.string().max(100).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ==============================================
// Combined Schemas for Routes
// ==============================================

export const studentListQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  branch: z.string().uuid().optional(),
  semester: z.coerce.number().int().min(1).max(8).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const courseListQuerySchema = paginationSchema.extend({
  semester: z.coerce.number().int().min(1).max(8).optional(),
  branch: z.string().uuid().optional(),
  professor: z.string().uuid().optional(),
  academicYear: z.string().optional(),
});

export const analyticsQuerySchema = dateRangeSchema.extend({
  type: z.enum(['overview', 'detailed']).default('overview'),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

// Export all schemas as a single object for easier imports
export const schemas = {
  // Auth
  login: loginSchema,
  register: registerSchema,
  forgotPassword: forgotPasswordSchema,
  resetPassword: resetPasswordSchema,
  
  // Student
  createStudent: createStudentSchema,
  updateStudent: updateStudentSchema,
  bulkImportStudents: bulkImportStudentsSchema,
  
  // Professor
  createProfessor: createProfessorSchema,
  updateProfessor: updateProfessorSchema,
  
  // Course
  createCourse: createCourseSchema,
  updateCourse: updateCourseSchema,
  
  // Assignment
  createAssignment: createAssignmentSchema,
  updateAssignment: updateAssignmentSchema,
  submitAssignment: submitAssignmentSchema,
  
  // Notice
  createNotice: createNoticeSchema,
  updateNotice: updateNoticeSchema,
  
  // File
  fileUpload: fileUploadSchema,
  
  // Query params
  pagination: paginationSchema,
  search: searchSchema,
  dateRange: dateRangeSchema,
  studentListQuery: studentListQuerySchema,
  courseListQuery: courseListQuerySchema,
  analyticsQuery: analyticsQuerySchema,
};

export default schemas;