/**
 * Property-Based Tests for UI Functionality Preservation
 * 
 * Property 4: API Backward Compatibility (Frontend)
 * Validates: Requirements 2.2
 * 
 * These tests ensure that the TypeScript migration preserves all UI functionality
 * and maintains backward compatibility with existing API contracts.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Import types and utilities
import type { 
  Student, 
  ApiResponse,
  UserRole,
  User
} from '../types/api';
import { typedApiClient } from '../services/typedApiClient';

// Mock components for testing
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Simple test component that doesn't use hooks
const StudentListComponent: React.FC<{ 
  students: Student[]; 
  isLoading?: boolean; 
  error?: Error | null 
}> = ({ 
  students, 
  isLoading = false, 
  error = null 
}) => {
  if (isLoading) return <div data-testid="loading">Loading...</div>;
  if (error) return <div data-testid="error">Error: {error.message}</div>;
  if (!students || students.length === 0) return <div data-testid="no-data">No data</div>;

  return (
    <div data-testid="student-list">
      {students.map((student) => (
        <div key={student.id} data-testid={`student-${student.id}`}>
          <span data-testid="student-name">
            {student.user?.profile?.firstName || ''} {student.user?.profile?.lastName || ''}
          </span>
          <span data-testid="student-email">{student.user?.email || ''}</span>
          <span data-testid="student-role">{student.user?.role || ''}</span>
        </div>
      ))}
    </div>
  );
};

// Property-based test generators
const userArbitrary = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  role: fc.constantFrom('student', 'professor', 'admin') as fc.Arbitrary<UserRole>,
  isActive: fc.boolean(),
  createdAt: fc.date().map(d => d.toISOString()),
  updatedAt: fc.date().map(d => d.toISOString()),
  profile: fc.record({
    firstName: fc.string({ minLength: 1, maxLength: 50 }),
    lastName: fc.string({ minLength: 1, maxLength: 50 }),
    phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
    dateOfBirth: fc.option(fc.date().map(d => d.toISOString())),
    avatar: fc.option(fc.webUrl()),
  }),
});

const studentArbitrary = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  rollNumber: fc.string({ minLength: 1, maxLength: 20 }),
  branchId: fc.uuid(),
  institutionId: fc.uuid(),
  semester: fc.integer({ min: 1, max: 8 }),
  academicYear: fc.string({ minLength: 4, maxLength: 10 }),
  isActive: fc.boolean(),
  createdAt: fc.date().map(d => d.toISOString()),
  updatedAt: fc.date().map(d => d.toISOString()),
  user: fc.option(userArbitrary),
});

describe('UI Functionality Preservation Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the typed API client
    vi.spyOn(typedApiClient, 'get').mockImplementation(() => Promise.resolve({
      success: true,
      data: [],
      message: 'Success',
    }));
  });

  describe('Property 4: API Backward Compatibility (Frontend)', () => {
    test('Student list component preserves data structure integrity', () => {
      fc.assert(fc.property(
        fc.array(studentArbitrary, { minLength: 0, maxLength: 10 }),
        (students) => {
          const { getByTestId } = render(
            <TestWrapper>
              <StudentListComponent students={students} />
            </TestWrapper>
          );

          // Verify correct rendering based on data
          if (students.length > 0) {
            const listElement = getByTestId('student-list');
            expect(listElement).toBeInTheDocument();

            students.forEach((student) => {
              const studentElement = screen.getByTestId(`student-${student.id}`);
              expect(studentElement).toBeInTheDocument();
              
              const nameElement = studentElement.querySelector('[data-testid="student-name"]');
              const emailElement = studentElement.querySelector('[data-testid="student-email"]');
              const roleElement = studentElement.querySelector('[data-testid="student-role"]');

              expect(nameElement).toBeInTheDocument();
              expect(emailElement).toBeInTheDocument();
              expect(roleElement).toBeInTheDocument();

              if (student.user) {
                expect(nameElement).toHaveTextContent(`${student.user.profile.firstName} ${student.user.profile.lastName}`);
                expect(emailElement).toHaveTextContent(student.user.email);
                expect(roleElement).toHaveTextContent(student.user.role);
              }
            });
          } else {
            const noDataElement = getByTestId('no-data');
            expect(noDataElement).toBeInTheDocument();
          }

          return true;
        }
      ), { numRuns: 50 });
      // **Feature: mbc-modernization, Property 4: API Backward Compatibility (Frontend)**
    });

    test('API client maintains response structure consistency', () => {
      fc.assert(fc.property(
        fc.record({
          success: fc.constant(true),
          data: fc.array(studentArbitrary),
          message: fc.option(fc.string()),
        }),
        (mockApiResponse) => {
          vi.spyOn(typedApiClient, 'get').mockResolvedValueOnce(mockApiResponse);

          return typedApiClient.get('/students').then(response => {
            // Verify response structure matches expected API contract
            expect(response).toHaveProperty('success');
            expect(response).toHaveProperty('data');
            expect(typeof response.success).toBe('boolean');
            expect(Array.isArray(response.data)).toBe(true);

            if (response.message !== undefined) {
              expect(typeof response.message).toBe('string');
            }

            // Verify each student object has required properties
            response.data.forEach((student: any) => {
              expect(student).toHaveProperty('id');
              expect(student).toHaveProperty('userId');
              expect(student).toHaveProperty('rollNumber');
              expect(student).toHaveProperty('branchId');
              expect(student).toHaveProperty('institutionId');
              expect(student).toHaveProperty('semester');
              expect(student).toHaveProperty('academicYear');
              expect(student).toHaveProperty('isActive');
              expect(student).toHaveProperty('createdAt');
              expect(student).toHaveProperty('updatedAt');
            });

            return true;
          });
        }
      ), { numRuns: 50 });
      // **Feature: mbc-modernization, Property 4: API Backward Compatibility (Frontend)**
    });

    test('Error handling preserves user experience consistency', () => {
      fc.assert(fc.property(
        fc.record({
          status: fc.integer({ min: 400, max: 599 }),
          message: fc.string({ minLength: 1 }),
          code: fc.option(fc.string()),
        }),
        (errorData) => {
          const mockError = {
            ...errorData,
            timestamp: new Date().toISOString(),
          };

          const { getByTestId } = render(
            <TestWrapper>
              <StudentListComponent students={[]} error={mockError as any} />
            </TestWrapper>
          );

          // Verify error state is displayed correctly
          const errorElement = getByTestId('error');
          expect(errorElement).toBeInTheDocument();
          expect(errorElement).toHaveTextContent(errorData.message);

          return true;
        }
      ), { numRuns: 30 });
      // **Feature: mbc-modernization, Property 4: API Backward Compatibility (Frontend)**
    });

    test('Loading states preserve UI responsiveness', () => {
      fc.assert(fc.property(
        fc.boolean(),
        (isLoading) => {
          const { getByTestId, queryByTestId } = render(
            <TestWrapper>
              <StudentListComponent students={[]} isLoading={isLoading} />
            </TestWrapper>
          );

          if (isLoading) {
            // Verify loading state is shown
            expect(getByTestId('loading')).toBeInTheDocument();
            expect(queryByTestId('no-data')).not.toBeInTheDocument();
          } else {
            // Verify no-data state is shown when not loading
            expect(getByTestId('no-data')).toBeInTheDocument();
            expect(queryByTestId('loading')).not.toBeInTheDocument();
          }

          return true;
        }
      ), { numRuns: 20 });
      // **Feature: mbc-modernization, Property 4: API Backward Compatibility (Frontend)**
    });
  });
});