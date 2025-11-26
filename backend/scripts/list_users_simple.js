const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, isActive: true } });
    console.log(JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('Error listing users:', e.message || e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
