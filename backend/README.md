# NutriMap Backend (Node + TypeScript + Prisma + Postgres)

Quick start (dev)

1. Copy `.env.example` to `.env` and edit `DATABASE_URL` & `JWT_SECRET`
2. Start Postgres (docker-compose up -d) or ensure local Postgres is running
3. npm install
4. npx prisma generate
5. npx prisma migrate dev --name init
6. npm run seed         # WARNING: removes existing demo data and recreates seeds
7. npm run dev

Seeded admin credentials:

email: admin@nutrimap.rw
password: admin123

API base: `/api`
