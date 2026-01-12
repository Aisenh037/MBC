import { useQueryClient } from '@tanstack/react-query';
import { createQuery, createMutation, queryKeys, useCacheManager, PaginationParams } from '../services/queryUtils';
import { apiServices } from '../services/apiServices';
import type {
  LoginCredentials,
  CreateStudentRequest,
  UpdateStudentRequest,
  CreateProfessorRequest,
  UpdateProfessorRequest,
  CreateCourseRequest,
  UpdateCourseRequest,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  CreateNoticeRequest,
  UpdateNoticeRequest,
  NotificationPreferences,
  SearchFilters,
  ApiResponse,
  ApiError
} from '../types/api';

import { useAuthStore } from '../stores/authStore';

// Auth hooks
export const useAuth = {
  login: () => {
    const loginAction = useAuthStore((state) => state.login);
    return createMutation(
      async (credentials: LoginCredentials) => {
        const result = await loginAction(credentials);
        return {
          success: result.success,
          data: result,
          message: 'Login successful',
          timestamp: new Date().toISOString()
        } as ApiResponse<any>;
      }
    );
  },

  logout: () => {
    const logoutAction = useAuthStore((state) => state.logout);
    return createMutation(
      async () => {
        logoutAction();
        return {
          success: true,
          data: null,
          message: 'Logout successful',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>;
      }
    );
  },

  me: () => {
    const checkAuthAction = useAuthStore((state) => state.checkAuth);
    const user = useAuthStore((state) => state.user);
    return createQuery(
      queryKeys.authUser(),
      async () => {
        const isAuthenticated = await checkAuthAction();
        return {
          success: isAuthenticated,
          data: user,
          message: isAuthenticated ? 'User authenticated' : 'User not authenticated',
          timestamp: new Date().toISOString()
        } as ApiResponse<any>;
      }
    );
  },

  forgotPassword: () => createMutation(
    (email: string) => apiServices.auth.forgotPassword(email)
  ),

  resetPassword: () => createMutation(
    ({ token, password }: { token: string; password: string }) =>
      apiServices.auth.resetPassword(token, password)
  ),
};

// Student hooks
export const useStudents = {
  list: (params?: SearchFilters & PaginationParams) => createQuery(
    queryKeys.studentsList(params),
    () => apiServices.students.getStudents(params),
    {
      placeholderData: (previousData) => previousData,
    }
  ),

  detail: (id: string) => createQuery(
    queryKeys.studentDetail(id),
    () => apiServices.students.getStudent(id),
    {
      enabled: !!id,
    }
  ),

  dashboard: (id?: string) => createQuery(
    queryKeys.studentDashboard(id),
    () => apiServices.students.getStudentDashboard(id)
  ),

  create: () => {
    const queryClient = useQueryClient();
    return createMutation(
      (data: CreateStudentRequest) => apiServices.students.createStudent(data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.students });
        },
      }
    );
  },

  update: () => {
    const queryClient = useQueryClient();
    return createMutation(
      ({ id, data }: { id: string; data: UpdateStudentRequest }) =>
        apiServices.students.updateStudent(id, data),
      {
        onSuccess: (_, { id }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.students });
          queryClient.invalidateQueries({ queryKey: queryKeys.studentDetail(id) });
        },
      }
    );
  },

  delete: () => {
    const queryClient = useQueryClient();
    return createMutation(
      (id: string) => apiServices.students.deleteStudent(id),
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.students });
        },
      }
    );
  },

  bulkImport: () => {
    const queryClient = useQueryClient();
    return createMutation(
      (file: File) => apiServices.students.bulkImportStudents(file),
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.students });
        },
      }
    );
  },

  export: () => createMutation(
    () => apiServices.students.exportStudents()
  ),

  sendResetLink: () => createMutation(
    (id: string) => apiServices.students.sendResetLink(id)
  ),
};

// Professor hooks
export const useProfessors = {
  list: (params?: SearchFilters & PaginationParams) => createQuery(
    queryKeys.professorsList(params),
    () => apiServices.professors.getProfessors(params),
    {
      placeholderData: (previousData) => previousData,
    }
  ),

  detail: (id: string) => createQuery(
    queryKeys.professorDetail(id),
    () => apiServices.professors.getProfessor(id),
    {
      enabled: !!id,
    }
  ),

  dashboard: (id?: string) => createQuery(
    queryKeys.professorDashboard(id),
    () => apiServices.professors.getProfessorDashboard(id)
  ),

  create: () => {
    const queryClient = useQueryClient();
    return createMutation(
      (data: CreateProfessorRequest) => apiServices.professors.createProfessor(data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.professors });
        },
      }
    );
  },

  update: () => {
    const queryClient = useQueryClient();
    return createMutation(
      ({ id, data }: { id: string; data: UpdateProfessorRequest }) =>
        apiServices.professors.updateProfessor(id, data),
      {
        onSuccess: (_, { id }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.professors });
          queryClient.invalidateQueries({ queryKey: queryKeys.professorDetail(id) });
        },
      }
    );
  },

  delete: () => {
    const queryClient = useQueryClient();
    return createMutation(
      (id: string) => apiServices.professors.deleteProfessor(id),
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.professors });
        },
      }
    );
  },
};

// Course hooks
export const useCourses = {
  list: (params?: SearchFilters & PaginationParams) => createQuery(
    queryKeys.coursesList(params),
    () => apiServices.courses.getCourses(params),
    {
      placeholderData: (previousData) => previousData,
    }
  ),

  detail: (id: string) => createQuery(
    queryKeys.courseDetail(id),
    () => apiServices.courses.getCourse(id),
    {
      enabled: !!id,
    }
  ),

  create: () => {
    const queryClient = useQueryClient();
    return createMutation(
      (data: CreateCourseRequest) => apiServices.courses.createCourse(data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.courses });
        },
      }
    );
  },

  update: () => {
    const queryClient = useQueryClient();
    return createMutation(
      ({ id, data }: { id: string; data: UpdateCourseRequest }) =>
        apiServices.courses.updateCourse(id, data),
      {
        onSuccess: (_, { id }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.courses });
          queryClient.invalidateQueries({ queryKey: queryKeys.courseDetail(id) });
        },
      }
    );
  },

  delete: () => {
    const queryClient = useQueryClient();
    return createMutation(
      (id: string) => apiServices.courses.deleteCourse(id),
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.courses });
        },
      }
    );
  },
};

// Assignment hooks
export const useAssignments = {
  list: (params?: SearchFilters & PaginationParams) => createQuery(
    queryKeys.assignmentsList(params),
    () => apiServices.assignments.getAssignments(params),
    {
      placeholderData: (previousData) => previousData,
    }
  ),

  detail: (id: string) => createQuery(
    queryKeys.assignmentDetail(id),
    () => apiServices.assignments.getAssignment(id),
    {
      enabled: !!id,
    }
  ),

  create: () => {
    const queryClient = useQueryClient();
    return createMutation(
      (data: CreateAssignmentRequest) => apiServices.assignments.createAssignment(data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.assignments });
        },
      }
    );
  },

  update: () => {
    const queryClient = useQueryClient();
    return createMutation(
      ({ id, data }: { id: string; data: UpdateAssignmentRequest }) =>
        apiServices.assignments.updateAssignment(id, data),
      {
        onSuccess: (_, { id }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.assignments });
          queryClient.invalidateQueries({ queryKey: queryKeys.assignmentDetail(id) });
        },
      }
    );
  },

  delete: () => {
    const queryClient = useQueryClient();
    return createMutation(
      (id: string) => apiServices.assignments.deleteAssignment(id),
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.assignments });
        },
      }
    );
  },

  submit: () => {
    const queryClient = useQueryClient();
    return createMutation(
      ({ assignmentId, file, additionalData }: {
        assignmentId: string;
        file: File;
        additionalData?: Record<string, any>
      }) => apiServices.assignments.submitAssignment(assignmentId, file, additionalData),
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.assignments });
          queryClient.invalidateQueries({ queryKey: queryKeys.studentDashboard() });
        },
      }
    );
  },
};

// Notice hooks
export const useNotices = {
  list: (params?: SearchFilters & PaginationParams) => createQuery(
    queryKeys.noticesList(params),
    () => apiServices.notices.getNotices(params),
    {
      placeholderData: (previousData) => previousData,
    }
  ),

  detail: (id: string) => createQuery(
    queryKeys.noticeDetail(id),
    () => apiServices.notices.getNotice(id),
    {
      enabled: !!id,
    }
  ),

  create: () => {
    const queryClient = useQueryClient();
    return createMutation(
      (data: CreateNoticeRequest) => apiServices.notices.createNotice(data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.notices });
        },
      }
    );
  },

  update: () => {
    const queryClient = useQueryClient();
    return createMutation(
      ({ id, data }: { id: string; data: UpdateNoticeRequest }) =>
        apiServices.notices.updateNotice(id, data),
      {
        onSuccess: (_, { id }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.notices });
          queryClient.invalidateQueries({ queryKey: queryKeys.noticeDetail(id) });
        },
      }
    );
  },

  delete: () => {
    const queryClient = useQueryClient();
    return createMutation(
      (id: string) => apiServices.notices.deleteNotice(id),
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.notices });
        },
      }
    );
  },
};

// Notification hooks
export const useNotifications = {
  list: (params?: SearchFilters & PaginationParams) => createQuery(
    queryKeys.notificationsList(params),
    () => apiServices.notifications.getNotifications(params),
    {
      placeholderData: (previousData) => previousData,
    }
  ),

  detail: (id: string) => createQuery(
    queryKeys.notificationDetail(id),
    () => apiServices.notifications.getNotification(id),
    {
      enabled: !!id,
    }
  ),

  unreadCount: () => createQuery(
    queryKeys.notificationsUnreadCount(),
    () => apiServices.notifications.getUnreadCount(),
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // Refetch every minute
    }
  ),

  preferences: () => createQuery(
    queryKeys.notificationPreferences(),
    () => apiServices.notifications.getPreferences()
  ),

  markAsRead: () => {
    const queryClient = useQueryClient();
    return createMutation(
      (id: string) => apiServices.notifications.markAsRead(id),
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
          queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnreadCount() });
        },
      }
    );
  },

  markAllAsRead: () => {
    const queryClient = useQueryClient();
    return createMutation(
      () => apiServices.notifications.markAllAsRead(),
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
          queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnreadCount() });
        },
      }
    );
  },

  delete: () => {
    const queryClient = useQueryClient();
    return createMutation(
      (id: string) => apiServices.notifications.deleteNotification(id),
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
          queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnreadCount() });
        },
      }
    );
  },

  updatePreferences: () => {
    const queryClient = useQueryClient();
    return createMutation(
      (preferences: NotificationPreferences) => apiServices.notifications.updatePreferences(preferences),
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.notificationPreferences() });
        },
      }
    );
  },

  test: () => createMutation(
    ({ type, data }: { type: string; data?: any }) => apiServices.notifications.testNotification(type, data)
  ),
};

// Analytics hooks
export const useAnalytics = {
  general: () => createQuery(
    queryKeys.analyticsData(),
    () => apiServices.analytics.getAnalytics(),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes for analytics
    }
  ),

  student: (studentId?: string) => createQuery(
    [...queryKeys.analytics, 'student', studentId || 'me'],
    () => apiServices.analytics.getStudentAnalytics(studentId),
    {
      staleTime: 5 * 60 * 1000,
    }
  ),

  professor: (professorId?: string) => createQuery(
    [...queryKeys.analytics, 'professor', professorId || 'me'],
    () => apiServices.analytics.getProfessorAnalytics(professorId),
    {
      staleTime: 5 * 60 * 1000,
    }
  ),

  course: (courseId: string) => createQuery(
    [...queryKeys.analytics, 'course', courseId],
    () => apiServices.analytics.getCourseAnalytics(courseId),
    {
      enabled: !!courseId,
      staleTime: 5 * 60 * 1000,
    }
  ),
};

// File hooks
export const useFiles = {
  upload: () => createMutation(
    ({ file, type }: { file: File; type?: 'assignment' | 'profile' | 'document' }) =>
      apiServices.files.uploadFile(file, type)
  ),

  delete: () => createMutation(
    (fileId: string) => apiServices.files.deleteFile(fileId)
  ),

  getUrl: (fileId: string, options?: { width?: number; height?: number; quality?: number }) =>
    createQuery(
      ['files', 'url', fileId, options],
      () => apiServices.files.getFileUrl(fileId, options),
      {
        enabled: !!fileId,
        staleTime: 30 * 60 * 1000, // 30 minutes for file URLs
      }
    ),
};

// Health hooks
export const useHealth = {
  check: () => createQuery(
    ['health'],
    () => apiServices.health.checkHealth(),
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // Refetch every minute
    }
  ),

  database: () => createQuery(
    ['health', 'database'],
    () => apiServices.health.checkDatabase(),
    {
      staleTime: 30 * 1000,
    }
  ),

  redis: () => createQuery(
    ['health', 'redis'],
    () => apiServices.health.checkRedis(),
    {
      staleTime: 30 * 1000,
    }
  ),
};

// Export all typed hooks
export const useTypedApi = {
  auth: useAuth,
  students: useStudents,
  professors: useProfessors,
  courses: useCourses,
  assignments: useAssignments,
  notices: useNotices,
  notifications: useNotifications,
  analytics: useAnalytics,
  files: useFiles,
  health: useHealth,
  cache: useCacheManager,
} as const;

export default useTypedApi;