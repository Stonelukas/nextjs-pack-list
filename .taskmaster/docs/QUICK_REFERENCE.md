# Quick Reference

## Install and run

```bash
bun install
bun run dev
```

Reproducible install:

```bash
bun install --frozen-lockfile
```

## Required quality gates

```bash
bun run check
bun run test:convex
bun run test:e2e:install      # first local Chromium install
bun run test:e2e
```

The committed `.github/workflows/ci.yml` pins Bun 1.3.11 and runs the frozen install, `bun run check`, built-artifact smoke, `bun run test:convex`, `bun run test:e2e:install:ci`, and `bun run test:e2e`. It deploys nothing and needs no live-service secrets. `bun run check` alone does not include Convex or Playwright. Playwright uses two workers, zero retries, and currently reports 37 first-attempt desktop/mobile Chromium journeys.

## Build and preview

```bash
bun run build
bun run test:build-smoke
bun run preview --host 127.0.0.1 --port 4173
```

Output directory: `dist`. Artifact smoke discovers current hashed JS/CSS/Workbox, validates manifest/worker/icons, and checks 12 byte-identical deep-route shells without hard-coded hashes.

## Public browser environment

```env
VITE_CLERK_PUBLISHABLE_KEY=
VITE_CONVEX_URL=
VITE_CONVEX_SITE_URL= # optional CLI-managed local HTTP-actions metadata
VITE_APP_URL=
VITE_SENTRY_DSN=
```

Vercel-reserved `VITE_VERCEL_*` values may be injected automatically during Preview builds. Build validation accepts and ignores that namespace; do not define those values manually or use them as application configuration.

## Convex environment

```env
CLERK_JWT_ISSUER_DOMAIN=
CLERK_WEBHOOK_SECRET=
```

Clerk JWT application ID: `convex`.

Webhook:

```text
https://<deployment>.convex.site/clerk-webhook
```

Events: `user.created`, `user.updated`, `user.deleted`.

## Production release order

```bash
REVISION="$(git rev-parse HEAD)"
bunx convex deploy --dry-run --typecheck enable --message "route-ledger:$REVISION"
bunx convex deploy --typecheck enable --message "route-ledger:$REVISION"
bunx convex run templates:seedTemplates '{}' --prod --typecheck enable --codegen disable
```

Select the intended production deployment with exactly one approved `CONVEX_DEPLOYMENT` linkage or target-scoped `CONVEX_DEPLOY_KEY`. The official seed is internal and idempotent; a fresh deployment must expose 9 public templates, 39 categories, and 264 items. Verify the matching audit SHA, functions, schema/indexes, catalog, webhook, and auth; then verify Vercel Preview with `VITE_CONVEX_URL` set to that deployment before production promotion. Convex and Vercel rollback separately.

## Startup and auth recovery

- `useAuthReadiness()`: `loading | ready | unavailable`, signed-in identity, message, and provider retry.
- `useConvexUserBootstrap()`: `idle | loading | ready | error`, mapped error, and account retry; signed-in Convex authentication/provisioning times out after exactly 15 seconds.
- `RequireAuth` state order: auth loading, auth unavailable, signed-out redirect, bootstrap idle/loading, bootstrap error, children. Redirects preserve pathname, search, and hash.
- `RootLayout` always mounts the shared header, but mounts authenticated navigation, legacy migration, and mobile navigation only for ready signed-in auth plus ready bootstrap. `Header` calls provider-dependent role/Clerk logic only in its ready signed-in child; public/loading/unavailable/unconfigured branches stay provider-safe. Other public paths and route-loading feedback use RootLayout's shared `main-content` wrapper; non-authenticated `/` renders the route-owned landing main directly.
- `HomePage` renders provider-independent `PublicHomePage` for every non-dashboard state and mounts `ListOverview` only for ready signed-in auth plus ready bootstrap. The landing owns the route's single `<main id="main-content">`, keeps exact `/sign-up` and `/sign-in` links, and exposes the failed boundary's retry action.
- `AuthLayout` owns the responsive Route Ledger auth/recovery shell; Clerk forms mount only when readiness is ready. Signed-in visitors follow a validated internal `redirect_url` or `/lists`. `ClerkProvider`, sign-in/up, and Settings `UserProfile` share explicit Graphite appearance rules and Route Ledger localization.
- `PreferenceThemeSync` does not query Convex until bootstrap is ready.
- `/templates` is public only through `RequireConfiguredRuntime`; unconfigured runtime gets a provider-independent service-unavailable card.
- Friendly workspace order: `My packing lists` → Quick start templates → accessible four-value stat group → packing-list collection toolbar → cards/empty state → load more. Sidebar groups are Lists, Organize, Recent, and Settings; count badges are not zero-padded; desktop, sheet, and bottom navigation use the same soft active treatment and 44-pixel targets.
- Vite source modules contain no top-level `use client` directives. `src/app/task-6-source-contracts.test.ts` scans all retained non-test JavaScript/TypeScript source and rejects Next/RSC marker reintroduction.

## Routes

```text
/
/sign-in/*
/sign-up/*
/lists
/lists/new
/lists/:id
/lists/:id/edit
/templates
/categories
/tags
/settings
/admin
*
```

## Typed hooks

```text
useLists
useList
useListActions
useTemplates
useTemplateDetail
useOwnedTemplateExportData
usePreferences
useAdminAccess
```

Use generated Convex `Id<>`, `FunctionArgs`, and `FunctionReturnType`. Never pass Clerk IDs/roles for authorization. Dashboard/sidebar/index use paginated ordinary-list summaries; list routes load one detail; account export/category aggregation use paginated full list export. Public list outputs and update actions do not expose legacy `isTemplate`/`isPublic` flags. Adds append order server-side; reorders own sibling order; same-category item edits omit move fields; `weight: null` clears weight. Template library rows are public-safe summaries with load-more; preview/apply wait for `useTemplateDetail`; settings waits for exhaustive `useOwnedTemplateExportData` plus resolved preferences before export.

Guard one-shot form/dialog submissions with a synchronous in-flight ref as well as pending UI. Quantity buttons are the exception: every click sends an intentional `adjustItemQuantity` delta.

List JSON import limits: 50 categories, 200 items per category, 1,000 total items, 1,000,000 UTF-8 bytes. Template limits: 50 categories, 200 per category, 1,000 total, 20 public per owner. Moderation pages: 1..50. Owner template export pages: 1..5.

Admin user reads and moderation both use cursor pagination with visible load-more actions. User-directory search filters loaded rows. Admin deletion is scheduled/resumable, not immediate, and current-administrator self-deletion is denied by Convex. Template analytics uses `templateStats` plus `by_usage`.

## Startup test boundary

`renderAppRoute` and `renderWithProviders` invoke the real `AppProviders` with memory routers and may pass configured or unconfigured runtime results. `unavailableAuth()` means unresolved Clerk input only; the real readiness provider owns the 10,000ms unavailable transition and Retry. The full single-worker client gate is 380 tests across 88 files.

## Persistence

- Convex: authoritative domain data.
- Zustand/local storage: presentation only.
- `pack-list-storage`: read-only one-time migration source.
- PWA: static shell only; no Convex cache, mutation queue, or Background Sync.

## Vercel

```json
{"$schema":"https://openapi.vercel.sh/vercel.json","framework":"vite","installCommand":"bun install --frozen-lockfile","buildCommand":"bun run build","outputDirectory":"dist","rewrites":[{"source":"/(.*)","destination":"/index.html"}]}
```

Existing static files must win before the rewrite. The Vercel origin hosts no business API and no Clerk webhook.

## Documentation

- `README.md`
- `DEPLOYMENT.md`
- `CLERK_SETUP.md`
- `PRODUCTION_CHECKLIST.md`
- `.taskmaster/docs/INDEX.md`
- `.taskmaster/docs/CURRENT_WORK_SESSION.md`

## Known blockers

- Rewrite verification is green: 380 client tests across 88 files, 142 Convex tests across eight files, 37 zero-retry Playwright journeys, built-artifact smoke, production-preview shell/offline service-worker navigation, strict typecheck, ESLint with 0 errors/20 existing warnings, frozen install, JSON/YAML/stale-claim/whitespace checks, and final review approval. Production Vercel and Convex deployments have been exercised; Clerk webhook delivery still requires explicit live re-verification.
- Convex code generation and live authenticated/webhook verification require a real `CONVEX_DEPLOYMENT` and Clerk/Convex configuration.

_Last updated: July 14, 2026_
