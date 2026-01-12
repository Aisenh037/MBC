/**
 * API Endpoints Integration Tests
 * Comprehensive integration tests for all API endpoints
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '@/app';
import { createClient } from '@supabase/supabase-js';
import config from '@/config/config';

// Test configuration
const API_BASE = '/api/v1';
let authToken: string;
let testUserId: string;
let testStudentId: string;
let testProfessorId: string;
let testCourseId: string;

// Initialize Supabase client for test data setup
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

describe('API Endpoints Integration Tests', () => {
  beforeAll(async () => {
    // Set up test data and authentication
    await setupTestData();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
  });

  beforeEach(() => {
    // Reset any mocks or state between tests
  });

  describe('Authentication Endpoints', () => {
    describe('POST /auth/register', () => {
      test('should register a new user successfully', async () => {
        const userData = {
          email: `test-${Date.now()}@example.com`,
          password: 'password123',
          name: 'Test User',
          role: 'student'
        };

        const response = await request(app)
          .post(`${API_BASE}/auth/register`)
          .send(userData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toHaveProperty('id');
        expect(response.body.data.user.email).toBe(userData.email);
        expect(response.body.data.user.name).toBe(userData.name);
        expect(response.body.data.user.role).toBe(userData.role);
        expect(response.body.data.tokens).toHaveProperty('accessToken');
        expect(response.body.data.tokens).toHaveProperty('refreshToken');
      });

      test('should reject registration with invalid email', async () => {
        const userData = {
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
          role: 'student'
        };

        const response = await request(app)
          .post(`${API_BASE}/auth/register`)
          .send(userData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('email');
      });

      test('should reject registration with weak password', async () => {
        const userData = {
          email: `test-${Date.now()}@example.com`,
          password: '123',
          name: 'Test User',
          role: 'student'
        };

        const response = await request(app)
          .post(`${API_BASE}/auth/register`)
          .send(userData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('password');
      });
    });

    describe('POST /auth/login', () => {
      test('should login with valid credentials', async () => {
        const credentials = {
          email: 'admin@test.com',
          password: 'admin123'
        };

        const response = await request(app)
          .post(`${API_BASE}/auth/login`)
          .send(credentials)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toHaveProperty('id');
        expect(response.body.data.user.email).toBe(credentials.email);
        expect(response.body.data.tokens).toHaveProperty('accessToken');
        expect(response.body.data.tokens).toHaveProperty('refreshToken');

        // Store token for subsequent tests
        authToken = response.body.data.tokens.accessToken;
      });

      test('should reject login with invalid credentials', async () => {
        const credentials = {
          email: 'admin@test.com',
          password: 'wrongpassword'
        };

        const response = await request(app)
          .post(`${API_BASE}/auth/login`)
          .send(credentials)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Invalid credentials');
      });
    });

    describe('POST /auth/refresh', () => {
      test('should refresh token with valid refresh token', async () => {
        // First login to get refresh token
        const loginResponse = await request(app)
          .post(`${API_BASE}/auth/login`)
          .send({
            email: 'admin@test.com',
            password: 'admin123'
          });

        const refreshToken = loginResponse.body.data.tokens.refreshToken;

        const response = await request(app)
          .post(`${API_BASE}/auth/refresh`)
          .send({ refreshToken })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('accessToken');
      });
    });
  });

  describe('Student Endpoints', () => {
    describe('GET /students', () => {
      test('should get all students with admin token', async () => {
        const response = await request(app)
          .get(`${API_BASE}/students`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      test('should reject request without authentication', async () => {
        const response = await request(app)
          .get(`${API_BASE}/students`)
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /students', () => {
      test('should create a new student', async () => {
        const studentData = {
          userId: testUserId,
          rollNumber: `TEST${Date.now()}`,
          semester: 1,
          branchId: 'test-branch-id'
        };

        const response = await request(app)
          .post(`${API_BASE}/students`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(studentData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.rollNumber).toBe(studentData.rollNumber);

        testStudentId = response.body.data.id;
      });
    });

    describe('GET /students/:id', () => {
      test('should get student by ID', async () => {
        const response = await request(app)
          .get(`${API_BASE}/students/${testStudentId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(testStudentId);
      });

      test('should return 404 for non-existent student', async () => {
        const response = await request(app)
          .get(`${API_BASE}/students/non-existent-id`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Course Endpoints', () => {
    describe('GET /courses', () => {
      test('should get all courses', async () => {
        const response = await request(app)
          .get(`${API_BASE}/courses`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('POST /courses', () => {
      test('should create a new course', async () => {
        const courseData = {
          name: `Test Course ${Date.now()}`,
          code: `TC${Date.now().toString().slice(-4)}`,
          credits: 3,
          semester: 1,
          branchId: 'test-branch-id',
          professorId: testProfessorId
        };

        const response = await request(app)
          .post(`${API_BASE}/courses`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(courseData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.name).toBe(courseData.name);

        testCourseId = response.body.data.id;
      });
    });
  });

  describe('Dashboard Endpoints', () => {
    describe('GET /dashboard/stats', () => {
      test('should get dashboard statistics', async () => {
        const response = await request(app)
          .get(`${API_BASE}/dashboard/stats`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalStudents');
        expect(response.body.data).toHaveProperty('totalProfessors');
        expect(response.body.data).toHaveProperty('totalCourses');
        expect(response.body.data).toHaveProperty('totalAssignments');
      });
    });
  });

  describe('Health Check Endpoints', () => {
    describe('GET /health', () => {
      test('should return health status', async () => {
        const response = await request(app)
          .get(`${API_BASE}/health`)
          .expect(200);

        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('uptime');
      });
    });

    describe('GET /health/detailed', () => {
      test('should return detailed health information', async () => {
        const response = await request(app)
          .get(`${API_BASE}/health/detailed`)
          .expect(200);

        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('system');
        expect(response.body).toHaveProperty('services');
        expect(response.body.system).toHaveProperty('memory');
        expect(response.body.services).toHaveProperty('database');
        expect(response.body.services).toHaveProperty('redis');
      });
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/non-existent-endpoint')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not found');
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post(`${API_BASE}/auth/login`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle missing required fields', async () => {
      const response = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits on auth endpoints', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Make multiple rapid requests to trigger rate limiting
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .post(`${API_BASE}/auth/login`)
          .send(credentials)
      );

      const responses = await Promise.all(requests);
      
      // At least one request should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('CORS Headers', () => {
    test('should include proper CORS headers', async () => {
      const response = await request(app)
        .options(`${API_BASE}/health`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
  });
});

// Helper functions
async function setupTestData(): Promise<void> {
  try {
    // Create test user
    const { data: user } = await supabase
      .from('users')
      .insert({
        email: 'admin@test.com',
        password: '$2a$12$hashed_password', // Pre-hashed password for 'admin123'
        name: 'Test Admin',
        role: 'admin'
      })
      .select()
      .single();

    if (user) {
      testUserId = user.id;
    }

    // Create test professor
    const { data: professor } = await supabase
      .from('professors')
      .insert({
        userId: testUserId,
        employeeId: 'TEST001',
        department: 'Computer Science',
        designation: 'Professor'
      })
      .select()
      .single();

    if (professor) {
      testProfessorId = professor.id;
    }
  } catch (error) {
    console.warn('Test data setup failed:', error);
  }
}

async function cleanupTestData(): Promise<void> {
  try {
    // Clean up test data in reverse order of creation
    if (testCourseId) {
      await supabase.from('courses').delete().eq('id', testCourseId);
    }
    if (testStudentId) {
      await supabase.from('students').delete().eq('id', testStudentId);
    }
    if (testProfessorId) {
      await supabase.from('professors').delete().eq('id', testProfessorId);
    }
    if (testUserId) {
      await supabase.from('users').delete().eq('id', testUserId);
    }
  } catch (error) {
    console.warn('Test data cleanup failed:', error);
  }
}