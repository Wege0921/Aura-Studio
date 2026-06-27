import { PrismaClient } from '@prisma/client';
import { supabase } from './lib/supabase';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@aurastudio.com';
  let adminId: string | undefined;

  // Try to create admin in Supabase Auth first
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: 'admin123',
      email_confirm: true,
      user_metadata: { name: 'AURA Admin', role: 'ADMIN' },
    });

    if (authError) {
      console.log('Supabase admin creation skipped (may already exist or not configured):', authError.message);
    }

    if (authData?.user) {
      adminId = authData.user.id;
    }
  } catch (e) {
    console.log('Supabase not configured, seeding Prisma profile only');
  }

  // Create or update admin Prisma profile
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      id: adminId || 'admin-seed-id',
      email: adminEmail,
      name: 'AURA Admin',
      role: 'ADMIN',
    },
  });

  // Clear existing packages and seed with correct names (matching admin form)
  await prisma.package.deleteMany();

  const packages = [
    // Pilates
    { name: 'Drop - in', description: 'Single Pilates session', sessionsCount: 1, price: 2000, validityDays: 1, classType: 'PILATES' },
    { name: '4 Class Packs', description: '4 Pilates sessions', sessionsCount: 4, price: 7000, validityDays: 30, classType: 'PILATES' },
    { name: '8 Class Packs', description: '8 Pilates sessions', sessionsCount: 8, price: 12000, validityDays: 60, classType: 'PILATES' },
    { name: 'Unlimited Monthly', description: 'Unlimited Pilates classes for 1 month', sessionsCount: 0, price: 20000, validityDays: 30, classType: 'PILATES' },
    { name: 'Unlimited 3 Month', description: 'Unlimited Pilates classes for 3 months', sessionsCount: 0, price: 54000, validityDays: 90, classType: 'PILATES' },
    { name: 'Unlimited 6month', description: 'Unlimited Pilates classes for 6 months', sessionsCount: 0, price: 96000, validityDays: 180, classType: 'PILATES' },
    { name: 'Unlimited 1year', description: 'Unlimited Pilates classes for 1 year', sessionsCount: 0, price: 168000, validityDays: 365, classType: 'PILATES' },
    // Prenatal
    { name: 'Drop - in', description: 'Single Prenatal session', sessionsCount: 1, price: 2500, validityDays: 1, classType: 'PRENATAL' },
    { name: '4 Class Packs', description: '4 Prenatal sessions', sessionsCount: 4, price: 9000, validityDays: 30, classType: 'PRENATAL' },
    { name: '8 Class Packs', description: '8 Prenatal sessions', sessionsCount: 8, price: 14000, validityDays: 60, classType: 'PRENATAL' },
    { name: 'Unlimited Monthly', description: 'Unlimited Prenatal classes for 1 month', sessionsCount: 0, price: 22000, validityDays: 30, classType: 'PRENATAL' },
    { name: 'Unlimited 3 Month', description: 'Unlimited Prenatal classes for 3 months', sessionsCount: 0, price: 60000, validityDays: 90, classType: 'PRENATAL' },
    { name: 'Unlimited 6month', description: 'Unlimited Prenatal classes for 6 months', sessionsCount: 0, price: 108000, validityDays: 180, classType: 'PRENATAL' },
    { name: 'Unlimited 1year', description: 'Unlimited Prenatal classes for 1 year', sessionsCount: 0, price: 192000, validityDays: 365, classType: 'PRENATAL' },
    // Postpartum
    { name: 'Drop - in', description: 'Single Postpartum session', sessionsCount: 1, price: 2500, validityDays: 1, classType: 'POSTPARTUM' },
    { name: '4 Class Packs', description: '4 Postpartum sessions', sessionsCount: 4, price: 9000, validityDays: 30, classType: 'POSTPARTUM' },
    { name: '8 Class Packs', description: '8 Postpartum sessions', sessionsCount: 8, price: 14000, validityDays: 60, classType: 'POSTPARTUM' },
    { name: 'Unlimited Monthly', description: 'Unlimited Postpartum classes for 1 month', sessionsCount: 0, price: 22000, validityDays: 30, classType: 'POSTPARTUM' },
    { name: 'Unlimited 3 Month', description: 'Unlimited Postpartum classes for 3 months', sessionsCount: 0, price: 60000, validityDays: 90, classType: 'POSTPARTUM' },
    { name: 'Unlimited 6month', description: 'Unlimited Postpartum classes for 6 months', sessionsCount: 0, price: 108000, validityDays: 180, classType: 'POSTPARTUM' },
    { name: 'Unlimited 1year', description: 'Unlimited Postpartum classes for 1 year', sessionsCount: 0, price: 192000, validityDays: 365, classType: 'POSTPARTUM' },
  ];

  for (const pkg of packages) {
    await prisma.package.create({ data: pkg });
  }

  console.log('Database seeded successfully!');
  console.log('Admin user: admin@aurastudio.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
