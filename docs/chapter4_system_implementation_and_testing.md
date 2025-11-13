# Chapter 4 — System Implementation and Testing (Academic)

This chapter documents the implementation and testing activities carried out during the NutriMap project, written with a formal academic tone suitable for defense. It covers objectives, methodology, implementation details, visual evidence (screenshots), testing results (unit, integration, validation), and conclusions.


4.1 Implementation and coding

4.1.1 Introduction (scope of this section)

This section covers the implementation decisions and code modules developed to satisfy the functional requirements. It focuses on the concrete software artifacts, the rationale behind major design choices (authentication, data model, API contract, and client-server separation), and the mapping from functional requirements to source files and features. It intentionally avoids re-stating the problem statement or requirements previously documented in earlier chapters.

4.1.2 Description of implementation tools and technology

- Backend
  - Node.js (v18+), TypeScript: application language and runtime.
  - Express: HTTP routing and middleware.
  - Prisma ORM: typed DB access and migrations for PostgreSQL.
  - PostgreSQL: relational datastore (local or managed e.g., Supabase).
  - bcrypt and jsonwebtoken: security primitives (password hashing, JWTs).
  - ts-node-dev/TypeScript compiler: developer and build tooling.

- Frontend
  - Vite + React + TypeScript: SPA and build toolchain.
  - React Router + ProtectedRoute: navigation and client-side RBAC.
  - React Query: data fetching and cache management.
  - Tailwind CSS: utility-first styling.
  - leaflet/react-leaflet: spatial visualization for map view.

- Dev/Ops
  - Docker: optional containerization for reproducible builds.
  - Fly/Render/Vercel: recommended deployment platforms.
  - GitHub Actions: CI (optional) for tests and build.

4.2 Graphical view of the project

4.2.1 Screenshots with description (what to capture and filenames)

Below are the recommended screenshots to include. Capture them at a reasonable resolution (e.g., 1280×800 or larger) and place them into `docs/images/` with the suggested filename. Add them to your final document where indicated.

- 4.2.1.1 Login screen
  - Filename: `docs/images/screen_login.png`
  - Why: shows authentication UI and fields; demonstrates login flow used by CHWs and admins.
  - Notes: capture an example of the login error state (wrong password) and a successful dashboard redirect.

- 4.2.1.2 Dashboard (Admin or Nutritionist)
  - Filename: `docs/images/screen_dashboard.png`
  - Why: shows high-level analytics, summaries and navigation to other features (Reports, Users).

- 4.2.1.3 Children list (CHW view)
  - Filename: `docs/images/screen_children_list.png`
  - Why: demonstrates per-CHW data separation and search/filtering features.

- 4.2.1.4 New Child form
  - Filename: `docs/images/screen_new_child.png`
  - Why: shows fields required to register a child (anthropometrics, geo, contact), and demonstrates who can create children.

- 4.2.1.5 Child detail / timeline
  - Filename: `docs/images/screen_child_detail.png`
  - Why: shows the child timeline of follow-ups, computed anthro analysis and charts.

- 4.2.1.6 Map view
  - Filename: `docs/images/screen_map_view.png`
  - Why: verifies geo coordinates display and cluster/marker behavior for mapped children.

- 4.2.1.7 Admin Users management
  - Filename: `docs/images/screen_admin_users.png`
  - Why: shows creation/activation of users (admin responsibility).

For each screenshot include a 1–2 paragraph caption describing which functional requirement it demonstrates and which source files implement the feature (link to repo path). Example:

Screenshot: `docs/images/screen_children_list.png`

Caption: "Children list (CHW view) — demonstrates the per-collector listing requirement. Implemented by `backend/src/controllers/children.controller.ts` (method `getChildren`) and consumed by `nutri-map FrontEnd/src/pages/ChildrenListPage.tsx` which calls `src/lib/api.ts::getChildren`. The backend applies filtering by `createdById` when `collectorId` query parameter is present."

4.3 Testing

4.3.1 Introduction

This section documents the testing approach used for the project: unit tests for utilities and controllers where feasible, small integration checks using node scripts, and acceptance checks performed manually against the seeded demo users. The goal is to show how to reproduce the checks quickly and what expected outputs look like.

4.3.2 Objective of testing

- Verify authentication and role-based access controls (CHW vs Admin vs Nutritionist).
- Verify that CHW users only see their own children (per-collector data separation).
- Verify child CRUD flows (create, update, delete) and follow-up creation.
- Verify report and export endpoints for completeness and format (CSV).

4.3.3 Unit testing outputs

Existing tests: The repo contains unit tests (Jest). Example run command (from `backend`):

```powershell
Set-Location '.\backend'
npm test
```

If you add a focused Jest test for CHW separation it might look like the following (save as `backend/tests/chw.separation.test.ts`):

```typescript
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prismaClient';

describe('CHW data separation (integration-like unit test)', () => {
  it('returns children only for the given collectorId', async () => {
    // This test assumes the seed has been run and seeded CHW ids exist
    const chwId = '10aa0fde-fdaf-4aa9-8191-1089e361888d';
    const res = await request(app).get(`/api/children?collectorId=${chwId}`).expect(200);
    const children = res.body;
    expect(Array.isArray(children)).toBe(true);
    // Every returned child should have createdById equal to chwId
    for (const c of children) {
      expect(c.createdById === chwId || c.createdBy?.id === chwId).toBeTruthy();
    }
  });
});
```

Expected output (partial):

```
 PASS  tests/chw.separation.test.ts
 ✓ returns children only for the given collectorId (xx ms)
 Tests: 1 passed
```

Notes: for unit tests that hit the database you can either run them against a test DB (configured via `DATABASE_URL`) or mock the Prisma client calls. For fast CI-friendly tests consider using an in-memory SQLite schema or a dedicated test Postgres instance.

4.3.4 Validation testing outputs

Validation tests confirm input validation and error responses. Example cases:

- Create child with missing required fields -> expect 400 and informative message.
- Login with incorrect password -> expect 401.
- POST follow-up by a different CHW -> expect 403.

Sample manual validation (PowerShell):

```powershell
# Using httpie or curl (example with curl)
curl -X POST http://localhost:4000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"chw@nutrimap.rw","password":"wrong"}'
# Expect 401 response with JSON { message: 'Invalid credentials' }
```

4.3.5 Integration testing outputs

The repository includes small helper scripts for smoke/integration checks in `backend/scripts/`:

- `test_chws.js` — logs in both CHWs and ensures returned children sets are disjoint. Run with `node ./scripts/test_chws.js` (from `backend` folder).
- `smoke.js` — logs in as the seeded CHW and Admin, performs a create child and a create user, prints IDs. Run with `node ./scripts/smoke.js`.

Expected output from `test_chws.js` (example):

```
CHW1 children count: 11
CHW2 children count: 10
PASS: No overlap between CHW1 and CHW2 children
```

If you see overlapping IDs the seed or DB may have been altered.

4.3.6 Functional and system testing results

Provide a short summary of hands-on functional tests you performed (example):

- Login as CHW -> can create new child -> child appears in CHW's list.
- Login as CHW2 -> cannot see CHW1's newly created child.
- Login as Admin -> can list users and activate a user.
- Login as Nutritionist -> access `/api/analytics` and `/api/export` returning aggregated summary and CSV respectively.

Include the following evidence artifacts in your final report:

- Captured screenshots (filenames matching section 4.2.1).
- Logs or terminal output from `test_chws.js` showing PASS.
- A copy of the sample unit test output.

4.3.7 Acceptance testing report (template)

Project: NutriMap
Date: <date>
Tested by: <tester name>

Summary of acceptance criteria (map these to your functional requirements):

1. CHW user can create child records and only sees their children in lists — PASS/FAIL and notes.
2. Admin can create/activate users — PASS/FAIL and notes.
3. Nutritionist can view aggregated analytics and export CSV — PASS/FAIL and notes.

Acceptance log example:

- Test case: CHW create child
  - Steps: Login CHW -> Create child via UI -> Open list -> verify child present
  - Expected: new child is listed and viewable
  - Result: PASS — timestamp, tester initials

- Test case: CHW data separation
  - Steps: Login CHW1 & CHW2, compare lists
  - Expected: no overlapping child ids
  - Result: PASS — include `test_chws.js` output

Sign-off:

By signing below the tester accepts the system meets the acceptance criteria for the tested features.

______________________   Date: __________

4.4 Source code excerpts (samples)

Include short code excerpts for the main modules that correspond to screenshots or features. Below are sample excerpts — include these in your report and reference exact file paths.

- Backend: `backend/src/controllers/auth.controller.ts` (login)

```typescript
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  if (!user.isActive) return res.status(403).json({ message: 'Account not activated by admin' });
  const ok = await verifyPassword(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
```

- Backend: `backend/src/controllers/children.controller.ts` (getChildren summary)

```typescript
export async function getChildren(req: Request, res: Response) {
  const { collectorId, q } = req.query;
  const where: any = {};
  if (collectorId) where.createdById = collectorId as string;
  if (q) {
    where.OR = [ /* search conditions */ ];
  }
  const children = await prisma.child.findMany({ where, include: { followUps: true, createdBy: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } });
  const withAnalysis = children.map((c: any) => {
    const last = c.followUps.length ? c.followUps[c.followUps.length -1] : null;
    const weight = last ? last.weightKg : c.initialWeightKg;
    const height = last ? last.heightCm : c.initialHeightCm;
    const analysis = computeAnthro({ ageDays: Math.floor((new Date().getTime() - c.dob.getTime())/ (1000*60*60*24)), weight, height, sex: c.sex });
    return { ...c, analysis };
  });
  res.json(withAnalysis);
}
```

- Frontend: `nutri-map FrontEnd/src/lib/api.ts` (getChildren client)

```typescript
export const api = {
  getChildren: async (params?: { collectorId?: string; q?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const raw = await request(`/api/children${qs}`);
    if (!Array.isArray(raw)) return [] as Child[];
    return raw.map((r: any) => normalizeChild(r));
  },
};
```

4.5 Notes and recommendations

- Always back up any important DB before running `npm run seed` — the seed deletes existing data.
- For production deployments consider adding database connection pooling (pgbouncer) or Prisma Data Proxy to avoid connection exhaustion.
- Add small integration tests in CI that run `npx prisma migrate deploy`, start the backend on a test DB, run `node ./scripts/test_chws.js` and assert a successful result.

---

If you want, I can now:
- Add real screenshots placeholders into `docs/images/` and commit a README telling how to capture them (I can't create real screenshots for you, but I can add the file structure and sample filenames).
- Add the sample Jest test file above into `backend/tests/` and a minimal GitHub Actions workflow that runs tests and `npx prisma generate` in CI (I will not run it here; just add files).
- Produce an annotated, line-by-line walkthrough for a chosen file and save it under `docs/annotations/`.

Which of those would you like me to do next? (A: add screenshot placeholders and README; B: add tests + CI skeleton; C: produce annotated walkthrough for one file)
