import prisma from './prismaClient';

// Runtime bcrypt fallback: try native 'bcrypt', fall back to 'bcryptjs' if native binding unavailable.
let _bcrypt: any;
try {
  // prefer native bcrypt when available
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  _bcrypt = require('bcrypt');
} catch (e) {
  // fallback to bcryptjs (pure JS) which avoids native binding issues on some platforms
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  _bcrypt = require('bcryptjs');
}

async function hashPw(plain: string, rounds = 10): Promise<string> {
  if (typeof _bcrypt.hashSync === 'function') {
    // synchronous hash available (bcryptjs and bcrypt provide hashSync)
    return _bcrypt.hashSync(plain, rounds);
  }
  if (typeof _bcrypt.hash === 'function') {
    // async hash (returns Promise or accepts callback)
    const res = _bcrypt.hash(plain, rounds);
    // if a Promise is returned, await it
    if (res && typeof res.then === 'function') return await res;
    // otherwise, wrap callback style
    return await new Promise<string>((resolve, reject) => {
      _bcrypt.hash(plain, rounds, (err: any, hashed: string) => {
        if (err) return reject(err);
        resolve(hashed);
      });
    });
  }
  throw new Error('No bcrypt hash implementation available');
}
import { generateLocalId } from './utils/anthro';

async function main() {
  console.log('Seeding database...');
  await prisma.followUp.deleteMany();
  await prisma.child.deleteMany();
  await prisma.user.deleteMany();

  const pw = await hashPw('admin123', 10);
  // Use fixed seeded IDs so dev tokens remain consistent across reseeds (convenience)
  const adminId = '0c3ae863-eb0c-4687-8b89-812fdab4444b';
  const chwId = '10aa0fde-fdaf-4aa9-8191-1089e361888d';
  const chw2Id = 'ebceee7e-db1b-4581-9d06-d3fd93f7b3ff';
  const nutId = '7c653310-be08-41c6-a500-df843fd66bee';

  const admin = await prisma.user.create({ data: { id: adminId, name: 'Admin User', email: 'admin@nutrimap.rw', password: pw, role: 'admin', isActive: true } });

  const chwPw = await hashPw('chw123', 10);
  // For local dev convenience the seed creates CHWs active so they can log in immediately.
  const chw = await prisma.user.create({ data: { id: chwId, name: 'CHW Demo', email: 'chw@nutrimap.rw', password: chwPw, role: 'chw', isActive: true } });

  // Second CHW for testing per-collector data separation
  const chw2Pw = await hashPw('chw223', 10);
  const chw2 = await prisma.user.create({ data: { id: chw2Id, name: 'CHW Demo 2', email: 'chw2@nutrimap.rw', password: chw2Pw, role: 'chw', isActive: true } });

  const nutPw = await hashPw('nutri123', 10);
  const nut = await prisma.user.create({ data: { id: nutId, name: 'Nutritionist Demo', email: 'nutri@nutrimap.rw', password: nutPw, role: 'nutritionist', isActive: true } });

  const coords = [
    { lat: -1.9499, lng: 30.0588 },
    { lat: -2.5952, lng: 29.7390 },
    { lat: -1.4853, lng: 29.6360 },
    { lat: -1.7436, lng: 29.2565 },
    { lat: -2.4568, lng: 28.8582 }
  ];

  // Create 21 children and assign explicitly to CHWs in round-robin so
  // each seeded CHW has an even distribution for local testing.
  for (let i = 0; i < 21; i++) {
    const ownerId = i % 2 === 0 ? chw.id : chw2.id;
    const c = await prisma.child.create({ data: {
      localId: await generateLocalId(),
      name: `Child ${i+1}`,
      motherName: `Mother ${i+1}`,
      dob: new Date(2021, i%12, 10),
      sex: i % 2 === 0 ? 'male' : 'female',
      address: `Sector ${i%5 + 1}, Rwanda`,
      latitude: coords[i%coords.length].lat + Math.random() * 0.02,
      longitude: coords[i%coords.length].lng + Math.random() * 0.02,
      complications: i % 6 === 0 ? 'Diarrhea' : null,
      createdById: ownerId,
      initialRecordedAt: new Date(2024, 8, i%28 + 1),
      initialWeightKg: 4 + Math.random()*8,
      initialHeightCm: 50 + Math.random()*30,
      initialHeadCircCm: 30 + Math.random()*6
    }});
    const nFollow = Math.floor(Math.random()*3);
    for (let j=0;j<nFollow;j++) {
      const collector = ownerId; 
      await prisma.followUp.create({ data: { childId: c.id, recordedAt: new Date(2024, 8, (i+j)%28 + 1), weightKg: c.initialWeightKg + Math.random()*2, heightCm: c.initialHeightCm + Math.random()*3, headCircCm: c.initialHeadCircCm ? c.initialHeadCircCm + Math.random()*1 : undefined, collectorId: collector } });
    }
  }
  console.log('Seeding finished');

  // Print seeded users for convenience
  // eslint-disable-next-line no-console
  console.log(JSON.stringify([
    { id: admin.id, email: admin.email, role: admin.role, isActive: admin.isActive },
    { id: chw.id, email: chw.email, role: chw.role, isActive: chw.isActive },
    { id: chw2.id, email: chw2.email, role: chw2.role, isActive: chw2.isActive },
    { id: nut.id, email: nut.email, role: nut.role, isActive: nut.isActive }
  ], null, 2));

  // Print child counts grouped by CHW
  const totalByChw = await prisma.child.groupBy({ by: ['createdById'], _count: { _all: true } });
  console.log('Child counts by CHW:');
  totalByChw.forEach((g: any) => console.log(`  - ${g.createdById}: ${g._count._all}`));
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
