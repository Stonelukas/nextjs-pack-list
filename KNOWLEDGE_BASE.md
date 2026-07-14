# Route Ledger Knowledge Base

This file is the repository-level navigation entry for the active Vite/React Router/Convex application and its Task Master workflow.

## Start here

- [README.md](README.md): Bun-only development, scripts, environment scopes, PWA boundary, and route overview.
- [DEPLOYMENT.md](DEPLOYMENT.md): static Vercel SPA contract and verification.
- [CLERK_SETUP.md](CLERK_SETUP.md): Clerk React, Convex JWT, roles, and signed webhook setup.
- [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md): release gates and Preview checks.
- [.taskmaster/docs/INDEX.md](.taskmaster/docs/INDEX.md): detailed architecture, APIs, patterns, troubleshooting, and session state.

## Application structure

```text
src/
├── main.tsx                    # environment validation, Sentry, React mount
├── app/                        # providers, router, layouts, guards, boundaries
├── features/
│   ├── auth/                   # Clerk path-routed sign-in/sign-up
│   ├── lists/                  # list routes, typed hooks, mutation models
│   ├── templates/              # template route and typed hook
│   ├── settings/               # preferences, export/import, legacy migration
│   ├── admin/                  # server-confirmed administrator route
│   ├── legacy-migration/       # read-only legacy source normalization/recovery
│   └── shared/                 # async mutation state
├── components/                 # Route Ledger presentation and workflows
├── providers/                  # Clerk-backed Convex and theme providers
├── store/navigation-store.ts   # presentation-only Zustand state
└── lib/                        # environment, errors, monitoring, utilities

convex/
├── lib/                        # auth, authorization, errors, deletion, validators
├── lists.ts                    # owned list/category/item operations
├── templates.ts                # public/owned templates and atomic application
├── users.ts                    # current-user/admin/internal Clerk sync
├── migrations.ts              # user-scoped atomic legacy import
├── http.ts                    # signed Clerk webhook
└── schema.ts                  # authoritative persistence model
```

## Supported commands

```bash
bun install
bun run dev
bun run check
bun run test:convex
bun run test:e2e:install      # first local run
bun run test:e2e
bun run build
bun run preview --host 127.0.0.1 --port 4173
```

Use `bun run test:e2e:install:ci` on a fresh Linux CI runner. `bun run check` does not include Convex or Playwright.

## Runtime boundaries

- React Router owns public, authenticated, admin, Clerk splat, and not-found navigation.
- Clerk React establishes browser identity; `ConvexProviderWithClerk` transports it.
- Convex resolves `identity.subject`, verifies ownership/admin role, and commits authoritative data.
- Typed feature hooks preserve generated Convex identifiers and exact argument/return contracts.
- Browser persistence is limited to theme/navigation presentation and the explicit read-only legacy source.
- The PWA caches only the static shell and icons. Offline editing and later synchronization are not implemented.
- Vercel serves static `dist` artifacts and rewrites unmatched paths to `index.html`. It does not host a business API or Clerk webhook.

## Environment ownership

Public Vite/Vercel build values:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_CONVEX_URL`
- optional `VITE_APP_URL`
- optional `VITE_SENTRY_DSN`

Convex deployment values:

- `CLERK_JWT_ISSUER_DOMAIN`
- `CLERK_WEBHOOK_SECRET`

Local/CI tooling:

- `CONVEX_DEPLOYMENT` for project linkage
- optional `CONVEX_DEPLOY_KEY` for an explicit Convex deploy step

## Historical records

`docs/superpowers/specs/`, `docs/superpowers/plans/`, and `.superpowers/sdd/task-*-brief.md` / `task-*-report.md` describe migration decisions and execution history. Removed-framework references in those records are archival context, not current operator instructions.

`PROJECT_ANALYSIS.md`, `DOCUMENTATION_SUMMARY.md`, and the legacy developer guides carry explicit archive/replacement notices. Do not copy obsolete commands from historical Task Master task records into active application documentation.
