const fs = require('fs');
const FormData = require('form-data');
const http = require('http');

function testImageUpload() {
  // Create a simple test JPG file (minimal valid JPG)
  const jpgContent = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43
  ]);

  // Create form data
  const form = new FormData();
  form.append('classId', 'cmopus6f4000fwry04p7k0apf');
  form.append('paymentMethod', 'BANK_TRANSFER');
  form.append('paymentAmount', '500');
  form.append('paymentReceipt', jpgContent, {
    filename: 'payment-receipt.jpg',
    contentType: 'image/jpeg'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/bookings',
    method: 'POST',
    headers: {
      ...form.getHeaders(),
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
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  form.pipe(req);
}

testImageUpload();
