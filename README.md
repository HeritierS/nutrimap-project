# Assignement Deliverables

# Demo Video Link 

Part One: https://www.loom.com/share/04a3df237d9c4102b4133854e3178073

Part Two: https://www.loom.com/share/8aa08464f04a4457bfcb945da25160c9

# Deployement Link: https://nutrimap-project.onrender.com

# NutriMap — Setup & Demo Users

This document explains how to clone, set up, run, and test the NutriMap project locally (backend + frontend). It also lists the demo users created by the seed script so you can sign in quickly during development.

IMPORTANT: The used accounts and passwords are for local development only. Do NOT use them in a production environment.

---



## Quick overview / contract

- Backend: Node.js + Express + TypeScript, Prisma ORM (Postgres)
  - Important scripts: `npm run dev`, `npm run seed`, `npm run prisma:generate`, `npm run prisma:migrate`

- Frontend: Vite + React + TypeScript
  - Important scripts: `npm install`, `npm run dev`

- Default database: PostgreSQL (connection set via `DATABASE_URL` in `backend/.env` or environment)
---

## Recommended prerequisites
- Node.js (v18+ recommended)
- A running PostgreSQL server accessible from your machine (local or container)
- (Optional) `psql` or a GUI like PgAdmin / TablePlus to inspect the DB

---




# Backend dependencies
Set-Location '.\backend'
npm install

# Frontend dependencies
Set-Location '..\nutri-map FrontEnd'
# Note: react-leaflet in this project may require --legacy-peer-deps in some Node/npm versions.
npm install --legacy-peer-deps
```

If you encounter peer dependency errors for `react-leaflet` or similar, re-run `npm install` for the frontend with `--legacy-peer-deps` (as above).

---

## Environment variables

- Backend expects a `DATABASE_URL` environment variable (Postgres connection string). You can set it in `backend/.env` or export it in PowerShell.

Example `backend/.env` (create if missing):

```ini
DATABASE_URL="postgresql://username:password@localhost:5432/d3_NutriMap?schema=public"
PORT=4000
```

- Frontend uses `VITE_API_URL` to know the backend address. Create `nutri-map FrontEnd/.env` (root of frontend):

```
VITE_API_URL=http://localhost:4000
```

---

## Quick start (you already cloned)

1) Backend

```powershell
cd .\backend
# create backend/.env (DATABASE_URL + PORT)
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed    # destructive: deletes and recreates demo data
npm run dev
```

2) Frontend

```powershell
cd ..\"nutri-map FrontEnd"
Set-Content -Path .\.env -Value 'VITE_API_URL=http://localhost:4000'
npm install --legacy-peer-deps
npm run dev
```

3) Verify

```powershell
# from backend folder
node .\scripts\verify_chw_separation.js
```

Expect: `PASS: No overlap between CHW1 and CHW2 children`

---

## Quick manual test / workflow (end-to-end)

Test flows:
- Login as CHW1
  - You should only see children created by this CHW.
- Login as CHW2
  - Email: `chw2@nutrimap.rw` / Password: `chw223`
  - You should see a different set of children (those created by CHW2).

- Login as Admin
  - Email: `admin@nutrimap.rw` / Password: `admin123`
  - You should see full population-level views (Dashboard, Reports, Users) and be able to create/activate users.

- Login as Nutritionist
  - Email: `nutri@nutrimap.rw` / Password: `nutri123`
  - Intended for analytics/clinical view.

---

## Automated quick checks (scripts)

Two utility scripts exist in `backend/scripts` for quick local checks:

- `smoke.js` — logs in as the seeded CHW and as Admin, creates a child (CHW) and a new user (Admin) and prints their IDs. Useful to confirm basic auth and write flows.

Run:

```powershell
Set-Location 'C:\path\to\nutri-track-viz\backend'
node .\scripts\smoke.js
```

- `test_chws.js` — logs in as both seeded CHWs and fetches children for each (using the `collectorId` query). It prints counts and sample child IDs for each CHW.

Run:

```powershell
Set-Location 'C:\path\to\NUTRIMAP\backend'
node .\scripts\test_chws.js
```

These scripts are small helpers and are safe for local dev only.

---


## Demo user accounts (seeded)

The backend seed script (`backend/src/seed.ts`) creates the following demo accounts and sample children.

- Admin
  - Email: `admin@nutrimap.rw`
  - Password: `admin123`
  - Role: `admin`
  - Notes: Has full access (user management, reports, all children).
- CHW 1 (Community Health Worker)
  - Email: `chw@nutrimap.rw`
  - Password: `chw123`
  - Role: `chw`
  - Notes: Can register children and see data they collected.
- CHW 2 (second CHW, added for testing per-collector separation)
  - Email: `chw2@nutrimap.rw`
  - Password: `chw223`
  - Role: `chw`
  - Notes: Separate CHW account — seeded children are distributed between CHW1 and CHW2.
- Nutritionist
  - Email: `nutri@nutrimap.rw`
  - Password: `nutri123`
  - Role: `nutritionist`
  - Notes: Role intended for population-level analytics and clinical review.
(If you create additional users from the Admin UI, you will set their email & password at creation time.)

---

## Troubleshooting / common issues

- "ECONNREFUSED" or "Unable to connect": Ensure backend server is running and `VITE_API_URL` points to the correct host/port.
- Prisma client generation errors: run `npm run prisma:generate` inside the `backend` folder and ensure the `DATABASE_URL` is reachable. If migrations fail, check your Postgres server and credentials.
- Frontend `npm install` fails due to peer dependency errors (react-leaflet requiring a newer React): re-run frontend install with `--legacy-peer-deps`.
- Port conflicts: Vite will pick the next available port automatically. If you want a fixed port, set `PORT` env or configure Vite.
- If children appear empty for CHW: confirm you're logged in and that the frontend passes `collectorId = user.id` to `api.getChildren` (this project already does that for CHW flows).

---

## Security reminders

- These demo credentials are intentionally simple for local testing. Do not reuse these credentials anywhere public.
- The seed script deletes data with `deleteMany()` — do not run it against production or shared databases.

---

## Want me to do this for you?

If you'd like, I can:
- Move this guidance into the repository (I already added this file at the repository root as `SETUP_AND_DEMO_USERS.md`).
- Add small unit/integration tests that assert the per-CHW data separation.
- Normalize API response shapes centrally so scripts and frontend always receive the same `Child` shape.

Tell me which of the follow-ups you'd like next and I'll implement them.
