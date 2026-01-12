/**
 * Swagger/OpenAPI Configuration
 * Generates comprehensive API documentation from TypeScript interfaces
 */

import swaggerJSDoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';
import config from './config';

// Basic API information
const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'MBC Department Management System API',
    version: '1.0.0',
    description: `
      A comprehensive API for managing department operations including student enrollment, 
      course management, assignments, file uploads, and real-time notifications.
      
      ## Features
      - **Authentication & Authorization**: JWT-based auth with role-based access control
      - **Student Management**: Complete student lifecycle management
      - **Course Management**: Course creation, enrollment, and tracking
      - **Assignment System**: Assignment creation, submission, and grading
      - **File Storage**: Cloudinary-powered file uploads with security
      - **Real-time Features**: WebSocket-based notifications and updates
      - **AI Integration**: Predictive analytics and sentiment analysis
      
      ## Authentication
      Most endpoints require authentication via JWT token in the Authorization header:
      \`Authorization: Bearer <your-jwt-token>\`
      
      ## Rate Limiting
      API requests are rate-limited to prevent abuse. Standard limits apply per user/IP.
      
      ## Error Handling
      All errors follow a consistent format with appropriate HTTP status codes.
    `,
    contact: {
      name: 'MBC Development Team',
      email: 'dev@mbc.edu',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: config.env === 'production' ? 'https://api.mbc.edu' : `http://localhost:${config.port}`,
      description: config.env === 'production' ? 'Production Server' : 'Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Authorization header using the Bearer scheme',
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication information is missing or invalid',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: { type: 'string', example: 'Unauthorized access' },
                message: { type: 'string', example: 'Please provide a valid authentication token' },
              },
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Access denied - insufficient permissions',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: { type: 'string', example: 'Access denied' },
                message: { type: 'string', example: 'You do not have permission to access this resource' },
              },
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: { type: 'string', example: 'Not found' },
                message: { type: 'string', example: 'The requested resource was not found' },
              },
            },
          },
        },
      },
      ValidationError: {
        description: 'Request validation failed',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: { type: 'string', example: 'Validation error' },
                message: { type: 'string', example: 'Request validation failed' },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string', example: 'email' },
                      message: { type: 'string', example: 'Email is required' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: { type: 'string', example: 'Internal server error' },
                message: { type: 'string', example: 'An unexpected error occurred' },
              },
            },
          },
        },
      },
    },
    schemas: {
      // Common response wrapper
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', description: 'Indicates if the request was successful' },
          data: { type: 'object', description: 'Response data (varies by endpoint)' },
          message: { type: 'string', description: 'Human-readable message' },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'number', description: 'Current page number' },
              limit: { type: 'number', description: 'Items per page' },
              total: { type: 'number', description: 'Total number of items' },
              pages: { type: 'number', description: 'Total number of pages' },
            },
          },
        },
        required: ['success'],
      },
      
      // User-related schemas
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Unique user identifier' },
          email: { type: 'string', format: 'email', description: 'User email address' },
          role: { type: 'string', enum: ['admin', 'professor', 'student'], description: 'User role' },
          isActive: { type: 'boolean', description: 'Whether the user account is active' },
          createdAt: { type: 'string', format: 'date-time', description: 'Account creation timestamp' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' },
        },
      },
      
      // Student schema
      Student: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          rollNumber: { type: 'string', description: 'Student roll number' },
          firstName: { type: 'string', description: 'Student first name' },
          lastName: { type: 'string', description: 'Student last name' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', description: 'Contact phone number' },
          dateOfBirth: { type: 'string', format: 'date' },
          address: { type: 'string', description: 'Student address' },
          profilePictureUrl: { type: 'string', format: 'uri', description: 'Profile picture URL' },
          institutionId: { type: 'string', format: 'uuid' },
          branchId: { type: 'string', format: 'uuid' },
          semester: { type: 'number', minimum: 1, maximum: 8 },
          academicYear: { type: 'string', pattern: '^\\d{4}-\\d{4}$', example: '2024-2025' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      
      // Professor schema
      Professor: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          employeeId: { type: 'string', description: 'Employee ID' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          department: { type: 'string', description: 'Department name' },
          designation: { type: 'string', description: 'Job designation' },
          qualification: { type: 'string', description: 'Educational qualification' },
          experience: { type: 'number', description: 'Years of experience' },
          profilePictureUrl: { type: 'string', format: 'uri' },
          institutionId: { type: 'string', format: 'uuid' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      
      // Course schema
      Course: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string', description: 'Course code (e.g., CS101)' },
          name: { type: 'string', description: 'Course name' },
          description: { type: 'string', description: 'Course description' },
          credits: { type: 'number', minimum: 1, maximum: 6 },
          semester: { type: 'number', minimum: 1, maximum: 8 },
          academicYear: { type: 'string', pattern: '^\\d{4}-\\d{4}$' },
          professorId: { type: 'string', format: 'uuid' },
          institutionId: { type: 'string', format: 'uuid' },
          branchId: { type: 'string', format: 'uuid' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      
      // Assignment schema
      Assignment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', description: 'Assignment title' },
          description: { type: 'string', description: 'Assignment description' },
          instructions: { type: 'string', description: 'Detailed instructions' },
          dueDate: { type: 'string', format: 'date-time', description: 'Assignment due date' },
          maxMarks: { type: 'number', minimum: 0, description: 'Maximum marks for the assignment' },
          courseId: { type: 'string', format: 'uuid' },
          professorId: { type: 'string', format: 'uuid' },
          institutionId: { type: 'string', format: 'uuid' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      
      // File upload schema
      FileUpload: {
        type: 'object',
        properties: {
          fileId: { type: 'string', format: 'uuid', description: 'Unique file identifier' },
          fileName: { type: 'string', description: 'Original filename' },
          fileSize: { type: 'number', description: 'File size in bytes' },
          mimeType: { type: 'string', description: 'MIME type of the file' },
          url: { type: 'string', format: 'uri', description: 'File access URL' },
          publicId: { type: 'string', description: 'Cloudinary public ID' },
          uploadedAt: { type: 'string', format: 'date-time', description: 'Upload timestamp' },
        },
      },
      
      // Authentication schemas
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', description: 'User email address' },
          password: { type: 'string', minLength: 6, description: 'User password' },
        },
      },
      
      LoginResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          token: { type: 'string', description: 'JWT access token' },
          refreshToken: { type: 'string', description: 'JWT refresh token' },
          expiresIn: { type: 'number', description: 'Token expiration time in seconds' },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints',
    },
    {
      name: 'Students',
      description: 'Student management operations',
    },
    {
      name: 'Professors',
      description: 'Professor management operations',
    },
    {
      name: 'Courses',
      description: 'Course management operations',
    },
    {
      name: 'Assignments',
      description: 'Assignment management operations',
    },
    {
      name: 'Files',
      description: 'File upload and management operations',
    },
    {
      name: 'Health',
      description: 'System health and monitoring endpoints',
    },
  ],
};

// Options for swagger-jsdoc
const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/types/*.ts',
    './src/app.ts',
  ],
};

// Generate swagger specification
const swaggerSpec = swaggerJSDoc(swaggerOptions);

export default swaggerSpec;