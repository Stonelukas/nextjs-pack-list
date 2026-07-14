# Claude Code Instructions

## Current application invariants

- The active browser application is Vite 7 + React 19 + React Router 7. Do not introduce framework-specific server routes, middleware, layouts, or build output.
- Bun is the only application package manager. Use `bun install`, `bun install --frozen-lockfile`, and `bun run <script>`; keep `bun.lock` as the only application lockfile.
- Convex is authoritative for users, lists, categories, items, templates, preferences, legacy-import markers, and administration.
- Public Convex functions derive identity from `ctx.auth`. Never authorize with a browser-supplied Clerk ID, role, or email.
- Browser persistence is presentation-only (`pack-list-theme` and navigation state). `pack-list-storage` is untrusted, read-only input for the explicit one-time legacy import.
- Zustand must remain presentation-only. New domain code uses typed hooks under `src/features/**/hooks` and generated `Id<>`, `FunctionArgs`, and `FunctionReturnType` contracts.
- `RequireAuth` and `RequireAdmin` are user-experience guards. Convex ownership/admin helpers remain the security boundary.
- The PWA is a shell-only offline experience. It does not cache Convex data, queue mutations, or use Background Sync. Durable controls require connectivity.
- `vite-plugin-pwa` generates `manifest.webmanifest`, `sw.js`, and Workbox output. Do not add `public/manifest.json`.
- The Vercel deployment is a static SPA from `dist`; there is no application/business API server. Existing static files take precedence over the catch-all rewrite.
- Historical design plans, SDD briefs/reports, and migration specifications are execution records. Their removed-framework search/deletion instructions are not active runtime guidance.

## Mandatory verification

Run the gates appropriate to the change and do not describe `bun run check` as including the separate Convex or Playwright suites:

```bash
bun run check
bun run test:convex
bun run test:e2e:install       # first local Chromium install only
bun run test:e2e:install:ci    # fresh Linux CI runner
bun run test:e2e
```

Deployment/documentation changes also require:

- JSON validation for `vercel.json` and package/config files.
- A frozen Bun install proof.
- `bun run build` plus production-preview checks for real static assets and direct nested routes.
- A repository-wide stale operational-claim scan and `git diff --check`.

The committed `.github/workflows/ci.yml` pins Bun 1.3.11 and runs frozen install, `check`, Convex, Chromium-install, and Playwright gates. It requires no live-service/deployment secrets and deploys nothing.

## Environment ownership

Public Vercel/Vite runtime values: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_CONVEX_URL`, optional `VITE_APP_URL`, and optional `VITE_SENTRY_DSN`. Convex CLI may additionally manage local public metadata `VITE_CONVEX_SITE_URL` for HTTP actions; builds validate it but the application does not consume it and Vercel does not require it.

Convex deployment values: `CLERK_JWT_ISSUER_DOMAIN` and `CLERK_WEBHOOK_SECRET`. `CONVEX_DEPLOYMENT` is local project linkage; target-scoped `CONVEX_DEPLOY_KEY` belongs only in the separately approved backend release stage, never repository test CI or the Vercel static build. Never expose server values with a `VITE_` prefix.

## Reference documentation

Always consult and update these documents when implementation behavior changes:

- @./.taskmaster/docs/CURRENT_WORK_SESSION.md
- @./.taskmaster/docs/INDEX.md
- @./.taskmaster/docs/FEATURE_IMPLEMENTATIONS.md
- @./.taskmaster/docs/CODE_PATTERNS.md
- @./.taskmaster/docs/API_REFERENCE.md
- @./.taskmaster/docs/TROUBLESHOOTING.md
- @./.taskmaster/docs/ARCHITECTURE.md
- @./.taskmaster/docs/CONVEX_INTEGRATION_SUMMARY.md
- @./.taskmaster/docs/QUICK_REFERENCE.md

Import Task Master's workflow commands and guidelines as project instructions:

@./.taskmaster/CLAUDE.md
