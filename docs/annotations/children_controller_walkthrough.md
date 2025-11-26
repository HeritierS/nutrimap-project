# Annotated walkthrough — backend/src/controllers/children.controller.ts

This walkthrough explains the main functions in `children.controller.ts` with line-level rationale and notes you can use during your defense. It highlights authentication checks, data queries, computation of anthropometric analysis, and defensive error handling.

Note: snippets below refer to the current code in the repository. Line numbers are approximate; open the file in your editor to cross-reference.

## 1) createChild(req, res)

Purpose: create a new `Child` record with the authenticated user's id as `createdById`.

Key behaviors to highlight in defense:
- Requires authentication; checks role (must be `chw` or `admin`).
- Generates a `localId` via `generateLocalId()` utility for human-friendly local identifiers.
- Performs defensive DB check to ensure the token user exists and is active before insertion.
- Catches Prisma FK errors (e.g., P2003) to return a friendly 400 message rather than a raw DB error.

Representative logic (pseudo / commented):

```ts
// 1. Extract user from request (populated by auth middleware)
const user = (req as any).user;
if (!user) return res.status(401).json({ message: 'Unauthorized' });
// 2. Authorization: only CHW or Admin can create children
if (user.role !== 'chw' && user.role !== 'admin') return res.status(403).json({ message: 'Only CHWs or Admins can create child records' });

// 3. Defensive: ensure user exists and isActive
const existingUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, isActive: true } });
if (!existingUser) return res.status(401).json({ message: 'Authenticated user not found in database' });
if (!existingUser.isActive) return res.status(403).json({ message: 'Account not activated' });

// 4. Create child record using body properties and user's id
const child = await prisma.child.create({ data: { localId, name: body.name, createdById: user.id, ... } });
res.status(201).json(child);
```

Talking points:
- Explain why the extra `existingUser` DB check is important: tokens could be forged or stale; checking DB ensures account still exists and is active.
- Explain the use of `localId` (human-friendly unique id) vs UUID primary `id`.
- Mention cascade delete behavior in Prisma schema: if a user is deleted their created children are also removed (onDelete: Cascade). This is deliberate and may be discussed as a design trade-off.

## 2) getChildren(req, res)

Purpose: return a list of children. Supports optional `collectorId` filter and free-text search `q`.

Critical behaviors to highlight:
- Uses Prisma to include `followUps` and a `createdBy` minimal projection (id, name).
- Computes anthropometric analysis for each child by calling `computeAnthro()` with the relevant age/weight/height values.
- Returns the enriched children array with `analysis` attached — the API performs domain analysis server-side so the frontend can be simpler.

Representative logic:

```ts
const { collectorId, q } = req.query;
const where: any = {};
if (collectorId) where.createdById = collectorId as string;
if (q) where.OR = [ ...search conditions... ];

const children = await prisma.child.findMany({ where, include: { followUps: true, createdBy: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } });

const withAnalysis = children.map((c: ChildWithRelations) => {
  const last = c.followUps.length ? c.followUps[c.followUps.length -1] : null;
  const weight = last ? last.weightKg : c.initialWeightKg;
  const height = last ? last.heightCm : c.initialHeightCm;
  const ageDays = Math.floor((new Date().getTime() - c.dob.getTime()) / (1000*60*60*24));
  const analysis = computeAnthro({ ageDays, weight, height, sex: c.sex });
  return { ...c, analysis };
});

res.json(withAnalysis);
```

Talking points:
- Why compute analysis server-side? To centralize domain logic and ensure consistent analysis across clients. It also allows returning a single payload used by charts and reports.
- Note the fallback to initial anthropometric measurements if no follow-ups exist.
- Mention potential performance considerations: computing analysis for many children in a single query could be heavy. For large datasets consider batching or precomputing critical metrics.

## 3) getChildById(req, res)

Purpose: return a single child with a timeline of initial + follow-up entries and analysis per entry.

Important details:
- `followUps` are ordered by `recordedAt` ascending.
- The controller assembles `entries` starting with the initial recorded visit followed by all follow-ups.
- Each timeline entry is annotated with `analysis` computed for the age at that entry.

This endpoint is used to power the Child Detail view and charts on the frontend.

## 4) addFollowUp(req, res)

Purpose: allow a CHW or Admin to add measurement entries for a child.

Key checks:
- Ensures the child exists.
- Ensures the acting user is either the child creator or admin (prevents other CHWs from adding follow-ups to another CHW's children).
- Creates the `FollowUp` record with `collectorId` set to `user.id`.

Discussion:
- This check preserves data ownership integrity and maps to the functional requirement that CHWs can only manage their own children.

## 5) updateChild / deleteChild

Purpose: manage updates and deletions.

Key points:
- Ownership checks are repeated: only admin or owner can mutate/delete.
- Deleting a child removes associated followUps (cascade) — the code explicitly deletes followUps first, then the child (extra safety).

## Defense tips: likely questions & short answers

Q: How is authorization enforced across the app?
A: `requireAuth` middleware decodes the JWT and attaches a payload to `req.user`; `requireRole` enforces role-level access; controllers perform additional ownership checks for resource-level security.

Q: How do you prevent token replay or stale tokens?
A: The code performs a DB lookup of the user and checks `isActive` on sensitive operations, preventing a deactivated account from acting even if the JWT is valid.

Q: What are the scalability concerns?
A: Prisma creates a DB connection per process; under heavy traffic the Postgres connection limit could be reached. For production use we recommend a pooler (pgbouncer) or Prisma Data Proxy and horizontal scaling strategies.

Q: Why compute anthro scores server-side not client-side?
A: Centralizing domain logic reduces client duplication and ensures consistent classification. It also simplifies maintaining and validating the algorithm in one place.

---

If you want, I can also produce an annotated PDF or slide snippets that annotate the exact lines in the file for your defense slides. Tell me if you'd like a slide-ready excerpt and I will format it accordingly.
