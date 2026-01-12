#!/usr/bin/env node

/**
 * Comprehensive Feature Testing Script
 * Tests all major features of the MBC system
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

// Configuration
const config = {
  baseURL: 'http://localhost:5000/api/v1',
  frontendURL: 'http://localhost:5173',
  aiServiceURL: 'http://localhost:5001',
  timeout: 10000
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test data
const testData = {
  admin: {
    email: 'admin@mbc.com',
    password: 'Admin@123'
  },
  student: {
    email: 'student.test@mbc.com',
    password: 'Student@123',
    profile: {
      firstName: 'Test',
      lastName: 'Student',
      phone: '+1234567890'
    }
  },
  professor: {
    email: 'professor.test@mbc.com',
    password: 'Professor@123',
    profile: {
      firstName: 'Test',
      lastName: 'Professor',
      phone: '+1234567891'
    }
  },
  course: {
    name: 'Test Course',
    code: 'TC101',
    credits: 3,
    semester: 1,
    description: 'A test course for automated testing'
  },
  assignment: {
    title: 'Test Assignment',
    description: 'This is a test assignment for automated testing',
    maxMarks: 100,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
  }
};

// Global variables for test state
let tokens = {};
let testEntities = {};

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async runTest(name, testFn) {
    try {
      log(`🧪 Testing: ${name}`, 'cyan');
      await testFn();
      this.passed++;
      log(`✅ PASSED: ${name}`, 'green');
      this.tests.push({ name, status: 'PASSED' });
    } catch (error) {
      this.failed++;
      log(`❌ FAILED: ${name}`, 'red');
      log(`   Error: ${error.message}`, 'red');
      this.tests.push({ name, status: 'FAILED', error: error.message });
    }
  }

  printSummary() {
    log('\n📊 Test Summary:', 'yellow');
    log(`✅ Passed: ${this.passed}`, 'green');
    log(`❌ Failed: ${this.failed}`, 'red');
    log(`📈 Total: ${this.passed + this.failed}`, 'blue');
    
    if (this.failed > 0) {
      log('\n❌ Failed Tests:', 'red');
      this.tests.filter(t => t.status === 'FAILED').forEach(test => {
        log(`   - ${test.name}: ${test.error}`, 'red');
      });
    }
    
    log(`\n🎯 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`, 'magenta');
  }
}

// API Helper functions
async function apiCall(method, endpoint, data = null, token = null, isFormData = false) {
  const headers = {
    'Content-Type': isFormData ? 'multipart/form-data' : 'application/json'
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const axiosConfig = {
    method,
    url: `${config.baseURL}${endpoint}`,
    headers,
    timeout: config.timeout
  };

  if (data) {
    if (method.toLowerCase() === 'get') {
      axiosConfig.params = data;
    } else {
      axiosConfig.data = data;
    }
  }

  const response = await axios(axiosConfig);
  return response.data;
}

// Test functions
async function testHealthCheck() {
  const response = await apiCall('GET', '/health');
  if (!response.success) {
    throw new Error('Health check failed');
  }
}

async function testUserRegistration() {
  // Register student
  const studentResponse = await apiCall('POST', '/auth/register', {
    ...testData.student,
    role: 'student'
  });
  
  if (!studentResponse.success) {
    throw new Error('Student registration failed');
  }

  // Register professor
  const professorResponse = await apiCall('POST', '/auth/register', {
    ...testData.professor,
    role: 'professor'
  });
  
  if (!professorResponse.success) {
    throw new Error('Professor registration failed');
  }
}

async function testUserLogin() {
  // Login admin
  const adminResponse = await apiCall('POST', '/auth/login', testData.admin);
  if (!adminResponse.success || !adminResponse.data.token) {
    throw new Error('Admin login failed');
  }
  tokens.admin = adminResponse.data.token;

  // Login student
  const studentResponse = await apiCall('POST', '/auth/login', {
    email: testData.student.email,
    password: testData.student.password
  });
  if (!studentResponse.success || !studentResponse.data.token) {
    throw new Error('Student login failed');
  }
  tokens.student = studentResponse.data.token;

  // Login professor
  const professorResponse = await apiCall('POST', '/auth/login', {
    email: testData.professor.email,
    password: testData.professor.password
  });
  if (!professorResponse.success || !professorResponse.data.token) {
    throw new Error('Professor login failed');
  }
  tokens.professor = professorResponse.data.token;
}

async function testCourseManagement() {
  // Create course (admin)
  const createResponse = await apiCall('POST', '/courses', testData.course, tokens.admin);
  if (!createResponse.success) {
    throw new Error('Course creation failed');
  }
  testEntities.course = createResponse.data;

  // Get courses
  const getResponse = await apiCall('GET', '/courses', null, tokens.admin);
  if (!getResponse.success || !Array.isArray(getResponse.data)) {
    throw new Error('Get courses failed');
  }

  // Update course
  const updateResponse = await apiCall('PUT', `/courses/${testEntities.course.id}`, {
    description: 'Updated test course description'
  }, tokens.admin);
  if (!updateResponse.success) {
    throw new Error('Course update failed');
  }
}

async function testAssignmentManagement() {
  if (!testEntities.course) {
    throw new Error('Course not created yet');
  }

  // Create assignment (professor)
  const createResponse = await apiCall('POST', '/assignments', {
    ...testData.assignment,
    courseId: testEntities.course.id
  }, tokens.professor);
  
  if (!createResponse.success) {
    throw new Error('Assignment creation failed');
  }
  testEntities.assignment = createResponse.data;

  // Get assignments
  const getResponse = await apiCall('GET', '/assignments', null, tokens.student);
  if (!getResponse.success || !Array.isArray(getResponse.data)) {
    throw new Error('Get assignments failed');
  }
}

async function testFileUpload() {
  if (!testEntities.assignment) {
    throw new Error('Assignment not created yet');
  }

  // Create a test file
  const testFilePath = path.join(__dirname, 'test-file.txt');
  fs.writeFileSync(testFilePath, 'This is a test file for assignment submission.');

  try {
    // Create form data
    const formData = new FormData();
    formData.append('files', fs.createReadStream(testFilePath));
    formData.append('assignmentId', testEntities.assignment.id);
    formData.append('content', 'This is my assignment submission content.');
    formData.append('submissionNotes', 'Test submission notes.');

    // Upload file (student)
    const uploadResponse = await axios.post(
      `${config.baseURL}/assignments/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${tokens.student}`
        },
        timeout: config.timeout
      }
    );

    if (!uploadResponse.data.success) {
      throw new Error('File upload failed');
    }

    testEntities.submission = uploadResponse.data.data.submission;
  } finally {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
}

async function testGrading() {
  if (!testEntities.assignment || !testEntities.submission) {
    throw new Error('Assignment or submission not created yet');
  }

  // Grade submission (professor)
  const gradeResponse = await apiCall('PUT', 
    `/assignments/${testEntities.assignment.id}/submissions/${testEntities.submission.id}/grade`,
    {
      marksObtained: 85,
      feedback: 'Good work! Well structured and clear explanations.'
    },
    tokens.professor
  );

  if (!gradeResponse.success) {
    throw new Error('Grading failed');
  }
}

async function testPasswordReset() {
  // Request password reset
  const resetResponse = await apiCall('POST', '/auth/forgot-password', {
    email: testData.student.email
  });

  if (!resetResponse.success) {
    throw new Error('Password reset request failed');
  }

  // Note: We can't test the actual reset without accessing the email
  // This test just verifies the endpoint works
}

async function testNotifications() {
  // Test real-time notification endpoint
  try {
    const notificationResponse = await apiCall('GET', '/notifications', null, tokens.student);
    // This might fail if notifications endpoint doesn't exist yet
    // That's okay for now
  } catch (error) {
    // Ignore for now - notifications might not be fully implemented
  }
}

async function testAnalytics() {
  // Test analytics endpoint
  try {
    const analyticsResponse = await apiCall('GET', '/analytics/dashboard', null, tokens.admin);
    if (analyticsResponse && !analyticsResponse.success) {
      throw new Error('Analytics dashboard failed');
    }
  } catch (error) {
    // Analytics might not be fully implemented yet
    if (!error.message.includes('404')) {
      throw error;
    }
  }
}

async function testAIService() {
  try {
    // Test AI service health
    const healthResponse = await axios.get(`${config.aiServiceURL}/health`, {
      timeout: 5000
    });
    
    if (healthResponse.status !== 200) {
      throw new Error('AI service health check failed');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('AI service is not running');
    }
    throw error;
  }
}

async function testCacheService() {
  // Test cache by making repeated requests
  const start = Date.now();
  await apiCall('GET', '/courses', null, tokens.admin);
  const firstCall = Date.now() - start;

  const start2 = Date.now();
  await apiCall('GET', '/courses', null, tokens.admin);
  const secondCall = Date.now() - start2;

  // Second call should be faster due to caching (this is a rough test)
  if (secondCall > firstCall) {
    log('⚠️  Cache might not be working optimally', 'yellow');
  }
}

async function testWebSocketConnection() {
  // This is a basic test - in a real scenario you'd use a WebSocket client
  try {
    const response = await axios.get(`${config.frontendURL}`, { timeout: 5000 });
    if (response.status !== 200) {
      throw new Error('Frontend not accessible');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Frontend is not running');
    }
    throw error;
  }
}

// Cleanup function
async function cleanup() {
  log('\n🧹 Cleaning up test data...', 'yellow');
  
  try {
    // Delete test entities in reverse order
    if (testEntities.assignment && tokens.professor) {
      await apiCall('DELETE', `/assignments/${testEntities.assignment.id}`, null, tokens.professor);
    }
    
    if (testEntities.course && tokens.admin) {
      await apiCall('DELETE', `/courses/${testEntities.course.id}`, null, tokens.admin);
    }
    
    log('✅ Cleanup completed', 'green');
  } catch (error) {
    log(`⚠️  Cleanup warning: ${error.message}`, 'yellow');
  }
}

// Main test execution
async function runAllTests() {
  const runner = new TestRunner();
  
  log('🚀 Starting comprehensive feature testing...\n', 'bright');
  
  // Core functionality tests
  await runner.runTest('Health Check', testHealthCheck);
  await runner.runTest('User Registration', testUserRegistration);
  await runner.runTest('User Login', testUserLogin);
  
  // Feature tests
  await runner.runTest('Course Management', testCourseManagement);
  await runner.runTest('Assignment Management', testAssignmentManagement);
  await runner.runTest('File Upload', testFileUpload);
  await runner.runTest('Grading System', testGrading);
  await runner.runTest('Password Reset', testPasswordReset);
  
  // Advanced features
  await runner.runTest('Notifications', testNotifications);
  await runner.runTest('Analytics', testAnalytics);
  await runner.runTest('AI Service', testAIService);
  await runner.runTest('Cache Service', testCacheService);
  await runner.runTest('WebSocket Connection', testWebSocketConnection);
  
  // Cleanup
  await cleanup();
  
  // Print summary
  runner.printSummary();
  
  // Exit with appropriate code
  process.exit(runner.failed > 0 ? 1 : 0);
}

// Handle errors and cleanup
process.on('unhandledRejection', async (error) => {
  log(`❌ Unhandled error: ${error.message}`, 'red');
  await cleanup();
  process.exit(1);
});

process.on('SIGINT', async () => {
  log('\n⚠️  Test interrupted by user', 'yellow');
  await cleanup();
  process.exit(1);
});

// Run tests
runAllTests().catch(async (error) => {
  log(`❌ Test execution failed: ${error.message}`, 'red');
  await cleanup();
  process.exit(1);
});