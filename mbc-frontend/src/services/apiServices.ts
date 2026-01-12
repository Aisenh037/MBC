import { typedApiClient } from './typedApiClient';
import { PaginationParams, PaginatedResponse } from './queryUtils';
import type {
  // Auth types
  LoginCredentials,
  AuthResponse,
  User,
  
  // Student types
  StudentResponse,
  CreateStudentRequest,
  UpdateStudentRequest,
  
  // Professor types
  ProfessorResponse,
  CreateProfessorRequest,
  UpdateProfessorRequest,
  
  // Course types
  CourseResponse,
  CreateCourseRequest,
  UpdateCourseRequest,
  
  // Assignment types
  AssignmentResponse,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  
  // Notice types
  NoticeResponse,
  CreateNoticeRequest,
  UpdateNoticeRequest,
  
  // Notification types
  NotificationResponse,
  NotificationPreferences,
  
  // Other types
  BranchResponse,
  CreateBranchRequest,
  UpdateBranchRequest,
  SubjectResponse,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  MarksResponse,
  CreateMarksRequest,
  UpdateMarksRequest,
  AttendanceResponse,
  CreateAttendanceRequest,
  AnalyticsData,
  DashboardData,
  BulkImportResponse,
  SearchFilters,
} from '../types/api';

// Auth Service
export class AuthService {
  static login(credentials: LoginCredentials) {
    return typedApiClient.post<AuthResponse>('/auth/login', credentials);
  }

  static logout() {
    return typedApiClient.post<{ message: string }>('/auth/logout');
  }

  static getMe() {
    return typedApiClient.get<User>('/auth/me');
  }

  static refreshToken() {
    return typedApiClient.post<AuthResponse>('/auth/refresh');
  }

  static forgotPassword(email: string) {
    return typedApiClient.post<{ message: string }>('/auth/forgot-password', { email });
  }

  static resetPassword(token: string, password: string) {
    return typedApiClient.post<{ message: string }>('/auth/reset-password', { token, password });
  }
}

// Student Service
export class StudentService {
  static getStudents(params?: SearchFilters & PaginationParams) {
    return typedApiClient.get<PaginatedResponse<StudentResponse>>('/students', { params });
  }

  static getStudent(id: string) {
    return typedApiClient.get<StudentResponse>(`/students/${id}`);
  }

  static createStudent(data: CreateStudentRequest) {
    return typedApiClient.post<StudentResponse>('/students', data);
  }

  static updateStudent(id: string, data: UpdateStudentRequest) {
    return typedApiClient.put<StudentResponse>(`/students/${id}`, data);
  }

  static deleteStudent(id: string) {
    return typedApiClient.delete<void>(`/students/${id}`);
  }

  static bulkImportStudents(file: File) {
    return typedApiClient.uploadFile<BulkImportResponse>('/students/bulk-import', file);
  }

  static exportStudents() {
    return typedApiClient.get<Blob>('/students/export', { responseType: 'blob' });
  }

  static getStudentDashboard(id?: string) {
    return typedApiClient.get<DashboardData>(`/dashboards/student/${id || 'me'}`);
  }

  static sendResetLink(id: string) {
    return typedApiClient.post<{ message: string }>(`/students/${id}/send-reset-link`);
  }
}

// Professor Service
export class ProfessorService {
  static getProfessors(params?: SearchFilters & PaginationParams) {
    return typedApiClient.get<PaginatedResponse<ProfessorResponse>>('/professors', { params });
  }

  static getProfessor(id: string) {
    return typedApiClient.get<ProfessorResponse>(`/professors/${id}`);
  }

  static createProfessor(data: CreateProfessorRequest) {
    return typedApiClient.post<ProfessorResponse>('/professors', data);
  }

  static updateProfessor(id: string, data: UpdateProfessorRequest) {
    return typedApiClient.put<ProfessorResponse>(`/professors/${id}`, data);
  }

  static deleteProfessor(id: string) {
    return typedApiClient.delete<void>(`/professors/${id}`);
  }

  static getProfessorDashboard(id?: string) {
    return typedApiClient.get<DashboardData>(`/dashboards/professor/${id || 'me'}`);
  }
}

// Course Service
export class CourseService {
  static getCourses(params?: SearchFilters & PaginationParams) {
    return typedApiClient.get<PaginatedResponse<CourseResponse>>('/courses', { params });
  }

  static getCourse(id: string) {
    return typedApiClient.get<CourseResponse>(`/courses/${id}`);
  }

  static createCourse(data: CreateCourseRequest) {
    return typedApiClient.post<CourseResponse>('/courses', data);
  }

  static updateCourse(id: string, data: UpdateCourseRequest) {
    return typedApiClient.put<CourseResponse>(`/courses/${id}`, data);
  }

  static deleteCourse(id: string) {
    return typedApiClient.delete<void>(`/courses/${id}`);
  }
}

// Assignment Service
export class AssignmentService {
  static getAssignments(params?: SearchFilters & PaginationParams) {
    return typedApiClient.get<PaginatedResponse<AssignmentResponse>>('/assignments', { params });
  }

  static getAssignment(id: string) {
    return typedApiClient.get<AssignmentResponse>(`/assignments/${id}`);
  }

  static createAssignment(data: CreateAssignmentRequest) {
    return typedApiClient.post<AssignmentResponse>('/assignments', data);
  }

  static updateAssignment(id: string, data: UpdateAssignmentRequest) {
    return typedApiClient.put<AssignmentResponse>(`/assignments/${id}`, data);
  }

  static deleteAssignment(id: string) {
    return typedApiClient.delete<void>(`/assignments/${id}`);
  }

  static submitAssignment(assignmentId: string, file: File, additionalData?: Record<string, any>) {
    return typedApiClient.uploadFile<{ message: string; submissionId: string }>(
      `/assignments/${assignmentId}/submit`,
      file,
      'submission',
      additionalData
    );
  }
}

// Notice Service
export class NoticeService {
  static getNotices(params?: SearchFilters & PaginationParams) {
    return typedApiClient.get<PaginatedResponse<NoticeResponse>>('/notices', { params });
  }

  static getNotice(id: string) {
    return typedApiClient.get<NoticeResponse>(`/notices/${id}`);
  }

  static createNotice(data: CreateNoticeRequest) {
    return typedApiClient.post<NoticeResponse>('/notices', data);
  }

  static updateNotice(id: string, data: UpdateNoticeRequest) {
    return typedApiClient.put<NoticeResponse>(`/notices/${id}`, data);
  }

  static deleteNotice(id: string) {
    return typedApiClient.delete<void>(`/notices/${id}`);
  }
}

// Branch Service
export class BranchService {
  static getBranches() {
    return typedApiClient.get<BranchResponse[]>('/branches');
  }

  static getBranch(id: string) {
    return typedApiClient.get<BranchResponse>(`/branches/${id}`);
  }

  static createBranch(data: CreateBranchRequest) {
    return typedApiClient.post<BranchResponse>('/branches', data);
  }

  static updateBranch(id: string, data: UpdateBranchRequest) {
    return typedApiClient.put<BranchResponse>(`/branches/${id}`, data);
  }

  static deleteBranch(id: string) {
    return typedApiClient.delete<void>(`/branches/${id}`);
  }
}

// Subject Service
export class SubjectService {
  static getSubjects() {
    return typedApiClient.get<SubjectResponse[]>('/subjects');
  }

  static getSubject(id: string) {
    return typedApiClient.get<SubjectResponse>(`/subjects/${id}`);
  }

  static createSubject(data: CreateSubjectRequest) {
    return typedApiClient.post<SubjectResponse>('/subjects', data);
  }

  static updateSubject(id: string, data: UpdateSubjectRequest) {
    return typedApiClient.put<SubjectResponse>(`/subjects/${id}`, data);
  }

  static deleteSubject(id: string) {
    return typedApiClient.delete<void>(`/subjects/${id}`);
  }
}

// Marks Service
export class MarksService {
  static getMarks(params?: SearchFilters & PaginationParams) {
    return typedApiClient.get<PaginatedResponse<MarksResponse>>('/marks', { params });
  }

  static createMark(data: CreateMarksRequest) {
    return typedApiClient.post<MarksResponse>('/marks', data);
  }

  static updateMark(id: string, data: UpdateMarksRequest) {
    return typedApiClient.put<MarksResponse>(`/marks/${id}`, data);
  }

  static deleteMark(id: string) {
    return typedApiClient.delete<void>(`/marks/${id}`);
  }
}

// Attendance Service
export class AttendanceService {
  static getAttendance(params?: SearchFilters & PaginationParams) {
    return typedApiClient.get<PaginatedResponse<AttendanceResponse>>('/attendance', { params });
  }

  static markAttendance(data: CreateAttendanceRequest) {
    return typedApiClient.post<AttendanceResponse>('/attendance', data);
  }
}

// Analytics Service
export class AnalyticsService {
  static getAnalytics() {
    return typedApiClient.get<AnalyticsData>('/analytics');
  }

  static getStudentAnalytics(studentId?: string) {
    return typedApiClient.get<AnalyticsData>(`/analytics/student/${studentId || 'me'}`);
  }

  static getProfessorAnalytics(professorId?: string) {
    return typedApiClient.get<AnalyticsData>(`/analytics/professor/${professorId || 'me'}`);
  }

  static getCourseAnalytics(courseId: string) {
    return typedApiClient.get<AnalyticsData>(`/analytics/course/${courseId}`);
  }
}

// File Service
export class FileService {
  static uploadFile(file: File, type: 'assignment' | 'profile' | 'document' = 'document') {
    return typedApiClient.uploadFile<{ url: string; publicId: string; fileId: string }>(
      '/files/upload',
      file,
      'file',
      { type }
    );
  }

  static deleteFile(fileId: string) {
    return typedApiClient.delete<{ message: string }>(`/files/${fileId}`);
  }

  static getFileUrl(fileId: string, options?: { width?: number; height?: number; quality?: number }) {
    return typedApiClient.get<{ url: string }>(`/files/${fileId}/url`, { params: options });
  }
}

// Notification Service
export class NotificationService {
  static getNotifications(params?: SearchFilters & PaginationParams) {
    return typedApiClient.get<PaginatedResponse<NotificationResponse>>('/notifications', { params });
  }

  static getNotification(id: string) {
    return typedApiClient.get<NotificationResponse>(`/notifications/${id}`);
  }

  static markAsRead(id: string) {
    return typedApiClient.patch<NotificationResponse>(`/notifications/${id}/read`);
  }

  static markAllAsRead() {
    return typedApiClient.patch<{ message: string; count: number }>('/notifications/read-all');
  }

  static deleteNotification(id: string) {
    return typedApiClient.delete<void>(`/notifications/${id}`);
  }

  static getUnreadCount() {
    return typedApiClient.get<{ count: number }>('/notifications/unread-count');
  }

  static updatePreferences(preferences: NotificationPreferences) {
    return typedApiClient.put<NotificationPreferences>('/notifications/preferences', preferences);
  }

  static getPreferences() {
    return typedApiClient.get<NotificationPreferences>('/notifications/preferences');
  }

  static testNotification(type: string, data?: any) {
    return typedApiClient.post<{ message: string }>('/notifications/test', { type, data });
  }
}

// Health Service
export class HealthService {
  static checkHealth() {
    return typedApiClient.get<{ status: string; timestamp: string; services: Record<string, string> }>('/health');
  }

  static checkDatabase() {
    return typedApiClient.get<{ status: string; latency: number }>('/health/database');
  }

  static checkRedis() {
    return typedApiClient.get<{ status: string; latency: number }>('/health/redis');
  }
}

// Export all services
export const apiServices = {
  auth: AuthService,
  students: StudentService,
  professors: ProfessorService,
  courses: CourseService,
  assignments: AssignmentService,
  notices: NoticeService,
  notifications: NotificationService,
  branches: BranchService,
  subjects: SubjectService,
  marks: MarksService,
  attendance: AttendanceService,
  analytics: AnalyticsService,
  files: FileService,
  health: HealthService,
} as const;

export default apiServices;