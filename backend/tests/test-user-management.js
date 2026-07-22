const fs = require('fs');
const http = require('http');

// Test User Management API endpoints
const BASE_URL = 'http://localhost:5000';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi0xIiwiaWF0IjoxNzc4NTI2NTIyLCJleHAiOjE3NzkxMzEzMjJ9.6YXvqzPaGPksR7LcwItHJmQ8Im5i6pU77yyJSvgzA0E';

async function testUserManagement() {
  console.log('🧪 Testing User Management API...\n');

  // Test 1: Get all users (admin only)
  console.log('1. Testing GET /api/users - Get all users');
  try {
    const response = await makeRequest('GET', '/api/users', null, ADMIN_TOKEN);
    console.log('✅ Success:', response.status);
    console.log('Users found:', response.data.users?.length || 0);
    console.log('Pagination:', response.data.pagination);
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }

  // Test 2: Get user statistics
  console.log('\n2. Testing GET /api/users/stats/overview - Get user statistics');
  try {
    const response = await makeRequest('GET', '/api/users/stats/overview', null, ADMIN_TOKEN);
    console.log('✅ Success:', response.status);
    console.log('Stats:', response.data);
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }

  // Test 3: Get single user
  console.log('\n3. Testing GET /api/users/:id - Get single user');
  try {
    // First get a user ID from the users list
    const usersResponse = await makeRequest('GET', '/api/users?limit=1', null, ADMIN_TOKEN);
    const userId = usersResponse.data.users?.[0]?.id;
    
    if (userId) {
      const response = await makeRequest('GET', `/api/users/${userId}`, null, ADMIN_TOKEN);
      console.log('✅ Success:', response.status);
      console.log('User details:', response.data.name, response.data.email);
    } else {
      console.log('⚠️  No users found to test single user endpoint');
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }

  // Test 4: Update user role
  console.log('\n4. Testing PATCH /api/users/:id/role - Update user role');
  try {
    const usersResponse = await makeRequest('GET', '/api/users?limit=1', null, ADMIN_TOKEN);
    const userId = usersResponse.data.users?.[0]?.id;
    
    if (userId) {
      const response = await makeRequest('PATCH', `/api/users/${userId}/role`, 
        { role: 'USER' }, ADMIN_TOKEN);
      console.log('✅ Success:', response.status);
      console.log('Updated user role:', response.data.user?.role);
    } else {
      console.log('⚠️  No users found to test role update');
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }

  // Test 5: Update user profile
  console.log('\n5. Testing PATCH /api/users/:id/profile - Update user profile');
  try {
    const usersResponse = await makeRequest('GET', '/api/users?limit=1', null, ADMIN_TOKEN);
    const userId = usersResponse.data.users?.[0]?.id;
    
    if (userId) {
      const response = await makeRequest('PATCH', `/api/users/${userId}/profile`, 
        { name: 'Test User Updated', email: 'test@example.com' }, ADMIN_TOKEN);
      console.log('✅ Success:', response.status);
      console.log('Updated user profile:', response.data.user?.name);
    } else {
      console.log('⚠️  No users found to test profile update');
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }

  // Test 6: Test unauthorized access
  console.log('\n6. Testing unauthorized access (non-admin user)');
  try {
    const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbW9wajYzcnIwMDAwYzZxeTJiMG5kYzllIiwiaWF0IjoxNzc3ODIwODAxLCJleHAiOjE3Nzg0MjU2MDF9.GG9hQ3ajFfRynZyPrwRLWYWDXLb_0gSDRKyhfA4VQd8';
    const response = await makeRequest('GET', '/api/users', null, USER_TOKEN);
    console.log('❌ Should have failed but got:', response.status);
  } catch (error) {
    console.log('✅ Correctly failed (as expected):', error.message);
  }

  // Test 7: Test pagination and filtering
  console.log('\n7. Testing pagination and filtering');
  try {
    const response = await makeRequest('GET', '/api/users?page=1&limit=5&search=test&role=USER', null, ADMIN_TOKEN);
    console.log('✅ Success:', response.status);
    console.log('Filtered users:', response.data.users?.length || 0);
    console.log('Pagination info:', response.data.pagination);
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }

  console.log('\n🎉 User Management API testing completed!');
}

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const data = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            data: data
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Run the tests
testUserManagement().catch(console.error);
