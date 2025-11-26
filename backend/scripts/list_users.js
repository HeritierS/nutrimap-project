const prisma = require('../dist/prismaClient') || require('../src/prismaClient');
(async () => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, isActive: true } });
    console.log(users);
  } catch (e) {
    console.error('Error listing users:', e.message || e);
  } finally {
    try { await prisma.$disconnect(); } catch(e){}
  }
})();
