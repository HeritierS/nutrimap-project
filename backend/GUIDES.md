# NutriMap Backend - Quick Guides

This file provides short, practical guidance for contributors working on the backend, database, and testing.

## Project layout (important files)

- `src/` - TypeScript source files (controllers, routes, middlewares, utils, app entry).
- `src/app.ts` - Express application (exports the `app` instance for testing).
- `src/index.ts` - Server bootstrap that imports `app` and calls `app.listen`.
- `prisma/` - Prisma schema, migrations and generated client.
- `package.json` - scripts for dev, build, migrate and test.

## Adding new files

- Backend code (controllers, routes, utils): put them under `src/` and keep file names descriptive.
- When you suggest a new file in PRs, create it and add a small doc line here describing purpose and insertion location.

## Database (Prisma)

- Schema: `prisma/schema.prisma`.
- Generate client: `npm run prisma:generate` (or `npx prisma generate`).
- Create migration & apply (development): `npm run prisma:migrate`.
- Reset DB (destructive): `npm run prisma:reset`.
- Seed demo data: `npm run seed`.

Notes:
- If your DB password contains special characters (e.g. `@`), URL-encode it when you put it into `DATABASE_URL`.

## Testing

- Tests live in `tests/` and are TypeScript. We use Jest + ts-jest + Supertest for HTTP integration tests.
- To install test deps (dev):

  1. `cd backend`
  2. `npm ci` or `npm install`

- Run tests:

  - `npm run test` (runs Jest once)
  - `npm run test:watch` (watch mode)

Test guidance:

- Prefer small, fast tests that don't rely on a running Postgres instance. For integration tests against Prisma/Postgres, either:
  - use a dedicated test database and run migrations before the test run, or
  - use a database container started in CI and run seed/migrations in the pipeline.

## How to add a new endpoint

1. Add the controller in `src/controllers/`.
2. Add a route file in `src/routes/` and wire it in `src/app.ts`.
3. Add tests in `tests/` that import `app` (not `index.ts`) so the test harness can start/stop the server freely.

## Helpful commands

- Dev server: `npm run dev` (hot reload with ts-node-dev)
- Build: `npm run build`
- Run tests: `npm run test`

If anything here is unclear or you want a longer guide for CI or test DB strategy, say so and I'll expand this file.
