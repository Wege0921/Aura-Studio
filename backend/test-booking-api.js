const jwt = require('jsonwebtoken');

async function testBookingAPI() {
  try {
    console.log('Testing booking API endpoint...');
    
    // Generate a test token for real database user
    const token = jwt.sign({ userId: 'cmopj63rr0000c6qy2b0ndc9e' }, 'aura-yoga-super-secret-jwt-key-for-development', { expiresIn: '7d' });
    console.log('Generated test token:', token);
    
    // Test the booking endpoint
    const response = await fetch('http://localhost:5000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        classId: 'cmopus6f4000fwry04p7k0apf', // Use the class ID from our test
      }),
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('API test failed:', error);
  }
}

testBookingAPI();
