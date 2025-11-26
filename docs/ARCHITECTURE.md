**System Architecture Diagram**

This document describes the deployed architecture for NutriMap and includes a Mermaid diagram showing components and interactions. Render the Mermaid block in VS Code or at https://mermaid.live.

```mermaid
flowchart TD
  subgraph Edge
    Browser[Browser (Users)]
  end

  subgraph CDN
    FrontendStatic[Frontend Static Site (Vite build -> dist/)]
  end

  subgraph Render
    Frontend[Render Static Site]\n{"nutri-map FrontEnd"}
    Backend[Render Web Service]\n{"nutrimap-backend"}
    Postgres[(Postgres DB)]\n{"Render Managed Postgres"}
  end

  Browser -->|GET / (static)| FrontendStatic
  Browser -->|API calls (XHR/Fetch)| Backend
  FrontendStatic -->|calls API (VITE_API_URL)| Backend

  Backend -->|Prisma Client| Postgres
  Backend -->|JWT auth| Backend
  Backend -->|Migrations (npx prisma migrate deploy)| Postgres

  CI[GitHub / Git provider] -->|push| Render
  Render -->|build & deploy| Frontend
  Render -->|build & deploy| Backend

  style FrontendStatic fill:#fef3c7,stroke:#eab308
  style Frontend fill:#fef3c7,stroke:#ea580c
  style Backend fill:#e0f2fe,stroke:#0284c7
  style Postgres fill:#ecfccb,stroke:#65a30d
  style CI fill:#eef2ff,stroke:#7c3aed
```

**Component responsibilities**
- **Browser**: Executes the Vite-built SPA (React). Reads `VITE_API_URL` to call the backend API and stores JWT in localStorage/session as implemented by the frontend.
- **Frontend Static Site**: Built with Vite; output `dist/` served by Render Static Site or a CDN. Uses client env vars prefixed with `VITE_` for API base URL.
- **Backend Web Service**: Express + TypeScript app. Responsibilities:
  - Expose REST endpoints under `/api/*` for auth, users, children, conversations, analytics.
  - Validate requests, enforce authorization via `requireAuth` and `requireRole` middleware.
  - Use Prisma Client to access the Postgres DB.
  - Issue and verify JWTs with `JWT_SECRET` env var.
- **Postgres**: Managed DB storing normalized records defined by Prisma schema. Migrations are applied with `prisma migrate deploy` in production.
- **CI / Render**: Git pushes trigger Render builds; build commands must install devDependencies (for TypeScript) then run `tsc` (backend) or `vite build` (frontend). Render runs the configured Start Command for the backend and serves the static `dist/` for the frontend.

**Operational notes**
- Environment variables (set in Render dashboard): `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`, `SKIP_AUTH` (should be `false` in production), and `VITE_API_URL` (for frontend).
- CORS: Backend uses `cors()`; set correct allowed origin or allow all for initial troubleshooting.
- Prisma: Use `npx prisma migrate deploy` in production; only run `npm run seed` in development (seed deletes data).
- Monitoring & backups: Enable DB backups, add error logging/alerts (Sentry, Render alerts), and add health checks.

**How to export diagrams**
- Open `docs/ARCHITECTURE.md` in VS Code with a Mermaid preview extension and export PNG/SVG, or paste the Mermaid block into https://mermaid.live.

**Next steps I can do (no code modifications)**
- Export the Mermaid diagrams to PNG and add them under `docs/images/` (I can generate the Mermaid text but not raster images here; you can paste into mermaid.live to export). 
- Create a short `docs/deployment-checklist.md` with exact Render settings (Build/Start/Publish/Env) for both frontend and backend so you can paste values into the Render UI quickly.

