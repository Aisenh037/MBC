# Design Document

## Overview

The MBC Department Management System will be transformed into a modern, production-ready application using TypeScript, PostgreSQL with Supabase, Redis caching, and enhanced AI capabilities. The system follows a microservices architecture with clear separation of concerns, ensuring scalability, maintainability, and production readiness for academic institutions.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[React + TypeScript SPA]
        MOBILE[Mobile App - Future]
    end
    
    subgraph "API Gateway"
        NGINX[Nginx Reverse Proxy]
    end
    
    subgraph "Application Layer"
        API[Node.js + Express + TypeScript API]
        AI[Python FastAPI AI Service]
        REALTIME[WebSocket Service]
    end
    
    subgraph "Data Layer"
        SUPABASE[(Supabase PostgreSQL)]
        REDIS[(Redis Cache)]
        STORAGE[Supabase Storage]
    end
    
    subgraph "External Services"
        EMAIL[Email Service]
        MONITORING[Monitoring & Logging]
    end
    
    WEB --> NGINX
    NGINX --> API
    NGINX --> AI
    NGINX --> REALTIME
    
    API --> SUPABASE
    API --> REDIS
    API --> STORAGE
    AI --> SUPABASE
    AI --> REDIS
    
    API --> EMAIL
    API --> MONITORING
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- TanStack Query for data fetching
- Zustand for state management
- Material-UI v5 for components
- React Router v6 for routing

**Backend:**
- Node.js 18+ with Express
- TypeScript with strict mode
- Prisma ORM for database operations
- Supabase for database and auth
- Redis for caching and sessions
- Winston for logging

**AI Service:**
- Python 3.11 with FastAPI
- Scikit-learn for ML models
- Pandas/NumPy for data processing
- NLTK for natural language processing
- Celery for background tasks

**Infrastructure:**
- Docker and Docker Compose
- Nginx for reverse proxy
- PostgreSQL 15 via Supabase
- Redis 7 for caching
- GitHub Actions for CI/CD

## Components and Interfaces

### Database Schema Design

```sql
-- Core entities with proper relationships
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(institution_id, code)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL,
    profile JSONB NOT NULL,
    institution_id UUID REFERENCES institutions(id),
    branch_id UUID REFERENCES branches(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE user_role AS ENUM ('admin', 'professor', 'student');

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    credits INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(branch_id, code)
);

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    academic_year VARCHAR(10) NOT NULL,
    status enrollment_status DEFAULT 'active',
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id, academic_year)
);

CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'dropped', 'failed');

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    professor_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    max_marks INTEGER NOT NULL,
    file_attachments TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    file_attachments TEXT[],
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    marks_obtained INTEGER,
    feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES users(id),
    UNIQUE(assignment_id, student_id)
);

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL,
    marked_by UUID REFERENCES users(id),
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, student_id, date)
);

CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');

CREATE TABLE notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id),
    target_audience TEXT[] NOT NULL, -- ['all', 'students', 'professors', 'branch:CS']
    priority notice_priority DEFAULT 'normal',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE notice_priority AS ENUM ('low', 'normal', 'high', 'urgent');
```

### API Interface Design

**Authentication Endpoints:**
```typescript
interface AuthAPI {
  // Authentication
  POST /api/v1/auth/login: (credentials: LoginRequest) => AuthResponse
  POST /api/v1/auth/logout: () => void
  POST /api/v1/auth/refresh: (token: string) => AuthResponse
  POST /api/v1/auth/forgot-password: (email: string) => void
  POST /api/v1/auth/reset-password: (token: string, password: string) => void
}

interface LoginRequest {
  email: string
  password: string
}

interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
}
```

**Core API Interfaces:**
```typescript
interface StudentAPI {
  GET /api/v1/students: (filters: StudentFilters) => PaginatedResponse<Student>
  GET /api/v1/students/:id: (id: string) => Student
  POST /api/v1/students: (data: CreateStudentRequest) => Student
  PUT /api/v1/students/:id: (id: string, data: UpdateStudentRequest) => Student
  DELETE /api/v1/students/:id: (id: string) => void
  
  // Student-specific endpoints
  GET /api/v1/students/:id/courses: (id: string) => Course[]
  GET /api/v1/students/:id/assignments: (id: string) => Assignment[]
  GET /api/v1/students/:id/attendance: (id: string, filters: AttendanceFilters) => Attendance[]
  GET /api/v1/students/:id/grades: (id: string) => Grade[]
}

interface AssignmentAPI {
  GET /api/v1/assignments: (filters: AssignmentFilters) => PaginatedResponse<Assignment>
  POST /api/v1/assignments: (data: CreateAssignmentRequest) => Assignment
  PUT /api/v1/assignments/:id: (id: string, data: UpdateAssignmentRequest) => Assignment
  DELETE /api/v1/assignments/:id: (id: string) => void
  
  // Submission endpoints
  POST /api/v1/assignments/:id/submissions: (id: string, data: SubmissionRequest) => Submission
  GET /api/v1/assignments/:id/submissions: (id: string) => Submission[]
  PUT /api/v1/assignments/:assignmentId/submissions/:submissionId/grade: 
    (assignmentId: string, submissionId: string, data: GradeRequest) => Submission
}
```

**AI Service Interface:**
```typescript
interface AIServiceAPI {
  // Analytics
  POST /api/v1/ai/analytics/student-performance: (studentId: string) => PerformanceAnalytics
  POST /api/v1/ai/analytics/course-insights: (courseId: string) => CourseInsights
  POST /api/v1/ai/analytics/department-overview: () => DepartmentAnalytics
  
  // Predictions
  POST /api/v1/ai/predict/grade: (data: GradePredictionRequest) => GradePrediction
  POST /api/v1/ai/predict/attendance: (data: AttendancePredictionRequest) => AttendancePrediction
  POST /api/v1/ai/predict/dropout-risk: (studentId: string) => DropoutRiskAssessment
  
  // Natural Language Processing
  POST /api/v1/ai/sentiment/analyze: (text: string) => SentimentAnalysis
  POST /api/v1/ai/feedback/categorize: (feedback: string) => FeedbackCategory
  
  // Dataset Analysis
  POST /api/v1/ai/dataset/upload: (file: File, analysisType: string) => DatasetAnalysis
}
```

## Data Models

### Core TypeScript Interfaces

```typescript
// User and Authentication
interface User {
  id: string
  email: string
  role: UserRole
  profile: UserProfile
  institutionId: string
  branchId?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

type UserRole = 'admin' | 'professor' | 'student'

interface UserProfile {
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  dateOfBirth?: Date
  address?: Address
  // Role-specific fields
  studentProfile?: StudentProfile
  professorProfile?: ProfessorProfile
}

interface StudentProfile {
  rollNumber: string
  admissionYear: number
  currentSemester: number
  gpa?: number
  parentContact?: ContactInfo
}

interface ProfessorProfile {
  employeeId: string
  department: string
  designation: string
  specialization: string[]
  officeHours?: string
}

// Academic Entities
interface Course {
  id: string
  branchId: string
  name: string
  code: string
  credits: number
  semester: number
  description?: string
  professorId?: string
  createdAt: Date
  updatedAt: Date
}

interface Assignment {
  id: string
  courseId: string
  professorId: string
  title: string
  description?: string
  dueDate?: Date
  maxMarks: number
  fileAttachments: string[]
  createdAt: Date
  updatedAt: Date
}

interface Submission {
  id: string
  assignmentId: string
  studentId: string
  content?: string
  fileAttachments: string[]
  submittedAt: Date
  marksObtained?: number
  feedback?: string
  gradedAt?: Date
  gradedBy?: string
}

// Analytics and AI Models
interface PerformanceAnalytics {
  studentId: string
  overallGPA: number
  semesterWiseGPA: SemesterGPA[]
  subjectPerformance: SubjectPerformance[]
  attendanceRate: number
  assignmentCompletionRate: number
  trends: PerformanceTrend[]
  predictions: PerformancePrediction[]
}

interface GradePrediction {
  studentId: string
  courseId: string
  predictedGrade: string
  confidence: number
  factors: PredictionFactor[]
  recommendations: string[]
}
```

### Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Institution {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String   @db.VarChar(255)
  code      String   @unique @db.VarChar(50)
  address   String?
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  branches Branch[]
  users    User[]

  @@map("institutions")
}

model Branch {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  institutionId String   @map("institution_id") @db.Uuid
  name          String   @db.VarChar(255)
  code          String   @db.VarChar(50)
  description   String?
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  institution Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)
  users       User[]
  courses     Course[]

  @@unique([institutionId, code])
  @@map("branches")
}

model User {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email         String   @unique @db.VarChar(255)
  role          UserRole
  profile       Json
  institutionId String?  @map("institution_id") @db.Uuid
  branchId      String?  @map("branch_id") @db.Uuid
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  institution Institution? @relation(fields: [institutionId], references: [id])
  branch      Branch?      @relation(fields: [branchId], references: [id])

  // Relations as student
  enrollments        Enrollment[]
  submissions        Submission[]
  attendanceRecords  Attendance[]

  // Relations as professor
  assignmentsCreated Assignment[] @relation("ProfessorAssignments")
  attendanceMarked   Attendance[] @relation("AttendanceMarkedBy")
  submissionsGraded  Submission[] @relation("SubmissionGradedBy")
  noticesCreated     Notice[]

  @@map("users")
}

enum UserRole {
  admin
  professor
  student

  @@map("user_role")
}

// Additional models following similar pattern...
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I've identified several areas where properties can be consolidated:

**Data Integrity Properties**: Properties 1.1, 1.3, 11.1, and 11.3 all relate to data integrity during migration and operations. These can be combined into comprehensive data integrity properties.

**Caching Properties**: Properties 4.1, 4.2, 4.3, 4.4, and 4.5 all relate to Redis caching behavior. These can be consolidated into fewer, more comprehensive caching properties.

**Real-time Properties**: Properties 5.1, 5.2, 5.3, 5.4, and 5.5 all relate to real-time functionality. These can be combined into properties that test the overall real-time system behavior.

**Performance Properties**: Properties 12.1, 12.2, 12.3, 12.4, and 12.5 all relate to system performance. These can be consolidated into comprehensive performance properties.

**Testing Properties**: Properties 9.1, 9.2, 9.3, 9.4, and 9.5 relate to testing completeness and can be combined.

### Converting EARS to Properties

Based on the prework analysis, here are the key correctness properties:

**Property 1: Data Migration Integrity**
*For any* data migration operation from MongoDB to PostgreSQL, the total record count and data checksums should remain identical before and after migration
**Validates: Requirements 1.1, 11.1, 11.3**

**Property 2: Database Referential Integrity**
*For any* database operation involving related entities (students, courses, assignments), all foreign key constraints should be enforced and referential integrity maintained
**Validates: Requirements 1.2, 1.3**

**Property 3: Type Safety Compilation**
*For any* TypeScript code in the system, compilation with strict mode should complete without errors and without any 'any' types in production code
**Validates: Requirements 2.3, 2.4, 2.5**

**Property 4: API Backward Compatibility**
*For any* existing API endpoint, the TypeScript version should produce identical responses to the JavaScript version for the same inputs
**Validates: Requirements 2.1, 2.2**

**Property 5: Role-Based Access Control**
*For any* user with a specific role (Admin, Professor, Student), access to resources should be granted or denied based on their role permissions consistently
**Validates: Requirements 3.2, 3.5**

**Property 6: Authentication Token Management**
*For any* authentication token, the system should properly validate, refresh, or reject the token based on its expiration status and validity
**Validates: Requirements 3.1, 3.3**

**Property 7: Cache Consistency and TTL**
*For any* cached data with a specified TTL (Time To Live), the cache should return fresh data within the TTL period and refresh data after expiration
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

**Property 8: Real-time Notification Delivery**
*For any* system event that should trigger notifications (notices, grades, attendance), all connected users in the target audience should receive the notification within 1 second
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

**Property 9: AI Service Prediction Accuracy**
*For any* AI prediction request with sufficient historical data, the service should return predictions with confidence scores and the predictions should fall within reasonable academic ranges (0-100 for grades, 0-1 for probabilities)
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

**Property 10: File Storage Security**
*For any* file upload or access request, the system should enforce proper access controls based on user permissions and file ownership
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

**Property 11: RESTful API Compliance**
*For any* API endpoint, it should follow REST conventions for HTTP methods, status codes, and resource naming, and provide proper error responses for invalid inputs
**Validates: Requirements 8.1, 8.3, 8.4, 8.5**

**Property 12: Test Coverage and Quality**
*For any* code module in the backend services, it should have minimum 80% test coverage with unit, integration, and property-based tests
**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

**Property 13: System Performance Benchmarks**
*For any* user interaction with the system, page loads should complete within 2 seconds and the system should maintain performance under concurrent user load
**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

**Property 14: Deployment and Monitoring**
*For any* service deployment, it should include health checks, comprehensive logging, and support for horizontal scaling
**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

**Property 15: System Initialization**
*For any* fresh system setup, the initialization process should create all required default roles, permissions, configurations, and admin accounts successfully
**Validates: Requirements 11.2, 11.4, 11.5**

## Error Handling

### Error Classification and Handling Strategy

**Client Errors (4xx):**
- 400 Bad Request: Invalid input data, malformed requests
- 401 Unauthorized: Missing or invalid authentication
- 403 Forbidden: Insufficient permissions for resource access
- 404 Not Found: Resource does not exist
- 409 Conflict: Resource already exists or constraint violation
- 422 Unprocessable Entity: Valid format but semantic errors

**Server Errors (5xx):**
- 500 Internal Server Error: Unexpected server errors
- 502 Bad Gateway: AI service or external service unavailable
- 503 Service Unavailable: System maintenance or overload
- 504 Gateway Timeout: External service timeout

### Error Response Format

```typescript
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, any>
    timestamp: string
    requestId: string
  }
}

// Example error responses
const ValidationError: ErrorResponse = {
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input data provided',
    details: {
      field: 'email',
      reason: 'Invalid email format'
    },
    timestamp: '2024-01-07T10:30:00Z',
    requestId: 'req_123456789'
  }
}
```

### Database Error Handling

```typescript
// Prisma error handling
class DatabaseErrorHandler {
  static handlePrismaError(error: any): ErrorResponse {
    if (error.code === 'P2002') {
      return {
        success: false,
        error: {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: 'Resource already exists',
          details: { field: error.meta?.target },
          timestamp: new Date().toISOString(),
          requestId: generateRequestId()
        }
      }
    }
    
    if (error.code === 'P2025') {
      return {
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Requested resource not found',
          timestamp: new Date().toISOString(),
          requestId: generateRequestId()
        }
      }
    }
    
    // Generic database error
    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed',
        timestamp: new Date().toISOString(),
        requestId: generateRequestId()
      }
    }
  }
}
```

### AI Service Error Handling

```typescript
// AI service error handling
class AIServiceErrorHandler {
  static handlePredictionError(error: any): ErrorResponse {
    if (error.message.includes('insufficient data')) {
      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_DATA',
          message: 'Not enough historical data for accurate prediction',
          details: { minimumDataPoints: 10 },
          timestamp: new Date().toISOString(),
          requestId: generateRequestId()
        }
      }
    }
    
    return {
      success: false,
      error: {
        code: 'AI_SERVICE_ERROR',
        message: 'AI prediction service temporarily unavailable',
        timestamp: new Date().toISOString(),
        requestId: generateRequestId()
      }
    }
  }
}
```

## Testing Strategy

### Dual Testing Approach

The system will implement both unit testing and property-based testing as complementary approaches:

**Unit Tests:**
- Test specific examples and edge cases
- Verify integration points between components
- Test error conditions and boundary cases
- Focus on concrete scenarios and known inputs/outputs

**Property-Based Tests:**
- Verify universal properties across all inputs
- Test system behavior with randomized data
- Validate business rules and invariants
- Ensure comprehensive input coverage

### Testing Framework Configuration

**Backend Testing (Node.js + TypeScript):**
```typescript
// Jest configuration for unit tests
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}

// Fast-check for property-based testing
import fc from 'fast-check'

describe('Property-Based Tests', () => {
  test('Property 1: Data Migration Integrity', () => {
    fc.assert(fc.property(
      fc.array(fc.record({
        id: fc.string(),
        name: fc.string(),
        email: fc.emailAddress()
      })),
      (students) => {
        const migrated = migrateStudentsToPostgreSQL(students)
        return migrated.length === students.length &&
               migrated.every(s => students.some(orig => orig.id === s.id))
      }
    ), { numRuns: 100 })
    // **Feature: mbc-modernization, Property 1: Data Migration Integrity**
  })
})
```

**Frontend Testing (React + TypeScript):**
```typescript
// Vitest configuration
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
})

// React Testing Library + Property-based tests
import { render, screen } from '@testing-library/react'
import fc from 'fast-check'

describe('UI Property Tests', () => {
  test('Property 4: API Backward Compatibility', () => {
    fc.assert(fc.property(
      fc.record({
        name: fc.string(),
        email: fc.emailAddress(),
        role: fc.constantFrom('admin', 'professor', 'student')
      }),
      (userData) => {
        const component = render(<UserForm initialData={userData} />)
        const nameInput = screen.getByLabelText(/name/i)
        expect(nameInput).toHaveValue(userData.name)
        return true
      }
    ), { numRuns: 50 })
    // **Feature: mbc-modernization, Property 4: API Backward Compatibility**
  })
})
```

**AI Service Testing (Python + FastAPI):**
```python
# pytest configuration with hypothesis for property-based testing
import pytest
from hypothesis import given, strategies as st
from fastapi.testclient import TestClient

class TestAIService:
    @given(st.lists(st.floats(min_value=0, max_value=100), min_size=3))
    def test_grade_prediction_property(self, grades):
        """Property 9: AI Service Prediction Accuracy"""
        prediction = predict_grade(grades)
        assert 0 <= prediction['predicted_grade'] <= 100
        assert 0 <= prediction['confidence'] <= 1
        # **Feature: mbc-modernization, Property 9: AI Service Prediction Accuracy**
```

### Integration and E2E Testing

**API Integration Tests:**
```typescript
describe('Integration Tests', () => {
  test('Student enrollment workflow', async () => {
    // Create student
    const student = await createStudent(testStudentData)
    
    // Enroll in course
    const enrollment = await enrollStudent(student.id, testCourse.id)
    
    // Verify enrollment
    const studentCourses = await getStudentCourses(student.id)
    expect(studentCourses).toContainEqual(
      expect.objectContaining({ courseId: testCourse.id })
    )
  })
})
```

**End-to-End Tests with Playwright:**
```typescript
import { test, expect } from '@playwright/test'

test('Complete assignment submission flow', async ({ page }) => {
  // Login as student
  await page.goto('/login')
  await page.fill('[data-testid=email]', 'student@test.com')
  await page.fill('[data-testid=password]', 'password')
  await page.click('[data-testid=login-button]')
  
  // Navigate to assignments
  await page.click('[data-testid=assignments-nav]')
  
  // Submit assignment
  await page.click('[data-testid=submit-assignment]')
  await page.fill('[data-testid=submission-text]', 'My assignment submission')
  await page.click('[data-testid=submit-button]')
  
  // Verify submission
  await expect(page.locator('[data-testid=submission-success]')).toBeVisible()
})
```

### Performance Testing

**Load Testing with Artillery:**
```yaml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
  processor: "./test-functions.js"

scenarios:
  - name: "Student Dashboard Load"
    weight: 70
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "student@test.com"
            password: "password"
          capture:
            - json: "$.accessToken"
              as: "token"
      - get:
          url: "/api/v1/students/dashboard"
          headers:
            Authorization: "Bearer {{ token }}"
```

### Continuous Integration

**GitHub Actions Workflow:**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci
          cd mbc-backend && npm ci
          cd ../mbc-frontend && npm ci
      
      - name: Run backend tests
        run: |
          cd mbc-backend
          npm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379
      
      - name: Run frontend tests
        run: |
          cd mbc-frontend
          npm run test:coverage
      
      - name: Run E2E tests
        run: |
          npm run test:e2e
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
```

This comprehensive design provides a solid foundation for transforming your MBC Department Management system into a modern, production-ready application that will showcase advanced full-stack development skills while serving your department's needs effectively.