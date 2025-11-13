## NutriMap — Implementation Report (Developer-focused)

This document explains the structure and key implementation details of the NutriMap project for developers. It covers the backend (Node/Express/Prisma), the database schema, seed/migration flow, the frontend (Vite + React), the API contract, security/roles, deployment notes, and verification steps.

## 1. Executive summary

NutriMap is a two-part application:
- Backend: TypeScript + Express + Prisma ORM + PostgreSQL. Exposes a JSON REST API under `/api/*`.
- Frontend: Vite + React + TypeScript single-page app that consumes the backend API.

The backend stores Users, Children and FollowUps. Roles (admin, chw, nutritionist) control access. The repository includes a destructive seed script to create demo users and sample children for local development.

## 2. Repo layout (relevant paths)

- `backend/` — Express app, Prisma schema & migrations, dev scripts.
  - `backend/src/index.ts` — process/evironment bootstrap + server start.
  - `backend/src/app.ts` — Express application, middleware and routes.
  - `backend/src/prismaClient.ts` — Prisma client singleton.
  - `backend/src/controllers/*` — controllers for auth, children, users and analytics.
  - `backend/src/seed.ts` — destructive seed script that populates demo data.
  - `backend/prisma/schema.prisma` — DB models and enums.
- `nutri-map FrontEnd/` — Vite React app.
  - `src/main.tsx`, `src/App.tsx` — React bootstrap and routing.
  - `src/lib/api.ts` — central HTTP wrapper and normalization.
  - `src/lib/*` — auth, storage, types and utilities.

## 3. Backend: entry, app and middleware

- `index.ts` loads `.env` and starts the HTTP server on `process.env.PORT || 4000`. It prints a short fingerprint of `DATABASE_URL` to aid debugging.
- `app.ts` configures Express middleware: `cors()`, `express.json()`, and `morgan('dev')`. It mounts route groups:
  - `/api/auth` — authentication endpoints
  - `/api/users` — admin user management
  - `/api/children` — child CRUD and analytics
  - top-level convenience routes: `/api/analytics` and `/api/export` (nutritionist-only)

An `errorHandler` middleware is installed at the end to centralize error responses.

Design note: the app separates route definitions and controllers so controllers assume validated input and available `req.user` when protected by authentication middleware.

## 4. Prisma & database schema

Key models in `prisma/schema.prisma`:

- `User`:
  - Fields: `id`, `name`, `email` (unique), `password`, `role` (enum), `isActive`, timestamps.
  - Relations: `children` (created children), `FollowUp` entries collected by the user.

- `Child`:
  - Fields: `id`, `localId` (unique human-friendly id), `name`, `motherName`, `dob`, `sex`, `address`, `latitude`, `longitude`, initial anthropometrics, `createdById` (FK to User).
  - `onDelete: Cascade` with relation to `User` for the `createdBy` relation.

- `FollowUp`:
  - Measurement records tied to a child, with `collectorId` referencing a `User`.

Enums: `Role { admin, chw, nutritionist }`, `Sex { male, female }`.

Prisma workflow (local dev):

```powershell
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate   # creates/updates local DB schema
npm run seed             # destructive: creates demo users + children
npm run dev
```

For production: run `npx prisma migrate deploy` against the production `DATABASE_URL` and `npx prisma generate` during build.

## 5. Seed and demo data

`src/seed.ts`:
- Deletes existing followUps, children and users (via `deleteMany()`), then creates demo users with fixed UUIDs (convenience for stable tokens during dev).
- Creates 21 children and assigns them in round-robin between two CHWs; creates 0–2 followUps per child with randomized values.

Warning: the seed script is destructive. Do not run it against shared/production databases.

Seeded demo accounts (use for testing):
- Admin: `admin@nutrimap.rw` / `admin123`
- CHW1: `chw@nutrimap.rw` / `chw123`
- CHW2: `chw2@nutrimap.rw` / `chw223`
- Nutritionist: `nutri@nutrimap.rw` / `nutri123`

## 6. Controllers & endpoint behavior (high-level)

Auth controller (`auth.controller.ts`):
- `login(email,password)` — finds user by email, verifies password, checks `isActive`, returns JWT and user info.
- `me()` — returns user info for token payload (DB lookup for fresh data).

Children controller (`children.controller.ts`) responsibilities:
- `createChild` — requires CHW or admin; sets `createdById` to `req.user.id`; returns 201 with created child. Contains defensive checks: confirms the authenticated user exists and is active before writing.
- `getChildren` — supports `collectorId` filter (used by CHW flows) and `q` text search. Includes `followUps` and `createdBy` in response and computes anthropometric analysis using `utils/anthro` before returning.
- `getChildById`, `addFollowUp`, `updateChild`, `deleteChild` — apply role checks. CHWs can only mutate their own children unless user is admin.
- `reportSummary` and `exportChildren` — nutritionist-only aggregation and CSV export.

Error handling: controllers return appropriate HTTP codes: 401 (unauthorized), 403 (forbidden), 404 (not found), and 500 (server error). Some Prisma errors (FK failures) are caught and converted to friendly 400 responses.

## 7. Frontend architecture & the API layer

Entry points:
- `src/main.tsx` — mounts React app.
- `src/App.tsx` — sets providers (React Query, Theme, Auth), and routing. Route protection is implemented by `ProtectedRoute` and `AuthProvider`.

`src/lib/api.ts` is the central HTTP client:
- Uses `import.meta.env.VITE_API_URL` as `API_BASE`.
- `request()` attaches `Authorization: Bearer <token>` when the app has a session token stored in `storage`.
- Handles network errors, JSON parsing errors, and API error payloads consistently.
- `normalizeChild()` centralizes shape normalization between backend fields and frontend `Child` model so components can rely on a stable object shape.

Examples of high-level API methods:
- `api.login(email,password)` -> logs in and returns `{ user, token }`.
- `api.getChildren({ collectorId })` -> returns normalized children with computed `analysis` on backend.

Routing & RBAC in UI:
- Routes use `ProtectedRoute` to limit access by role. For example: `/children/new` is wrapped to allow only `['chw']`.

## 8. Security and role enforcement

- JWTs are issued by backend (`utils/jwt`) and validated in middleware (`middlewares/verifyToken.ts`, `auth.middleware.ts`).
- `requireAuth` middleware attaches a `user` payload to `req` and `requireRole(role)` ensures the authenticated user has the required role.
- Controllers add additional checks (e.g., active account, owner of resource) for defense-in-depth.

Secrets and env:
- `DATABASE_URL` must be set in backend environment (or `backend/.env` for local).
- `PORT` optional; default 4000.

## 9. Deployment notes (practical, minimal friction)

Recommended free stack for small deployments:
- Database: Supabase (free Postgres) or Neon
- Backend: Fly.io (free allowance) or Render
- Frontend: Vercel or Netlify

Key production steps (short):

1. Create managed Postgres and get connection string.
2. Configure backend environment variables (DATABASE_URL, PORT, any JWT secret if used).
3. Build backend: `npm ci && npx prisma generate && npm run build` and start with `node dist/index.js` (or containerize and deploy).
4. Run DB migrations on remote DB: `npx prisma migrate deploy`.
5. (Optional) Run seed if you want demo data: run `npm run seed` with `DATABASE_URL` pointing at the remote DB. WARNING: destructive.
6. Deploy frontend to Vercel/Netlify and set `VITE_API_URL` to your backend URL.

Minimal Dockerfile pattern (add to `backend/Dockerfile`):

```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM node:20-alpine AS prod
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules ./node_modules
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

Notes: ensure `prisma generate` runs during build so the generated client exists. For production apply `prisma migrate deploy` during deploy/release.

## 10. Testing & verification

Local quick checks (from repo root):

```powershell
# Backend
Set-Location '.\\backend'
# prepare env with local Postgres connection
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed   # destructive - creates demo users
npm run dev

# Frontend (in separate terminal)
Set-Location '..\\"nutri-map FrontEnd"'
Set-Content -Path .\\.env -Value 'VITE_API_URL=http://localhost:4000'
npm install --legacy-peer-deps
npm run dev
```

Verification steps:
- Use demo credentials in seed to log in on the frontend and confirm role-based views.
- Run `node ./backend/scripts/test_chws.js` to check that children are partitioned by CHW.

## 11. Appendix — useful commands & snippets

- Generate prisma client:
  - `npx prisma generate`
- Apply migrations in production:
  - `npx prisma migrate deploy`
- Run seed locally:
  - `npm run seed`
- Run tests:
  - `cd backend && npm test`

---

If you'd like, I can:
- Expand any section to include inline code walkthroughs (line-by-line) for specific files.
- Add a simple `backend/Dockerfile` and a `docs/deploy.md` with exact Fly/Vercel steps.

Tell me which files you want a deeper, line-level walkthrough for (for example: `src/controllers/children.controller.ts`, `src/seed.ts`, `nutri-map FrontEnd/src/lib/api.ts`) and I will produce a detailed annotated explanation for those files.
