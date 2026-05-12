const http = require('http');

async function loginAndGetToken(email, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email, password });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve(response.token);
          } else {
            reject(new Error(response.error || 'Login failed'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    console.log('🔐 Getting authentication tokens...\n');

    // Login as admin
    console.log('1. Logging in as admin...');
    const adminToken = await loginAndGetToken('admin@aura-yoga.com', 'admin123');
    console.log('✅ Admin Token:', adminToken);

    // Login as regular user
    console.log('\n2. Logging in as regular user...');
    const userToken = await loginAndGetToken('wege@gmail.com', 'password123');
    console.log('✅ User Token:', userToken);

    console.log('\n📋 Update your test-user-management.js with these tokens:');
    console.log('\n// Replace these lines in test-user-management.js:');
    console.log('const ADMIN_TOKEN = "' + adminToken + '";');
    console.log('const USER_TOKEN = "' + userToken + '";');

    console.log('\n🧪 Then run: node test-user-management.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
