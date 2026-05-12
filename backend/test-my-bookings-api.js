const http = require('http');

function testMyBookingsAPI() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/bookings/my-bookings',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbW9wajYzcnIwMDAwYzZxeTJiMG5kYzllIiwiaWF0IjoxNzc3ODIwODAxLCJleHAiOjE3Nzg0MjU2MDF9.GG9hQ3ajFfRynZyPrwRLWYWDXLb_0gSDRKyhfA4VQd8'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
      
      // Parse and check the structure
      try {
        const bookings = JSON.parse(data);
        console.log('\n--- Booking Structure Analysis ---');
        bookings.forEach((booking, index) => {
          console.log(`\nBooking ${index + 1}:`);
          console.log('- ID:', booking.id);
          console.log('- Status:', booking.status);
          console.log('- Payment Status:', booking.paymentStatus);
          console.log('- Class Date:', booking.class?.date);
          console.log('- Class Time:', booking.class?.time);
          
          // Test the frontend logic
          const isCancellable = booking.status === 'CONFIRMED' && 
            new Date(`${booking.class?.date}T${booking.class?.time}`) > new Date(Date.now() + 2 * 60 * 60 * 1000);
          console.log('- Frontend isCancellable:', isCancellable);
        });
      } catch (error) {
        console.error('Error parsing response:', error);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.end();
}

testMyBookingsAPI();
