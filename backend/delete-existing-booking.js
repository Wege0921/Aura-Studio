const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteExistingBooking() {
  try {
    // Delete existing booking for the test user
    const deleted = await prisma.booking.deleteMany({
      where: {
        userId: 'cmopj63rr0000c6qy2b0ndc9e',
        classId: 'cmopus6f4000fwry04p7k0apf'
      }
    });
    
    console.log(`Deleted ${deleted.count} existing bookings`);
  } catch (error) {
    console.error('Error deleting bookings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteExistingBooking();
