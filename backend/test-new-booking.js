const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testNewBooking() {
  try {
    console.log('Testing new booking...');
    
    // First, delete existing booking for this user
    const existingBooking = await prisma.booking.findFirst({
      where: { userId: 'cmopj63rr0000c6qy2b0ndc9e' }
    });
    
    if (existingBooking) {
      console.log('Deleting existing booking...');
      await prisma.booking.delete({
        where: { id: existingBooking.id }
      });
    }
    
    // Generate a test token for real database user
    const token = jwt.sign({ userId: 'cmopj63rr0000c6qy2b0ndc9e' }, 'aura-yoga-super-secret-jwt-key-for-development', { expiresIn: '7d' });
    
    // Test the booking endpoint
    const response = await fetch('http://localhost:5000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        classId: 'cmopus6f4000fwry04p7k0apf',
      }),
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewBooking();
