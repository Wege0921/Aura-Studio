const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBooking() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const userCount = await prisma.user.count();
    console.log('Users in database:', userCount);
    
    const classCount = await prisma.class.count();
    console.log('Classes in database:', classCount);
    
    const bookingCount = await prisma.booking.count();
    console.log('Bookings in database:', bookingCount);
    
    // Get a sample class
    const sampleClass = await prisma.class.findFirst();
    console.log('Sample class:', sampleClass);
    
    // Get a sample user
    const sampleUser = await prisma.user.findFirst();
    console.log('Sample user:', sampleUser);
    
    if (sampleClass && sampleUser) {
      console.log('Testing booking creation...');
      
      // Check if booking already exists
      const existingBooking = await prisma.booking.findUnique({
        where: {
          userId_classId: {
            userId: sampleUser.id,
            classId: sampleClass.id,
          },
        },
      });
      
      if (existingBooking) {
        console.log('Booking already exists');
      } else {
        // Try to create a booking
        const booking = await prisma.booking.create({
          data: {
            userId: sampleUser.id,
            classId: sampleClass.id,
            status: 'CONFIRMED',
          },
          include: {
            class: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
        
        console.log('Booking created successfully:', booking);
      }
    }
    
    console.log('Test completed successfully');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBooking();
