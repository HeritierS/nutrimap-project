// assign_children_to_chws2.js
// Simple script to assign existing Child records to the seeded CHW users.
// It finds users with role='chw' and assigns children round-robin to them.
// Run from the repository root: node .\backend\scripts\assign_children_to_chws2.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('[assign_children_to_chws2] Starting...');

  const chws = await prisma.user.findMany({ where: { role: 'chw' }, orderBy: { id: 'asc' } });
  if (!chws || chws.length === 0) {
    console.error('[assign_children_to_chws2] No users with role=chw found. Aborting.');
    process.exit(2);
  }

  console.log(`[assign_children_to_chws2] Found ${chws.length} CHW(s):`);
  chws.forEach((c) => console.log(`  - ${c.id} (${c.email || 'no-email'})`));

  const children = await prisma.child.findMany({ select: { id: true, createdById: true } });
  console.log(`[assign_children_to_chws2] Found ${children.length} children.`);

  if (children.length === 0) {
    console.log('[assign_children_to_chws2] No children to assign. Exiting.');
    await prisma.$disconnect();
    return;
  }

  // Build updates round-robin across the CHWs
  let i = 0;
  const updates = [];
  for (const child of children) {
    const target = chws[i % chws.length];
    // Only update if different (to minimize writes)
    if (child.createdById !== target.id) {
      updates.push({ id: child.id, createdById: target.id });
    }
    i += 1;
  }

  console.log(`[assign_children_to_chws2] Will update ${updates.length} children (others already assigned).`);

  const counts = {};
  for (const u of chws) counts[u.id] = 0;

  for (const upd of updates) {
    await prisma.child.update({ where: { id: upd.id }, data: { createdById: upd.createdById } });
    counts[upd.createdById] = (counts[upd.createdById] || 0) + 1;
  }

  console.log('[assign_children_to_chws2] Update summary:');
  chws.forEach((c) => console.log(`  - ${c.id}: ${counts[c.id] || 0} children assigned`));

  // Also show total per CHW including already assigned ones
  const totals = {};
  for (const c of chws) totals[c.id] = 0;
  const finalChildren = await prisma.child.findMany({ select: { id: true, createdById: true } });
  finalChildren.forEach((ch) => {
    if (totals[ch.createdById] !== undefined) totals[ch.createdById] += 1;
  });
  console.log('[assign_children_to_chws2] Final totals:');
  chws.forEach((c) => console.log(`  - ${c.id}: ${totals[c.id] || 0} total children`));

  await prisma.$disconnect();
  console.log('[assign_children_to_chws2] Done.');
}

main().catch((err) => {
  console.error('[assign_children_to_chws2] Error:', err);
  prisma.$disconnect().catch(() => {});
  process.exit(1);
});
