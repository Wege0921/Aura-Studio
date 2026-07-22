const fs = require('fs');
const FormData = require('form-data');
const http = require('http');

function testPDFUpload() {
  // Create a simple test PDF file
  const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF');

  // Create form data
  const form = new FormData();
  form.append('classId', 'cmopus6f4000fwry04p7k0apf');
  form.append('paymentMethod', 'BANK_TRANSFER');
  form.append('paymentAmount', '500');
  form.append('paymentReceipt', pdfContent, {
    filename: 'test-receipt.pdf',
    contentType: 'application/pdf'
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
    console.log(`Headers:`, res.headers);
    
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

testPDFUpload();
