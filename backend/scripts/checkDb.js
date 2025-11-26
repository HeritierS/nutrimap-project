/* Quick DB connectivity check using Prisma Client
   Run from the backend folder after installing dependencies:
     Set-Location .\backend
     node scripts/checkDb.js
*/
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Testing database connectivity using Prisma...');
  try {
    const res = await prisma.$queryRawUnsafe('SELECT 1 as result');
    console.log('Query result:', res);
    console.log('Database connection OK.');
  } catch (err) {
    console.error('Database connectivity test failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
