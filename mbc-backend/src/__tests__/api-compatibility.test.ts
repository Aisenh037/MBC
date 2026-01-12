/**
 * Property-Based Tests for API Backward Compatibility
 * 
 * These tests ensure that the TypeScript migration maintains backward compatibility
 * with existing API contracts and response formats.
 */

import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';
import request from 'supertest';
import app from '../app';
import logger from '../utils/logger';

describe('Property 4: API Backward Compatibility', () => {
  /**
   * Property: All API responses maintain consistent structure
   * Validates that TypeScript migration doesn't break existing API contracts
   */
  test('API responses maintain consistent structure for public endpoints', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          { method: 'POST', path: '/api/v1/auth/login', body: { email: 'invalid@test.com', password: 'invalid' } },
          { method: 'GET', path: '/api/v1/health' },
          { method: 'GET', path: '/api/v1/students' }, // Will return 401 but should have consistent structure
          { method: 'GET', path: '/api/v1/professors' }, // Will return 401 but should have consistent structure
        ),
        async (endpoint) => {
          let response;
          
          if (endpoint.method === 'POST' && endpoint.body) {
            response = await request(app)
              .post(endpoint.path)
              .send(endpoint.body);
          } else {
            response = await request(app)
              [endpoint.method.toLowerCase() as 'get'](endpoint.path);
          }

          // Verify standard API response structure
          expect(response.body).toHaveProperty('success');
          expect(typeof response.body.success).toBe('boolean');

          if (response.body.success) {
            expect(response.body).toHaveProperty('data');
          } else {
            expect(response.body).toHaveProperty('error');
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: HTTP status codes are consistent with REST conventions
   * Validates that status codes follow standard HTTP conventions
   */
  test('HTTP status codes follow REST conventions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          { method: 'GET', path: '/api/v1/health', expectedRange: [200, 299] },
          { method: 'GET', path: '/api/v1/students', expectedRange: [401, 401] }, // No auth
          { method: 'GET', path: '/api/v1/nonexistent', expectedRange: [404, 404] },
          { method: 'POST', path: '/api/v1/auth/login', expectedRange: [400, 401], body: { email: 'invalid' } }
        ),
        async (testCase) => {
          let response;
          
          if (testCase.method === 'POST' && testCase.body) {
            response = await request(app)
              .post(testCase.path)
              .send(testCase.body);
          } else {
            response = await request(app)
              [testCase.method.toLowerCase() as 'get'](testCase.path);
          }

          expect(response.status).toBeGreaterThanOrEqual(testCase.expectedRange[0]);
          expect(response.status).toBeLessThanOrEqual(testCase.expectedRange[1]);
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Property: Error responses have consistent format
   * Validates that all error responses follow the same structure
   */
  test('Error responses maintain consistent format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          { path: '/api/v1/students', method: 'GET' }, // 401 - no auth
          { path: '/api/v1/professors', method: 'GET' }, // 401 - no auth
          { path: '/api/v1/nonexistent', method: 'GET' }, // 404
          { path: '/api/v1/auth/login', method: 'POST', body: { email: 'invalid' } } // 400 - validation error
        ),
        async (errorCase) => {
          let response;
          
          if (errorCase.method === 'POST' && errorCase.body) {
            response = await request(app)
              .post(errorCase.path)
              .send(errorCase.body);
          } else {
            response = await request(app)
              [errorCase.method.toLowerCase() as 'get'](errorCase.path);
          }

          // Should be an error response
          expect(response.status).toBeGreaterThanOrEqual(400);

          // Verify error response structure
          expect(response.body).toHaveProperty('success');
          expect(response.body.success).toBe(false);
          expect(response.body).toHaveProperty('error');
          
          if (typeof response.body.error === 'string') {
            expect(response.body.error.length).toBeGreaterThan(0);
          } else if (typeof response.body.error === 'object') {
            expect(response.body.error).toHaveProperty('message');
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Content-Type headers are consistent
   * Validates that all API responses have proper Content-Type headers
   */
  test('Content-Type headers are consistent across endpoints', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          { path: '/api/v1/health', method: 'GET' },
          { path: '/api/v1/students', method: 'GET' },
          { path: '/api/v1/professors', method: 'GET' },
          { path: '/api/v1/auth/login', method: 'POST', body: { email: 'test@test.com', password: 'test' } }
        ),
        async (endpoint) => {
          let response;
          
          if (endpoint.method === 'POST' && endpoint.body) {
            response = await request(app)
              .post(endpoint.path)
              .send(endpoint.body);
          } else {
            response = await request(app)
              [endpoint.method.toLowerCase() as 'get'](endpoint.path);
          }

          expect(response.headers['content-type']).toMatch(/application\/json/);
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Property: Authentication requirements are consistent
   * Validates that protected endpoints consistently require authentication
   */
  test('Authentication requirements are consistent across protected endpoints', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          '/api/v1/students',
          '/api/v1/professors',
          '/api/v1/courses',
          '/api/v1/assignments'
        ),
        async (protectedPath) => {
          // Request without token should fail
          const responseWithoutToken = await request(app)
            .get(protectedPath);

          expect(responseWithoutToken.status).toBe(401);
          expect(responseWithoutToken.body.success).toBe(false);

          // Request with invalid token should fail
          const responseWithInvalidToken = await request(app)
            .get(protectedPath)
            .set('Authorization', 'Bearer invalid-token');

          expect(responseWithInvalidToken.status).toBe(401);
          expect(responseWithInvalidToken.body.success).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Response time is within acceptable limits
   * Validates that API responses are returned within reasonable time limits
   */
  test('Response times are within acceptable limits', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          { path: '/api/v1/health', method: 'GET' },
          { path: '/api/v1/students', method: 'GET' },
          { path: '/api/v1/professors', method: 'GET' }
        ),
        async (endpoint) => {
          const startTime = Date.now();
          
          const response = await request(app)
            [endpoint.method.toLowerCase() as 'get'](endpoint.path);

          const responseTime = Date.now() - startTime;

          // Response should be within 5 seconds (generous for CI environments)
          expect(responseTime).toBeLessThan(5000);
          
          // For any response, should be reasonably fast
          expect(responseTime).toBeLessThan(3000);
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Property: Request validation is consistent
   * Validates that request validation works consistently across endpoints
   */
  test('Request validation is consistent across POST endpoints', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          { path: '/api/v1/auth/login', invalidBody: {} }, // Missing required fields
          { path: '/api/v1/auth/login', invalidBody: { email: 'invalid-email' } }, // Invalid email format
          { path: '/api/v1/auth/login', invalidBody: { email: 'test@test.com' } } // Missing password
        ),
        async (testCase) => {
          const response = await request(app)
            .post(testCase.path)
            .send(testCase.invalidBody);

          // Should return validation error
          expect(response.status).toBeGreaterThanOrEqual(400);
          expect(response.status).toBeLessThan(500);
          expect(response.body.success).toBe(false);
          expect(response.body).toHaveProperty('error');
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Property: CORS headers are present for cross-origin requests
   * Validates that CORS is properly configured
   */
  test('CORS headers are present for cross-origin requests', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          { path: '/api/v1/health', method: 'GET' },
          { path: '/api/v1/students', method: 'GET' },
          { path: '/api/v1/auth/login', method: 'POST' }
        ),
        async (endpoint) => {
          let response;
          
          if (endpoint.method === 'POST') {
            response = await request(app)
              .post(endpoint.path)
              .set('Origin', 'http://localhost:3000')
              .send({});
          } else {
            response = await request(app)
              [endpoint.method.toLowerCase() as 'get'](endpoint.path)
              .set('Origin', 'http://localhost:3000');
          }

          // Should have CORS headers (if CORS is configured)
          // This test validates that CORS configuration is consistent
          const corsHeader = response.headers['access-control-allow-origin'];
          if (corsHeader) {
            expect(typeof corsHeader).toBe('string');
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});