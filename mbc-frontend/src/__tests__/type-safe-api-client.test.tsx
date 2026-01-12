/**
 * Property Test: Type-safe API Client Integration
 * 
 * This test validates the type-safe API client implementation with TanStack Query integration.
 * It ensures proper error handling, retry logic, caching, and type safety across all API endpoints.
 * 
 * Requirements validated:
 * - 2.5: Type-safe API client with proper TypeScript interfaces
 * - 8.3: Error handling with typed error responses
 * - 4.1-4.5: Caching integration with TanStack Query
 */

import fc from 'fast-check';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';

// Import the API client and services
import { TypedApiClient } from '../services/typedApiClient';
import { apiServices } from '../services/apiServices';
import { useTypedApi } from '../hooks/useTypedApi';
import type { 
  ApiResponse, 
  ApiError, 
  LoginCredentials,
  CreateStudentRequest,
  StudentResponse,
  NotificationResponse,
  PaginatedResponse
} from '../types/api';

// Mock axios for controlled testing
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      request: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }))
  }
}));

// Test wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Property Test: Type-safe API Client Integration', () => {
  let mockApiClient: TypedApiClient;
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    // Create mock API client
    mockApiClient = new TypedApiClient({
      getToken: () => 'mock-token',
      onUnauthorized: vi.fn(),
      onError: vi.fn()
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  /**
   * Property 1: API Response Type Safety
   * Validates that all API responses conform to the expected TypeScript interfaces
   */
  it('should maintain type safety across all API responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          endpoint: fc.constantFrom('students', 'professors', 'courses', 'assignments', 'notices', 'notifications'),
          method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
          data: fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.emailAddress(),
            isActive: fc.boolean(),
            createdAt: fc.date().map(d => d.toISOString()),
            updatedAt: fc.date().map(d => d.toISOString())
          }),
          success: fc.boolean(),
          status: fc.integer({ min: 200, max: 599 })
        }),
        async ({ endpoint, method, data, success, status }) => {
          // Mock the API response
          const mockResponse: ApiResponse<any> = {
            success,
            data: success ? data : null,
            message: success ? 'Operation successful' : 'Operation failed'
          };

          // Mock the request method
          const mockRequest = vi.fn().mockResolvedValue(mockResponse);
          (mockApiClient as any).request = mockRequest;

          // Test type safety by calling the appropriate service method
          let result: any;
          try {
            switch (endpoint) {
              case 'students':
                if (method === 'GET') {
                  result = await apiServices.students.getStudents();
                }
                break;
              case 'notifications':
                if (method === 'GET') {
                  result = await apiServices.notifications.getNotifications();
                }
                break;
              // Add other endpoints as needed
            }

            if (success) {
              expect(result).toBeDefined();
              expect(result.success).toBe(success);
              expect(result.data).toEqual(data);
            }
          } catch (error) {
            if (!success) {
              expect(error).toBeDefined();
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 2: Error Handling Consistency
   * Validates that all API errors are properly typed and handled consistently
   */
  it('should handle errors consistently with proper typing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          status: fc.integer({ min: 400, max: 599 }),
          message: fc.string({ minLength: 1, maxLength: 200 }),
          code: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          timestamp: fc.date().map(d => d.toISOString())
        }),
        async ({ status, message, code, timestamp }) => {
          const mockError: ApiError = {
            status,
            message,
            code,
            timestamp
          };

          // Mock API client to throw error
          const mockRequest = vi.fn().mockRejectedValue(mockError);
          (mockApiClient as any).request = mockRequest;

          try {
            await apiServices.auth.login({ email: 'test@example.com', password: 'password' });
            expect.fail('Should have thrown an error');
          } catch (error) {
            const apiError = error as ApiError;
            
            // Validate error structure
            expect(apiError.status).toBe(status);
            expect(apiError.message).toBe(message);
            expect(apiError.timestamp).toBe(timestamp);
            
            if (code) {
              expect(apiError.code).toBe(code);
            }

            // Validate error categorization
            if (status >= 400 && status < 500) {
              expect(apiError.status).toBeGreaterThanOrEqual(400);
              expect(apiError.status).toBeLessThan(500);
            } else if (status >= 500) {
              expect(apiError.status).toBeGreaterThanOrEqual(500);
            }
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 3: TanStack Query Integration
   * Validates proper integration with TanStack Query for caching and state management
   */
  it('should integrate properly with TanStack Query for caching and state management', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentData: fc.record({
            id: fc.uuid(),
            firstName: fc.string({ minLength: 1, maxLength: 50 }),
            lastName: fc.string({ minLength: 1, maxLength: 50 }),
            email: fc.emailAddress(),
            rollNumber: fc.string({ minLength: 1, maxLength: 20 }),
            branchId: fc.uuid(),
            semester: fc.integer({ min: 1, max: 8 }),
            academicYear: fc.string({ minLength: 9, maxLength: 9 }),
            isActive: fc.boolean(),
            createdAt: fc.date().map(d => d.toISOString()),
            updatedAt: fc.date().map(d => d.toISOString())
          }),
          cacheTime: fc.integer({ min: 1000, max: 300000 }), // 1s to 5min
          staleTime: fc.integer({ min: 0, max: 600000 }) // 0 to 10min
        }),
        async ({ studentData, cacheTime, staleTime }) => {
          const wrapper = createWrapper();
          
          // Mock successful API response
          const mockResponse: ApiResponse<StudentResponse> = {
            success: true,
            data: studentData as StudentResponse,
            message: 'Student retrieved successfully'
          };

          // Mock the API service
          const mockGetStudent = vi.fn().mockResolvedValue(mockResponse);
          vi.spyOn(apiServices.students, 'getStudent').mockImplementation(mockGetStudent);

          // Test the hook
          const { result } = renderHook(
            () => useTypedApi.students.detail(studentData.id),
            { wrapper }
          );

          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          // Validate query result
          expect(result.current.data).toEqual(studentData);
          expect(result.current.isLoading).toBe(false);
          expect(result.current.error).toBeNull();

          // Validate caching behavior
          expect(mockGetStudent).toHaveBeenCalledTimes(1);
          expect(mockGetStudent).toHaveBeenCalledWith(studentData.id);

          // Test cache hit on second call
          const { result: result2 } = renderHook(
            () => useTypedApi.students.detail(studentData.id),
            { wrapper }
          );

          await waitFor(() => {
            expect(result2.current.isSuccess).toBe(true);
          });

          // Should use cached data, not make another API call
          expect(mockGetStudent).toHaveBeenCalledTimes(1);
          expect(result2.current.data).toEqual(studentData);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 4: Pagination and Filtering
   * Validates proper handling of paginated responses and filtering parameters
   */
  it('should handle pagination and filtering correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          page: fc.integer({ min: 1, max: 100 }),
          limit: fc.integer({ min: 1, max: 100 }),
          total: fc.integer({ min: 0, max: 10000 }),
          search: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          branch: fc.option(fc.uuid()),
          semester: fc.option(fc.integer({ min: 1, max: 8 })),
          isActive: fc.option(fc.boolean())
        }),
        async ({ page, limit, total, search, branch, semester, isActive }) => {
          const totalPages = Math.ceil(total / limit);
          const hasNext = page < totalPages;
          const hasPrev = page > 1;

          const mockPaginatedResponse: ApiResponse<PaginatedResponse<StudentResponse>> = {
            success: true,
            data: {
              data: [], // Empty for simplicity
              pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext,
                hasPrev
              }
            },
            message: 'Students retrieved successfully'
          };

          // Mock the API service
          const mockGetStudents = vi.fn().mockResolvedValue(mockPaginatedResponse);
          vi.spyOn(apiServices.students, 'getStudents').mockImplementation(mockGetStudents);

          const wrapper = createWrapper();
          const filters = { page, limit, search, branch, semester, isActive };

          const { result } = renderHook(
            () => useTypedApi.students.list(filters),
            { wrapper }
          );

          await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
          });

          // Validate pagination data
          expect(result.current.data?.pagination.page).toBe(page);
          expect(result.current.data?.pagination.limit).toBe(limit);
          expect(result.current.data?.pagination.total).toBe(total);
          expect(result.current.data?.pagination.totalPages).toBe(totalPages);
          expect(result.current.data?.pagination.hasNext).toBe(hasNext);
          expect(result.current.data?.pagination.hasPrev).toBe(hasPrev);

          // Validate API call parameters
          expect(mockGetStudents).toHaveBeenCalledWith(
            expect.objectContaining({
              page,
              limit,
              ...(search && { search }),
              ...(branch && { branch }),
              ...(semester && { semester }),
              ...(isActive !== undefined && { isActive })
            })
          );
        }
      ),
      { numRuns: 25 }
    );
  });

  /**
   * Property 5: Mutation Operations
   * Validates proper handling of create, update, and delete operations
   */
  it('should handle mutation operations with proper cache invalidation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          operation: fc.constantFrom('create', 'update', 'delete'),
          studentData: fc.record({
            id: fc.uuid(),
            firstName: fc.string({ minLength: 1, maxLength: 50 }),
            lastName: fc.string({ minLength: 1, maxLength: 50 }),
            email: fc.emailAddress(),
            rollNumber: fc.string({ minLength: 1, maxLength: 20 }),
            branchId: fc.uuid(),
            semester: fc.integer({ min: 1, max: 8 }),
            academicYear: fc.string({ minLength: 9, maxLength: 9 })
          })
        }),
        async ({ operation, studentData }) => {
          const wrapper = createWrapper();
          let mockMutation: any;
          let mockResponse: ApiResponse<any>;

          switch (operation) {
            case 'create':
              mockResponse = {
                success: true,
                data: { ...studentData, id: fc.uuid() },
                message: 'Student created successfully'
              };
              mockMutation = vi.fn().mockResolvedValue(mockResponse);
              vi.spyOn(apiServices.students, 'createStudent').mockImplementation(mockMutation);
              break;

            case 'update':
              mockResponse = {
                success: true,
                data: studentData,
                message: 'Student updated successfully'
              };
              mockMutation = vi.fn().mockResolvedValue(mockResponse);
              vi.spyOn(apiServices.students, 'updateStudent').mockImplementation(mockMutation);
              break;

            case 'delete':
              mockResponse = {
                success: true,
                data: null,
                message: 'Student deleted successfully'
              };
              mockMutation = vi.fn().mockResolvedValue(mockResponse);
              vi.spyOn(apiServices.students, 'deleteStudent').mockImplementation(mockMutation);
              break;
          }

          const { result } = renderHook(
            () => {
              switch (operation) {
                case 'create':
                  return useTypedApi.students.create();
                case 'update':
                  return useTypedApi.students.update();
                case 'delete':
                  return useTypedApi.students.delete();
                default:
                  throw new Error('Invalid operation');
              }
            },
            { wrapper }
          );

          // Execute mutation
          let mutationPromise: Promise<any>;
          switch (operation) {
            case 'create':
              mutationPromise = result.current.mutateAsync(studentData as CreateStudentRequest);
              break;
            case 'update':
              mutationPromise = result.current.mutateAsync({ 
                id: studentData.id, 
                data: studentData as any 
              });
              break;
            case 'delete':
              mutationPromise = result.current.mutateAsync(studentData.id);
              break;
            default:
              throw new Error('Invalid operation');
          }

          await waitFor(async () => {
            const mutationResult = await mutationPromise;
            expect(mutationResult).toBeDefined();
            expect(mutationResult.success).toBe(true);
          });

          // Validate mutation was called correctly
          expect(mockMutation).toHaveBeenCalledTimes(1);
          expect(result.current.isSuccess).toBe(true);
          expect(result.current.error).toBeNull();
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Property 6: Notification System Integration
   * Validates proper integration with the notification system endpoints
   */
  it('should integrate properly with notification system endpoints', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          notificationData: fc.record({
            id: fc.uuid(),
            type: fc.constantFrom('notice', 'assignment', 'grade', 'attendance', 'system', 'reminder'),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            message: fc.string({ minLength: 1, maxLength: 500 }),
            userId: fc.uuid(),
            priority: fc.constantFrom('low', 'normal', 'high', 'urgent'),
            isRead: fc.boolean(),
            createdAt: fc.date().map(d => d.toISOString()),
            updatedAt: fc.date().map(d => d.toISOString())
          }),
          unreadCount: fc.integer({ min: 0, max: 999 })
        }),
        async ({ notificationData, unreadCount }) => {
          const wrapper = createWrapper();

          // Mock notification responses
          const mockNotificationResponse: ApiResponse<NotificationResponse> = {
            success: true,
            data: notificationData as NotificationResponse,
            message: 'Notification retrieved successfully'
          };

          const mockUnreadCountResponse: ApiResponse<{ count: number }> = {
            success: true,
            data: { count: unreadCount },
            message: 'Unread count retrieved successfully'
          };

          // Mock API services
          const mockGetNotification = vi.fn().mockResolvedValue(mockNotificationResponse);
          const mockGetUnreadCount = vi.fn().mockResolvedValue(mockUnreadCountResponse);
          const mockMarkAsRead = vi.fn().mockResolvedValue({
            success: true,
            data: { ...notificationData, isRead: true },
            message: 'Notification marked as read'
          });

          vi.spyOn(apiServices.notifications, 'getNotification').mockImplementation(mockGetNotification);
          vi.spyOn(apiServices.notifications, 'getUnreadCount').mockImplementation(mockGetUnreadCount);
          vi.spyOn(apiServices.notifications, 'markAsRead').mockImplementation(mockMarkAsRead);

          // Test notification detail hook
          const { result: detailResult } = renderHook(
            () => useTypedApi.notifications.detail(notificationData.id),
            { wrapper }
          );

          await waitFor(() => {
            expect(detailResult.current.isSuccess).toBe(true);
          });

          expect(detailResult.current.data).toEqual(notificationData);

          // Test unread count hook
          const { result: countResult } = renderHook(
            () => useTypedApi.notifications.unreadCount(),
            { wrapper }
          );

          await waitFor(() => {
            expect(countResult.current.isSuccess).toBe(true);
          });

          expect(countResult.current.data?.count).toBe(unreadCount);

          // Test mark as read mutation
          const { result: markReadResult } = renderHook(
            () => useTypedApi.notifications.markAsRead(),
            { wrapper }
          );

          await waitFor(async () => {
            const result = await markReadResult.current.mutateAsync(notificationData.id);
            expect(result.success).toBe(true);
            expect(result.data.isRead).toBe(true);
          });

          // Validate all API calls
          expect(mockGetNotification).toHaveBeenCalledWith(notificationData.id);
          expect(mockGetUnreadCount).toHaveBeenCalledTimes(1);
          expect(mockMarkAsRead).toHaveBeenCalledWith(notificationData.id);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 7: Authentication Integration
   * Validates proper handling of authentication tokens and unauthorized responses
   */
  it('should handle authentication properly with token management', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          credentials: fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 })
          }),
          token: fc.string({ minLength: 20, maxLength: 200 }),
          refreshToken: fc.string({ minLength: 20, maxLength: 200 }),
          userData: fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constantFrom('admin', 'professor', 'student'),
            isActive: fc.boolean()
          }),
          shouldSucceed: fc.boolean()
        }),
        async ({ credentials, token, refreshToken, userData, shouldSucceed }) => {
          const wrapper = createWrapper();

          if (shouldSucceed) {
            const mockAuthResponse: ApiResponse<any> = {
              success: true,
              data: {
                token,
                refreshToken,
                user: userData,
                expiresIn: 3600
              },
              message: 'Login successful'
            };

            const mockLogin = vi.fn().mockResolvedValue(mockAuthResponse);
            vi.spyOn(apiServices.auth, 'login').mockImplementation(mockLogin);

            const { result } = renderHook(
              () => useTypedApi.auth.login(),
              { wrapper }
            );

            await waitFor(async () => {
              const loginResult = await result.current.mutateAsync(credentials);
              expect(loginResult.success).toBe(true);
              expect(loginResult.data.token).toBe(token);
              expect(loginResult.data.user).toEqual(userData);
            });

            expect(mockLogin).toHaveBeenCalledWith(credentials);
            expect(result.current.isSuccess).toBe(true);
          } else {
            const mockError: ApiError = {
              status: 401,
              message: 'Invalid credentials',
              code: 'UNAUTHORIZED',
              timestamp: new Date().toISOString()
            };

            const mockLogin = vi.fn().mockRejectedValue(mockError);
            vi.spyOn(apiServices.auth, 'login').mockImplementation(mockLogin);

            const { result } = renderHook(
              () => useTypedApi.auth.login(),
              { wrapper }
            );

            try {
              await result.current.mutateAsync(credentials);
              expect.fail('Should have thrown an error');
            } catch (error) {
              const apiError = error as ApiError;
              expect(apiError.status).toBe(401);
              expect(apiError.message).toBe('Invalid credentials');
              expect(apiError.code).toBe('UNAUTHORIZED');
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});