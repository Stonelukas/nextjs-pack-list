# Documentation Index

These files are the active implementation memory for Route Ledger. Update them whenever architecture, APIs, deployment, or operator behavior changes.

## Application entry points

- [README](../../README.md): Bun-only local development, commands, routes, PWA, and deployment overview.
- [Deployment](../../DEPLOYMENT.md): static Vercel SPA procedure and verification.
- [Clerk setup](../../CLERK_SETUP.md): Clerk React, Convex JWT, webhook, and roles.
- [Production checklist](../../PRODUCTION_CHECKLIST.md): release gates.
- [Knowledge base](../../KNOWLEDGE_BASE.md): repository navigation.

## Task Master references

1. [Current work session](CURRENT_WORK_SESSION.md) — rewrite progress, constraints, verification, blockers.
2. [Feature implementations](FEATURE_IMPLEMENTATIONS.md) — implemented capabilities and file locations.
3. [Code patterns](CODE_PATTERNS.md) — reusable route, hook, authorization, migration, PWA, and deployment patterns.
4. [API reference](API_REFERENCE.md) — routes, generated hook contracts, auth helpers, environment, PWA, and Vercel configuration.
5. [Troubleshooting](TROUBLESHOOTING.md) — build, auth, webhook, deployment, PWA, test, and migration failures.
6. [Architecture](ARCHITECTURE.md) — trust, data, module, PWA, testing, and static hosting boundaries.
7. [Convex integration summary](CONVEX_INTEGRATION_SUMMARY.md) — identity, authorization, webhook, typed hooks, and persistence.
8. [Quick reference](QUICK_REFERENCE.md) — commands and exact operational values.

## Current invariants

- Vite, React, and React Router own the browser application.
- Bun is the application package manager and `bun.lock` is the only application lockfile.
- Convex is authoritative for domain data and server authorization.
- Convex CLI may manage local public `VITE_CONVEX_SITE_URL` metadata for HTTP actions/webhooks; runtime configuration does not consume it and Vercel does not require it.
- Configured runtime mounts Clerk, Convex, auth readiness, and state-only account bootstrap; unconfigured runtime constructs neither external provider and still renders public routes.
- Clerk React supplies browser identity through `ConvexProviderWithClerk`; `RequireAuth` owns protected loading/unavailable/bootstrap recovery and preserves complete return URLs.
- Account bootstrap always renders router children, times out pending signed-in Convex readiness at 15 seconds, and gates the authenticated shell plus preference query until ready.
- `RootLayout` always mounts the shared header. `Header` itself reads auth readiness and mounts role access, Clerk account controls, and any Convex-backed navigation logic only inside the ready signed-in child, so loading, signed-out, and unconfigured public branches remain provider-safe.
- `/` always retains the provider-independent friendly landing until ready signed-in auth and ready account bootstrap can mount `ListOverview`; the landing owns the route's single `main-content` landmark while other public routes use `RootLayout`'s shared main. `AuthLayout` owns centered auth loading and unavailable recovery before Clerk forms mount.
- The signed-in workspace uses one-line branding, grouped Lists/Organize/Recent/Settings navigation, soft blue active surfaces, immediate quick-start templates, accessible definition-list stat tiles, and rounded Source Sans 3 card surfaces without changing list filters, permissions, actions, or pagination.
- `/templates` remains public at the same URL but requires configured runtime before connected data mounts.
- Typed hooks under `src/features/**/hooks` preserve generated Convex IDs/arguments/returns.
- Retained Vite source contains no top-level `use client` directives; the node-environment source-contract test scans all non-test JavaScript/TypeScript source and treats Next/RSC client-boundary markers as regressions.
- Dashboard/sidebar/index list collections use bounded ordinary-list summary pages; full nested account data uses a separate paginated export path. Legacy list template/publication flags remain storage-only and legacy template rows are excluded by the compound owner/type index.
- Template browsing merges bounded public/owned summaries with denormalized counts and explicit next-page state; preview/apply wait for one authorized detail query that loads bounded canonical children. One-shot submission handlers use synchronous duplicate guards, while quantity controls send independent atomic deltas.
- The predefined public catalog is backend-owned and environment-local: the internal idempotent seed synchronizes nine official templates, 39 categories, and 264 items after a fresh Convex deployment or catalog expansion.
- Administration reads users through mandatory bounded pages. The browser loads 50 at a time, filters only loaded rows, and cannot request deletion of the authenticated administrator; Convex independently rejects self-deletion.
- `src/store/navigation-store.ts` and theme persistence are presentation-only.
- `pack-list-storage` is untrusted, read-only legacy import input.
- The PWA caches only the static shell and icons; durable writes require connectivity.
- `vercel.json` publishes `dist` and rewrites only unmatched paths to `index.html`.
- Vercel hosts no business API or Clerk webhook.
- Public `VITE_*` values and Convex deployment secrets have separate ownership.
- Shared render helpers invoke the real `AppProviders` with memory routers; unresolved auth is projected by the real ten-second provider timeout, not by mocks.
- `.github/workflows/ci.yml` enforces frozen Bun install, client/build/artifact smoke, Convex, and 37 deterministic two-worker/zero-retry Chromium journeys without deployment credentials.
- Convex and Vercel are separate release stages with matching-revision checks and independent rollback ownership.

## Required commands

```bash
bun run check
bun run test:convex
bun run test:e2e:install      # first local run
bun run test:e2e
bun run build
bun run test:build-smoke
bun run preview --host 127.0.0.1 --port 4173
```

Fresh Linux CI uses `bun run test:e2e:install:ci`. `bun run check` is not the complete gate by itself.

## Documentation update protocol

For every feature or integration change:

1. Update `FEATURE_IMPLEMENTATIONS.md`.
2. Add or change reusable guidance in `CODE_PATTERNS.md`.
3. Update `API_REFERENCE.md` for contracts/configuration.
4. Add non-obvious failures to `TROUBLESHOOTING.md`.
5. Update `ARCHITECTURE.md` for trust/data/deployment changes.
6. Update `CURRENT_WORK_SESSION.md` with progress, verification, and blockers.
7. Validate links, paths, commands, JSON, and stale operational claims.

## Historical records

- `docs/superpowers/specs/`
- `docs/superpowers/plans/`
- `.superpowers/sdd/task-*-brief.md`
- `.superpowers/sdd/task-*-report.md`
- archive-labeled root `prd.txt`
- legacy Task Master task database entries

These are migration specifications/execution records. Removed-framework references inside them are archival context and should not be rewritten as current runtime behavior. Active operational documents must not copy their obsolete commands.

## Task Master database note

The checked-in Task Master `master` tag predates this rewrite; its task IDs do not map to the SDD rewrite task numbers. Use the CLI for real Task Master records, never edit `.taskmaster/tasks/tasks.json` manually, and track rewrite execution in `CURRENT_WORK_SESSION.md` plus SDD reports.

_Last updated: July 14, 2026_
