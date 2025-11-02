// Some TypeScript setups may report a missing named export for PrismaClient
// (editor/tsserver mismatch with installed @prisma/client). Use require to
// ensure runtime import works and avoid editor error 2305 while keeping
// the same PrismaClient runtime.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ log: ['query'] });

export default prisma;
