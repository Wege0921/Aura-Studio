import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aura-yoga.com' },
    update: {},
    create: {
      email: 'admin@aura-yoga.com',
      name: 'AURA Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // Create sample packages
  const packages = [
    {
      name: 'Starter Pack',
      description: 'Perfect for beginners',
      sessionsCount: 5,
      price: 1500,
      validityDays: 30,
    },
    {
      name: 'Regular Pack',
      description: 'Most popular choice',
      sessionsCount: 10,
      price: 2800,
      validityDays: 60,
    },
    {
      name: 'Monthly Unlimited',
      description: 'Unlimited classes for one month',
      sessionsCount: 999,
      price: 4500,
      validityDays: 30,
    },
  ];

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { name: pkg.name },
      update: {},
      create: pkg,
    });
  }

  // Create sample classes
  const classes = [
    {
      name: 'Morning Hatha Yoga',
      description: 'Gentle morning practice to start your day',
      instructor: 'Sarah Johnson',
      date: new Date('2024-01-15'),
      time: '07:00',
      duration: 80,
      capacity: 15,
      classType: 'YOGA',
    },
    {
      name: 'Power Vinyasa',
      description: 'Dynamic flow for building strength',
      instructor: 'Maria Garcia',
      date: new Date('2024-01-15'),
      time: '09:00',
      duration: 80,
      capacity: 15,
      classType: 'YOGA',
    },
    {
      name: 'Pilates Core',
      description: 'Strengthen your core and improve posture',
      instructor: 'Emma Wilson',
      date: new Date('2024-01-15'),
      time: '17:30',
      duration: 80,
      capacity: 15,
      classType: 'PILATES',
    },
    {
      name: 'Evening Relaxation',
      description: 'Wind down with gentle stretches',
      instructor: 'Sarah Johnson',
      date: new Date('2024-01-15'),
      time: '19:00',
      duration: 80,
      capacity: 15,
      classType: 'YOGA',
    },
  ];

  for (const cls of classes) {
    await prisma.class.upsert({
      where: { 
        name_date_time: {
          name: cls.name,
          date: cls.date,
          time: cls.time,
        }
      },
      update: {},
      create: cls,
    });
  }

  console.log('Database seeded successfully!');
  console.log('Admin user: admin@aura-yoga.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
