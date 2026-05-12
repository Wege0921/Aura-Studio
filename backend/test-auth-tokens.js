const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getValidTokens() {
  try {
    // Get all users from database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    console.log('📋 Users in database:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    // Find admin user
    const adminUser = users.find(u => u.role === 'ADMIN');
    const regularUser = users.find(u => u.role === 'USER');

    console.log('\n🔑 To generate valid tokens, use these credentials:');
    
    if (adminUser) {
      console.log(`\nAdmin User:`);
      console.log(`Email: ${adminUser.email}`);
      console.log(`You can login via frontend to get a valid admin token`);
    }

    if (regularUser) {
      console.log(`\nRegular User:`);
      console.log(`Email: ${regularUser.email}`);
      console.log(`You can login via frontend to get a valid user token`);
    }

    console.log('\n💡 Then update the tokens in test-user-management.js');

  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getValidTokens();
