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

async function testAuth() {
  console.log('Testing Authentication Flow...\n');

  try {
    // Test registration
    console.log('1. Testing User Registration...');
    const registerResponse = await makeRequest('/auth/register', 'POST', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'student',
    });
    console.log('✅ Registration successful:', registerResponse);

    // Test login
    console.log('\n2. Testing User Login...');
    const loginResponse = await makeRequest('/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'password123',
    });
    console.log('✅ Login successful:', loginResponse);

    const token = loginResponse.token;

    // Test getMe (protected route)
    console.log('\n3. Testing Get Current User...');
    const meResponse = await makeRequest('/auth/me', 'GET', null, token);
    console.log('✅ Get Me successful:', meResponse);

    // Test logout
    console.log('\n4. Testing Logout...');
    const logoutResponse = await makeRequest('/auth/logout', 'POST', null, token);
    console.log('✅ Logout successful:', logoutResponse);

    return token;
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
    return null;
  }
}

async function testStudents(token) {
  console.log('\nTesting Student CRUD Operations...\n');

  if (!token) {
    console.log('❌ Skipping student tests - no auth token');
    return;
  }

  try {
    // Test get students
    console.log('1. Testing Get Students...');
    const studentsResponse = await makeRequest('/students', 'GET', null, token);
    console.log('✅ Get Students successful:', studentsResponse);
  } catch (error) {
    console.error('❌ Students test failed:', error.message);
  }
}

async function testCORS() {
  console.log('\nTesting CORS Settings...\n');

  // CORS preflight test is complex with http module, skipping detailed test here
  console.log('⚠️ Manual CORS testing recommended via browser or tools like Postman.');
}

async function testAnalytics(token) {
  console.log('\nTesting Analytics Endpoints...\n');

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

async function runTests() {
  console.log('🚀 Starting Backend API Tests...\n');

  const token = await testAuth();
  await testStudents(token);
  await testCORS();
  await testAnalytics(token);

  console.log('\n✅ All tests completed!');
}

runTests().catch(console.error);
