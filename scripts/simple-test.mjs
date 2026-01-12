#!/usr/bin/env node

/**
 * Simple System Test
 * Basic health checks for the MBC system
 */

import axios from 'axios';

// Configuration
const config = {
  baseURL: 'http://localhost:5000/api/v1',
  frontendURL: 'http://localhost:5173',
  timeout: 5000
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class SimpleTestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  async runTest(name, testFn) {
    try {
      log(`🧪 Testing: ${name}`, 'cyan');
      await testFn();
      this.passed++;
      log(`✅ PASSED: ${name}`, 'green');
    } catch (error) {
      this.failed++;
      log(`❌ FAILED: ${name}`, 'red');
      log(`   Error: ${error.message}`, 'red');
    }
  }

  printSummary() {
    log('\n📊 Test Summary:', 'yellow');
    log(`✅ Passed: ${this.passed}`, 'green');
    log(`❌ Failed: ${this.failed}`, 'red');
    log(`📈 Total: ${this.passed + this.failed}`, 'cyan');
    
    const successRate = this.passed + this.failed > 0 ? 
      ((this.passed / (this.passed + this.failed)) * 100).toFixed(1) : 0;
    log(`🎯 Success Rate: ${successRate}%`, 'cyan');
  }
}

// Test functions
async function testBackendConnection() {
  try {
    const response = await axios.get(`${config.baseURL}/health`, { timeout: config.timeout });
    if (response.status !== 200) {
      throw new Error(`Backend returned status ${response.status}`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Backend server is not running on port 5000');
    }
    throw error;
  }
}

async function testFrontendConnection() {
  try {
    const response = await axios.get(config.frontendURL, { timeout: config.timeout });
    if (response.status !== 200) {
      throw new Error(`Frontend returned status ${response.status}`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Frontend server is not running on port 5173');
    }
    throw error;
  }
}

async function testDatabaseConnection() {
  try {
    const response = await axios.get(`${config.baseURL}/health/detailed`, { timeout: config.timeout });
    if (response.status !== 200) {
      throw new Error('Health check endpoint not available');
    }
    
    const healthData = response.data;
    if (healthData.database && healthData.database.status !== 'healthy') {
      throw new Error(`Database status: ${healthData.database.status}`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to backend for database check');
    }
    throw error;
  }
}

async function testBasicAPIEndpoints() {
  // Test a few basic endpoints that should be available
  const endpoints = [
    '/health',
    '/health/live',
    '/health/ready'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${config.baseURL}${endpoint}`, { timeout: config.timeout });
      if (response.status !== 200) {
        throw new Error(`Endpoint ${endpoint} returned status ${response.status}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to ${endpoint}`);
      }
      throw new Error(`Endpoint ${endpoint} failed: ${error.message}`);
    }
  }
}

// Main test execution
async function runSimpleTests() {
  const runner = new SimpleTestRunner();
  
  log('🚀 Starting simple system tests...\n', 'cyan');
  
  await runner.runTest('Backend Connection', testBackendConnection);
  await runner.runTest('Frontend Connection', testFrontendConnection);
  await runner.runTest('Database Connection', testDatabaseConnection);
  await runner.runTest('Basic API Endpoints', testBasicAPIEndpoints);
  
  runner.printSummary();
  
  if (runner.failed > 0) {
    log('\n💡 Suggestions:', 'yellow');
    log('- Make sure Docker Desktop is running', 'reset');
    log('- Start the backend: cd mbc-backend && npm run dev', 'reset');
    log('- Start the frontend: cd mbc-frontend && npm run dev', 'reset');
    log('- Check if PostgreSQL and Redis are running', 'reset');
  } else {
    log('\n🎉 All basic tests passed! System appears to be working.', 'green');
  }
  
  process.exit(runner.failed > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`❌ Unhandled error: ${error.message}`, 'red');
  process.exit(1);
});

process.on('SIGINT', () => {
  log('\n⚠️  Test interrupted by user', 'yellow');
  process.exit(1);
});

// Run tests
runSimpleTests().catch((error) => {
  log(`❌ Test execution failed: ${error.message}`, 'red');
  process.exit(1);
});