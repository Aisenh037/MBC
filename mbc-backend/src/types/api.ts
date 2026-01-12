// ==============================================
// API Types - Request/Response Interfaces
// ==============================================

import type { UserRole } from '@prisma/client';
import type { 
  User, 
  Course, 
  Assignment, 
  Submission, 
  Attendance, 
  Notice,
  PaginatedResponse,
  StudentProfile,
  ProfessorProfile,
  AdminProfile
} from './database';

// ==============================================
// Common API Types
// ==============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
  error?: ApiError;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId: string;
}

// ==============================================
// Authentication API Types
// ==============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// ==============================================
// User Management API Types
// ==============================================

export interface CreateUserRequest {
  email: string;
  role: UserRole;
  profile: StudentProfile | ProfessorProfile | AdminProfile;
  institutionId?: string;
  branchId?: string;
  password?: string; // Optional, can be generated
}

export interface UpdateUserRequest {
  profile?: Partial<StudentProfile | ProfessorProfile | AdminProfile>;
  institutionId?: string;
  branchId?: string;
  isActive?: boolean;
}

export interface UserListResponse extends PaginatedResponse<User> {}

// ==============================================
// Student Management API Types
// ==============================================

export interface CreateStudentRequest {
  name: string;
  email: string;
  rollNumber: string;
  branchId: string;
  institutionId: string;
  semester: number;
  academicYear: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  guardianName?: string;
  guardianPhone?: string;
}

export interface UpdateStudentRequest {
  name?: string;
  email?: string;
  rollNumber?: string;
  branchId?: string;
  semester?: number;
  academicYear?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  guardianName?: string;
  guardianPhone?: string;
}

export interface StudentResponse {
  id: string;
  roll_number: string;
  semester: number;
  academic_year: string;
  phone_number?: string;
  address?: string;
  date_of_birth?: string;
  guardian_name?: string;
  guardian_phone?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    is_active: boolean;
  };
  branch?: {
    id: string;
    name: string;
  };
  institution?: {
    id: string;
    name: string;
  };
  courses?: any[];
}

export interface BulkImportResponse {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

// ==============================================
// Professor Management API Types
// ==============================================

export interface CreateProfessorRequest {
  name: string;
  email: string;
  employeeId: string;
  department: string;
  designation: string;
  branchIds: string[];
  institutionId: string;
  phoneNumber?: string;
  address?: string;
  dateOfJoining?: string;
  qualification?: string;
  experience?: number;
  specialization?: string;
}

export interface UpdateProfessorRequest {
  name?: string;
  email?: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  branchIds?: string[];
  phoneNumber?: string;
  address?: string;
  dateOfJoining?: string;
  qualification?: string;
  experience?: number;
  specialization?: string;
}

export interface ProfessorResponse {
  id: string;
  employee_id: string;
  department: string;
  designation: string;
  phone_number?: string;
  address?: string;
  date_of_joining?: string;
  qualification?: string;
  experience?: number;
  specialization?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    is_active: boolean;
  };
  branches?: {
    branch: {
      id: string;
      name: string;
    };
  }[];
  institution?: {
    id: string;
    name: string;
  };
  courses?: any[];
}

// ==============================================
// Course Management API Types
// ==============================================

export interface CreateCourseRequest {
  name: string;
  code: string;
  description?: string;
  credits: number;
  semester: number;
  branchId: string;
  institutionId: string;
  professorId: string;
  syllabus?: string;
  prerequisites?: string[];
  isElective?: boolean;
  maxStudents?: number;
}

export interface UpdateCourseRequest {
  name?: string;
  code?: string;
  description?: string;
  credits?: number;
  semester?: number;
  branchId?: string;
  professorId?: string;
  syllabus?: string;
  prerequisites?: string[];
  isElective?: boolean;
  maxStudents?: number;
}

export interface CourseResponse {
  id: string;
  name: string;
  code: string;
  description?: string;
  credits: number;
  semester: number;
  syllabus?: string;
  is_elective: boolean;
  max_students?: number;
  branch?: {
    id: string;
    name: string;
  };
  institution?: {
    id: string;
    name: string;
  };
  professor?: {
    id: string;
    employee_id: string;
    department?: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
  };
  prerequisites?: {
    prerequisite: {
      id: string;
      name: string;
      code: string;
    };
  }[];
  enrollments?: any[];
}

export interface CourseListResponse extends PaginatedResponse<Course> {}

// ==============================================
// Assignment API Types
// ==============================================

export interface CreateAssignmentRequest {
  courseId: string;
  title: string;
  description?: string;
  dueDate?: string; // ISO date string
  maxMarks: number;
  fileAttachments?: string[];
}

export interface UpdateAssignmentRequest {
  title?: string;
  description?: string;
  dueDate?: string;
  maxMarks?: number;
  fileAttachments?: string[];
}

export interface SubmissionRequest {
  content?: string;
  fileAttachments?: string[];
}

export interface GradeSubmissionRequest {
  marksObtained: number;
  feedback?: string;
}

export interface AssignmentListResponse extends PaginatedResponse<Assignment> {}
export interface SubmissionListResponse extends PaginatedResponse<Submission> {}

// ==============================================
// Attendance API Types
// ==============================================

export interface MarkAttendanceRequest {
  courseId: string;
  date: string; // ISO date string
  attendanceRecords: {
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
  }[];
}

export interface AttendanceReportRequest {
  courseId?: string;
  studentId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AttendanceListResponse extends PaginatedResponse<Attendance> {}

// ==============================================
// Notice API Types
// ==============================================

export interface CreateNoticeRequest {
  title: string;
  content: string;
  targetAudience: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  expiresAt?: string; // ISO date string
}

export interface UpdateNoticeRequest {
  title?: string;
  content?: string;
  targetAudience?: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  expiresAt?: string;
}

export interface NoticeListResponse extends PaginatedResponse<Notice> {}

// ==============================================
// Analytics API Types
// ==============================================

export interface DashboardStatsResponse {
  totalStudents: number;
  totalProfessors: number;
  totalCourses: number;
  totalAssignments: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'assignment' | 'submission' | 'attendance' | 'notice';
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

export interface StudentPerformanceResponse {
  studentId: string;
  overallGPA: number;
  semesterWiseGPA: SemesterGPA[];
  subjectPerformance: SubjectPerformance[];
  attendanceRate: number;
  assignmentCompletionRate: number;
}

export interface SemesterGPA {
  semester: number;
  gpa: number;
  credits: number;
}

export interface SubjectPerformance {
  courseId: string;
  courseName: string;
  grade: string;
  marks: number;
  maxMarks: number;
  attendancePercentage: number;
}

// ==============================================
// File Upload API Types
// ==============================================

export interface FileUploadResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  publicId: string;
  uploadedAt: string;
}

export interface FileUploadRequest {
  file: File;
  category: 'assignment' | 'submission' | 'profile' | 'document';
  metadata?: Record<string, any>;
}

export interface SignedUploadUrlResponse {
  url: string;
  signature: string;
  timestamp: number;
  api_key: string;
  folder: string;
}