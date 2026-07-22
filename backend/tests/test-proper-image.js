const fs = require('fs');
const FormData = require('form-data');
const http = require('http');

function testProperImageUpload() {
  // Create a simple 1x1 PNG image (valid PNG format)
  const pngContent = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth, color type
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0x99, 0x01, 0x01, 0x01, 0x00, 0x00, // minimal image data
    0xFE, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // CRC
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
    0xAE, 0x42, 0x60, 0x82 // IEND CRC
  ]);

  // Create form data
  const form = new FormData();
  form.append('classId', 'cmopus6f4000fwry04p7k0apf');
  form.append('paymentMethod', 'BANK_TRANSFER');
  form.append('paymentAmount', '500');
  form.append('paymentReceipt', pngContent, {
    filename: 'payment-receipt.png',
    contentType: 'image/png'
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

testProperImageUpload();
