# Testing — Detailed (sections 4.2.1 → 4.2.7)

This document expands the testing sections for Chapter 4 of the report. It is written to be copy-pasteable into the dissertation where you listed testing subsections 4.2.1..4.2.7. It provides concrete commands (PowerShell), sample test code (Jest + Supertest), expected outputs, and templates for acceptance testing.

4.2.1 Introduction

This testing section documents the approaches used to validate the NutriMap system. The testing strategy consists of:
- Unit tests: verify small, pure utilities and small controller logic where possible.
- Validation tests: check input validation and error responses from endpoints.
- Integration tests: exercise real code paths that include the database and multiple modules (e.g., login + children listing).
- Functional/system tests: manual and scripted end-to-end workflows exercised in a browser or via scripts (smoke tests).
- Acceptance tests: higher-level checks mapped to the project's functional requirements and signed-off by the tester.

Tests should be reproducible: steps, commands and expected outputs are provided below. Tests that require the database should use a dedicated test database or a fresh local DB instance. The repository includes helper scripts under `backend/scripts/` to run small integration sanity checks.

4.2.2 Objective of testing

The objectives of testing for this project are:
- Correctness: verify that endpoints behave as documented and return the correct HTTP responses and payload shapes.
- Security / RBAC: verify authentication and role-based access control (CHW, Admin, Nutritionist).
- Isolation: ensure CHW data separation — CHWs must only see children they created.
- Data integrity: ensure follow-ups and child records are created and linked correctly.
- Usability and stability: ensure the frontend can authenticate, display lists, forms and maps without errors.

4.2.3 Unit testing outputs

What to test as unit tests
- Utility functions (e.g., `utils/anthro` calculations, `utils/password` wrapper).
- Small pure functions and helpers (e.g., `generateLocalId`).

How to run unit tests (PowerShell)

```powershell
Set-Location 'C:\Users\hp1\OneDrive\Desktop\NUTRIMAP\backend'
npm test
```

Sample Jest test (fast, local): create `backend/tests/anthro.test.ts`

```typescript
import { computeAnthro } from '../src/utils/anthro';

describe('Anthropometric utils', () => {
  it('computes expected classification for simple case', () => {
    const res = computeAnthro({ ageDays: 365 * 2, weight: 12, height: 85, sex: 'male' });
    expect(res).toHaveProperty('classification');
    // classification shape: { wa: null, ha: null, wh: 'normal' } etc.
  });
});
```

Expected test output (example):

```
 PASS  tests/anthro.test.ts
 ✓ computes expected classification for simple case (10 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

Notes
- If tests touch the database, configure `DATABASE_URL` to point to a throwaway DB or mock Prisma calls.
- Use `--runInBand` for Jest in CI to avoid parallel DB connections if using a shared test DB.

4.2.4 Validation testing outputs

Purpose
- Ensure the API returns proper validation errors and status codes when given malformed input or unauthorized requests.

Manual validation examples (PowerShell/curl)

1) Invalid login (expect 401)

```powershell
curl -X POST http://localhost:4000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"chw@nutrimap.rw","password":"wrong"}'
```

Expected response (HTTP 401):

```json
{ "message": "Invalid credentials" }
```

2) Create child missing required field (expect 400 or 500 depending on validation)

```powershell
$token = "<paste valid CHW Bearer token>"
curl -X POST http://localhost:4000/api/children -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d '{"name":"","motherName":""}' -i
```

Expected outcome: HTTP 400 (bad request) or a JSON error describing missing required fields. If your controllers do not perform schema validation, you will get a Prisma error — consider adding express-validator or a schema validation layer for clearer error messages.

4.2.5 Integration testing outputs

Purpose
- Run multi-step flows that exercise several layers (HTTP routing, middleware, controllers, DB) with real data.

Suggested approach
- Use Supertest with Jest against the Express `app` object. Use a test database or run the tests against a local DB seeded for tests.
- Alternatively use the provided scripts `backend/scripts/test_chws.js` and `smoke.js` to run quick assertions.

Sample integration test (Supertest + Jest)

Save as `backend/tests/chw.separation.test.ts`:

```typescript
import request from 'supertest';
import app from '../src/app';

describe('CHW separation (integration)', () => {
  it('returns only children for specified collectorId', async () => {
    const chwId = '10aa0fde-fdaf-4aa9-8191-1089e361888d';
    const res = await request(app).get(`/api/children?collectorId=${chwId}`).expect(200);
    const children = res.body;
    expect(Array.isArray(children)).toBe(true);
    for (const c of children) {
      // Backend returns createdBy or createdById depending on include
      const createdById = c.createdById || (c.createdBy && c.createdBy.id);
      expect(createdById).toBe(chwId);
    }
  }, 20000);
});
```

How to run the integration test (PowerShell)

```powershell
Set-Location '.\backend'
DATABASE_URL="postgresql://user:pass@localhost:5432/test_db?schema=public" npm test -- tests/chw.separation.test.ts --runInBand
```

Expected output (example):

```
 PASS  tests/chw.separation.test.ts
 ✓ returns only children for specified collectorId (xxx ms)

Test Suites: 1 passed, 1 total
```

If the test fails, inspect `backend/scripts/test_chws.js` to see how the repository's own helper scripts query the API.

4.2.6 Functional and system testing results

Manual test checklist (document each test with a short result and timestamp):

- Test: CHW login and list children
  - Steps: login as `chw@nutrimap.rw` -> open Children list
  - Expected: list contains only CHW's children
  - Result: PASS — (timestamp)

- Test: CHW create child
  - Steps: login CHW -> create new child via UI -> verify in list
  - Expected: new child appears in CHW list with correct fields
  - Result: PASS — (timestamp)

- Test: CHW cannot edit another CHW's child
  - Steps: login CHW1 -> attempt to update CHW2 child via API
  - Expected: 403 Forbidden
  - Result: PASS — (timestamp)

- Test: Admin user management
  - Steps: login admin -> create new user -> activate user
  - Expected: new user present and can login after activation
  - Result: PASS — (timestamp)

- Test: Nutritionist analytics & export
  - Steps: login nutritionist -> call `/api/analytics` and `/api/export`
  - Expected: JSON summary and downloadable CSV
  - Result: PASS — (timestamp)

Include sample evidence in your report: small terminal logs, CSV snippet, screenshot of charts.

4.2.7 Acceptance testing report

Acceptance testing maps functional requirements to test cases. Use the template below when presenting results in the defense.

Acceptance testing template (for each criteria):

- ID: AT-01
- Feature: CHW children separation
- Requirement: CHW user must only see children they created
- Test steps:
  1. Login as CHW1 (chw@nutrimap.rw / chw123)
  2. Run GET /api/children?collectorId=<CHW1 id>
  3. Login as CHW2 and run GET /api/children?collectorId=<CHW2 id>
  4. Verify sets do not overlap
- Expected result: disjoint sets of child IDs
- Actual result: PASS/FAIL and short notes
- Evidence: attach `test_chws.js` output and screenshots
- Tester: <name>
- Date: <date>

Sign-off section (example):

I confirm that the system meets the acceptance criteria for the functions tested above.

Tester signature: __________________  Date: ____________

---

Notes and recommendations for reproducibility

- Use a dedicated test database or local Postgres instance during tests (`DATABASE_URL` environment variable).
- For CI use, ensure secrets are configured and prefer `npx prisma migrate deploy` for migrations against a test DB rather than `prisma migrate dev`.
- Consider mocking external dependencies (if any) in unit tests to keep them fast and reliable.

If you want, I can also:
- Add the sample integration test file `backend/tests/chw.separation.test.ts` to the repo and a minimal `.github/workflows/ci.yml` workflow that runs `npm test`. (I can commit these on request.)
- Generate a short PDF snippet of test outputs to include directly in your defense slides.
