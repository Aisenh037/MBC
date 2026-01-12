// Test script to simulate frontend login request
const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login from frontend perspective...');
    
    const response = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'admin@mbc.edu',
      password: 'Password@123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5174'
      },
      withCredentials: true
    });

    console.log('✅ Login successful!');
    console.log('Status:', response.status);
    console.log('User:', response.data.data.user.email);
    console.log('Role:', response.data.data.user.role);
    console.log('Token received:', !!response.data.data.accessToken);
    
  } catch (error) {
    console.error('❌ Login failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLogin();