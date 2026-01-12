/**
 * API Types for Frontend
 * Types that match the backend API responses
 */

// User Roles
export type UserRole = 'admin' | 'professor' | 'student';

// Enhanced API Error interface
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  data?: any;
  timestamp?: string;
}

// Base API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
  pagination?: PaginationInfo;
}

// Pagination
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Search and Filter Types
export interface SearchFilters extends PaginationParams, SortParams {
  search?: string;
  branch?: string;
  semester?: number;
  isActive?: boolean;
  department?: string;
  priority?: string;
  targetAudience?: string;
  course?: string;
  professor?: string;
  academicYear?: string;
  dueDate?: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

// User Types
export interface User {
  id: string;
  name?: string; // For backward compatibility with some legacy pages
  email: string;
  role: UserRole;
  isActive: boolean;
  institutionId?: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
  profile: UserProfile;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  avatar?: string;
  address?: Address;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// Student Types
export interface Student {
  id: string;
  userId: string;
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
  branch?: Branch;
  institution?: Institution;
  courses?: Course[];
}

export interface StudentResponse extends Student { }

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

export interface UpdateStudentRequest extends Partial<CreateStudentRequest> {
  isActive?: boolean;
}

// Professor Types
export interface Professor {
  id: string;
  userId: string;
  employeeId: string;
  branchId?: string;
  institutionId: string;
  department: string;
  designation: string;
  phoneNumber?: string;
  qualification?: string;
  experience?: number;
  specialization?: string | string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
  branch?: Branch;
  branches?: { branch: Branch }[];
  institution?: Institution;
  courses?: Course[];
}

export interface ProfessorResponse extends Professor { }

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

export interface UpdateProfessorRequest extends Partial<CreateProfessorRequest> {
  isActive?: boolean;
}

// Course Types
export interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  credits: number;
  semester: number;
  academicYear: string;
  branchId: string;
  professorId: string;
  institutionId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  professor?: Professor;
  branch?: Branch;
  institution?: Institution;
  enrollments?: CourseEnrollment[];
  assignments?: Assignment[];
}

export interface CourseResponse extends Course { }

export interface CreateCourseRequest {
  code: string;
  name: string;
  description?: string;
  credits: number;
  semester: number;
  branchId: string;
  professorId: string;
  institutionId: string;
  syllabus?: string;
  prerequisites?: string[];
  isElective?: boolean;
  maxStudents?: number;
}

export interface UpdateCourseRequest extends Partial<CreateCourseRequest> {
  isActive?: boolean;
}

// Course Enrollment Types
export interface CourseEnrollment {
  id: string;
  courseId: string;
  studentId: string;
  enrolledAt: string;
  isActive: boolean;
  course?: Course;
  student?: Student;
}

// Assignment Types
export interface Assignment {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  professorId: string;
  dueDate?: string;
  maxMarks: number;
  fileAttachments?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  course?: Course;
  professor?: Professor;
  submissions?: AssignmentSubmission[];
}

export interface AssignmentResponse extends Assignment { }

export interface CreateAssignmentRequest {
  title: string;
  description?: string;
  courseId: string;
  dueDate?: string;
  maxMarks: number;
  fileAttachments?: string[];
}

export interface UpdateAssignmentRequest extends Partial<CreateAssignmentRequest> {
  isActive?: boolean;
}

// Assignment Submission Types
export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  submissionText?: string;
  fileUrls?: string[];
  submittedAt: string;
  isLate: boolean;
  assignment?: Assignment;
  student?: Student;
  marks?: AssignmentMarks;
}

export interface AssignmentMarks {
  id: string;
  submissionId: string;
  marksObtained: number;
  feedback?: string;
  gradedAt: string;
  gradedBy: string;
}

// Notice Types
export interface Notice {
  id: string;
  title: string;
  content: string;
  authorId: string;
  institutionId: string;
  targetAudience: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  author?: User;
  institution?: Institution;
}

export interface NoticeResponse extends Notice { }

export interface CreateNoticeRequest {
  title: string;
  content: string;
  targetAudience: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  expiresAt?: string;
}

export interface UpdateNoticeRequest extends Partial<CreateNoticeRequest> {
  isActive?: boolean;
}

// Branch Types
export interface Branch {
  id: string;
  name: string;
  code: string;
  description?: string;
  intakeCapacity?: number;
  establishedYear?: number;
  institutionId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  institution?: Institution;
  students?: Student[];
  professors?: Professor[];
  courses?: Course[];
}

export interface BranchResponse extends Branch { }

export interface CreateBranchRequest {
  name: string;
  code: string;
  description?: string;
  intakeCapacity?: number;
  establishedYear?: number;
  institutionId: string;
}

export interface UpdateBranchRequest extends Partial<CreateBranchRequest> {
  isActive?: boolean;
}

// Institution Types
export interface Institution {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branches?: Branch[];
  users?: User[];
}

// Subject Types
export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  credits: number;
  branchId: string;
  semester: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branch?: Branch;
}

export interface SubjectResponse extends Subject { }

export interface CreateSubjectRequest {
  name: string;
  code: string;
  description?: string;
  credits: number;
  branchId: string;
  semester: number;
}

export interface UpdateSubjectRequest extends Partial<CreateSubjectRequest> {
  isActive?: boolean;
}

// Attendance Types
export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  markedBy: string;
  createdAt: string;
  student?: Student;
  course?: Course;
  markedByUser?: User;
}

export interface AttendanceResponse extends Attendance { }

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late';
  course: {
    id: string;
    name: string;
    code: string;
  };
}

export interface CreateAttendanceRequest {
  studentId: string;
  courseId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

// Marks Types
export interface Marks {
  id: string;
  studentId: string;
  courseId: string;
  assignmentId?: string;
  examType: 'assignment' | 'quiz' | 'midterm' | 'final';
  marksObtained: number;
  maxMarks: number;
  gradedBy: string;
  gradedAt: string;
  feedback?: string;
  student?: Student;
  course?: Course;
  assignment?: Assignment;
  gradedByUser?: User;
}

export interface MarksResponse extends Marks { }

export interface CreateMarksRequest {
  studentId: string;
  courseId: string;
  assignmentId?: string;
  examType: 'assignment' | 'quiz' | 'midterm' | 'final';
  marksObtained: number;
  maxMarks: number;
  feedback?: string;
}

export interface UpdateMarksRequest extends Partial<CreateMarksRequest> { }

// Analytics Types
export interface AnalyticsData {
  totalStudents?: number;
  totalProfessors?: number;
  totalCourses?: number;
  totalBranches?: number;
  totalNotices?: number;
  activeStudents?: number;
  enrolledCourses?: number;
  totalAssignments?: number;
  submittedAssignments?: number;
  pendingGrading?: number;
  recentNotices?: Notice[];
  recentSubmissions?: AssignmentSubmission[];
  courseAnalytics?: any[];
  performanceMetrics?: any;
  attendanceStats?: any;
}

export interface DashboardData extends AnalyticsData {
  assignments?: Assignment[];
  marks?: MarksResponse[];
  notices?: Notice[];
  totalClasses?: number;
  pendingToGrade?: number;
  upcomingAssignments?: Assignment[];
}

export interface StudentDashboardData extends DashboardData {
  assignments: Assignment[];
  marks: MarksResponse[];
  notices: Notice[];
}

export interface ProfessorDashboardData extends DashboardData {
  totalClasses: number;
  totalStudents: number;
  totalAssignments: number;
  pendingToGrade: number;
  upcomingAssignments: Assignment[];
}

// Notification Types
export interface NotificationResponse {
  id: string;
  type: 'notice' | 'assignment' | 'grade' | 'attendance' | 'system' | 'reminder';
  title: string;
  message: string;
  data?: any;
  userId: string;
  institutionId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  readAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationTypes: {
    notices: boolean;
    assignments: boolean;
    grades: boolean;
    attendance: boolean;
    reminders: boolean;
    system: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  createdAt: string;
  updatedAt: string;
}

// File Upload Types
export interface FileUploadResponse {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  publicId: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface FileUploadRequest {
  fileName: string;
  fileType: 'assignment' | 'profile' | 'document' | 'notice';
  description?: string;
  isPublic?: boolean;
}

// Bulk Operations
export interface BulkImportResponse {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

export interface BulkDeleteRequest {
  ids: string[];
}

export interface BulkUpdateRequest<T = any> {
  ids: string[];
  updates: Partial<T>;
}

// Semester Types
export interface Semester {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  academicYear: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SemesterResponse extends Semester { }

export interface CreateSemesterRequest {
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  academicYear: string;
}

export interface UpdateSemesterRequest extends Partial<CreateSemesterRequest> {
  isActive?: boolean;
}

// Real-time Types
export interface NotificationMessage {
  id: string;
  type: 'notice' | 'assignment' | 'grade' | 'attendance' | 'system';
  title: string;
  message: string;
  data?: any;
  userId?: string;
  institutionId?: string;
  createdAt: string;
  read: boolean;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

// Pagination Response
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

// Error Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}