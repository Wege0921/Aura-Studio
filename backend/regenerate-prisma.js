const { execSync } = require('child_process');
const path = require('path');

async function regeneratePrisma() {
  try {
    console.log('Regenerating Prisma client...');
    
    // Change to backend directory
    process.chdir(path.join(__dirname));
    
    // Generate Prisma client
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('Prisma client regenerated successfully!');
    
    // Push schema changes to database
    console.log('Pushing schema changes to database...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    console.log('Database schema synchronized successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

regeneratePrisma();
