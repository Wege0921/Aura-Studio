const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBookingData() {
  try {
    console.log('Checking booking data...');
    
    // Get all bookings with their classes
    const bookings = await prisma.booking.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Found bookings:', bookings.length);
    
    bookings.forEach(booking => {
      console.log('\n--- Booking Details ---');
      console.log('ID:', booking.id);
      console.log('Status:', booking.status);
      console.log('Payment Status:', booking.paymentStatus);
      console.log('Payment Method:', booking.paymentMethod);
      console.log('Payment Amount:', booking.paymentAmount);
      console.log('Payment Receipt URL:', booking.paymentReceiptUrl);
      console.log('Paid At:', booking.paidAt);
      console.log('Class:', booking.class.name);
      console.log('Class Date:', booking.class.date);
      console.log('Class Time:', booking.class.time);
      console.log('User:', booking.user.email);
      
      // Check if booking should be cancellable
      const classDateTime = new Date(`${booking.class.date.toISOString().split('T')[0]}T${booking.class.time}`);
      const twoHoursFromNow = new Date();
      twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);
      
      const isCancellable = booking.status === 'CONFIRMED' && classDateTime > twoHoursFromNow;
      console.log('Should be cancellable:', isCancellable);
      console.log('Class time:', classDateTime);
      console.log('Two hours from now:', twoHoursFromNow);
    });
    
  } catch (error) {
    console.error('Error checking bookings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBookingData();
