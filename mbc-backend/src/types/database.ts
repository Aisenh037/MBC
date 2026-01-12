// ==============================================
// Database Types - Generated from Prisma Schema
// ==============================================

import type { 
  User as PrismaUser,
  Institution as PrismaInstitution,
  Branch as PrismaBranch,
  Course as PrismaCourse,
  Assignment as PrismaAssignment,
  Submission as PrismaSubmission,
  Attendance as PrismaAttendance,
  Notice as PrismaNotice,
  Enrollment as PrismaEnrollment,
  SystemConfig as PrismaSystemConfig,
  AuditLog as PrismaAuditLog,
  UserRole,
  EnrollmentStatus,
  AttendanceStatus,
  NoticePriority
} from '@prisma/client';

// ==============================================
// Core Entity Types
// ==============================================

export type User = PrismaUser;
export type Institution = PrismaInstitution;
export type Branch = PrismaBranch;
export type Course = PrismaCourse;
export type Assignment = PrismaAssignment;
export type Submission = PrismaSubmission;
export type Attendance = PrismaAttendance;
export type Notice = PrismaNotice;
export type Enrollment = PrismaEnrollment;
export type SystemConfig = PrismaSystemConfig;
export type AuditLog = PrismaAuditLog;

// ==============================================
// Enum Types
// ==============================================

export { UserRole, EnrollmentStatus, AttendanceStatus, NoticePriority };

// ==============================================
// Extended Types with Relations
// ==============================================

export interface UserWithRelations extends User {
  institution?: Institution | null;
  branch?: Branch | null;
  enrollments?: Enrollment[];
  submissions?: Submission[];
  attendanceRecords?: Attendance[];
  assignmentsCreated?: Assignment[];
  attendanceMarked?: Attendance[];
  submissionsGraded?: Submission[];
  noticesCreated?: Notice[];
}

export interface CourseWithRelations extends Course {
  branch: Branch;
  enrollments?: Enrollment[];
  assignments?: Assignment[];
  attendance?: Attendance[];
}

export interface AssignmentWithRelations extends Assignment {
  course: Course;
  professor: User;
  submissions?: Submission[];
}

export interface SubmissionWithRelations extends Submission {
  assignment: Assignment;
  student: User;
  grader?: User | null;
}

// ==============================================
// Profile Types (JSON fields)
// ==============================================

export interface BaseProfile {
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: string; // ISO date string
  address?: Address;
}

export interface StudentProfile extends BaseProfile {
  rollNumber: string;
  admissionYear: number;
  currentSemester: number;
  gpa?: number;
  parentContact?: ContactInfo;
}

export interface ProfessorProfile extends BaseProfile {
  employeeId: string;
  department: string;
  designation: string;
  specialization: string[];
  officeHours?: string;
}

export interface AdminProfile extends BaseProfile {
  employeeId: string;
  department: string;
  permissions: string[];
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface ContactInfo {
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

// ==============================================
// Database Query Types
// ==============================================

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ==============================================
// Filter Types
// ==============================================

export interface UserFilters {
  role?: UserRole;
  institutionId?: string;
  branchId?: string;
  isActive?: boolean;
  search?: string;
}

export interface CourseFilters {
  branchId?: string;
  semester?: number;
  search?: string;
}

export interface AssignmentFilters {
  courseId?: string;
  professorId?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  search?: string;
}

export interface AttendanceFilters {
  courseId?: string;
  studentId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: AttendanceStatus;
}