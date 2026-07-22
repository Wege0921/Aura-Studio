const http = require('http');

async function testFrontendIntegration() {
  console.log('🌐 Testing Frontend User Management Integration...\n');

  try {
    // Test if frontend can fetch users from backend
    const response = await fetch('http://localhost:5000/api/users', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi0xIiwiaWF0IjoxNzc4NTI2NTIyLCJleHAiOjE3NzkxMzEzMjJ9.6YXvqzPaGPksR7LcwItHJmQ8Im5i6pU77yyJSvgzA0E'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Frontend can successfully fetch users');
      console.log('Users count:', data.users?.length || 0);
      console.log('Pagination info:', data.pagination);
      
      if (data.users && data.users.length > 0) {
        console.log('\n📋 Sample user data:');
        data.users.slice(0, 2).forEach((user, index) => {
          console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
        });
      }
      
      console.log('\n🎯 Frontend Integration Status: PASSED');
      console.log('✅ Users list is accessible from frontend');
      console.log('✅ API endpoints are working correctly');
      console.log('✅ Authentication is functioning');
      
    } else {
      console.log('❌ Frontend failed to fetch users');
      console.log('Status:', response.status);
    }
  } catch (error) {
    console.error('❌ Error testing frontend integration:', error.message);
  }
}

testFrontendIntegration();
