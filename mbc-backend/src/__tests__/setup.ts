/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import config from '@/config/config';
import redisService from '@/services/redisService';
import logger from '@/utils/logger';

// Extend Jest matchers
import 'jest-extended';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/mbc_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// Initialize test database client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://test.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'test-service-key'
);

// Global test utilities
declare global {
  var testUtils: {
    createMockUser: (role?: string) => any;
    createMockStudent: () => any;
    createMockProfessor: () => any;
    createMockCourse: () => any;
    createMockAssignment: () => any;
    generateJWT: (user: any) => string;
    cleanupDatabase: () => Promise<void>;
    seedTestData: () => Promise<void>;
  };
}

// Test utilities
global.testUtils = {
  createMockUser: (role = 'student') => ({
    id: `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: `test-${Date.now()}@example.com`,
    name: `Test User ${Date.now()}`,
    role,
    institutionId: 'test-institution-id',
    branchId: 'test-branch-id',
    createdAt: new Date(),
    updatedAt: new Date()
  }),

  createMockStudent: () => ({
    id: `test-student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: `test-user-${Date.now()}`,
    rollNumber: `TEST${Date.now().toString().slice(-6)}`,
    semester: Math.floor(Math.random() * 8) + 1,
    cgpa: Math.random() * 4 + 6, // 6-10 range
    branchId: 'test-branch-id',
    createdAt: new Date(),
    updatedAt: new Date()
  }),

  createMockProfessor: () => ({
    id: `test-professor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: `test-user-${Date.now()}`,
    employeeId: `EMP${Date.now().toString().slice(-6)}`,
    department: 'Computer Science',
    designation: 'Assistant Professor',
    branchId: 'test-branch-id',
    createdAt: new Date(),
    updatedAt: new Date()
  }),

  createMockCourse: () => ({
    id: `test-course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: `Test Course ${Date.now()}`,
    code: `TC${Date.now().toString().slice(-4)}`,
    credits: Math.floor(Math.random() * 4) + 1,
    semester: Math.floor(Math.random() * 8) + 1,
    branchId: 'test-branch-id',
    professorId: 'test-professor-id',
    createdAt: new Date(),
    updatedAt: new Date()
  }),

  createMockAssignment: () => ({
    id: `test-assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: `Test Assignment ${Date.now()}`,
    description: 'Test assignment description',
    courseId: 'test-course-id',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    maxMarks: 100,
    createdAt: new Date(),
    updatedAt: new Date()
  }),

  generateJWT: (user: any): string => {
    // Simple mock JWT for testing
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    };
    
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  },

  cleanupDatabase: async (): Promise<void> => {
    try {
      // Clean up test data from database
      // This would typically involve deleting test records
      logger.info('Cleaning up test database');
    } catch (error) {
      logger.error('Database cleanup error:', error);
    }
  },

  seedTestData: async (): Promise<void> => {
    try {
      // Seed test data if needed
      logger.info('Seeding test data');
    } catch (error) {
      logger.error('Test data seeding error:', error);
    }
  }
};

// Global test setup
beforeAll(async () => {
  logger.info('Setting up global test environment');
  
  try {
    // Initialize Redis connection for tests
    await redisService.ping();
    logger.info('Redis connection established for tests');
  } catch (error) {
    logger.warn('Redis not available for tests, some tests may be skipped');
  }
  
  // Seed initial test data
  await global.testUtils.seedTestData();
});

// Global test cleanup
afterAll(async () => {
  logger.info('Cleaning up global test environment');
  
  // Cleanup test data
  await global.testUtils.cleanupDatabase();
  
  // Close connections
  try {
    await redisService.disconnect();
  } catch (error) {
    logger.warn('Error disconnecting Redis in tests:', error);
  }
});

// Per-test setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

// Per-test cleanup
afterEach(async () => {
  // Any per-test cleanup
});

// Mock external services for testing
jest.mock('@/services/cloudinaryService', () => ({
  uploadFile: jest.fn().mockResolvedValue({
    public_id: 'test-file-id',
    secure_url: 'https://test.cloudinary.com/test-file.jpg',
    format: 'jpg',
    bytes: 12345
  }),
  deleteFile: jest.fn().mockResolvedValue({ result: 'ok' }),
  generateSignedUrl: jest.fn().mockReturnValue('https://test.cloudinary.com/signed-url')
}));

// Mock email service
jest.mock('@/services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendNotificationEmail: jest.fn().mockResolvedValue(true)
}));

// Mock WebSocket service for tests
jest.mock('@/services/websocketService', () => ({
  broadcast: jest.fn(),
  sendToUser: jest.fn(),
  sendToRoom: jest.fn(),
  getConnectedUsers: jest.fn().mockReturnValue([]),
  getUserSocketId: jest.fn().mockReturnValue(null)
}));

// Increase timeout for property-based tests
jest.setTimeout(60000);

// Suppress console logs during tests unless explicitly needed
if (process.env.TEST_VERBOSE !== 'true') {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}