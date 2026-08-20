import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function main() {
  const sqlPath = join(__dirname, '..', 'prisma', 'shop_tables.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  // Remove comment lines first, then split on semicolons
  const cleanedSql = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  const statements = cleanedSql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Executing ${statements.length} SQL statements to create shop tables...\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';
    try {
      await prisma.$executeRawUnsafe(stmt);
      const preview = stmt.substring(0, 80).replace(/\n/g, ' ');
      console.log(`  [${i + 1}/${statements.length}] OK: ${preview}...`);
    } catch (err: any) {
      if (err.message.includes('already exists')) {
        console.log(`  [${i + 1}/${statements.length}] SKIP (already exists)`);
      } else {
        console.error(`  [${i + 1}/${statements.length}] ERROR: ${err.message.substring(0, 150)}`);
        throw err;
      }
    }
  }

  console.log('\nShop tables created successfully!');
}

main()
  .catch((e) => {
    console.error('Failed:', e.message.substring(0, 200));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
