import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
  QueryKey
} from '@tanstack/react-query';
import type { ApiResponse, ApiError } from '../types/api';

// Enhanced query options with better defaults
interface EnhancedQueryOptions<TData, TError = ApiError> 
  extends Omit<UseQueryOptions<ApiResponse<TData>, TError, TData>, 'queryFn' | 'queryKey'> {
  queryKey?: QueryKey;
}

interface EnhancedMutationOptions<TData, TVariables, TError = ApiError>
  extends Omit<UseMutationOptions<ApiResponse<TData>, TError, TVariables>, 'mutationFn'> {
  // Custom options can be added here
}

// Query factory functions
export const createQuery = <TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<ApiResponse<TData>>,
  options?: EnhancedQueryOptions<TData>
) => {
  return useQuery({
    queryKey,
    queryFn,
    select: (response: ApiResponse<TData>) => response.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors except 408, 429
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as ApiError).status;
        if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
          return false;
        }
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const createMutation = <TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: EnhancedMutationOptions<TData, TVariables>
) => {
  return useMutation({
    mutationFn,
    retry: (failureCount, error) => {
      // Only retry on network errors or 5xx errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as ApiError).status;
        return status >= 500 && failureCount < 2;
      }
      return failureCount < 1; // Retry once for network errors
    },
    ...options,
  });
};

// Pagination utilities
export interface PaginationParams {
  page?: number;
  limit?: number;
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

export const createPaginatedQuery = <TData>(
  baseQueryKey: QueryKey,
  queryFn: (params: PaginationParams) => Promise<ApiResponse<PaginatedResponse<TData>>>,
  params: PaginationParams = {},
  options?: Partial<EnhancedQueryOptions<PaginatedResponse<TData>>>
) => {
  return createQuery(
    [...baseQueryKey, 'paginated', params],
    () => queryFn(params),
    {
      placeholderData: (previousData) => previousData, // Keep previous data while loading new page
      ...options,
    }
  );
};

// Infinite query utilities
export const createInfiniteQuery = <TData>(
  queryKey: QueryKey,
  queryFn: ({ pageParam }: { pageParam: number }) => Promise<ApiResponse<PaginatedResponse<TData>>>,
  options?: any
) => {
  return useQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }: { pageParam?: number }) => queryFn({ pageParam }),
    getNextPageParam: (lastPage: ApiResponse<PaginatedResponse<TData>>) => {
      const pagination = lastPage.data.pagination;
      return pagination.hasNext ? pagination.page + 1 : undefined;
    },
    getPreviousPageParam: (firstPage: ApiResponse<PaginatedResponse<TData>>) => {
      const pagination = firstPage.data.pagination;
      return pagination.hasPrev ? pagination.page - 1 : undefined;
    },
    select: (data: any) => ({
      pages: data.pages.map((page: ApiResponse<PaginatedResponse<TData>>) => page.data),
      pageParams: data.pageParams,
    }),
    ...options,
  });
};

// Cache management utilities
export const useCacheManager = () => {
  const queryClient = useQueryClient();

  return {
    // Invalidate queries by pattern
    invalidateByPattern: (pattern: string) => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey.some(key => 
            typeof key === 'string' && key.includes(pattern)
          );
        },
      });
    },

    // Remove queries by pattern
    removeByPattern: (pattern: string) => {
      queryClient.removeQueries({
        predicate: (query) => {
          return query.queryKey.some(key => 
            typeof key === 'string' && key.includes(pattern)
          );
        },
      });
    },

    // Prefetch data
    prefetch: async <TData>(
      queryKey: QueryKey,
      queryFn: () => Promise<ApiResponse<TData>>,
      options?: { staleTime?: number }
    ) => {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: options?.staleTime || 5 * 60 * 1000,
      });
    },

    // Set query data
    setQueryData: <TData>(queryKey: QueryKey, data: TData) => {
      queryClient.setQueryData(queryKey, (old: ApiResponse<TData> | undefined) => ({
        ...old,
        data,
        success: true,
        message: 'Data updated',
        timestamp: new Date().toISOString(),
      } as ApiResponse<TData>));
    },

    // Get query data
    getQueryData: <TData>(queryKey: QueryKey): TData | undefined => {
      const response = queryClient.getQueryData<ApiResponse<TData>>(queryKey);
      return response?.data;
    },

    // Clear all cache
    clear: () => queryClient.clear(),

    // Get cache stats
    getCacheStats: () => {
      const cache = queryClient.getQueryCache();
      return {
        totalQueries: cache.getAll().length,
        activeQueries: cache.getAll().filter(query => query.getObserversCount() > 0).length,
        staleQueries: cache.getAll().filter(query => query.isStale()).length,
      };
    },
  };
};

// Error boundary utilities
export const createErrorBoundaryFallback = (error: ApiError) => {
  return {
    title: 'Something went wrong',
    message: error.message || 'An unexpected error occurred',
    status: error.status,
    code: error.code,
    canRetry: error.status >= 500 || error.status === 0,
  };
};

// Query key factories
export const queryKeys = {
  // Auth
  auth: ['auth'] as const,
  authUser: () => [...queryKeys.auth, 'user'] as const,

  // Students
  students: ['students'] as const,
  studentsList: (filters?: any) => [...queryKeys.students, 'list', filters] as const,
  studentDetail: (id: string) => [...queryKeys.students, 'detail', id] as const,
  studentDashboard: (id?: string) => [...queryKeys.students, 'dashboard', id || 'me'] as const,

  // Professors
  professors: ['professors'] as const,
  professorsList: (filters?: any) => [...queryKeys.professors, 'list', filters] as const,
  professorDetail: (id: string) => [...queryKeys.professors, 'detail', id] as const,
  professorDashboard: (id?: string) => [...queryKeys.professors, 'dashboard', id || 'me'] as const,

  // Courses
  courses: ['courses'] as const,
  coursesList: (filters?: any) => [...queryKeys.courses, 'list', filters] as const,
  courseDetail: (id: string) => [...queryKeys.courses, 'detail', id] as const,

  // Assignments
  assignments: ['assignments'] as const,
  assignmentsList: (filters?: any) => [...queryKeys.assignments, 'list', filters] as const,
  assignmentDetail: (id: string) => [...queryKeys.assignments, 'detail', id] as const,

  // Notices
  notices: ['notices'] as const,
  noticesList: (filters?: any) => [...queryKeys.notices, 'list', filters] as const,
  noticeDetail: (id: string) => [...queryKeys.notices, 'detail', id] as const,

  // Notifications
  notifications: ['notifications'] as const,
  notificationsList: (filters?: any) => [...queryKeys.notifications, 'list', filters] as const,
  notificationDetail: (id: string) => [...queryKeys.notifications, 'detail', id] as const,
  notificationsUnreadCount: () => [...queryKeys.notifications, 'unread-count'] as const,
  notificationPreferences: () => [...queryKeys.notifications, 'preferences'] as const,

  // Analytics
  analytics: ['analytics'] as const,
  analyticsData: () => [...queryKeys.analytics, 'data'] as const,

  // Branches
  branches: ['branches'] as const,
  branchesList: () => [...queryKeys.branches, 'list'] as const,
  branchDetail: (id: string) => [...queryKeys.branches, 'detail', id] as const,

  // Subjects
  subjects: ['subjects'] as const,
  subjectsList: () => [...queryKeys.subjects, 'list'] as const,
  subjectDetail: (id: string) => [...queryKeys.subjects, 'detail', id] as const,

  // Marks
  marks: ['marks'] as const,
  marksList: (filters?: any) => [...queryKeys.marks, 'list', filters] as const,

  // Attendance
  attendance: ['attendance'] as const,
  attendanceList: (filters?: any) => [...queryKeys.attendance, 'list', filters] as const,
} as const;

export type QueryKeys = typeof queryKeys;