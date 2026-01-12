import request from 'supertest';
import app from './mbc-backend/app.js';

async function testAdminLogin() {
  console.log('Testing Admin Login...');
  try {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@mbc.com',
        password: 'Admin@123'
      });

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.status === 200 && response.body.success) {
      console.log('✓ Admin login successful!');
    } else {
      console.log('✗ Admin login failed');
    }
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testAdminLogin();
