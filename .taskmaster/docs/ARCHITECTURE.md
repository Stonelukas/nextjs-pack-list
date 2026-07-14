# Architecture

## System overview

Route Ledger is a static Vite single-page application backed directly by Clerk and Convex.

```text
Browser
  -> Vite/React/React Router presentation
  -> Clerk session
  -> typed Convex React hooks
  -> Convex auth, authorization, transactions, persistence

Vercel
  -> installs/builds with Bun
  -> serves dist static files
  -> rewrites unmatched routes to index.html

Clerk webhook
  -> Convex HTTP action
  -> Svix verification
  -> internal user synchronization mutations
```

There is no long-running application server or Vercel business API. Retained browser modules are ordinary Vite modules and carry no Next/RSC `use client` boundaries; a source-contract test scans all non-test JavaScript/TypeScript source to preserve that platform boundary.

## Browser composition

```text
RootErrorBoundary
  -> ThemeProvider
    -> RuntimeConfigurationProvider
      -> configured: ClerkProvider
        -> ConvexProviderWithClerk
          -> AuthReadinessProvider
            -> ConvexUserBootstrap
              -> PreferenceThemeSync
              -> RouterProvider
      -> unconfigured: UnavailableAuthReadinessProvider
        -> RouterProvider
```

`src/main.tsx` validates public environment values and initializes Sentry before mounting. Production `App` passes the browser router explicitly to `AppProviders`; shared render helpers pass memory routers to that same component, so configured/unconfigured provider composition cannot drift. The unconfigured branch constructs neither Clerk nor Convex, but still supplies unavailable auth readiness so public routing can render. In the configured branch, `ClerkProvider` supplies the shared Route Ledger appearance/localization before `AuthReadinessProvider` projects unresolved Clerk input to unavailable after ten seconds and a Retry creates a fresh provider attempt. `ConvexUserBootstrap` is a state-only provider: it always renders the router, provisions one local Convex user per keyed attempt, remains safe under React StrictMode replay, bounds signed-in Convex authentication/provisioning at 15 seconds, and rejects stale attempt completions. `RequireAuth` owns protected loading/unavailable/retry presentation. `RootLayout` always mounts `Header`, whose outer component reads only auth readiness; role access, Clerk account UI, and provider-backed navigation exist only in its ready signed-in child. RootLayout uses readiness/bootstrap contexts to mount the rest of the authenticated shell only after both are ready. On non-authenticated `/`, it renders the outlet directly because `PublicHomePage` owns the single `main-content` landmark and focus target; other public paths and route-loading feedback retain RootLayout's shared main. `HomePage` is a thin adapter that keeps the provider-independent `PublicHomePage` mounted for every other state and replaces it with `ListOverview` only at the ready signed-in/ready bootstrap boundary, where `NavigationLayout` owns the main landmark. `AuthLayout` withholds Clerk forms until auth readiness is ready, owns responsive first-party auth/recovery presentation, and routes already-authenticated visitors to a validated internal return URL or `/lists`. `PreferenceThemeSync` starts its Convex query only after bootstrap is ready and applies changed server preferences without overriding an unsaved local theme draft. `src/app/routes.tsx` exports the route objects used by both the browser router and memory-router tests.

## Route topology

Public:

- `/` — provider-independent landing until the authenticated list overview is fully ready
- `/sign-in/*` — responsive Route Ledger recovery/Clerk sign-in; signed-in visitors follow a safe internal return URL
- `/sign-up/*` — responsive Route Ledger recovery/Clerk sign-up; signed-in visitors follow a safe internal return URL
- `/templates` through `RequireConfiguredRuntime` (public when configured; provider-independent unavailable state otherwise)
- client `*` not-found recovery

Authenticated through `RequireAuth`:

- `/lists`
- `/lists/new`
- `/lists/:id`
- `/lists/:id/edit`
- `/categories`
- `/tags`
- `/settings`

Administrator through `RequireAdmin` below the authenticated boundary:

- `/admin`

Guards improve startup recovery, loading, and navigation. `RequireAuth` never mounts protected children while auth/bootstrap are unresolved, unavailable, or failed, and it preserves the full encoded return URL for ready signed-out users. Convex remains the authorization boundary.

## Data and trust flow

1. A route/component calls a focused feature hook.
2. The hook invokes a generated Convex reference with branded IDs and exact generated arguments.
3. `ConvexProviderWithClerk` supplies the Clerk session.
4. Convex resolves `identity.subject` to `users.by_clerk_id`.
5. `requireCurrentUser`, `requireAdmin`, or normalized ownership helpers authorize the operation.
6. Convex applies shared semantic validation and commits the transaction.
7. Reactive query subscriptions update the hook and component.

Dashboard, sidebar, and list-index surfaces subscribe to capped, newest-first `getListSummaries` pages containing ordinary-list metadata and aggregate counts only. Summary and export feeds use the compound `by_user_template` index, exclude legacy template rows, and omit storage-only list-template/publication flags. One-list routes use `getList`; account export and cross-list category aggregation use the separate capped, oldest-first `getListExportPage` path. The list overview presents the same summaries as immediate quick starts, one accessible definition-list stat panel, an adjacent search/sort/view/import/create toolbar, and the existing grid/empty/load-more path; status filtering changes the collection heading, not the stable page h1. List-index filters operate on loaded pages but never hide the remaining-page control. Sidebar summaries remain paginated and grouped into Lists, Organize, Recent, and Settings with exact query matching; mobile navigation applies the same permission boundary and soft active state. Public adds append order server-side and only exact-set reorder mutations rewrite siblings. Item forms omit destination fields for same-category edits, use explicit null to clear weight, and include destination only for one atomic cross-category move. Nested import performs shared structural/byte preflight before the first insert; direct item deletion cleans linked moderation/history in the same transaction. Form/dialog submission boundaries use synchronous in-flight guards in addition to rendered pending state.

Template collection surfaces merge capped public and current-user-owned summary pages and expose explicit next-page state. Public-safe DTOs omit `createdBy` and carry `isOwned`; anonymous private/missing lookup is indistinguishable. The `templates` row carries denormalized category/item counts so browsing never expands every child collection. Selecting or applying a template calls one public-or-owner-authorized `getTemplate` query first, which loads bounded canonical `templateCategories` and `templateItems`. Creation checks publication quota before sequential bounded source reads. `convex/lib/official_templates.ts` owns the nine-template predefined catalog; the internal idempotent seed inserts only missing official names, writes 39 categories and 264 items for a fresh deployment, and starts bounded metadata/`templateStats` repair. Create/import/seed paths validate complete metadata and child counts before inserting; apply reuses the same bounded detail path before creating a list. Settings uses separate exhaustive full-detail list and owner-template export hooks and remains blocked until preferences and every page resolve.

The browser never chooses a Clerk identity, role, or resource owner.

## Application modules

```text
src/app/                         shell, routes, guards, errors, layouts
src/features/lists/              routes, typed hooks, list/item adapters
src/features/templates/          template route, hook, filter model
src/features/settings/           preferences, export/import, legacy migration entry
src/features/admin/              guarded administrator route/access hook
src/features/legacy-migration/   untrusted browser-source parser and recovery
src/features/shared/             ephemeral async mutation state
src/components/                  presentation and workflow components
src/store/navigation-store.ts    presentation-only Zustand
src/lib/                         environment, errors, monitoring, utilities
```

## Convex modules

```text
convex/lib/auth.ts               identity/current-user/admin helpers
convex/lib/authorization.ts      list/category/item ownership traversal
convex/lib/errors.ts             stable domain codes
convex/lib/deletion.ts           linked-record batch and direct cleanup helpers
convex/lib/import_limits.ts      shared list JSON structure/byte limits
convex/lib/legacy_import.ts      shared legacy fingerprint and transaction limits
convex/lib/official_templates.ts backend-owned nine-template official catalog
convex/lib/template_stats.ts     bounded global template count/usage aggregate
convex/lib/validation.ts         canonical list/template field, count, and quota limits
convex/lists.ts                  tenant-safe bounded list/category/item operations
convex/templates.ts              safe summaries, authorized detail/export, create/apply/backfill/seed
convex/users.ts                  current-user/admin/internal Clerk sync and deletion jobs
convex/migrations.ts             bounded user-scoped legacy import
convex/http.ts                   signed Clerk webhook
convex/schema.ts                 authoritative normalized persistence
```

Convex CLI owns local deployment linkage and may write `VITE_CONVEX_SITE_URL` beside `VITE_CONVEX_URL`. The former is validated public metadata for HTTP actions/webhooks and is intentionally absent from the application runtime configuration object; the latter is the browser data/query endpoint.

## Persistence ownership

Convex stores users, lists, categories, items, templates, template categories/items, shares, preferences, legacy import markers, moderation, and settings.

Browser persistence is limited to:

- theme preference;
- navigation presentation preference;
- exact historical `pack-list-storage` source until explicit migration cleanup;
- a best-effort post-import archive marker.

There is no browser-authoritative domain store or offline mutation queue.

## Bounded administration architecture

Admin user detail reads ordinary lists through `by_user_template(userId, false)` and canonical templates through `templates.by_creator`; legacy template-list rows do not affect list or template metrics. Template analytics reads singleton `templateStats` for totals/usage and `templates.by_usage` for the top ten.

The user directory is cursor-paginated end to end: `getAllUsers` requires pagination options and the browser loads 50 records at a time. Browser search is scoped to loaded rows. Destructive controls stay disabled while current-user identity is unresolved; an admin deletion request is rejected before job creation when the authenticated administrator ID equals the target. `updateUser` returns the updated record; a user-ID-keyed override bridges stale table/details rows only until their `updatedAt` is equal or newer, preserving Convex authority.

```text
Admin or Clerk deletion request
  -> create/reuse userDeletionJobs row
  -> schedule internal continueUserDeletion
  -> remove one bounded descendant/link batch
  -> reschedule until no owned data remains
  -> delete user and job
```

Moderation queues page through `by_status` or `by_status_content_type`. Generated discriminated queue DTOs keep list and template previews separate, and the client locks a confirmation dialog around one in-flight mutation.

## Legacy migration architecture

```text
pack-list-storage raw text
  -> guarded found/missing/inaccessible read
  -> exact recovery snapshot
  -> per-record normalization/rejection
  -> shared deterministic fingerprint and cost preflight
  -> current-user Convex status query
  -> one authenticated atomic import mutation
  -> user/source/fingerprint completion record
  -> optional explicit source cleanup
```

Changed, missing, or inaccessible source data blocks stale import/cleanup while preserving cached recovery. Template categories are normalized to preserve empty and duplicate-name categories.

## PWA architecture

`vite-plugin-pwa` generates the manifest and Workbox worker.

```text
Static navigation
  -> precached HTML/JS/CSS/fonts/icons
  -> /index.html navigation fallback

Convex request
  -> network only
  -> Clerk-backed authorization
  -> authoritative persistence

Offline mutation
  -> client connectivity preflight
  -> stable OFFLINE error / disabled control
  -> zero Convex calls
```

Updates remain waiting until the user approves activation. `runtimeCaching` and Background Sync are absent.

## Monitoring

- Sentry React initializes before mount when `VITE_SENTRY_DSN` is set.
- Sensitive event values are redacted recursively.
- Expected domain errors remain local/user-facing.
- Vercel Analytics, Speed Insights, and Web Vitals mount globally.

## Testing architecture

- Client Vitest mounts real routes/pages/components/hooks and replaces only external Clerk/Convex/PWA/Vercel edges. Its memory-router helpers invoke the production `AppProviders` and can select configured or unconfigured runtime results. The client project uses one file worker with bounded async/test timeouts; the current gate is 388 tests across 89 files.
- `convex-test` executes actual Convex auth/authorization/domain/webhook/migration functions and checks deployable module paths; the current gate is 146 tests across eight files.
- Playwright runs 37 deterministic desktop/mobile Chromium scenarios on the existing development-only Vite e2e boundary with two workers and zero retries. Playwright Clock controls the real ten-second auth readiness timeout, and 390×844 geometry checks cover landing, sign-in splat, and signed-in dashboard primary targets.
- Production-build contracts prevent mock aliases and seed state from entering normal artifacts.
- The node-environment source contract rejects top-level `use client` directives throughout retained non-test Vite source.
- `.github/workflows/ci.yml` pins Bun 1.3.11 and enforces frozen install, client/build checks, built-artifact smoke, Convex tests, Chromium dependency installation, and Playwright on pushes and pull requests.
- Repository CI carries no live service or deployment secrets, performs no deployment, and cannot replace Vercel Preview or live Convex release verification.
- Playwright is not deployment rewrite verification.

## Static Vercel architecture

```text
Vercel build
  -> bun install --frozen-lockfile
  -> bun run build
  -> dist

Request
  -> existing dist file? serve it
  -> otherwise rewrite to /index.html
  -> React Router resolves the preserved URL
```

The Vercel project Root Directory is the repository root. Public `VITE_*` values belong in Vercel. Clerk issuer/webhook values belong in Convex. Local artifact smoke parses the built index to discover current hashed JS/CSS and Workbox output, validates manifest/worker/icons as real non-HTML files, and byte-compares 12 direct routes with the index shell; it does not infer platform precedence from hard-coded filenames.

Production release has separate trust and rollback boundaries:

```text
Repository CI (no deployment credentials)
  -> verify client, Convex, build, and deterministic Chromium gates
  -> Convex release owner deploys exact SHA to selected production deployment
  -> verify audit SHA, function metadata, schema/indexes, webhook, and auth
  -> Vercel Preview points VITE_CONVEX_URL at that deployment
  -> frontend release owner promotes Vercel Production
```

A backend-first rollout must preserve compatibility with the currently live frontend; otherwise the release needs a coordinated window or a backward-compatible intermediate backend. Vercel promotion/rollback never deploys or rolls back Convex.

## Decisions

### ADR: Server-authoritative identity and data

Clerk transports identity and Convex enforces current-user, admin, and ownership rules. Consequence: no browser-supplied authorization IDs and no client domain store.

### ADR: Generated typed hooks

Feature hooks mirror generated Convex arguments/returns and preserve `Id<>`. Consequence: route/form adapters remain explicit and loading/error state is visible.

### ADR: Atomic legacy import

Untrusted browser data is normalized and imported in one bounded, idempotent, authenticated transaction. Consequence: rollback and recovery are preserved.

### ADR: Denormalized template summaries with selected detail

Template browsing reads capped public-safe metadata pages with stored category/item counts; it never expands every template's children or exposes creator document IDs. One selected public-or-owned template loads bounded canonical children through a separate query, while account export uses a separate exhaustive owner-only full-detail pager. Count accuracy is maintained by create/import/seed paths plus a bounded migration, and global analytics uses a maintained aggregate. Consequence: public browsing remains predictable, private ownership stays server-authoritative, old rows can be repaired without N+1 summary reads, and account backup remains complete.

### ADR: Shell-only PWA

The worker caches only static shell assets and requires connectivity for Convex. Consequence: installability without stale tenant caches or false offline-edit promises.

### ADR: Static Vercel SPA

Vercel publishes `dist` and rewrites unmatched paths after filesystem handling. Consequence: direct React Router refreshes work while assets remain real files.

## Environment-dependent follow-up

Convex code generation, live authenticated routes, Clerk JWT behavior, and signed webhook delivery require real development/deployment configuration. A Vercel Preview is required for final platform cache/content-type/static-order verification.

_Last updated: July 14, 2026_
