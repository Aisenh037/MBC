const http = require('http');

const BASE_URL = 'http://localhost:5000/api/v1';

function makeRequest(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAdminAuth() {
  console.log('Testing Admin Authentication Flow...\n');

  try {
    // Test registration with admin role
    console.log('1. Testing Admin User Registration...');
    const registerResponse = await makeRequest('/auth/register', 'POST', {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
    });
    console.log('✅ Admin Registration successful:', registerResponse);

    // Test login with admin
    console.log('\n2. Testing Admin User Login...');
    const loginResponse = await makeRequest('/auth/login', 'POST', {
      email: 'admin@example.com',
      password: 'admin123',
    });
    console.log('✅ Admin Login successful:', loginResponse);

    const adminToken = loginResponse.token;

    // Test getMe (protected route)
    console.log('\n3. Testing Get Current User...');
    const meResponse = await makeRequest('/auth/me', 'GET', null, adminToken);
    console.log('✅ Get Me successful:', meResponse);

    return adminToken;
  } catch (error) {
    console.error('❌ Admin Auth test failed:', error.message);
    return null;
  }
}

async function testAdminStudents(token) {
  console.log('\nTesting Student CRUD Operations (Admin Access)...\n');

  if (!token) {
    console.log('❌ Skipping student tests - no auth token');
    return;
  }

  try {
    // Test get students
    console.log('1. Testing Get Students...');
    const studentsResponse = await makeRequest('/students', 'GET', null, token);
    console.log('✅ Get Students successful:', studentsResponse);

    // Test create student
    console.log('\n2. Testing Create Student...');
    const createStudentResponse = await makeRequest('/students', 'POST', {
      name: 'John Doe',
      email: 'john.doe@example.com',
      enrollmentNumber: 'EN001',
      branch: 'Computer Science',
      semester: 6,
      contactNumber: '1234567890',
    }, token);
    console.log('✅ Create Student successful:', createStudentResponse);

  } catch (error) {
    console.error('❌ Students test failed:', error.message);
  }
}

async function testAdminAnalytics(token) {
  console.log('\nTesting Analytics Endpoints (Admin Access)...\n');

  if (!token) {
    console.log('❌ Skipping analytics tests - no auth token');
    return;
  }

  try {
    // Test get analytics
    console.log('1. Testing Get Analytics...');
    const analyticsResponse = await makeRequest('/analytics', 'GET', null, token);
    console.log('✅ Get Analytics successful:', analyticsResponse);

  } catch (error) {
    console.error('❌ Analytics test failed:', error.message);
  }
}

async function runAdminTests() {
  console.log('🚀 Starting Admin Backend API Tests...\n');

  const token = await testAdminAuth();
  await testAdminStudents(token);
  await testAdminAnalytics(token);

  console.log('\n✅ All admin tests completed!');
}

runAdminTests().catch(console.error);
