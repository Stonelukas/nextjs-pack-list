# Feature Implementations

This catalog describes the active Route Ledger implementation. Historical migration plans and Task Master records are not current runtime instructions.

## Vite application platform

**Status:** Complete

**Files:** `index.html`, `src/main.tsx`, `vite.config.ts`, `tsconfig*.json`, `vitest.config.ts`, `package.json`, `bun.lock`.

- Vite 7 and React 19 produce a static `dist` client.
- Strict TypeScript project references run before the production build.
- Bun is the application package manager and `bun.lock` is the only application lockfile.
- Tailwind's Vite plugin and `components.json` with `rsc: false` support the retained UI.
- Retained Vite modules contain no top-level `use client` directives. `src/app/task-6-source-contracts.test.ts` scans all non-test JavaScript/TypeScript source so Next/RSC client-boundary markers cannot be reintroduced.

## Provider, router, error, and monitoring shell

**Status:** Complete

**Files:** `src/app/providers.tsx`, `src/providers/convex-provider.tsx`, `src/app/routes.tsx`, `src/app/router.tsx`, `src/app/layouts/`, `src/app/guards/`, `src/app/errors/`, `src/lib/monitoring/`.

- Provider order is `RootErrorBoundary -> ThemeProvider -> RuntimeConfigurationProvider`; configured runtime continues through `ClerkProvider -> ConvexProviderWithClerk -> AuthReadinessProvider -> ConvexUserBootstrap -> PreferenceThemeSync + RouterProvider`, while unconfigured runtime uses `UnavailableAuthReadinessProvider -> RouterProvider` without constructing Clerk or Convex.
- `ConvexUserBootstrap` always renders children and publishes `idle | loading | ready | error`, a mapped error, and `retry()`. It creates the local Convex user once per `userId:attempt`, remains StrictMode-safe, ignores stale completions, and bounds signed-in Convex authentication/provisioning at 15 seconds.
- Lazy routes cover the landing page, Clerk splats, authenticated feature routes, administration, and client not-found recovery. `/templates` keeps its public URL and lazy module under `RequireConfiguredRuntime` so unconfigured startup does not touch connected data providers.
- `RequireAuth` owns auth loading/unavailable, signed-out redirects with complete return URLs, and account bootstrap loading/error recovery. `RequireAdmin` waits for `users.getCurrentAccess`.
- `RootLayout` always mounts the shared header, but mounts navigation, migration, and mobile authenticated shells only for ready signed-in auth plus ready account bootstrap. `Header` reads `useAuthReadiness()` before branching; only its ready signed-in child mounts `useRoleBasedAccess()`, Clerk `UserButton`, or provider-dependent navigation. Other public routes use RootLayout's shared `<main id="main-content">`; the non-authenticated `/` route renders its route-owned landing main directly, while route-loading feedback retains the shared focus target.
- `HomePage` adapts auth/bootstrap state into the provider-independent `PublicHomePage` and mounts `ListOverview` only at the same ready boundary. The complete landing stays visible during auth loading/unavailability and account setup loading/error, with retry actions at the failed boundary, and owns the route's single `main-content` landmark.
- `AuthLayout` places auth loading/unavailable recovery and Clerk forms in one responsive Route Ledger shell. Signed-in visitors leave auth routes through a validated internal `redirect_url` or `/lists`. `clerkAppearance` uses explicit style objects rather than fragile utility precedence, and `ClerkProvider` supplies Route Ledger localization; the same appearance themes `UserProfile` in Settings.
- `PreferenceThemeSync` mounts its Convex preference query only after bootstrap is ready and preserves the last observed server theme across temporary bootstrap transitions.
- Expected domain failures remain user-facing; unexpected failures are eligible for Sentry after redaction.
- Vercel Analytics, Speed Insights, and Web Vitals mount globally.

## Convex-authoritative domain data and authorization

**Status:** Complete, including bounded list and template contracts

**Files:** `convex/lib/auth.ts`, `convex/lib/authorization.ts`, `convex/lib/errors.ts`, `convex/lists.ts`, `convex/templates.ts`, `convex/users.ts`, `convex/analytics.ts`, `convex/moderation.ts`, `convex/settings.ts`, `convex/schema.ts`.

- Clerk `identity.subject` resolves through `users.by_clerk_id`.
- Public operations never accept a Clerk ID, role, or email for authorization.
- List, category, and item ownership follows normalized parent relationships.
- Administration requires an explicit server-stored `admin` role.
- Reorder, move, import, template application, and deletion paths validate complete relationships before writes.
- Stable `ConvexError.data.code` values support client error mapping.
- Semantic list/item validation, paginated list summaries, bounded template summaries/detail, publication quotas, atomic item edit/move, and quantity deltas are implemented and covered by the green Convex gate.

## Signed Clerk synchronization

**Status:** Complete

**Files:** `convex/auth.config.js`, `convex/http.ts`, `convex/users.ts`.

- The Convex auth provider requires an exact HTTPS issuer and application ID `convex`.
- `/clerk-webhook` verifies Svix headers and raw-body signature in Convex.
- `user.created`, `user.updated`, and `user.deleted` dispatch to internal mutations.
- Only verified `public_metadata.role: "admin"` grants administrator access.

## Typed feature hooks

**Status:** Complete

**Files:** `src/features/lists/hooks/`, `src/features/templates/hooks/`, `src/features/settings/hooks/`, `src/features/admin/hooks/`, `src/features/shared/async-action-state.ts`.

- Hooks use generated `Id<>`, `FunctionArgs`, and `FunctionReturnType` contracts.
- Query `undefined` remains an explicit loading state.
- Mutation state provides overlap-safe pending, mapped errors, reset, and optional transactional rethrow.
- The removed `use-convex-store` compatibility facade must not be restored.

## Retained feature routes

**Status:** Complete

**Files:** `src/features/home/`, `src/features/auth/`, `src/features/lists/`, `src/features/templates/`, `src/features/settings/`, `src/features/admin/`, `src/components/`.

- The public home explains the product with direct React Router account links, practical trip-preparation features, and a useful example checklist without importing Clerk or Convex.
- List CRUD/detail/edit, category/item workflows, templates, tags, settings, export/import/print, and administration use typed hooks.
- Complete item creation and nested list import use atomic Convex mutations.
- Dialog-owned sequences request rethrow and close/reset only after success.
- Navigation and breadcrumbs derive from React Router. The header uses one-line branding; desktop navigation groups Lists, Organize, Recent, and Settings; mobile destinations retain the same permissions and 44-pixel targets with soft active surfaces.
- `ListOverview` keeps its typed summary hook, URL status filter, search/sort/view state, import/create actions, grid/empty states, and pagination. Its composition is `My packing lists` → quick-start templates → accessible definition-list stat tiles → adjacent collection toolbar → cards/load-more, including load-more when the loaded filtered page is empty.
- `ListCard` preserves its overlay link, IDs, progress, tags, actions, errors, and delete dialog while using shared friendly card elevation and the presentation label `Completed`.
- `src/store/navigation-store.ts` persists presentation preferences only.

## One-time legacy browser-data import

**Status:** Complete

**Files:** `src/features/legacy-migration/`, `convex/lib/legacy_import.ts`, `convex/migrations.ts`, `convex/schema.ts`.

- Reads only browser key `pack-list-storage` as source `zustand:pack-list-storage:v1`.
- Preserves exact raw recovery data and per-record rejection information.
- Shares deterministic fingerprint and transaction-cost limits between client and Convex.
- Imports normalized lists, templates, and supported preferences in one authenticated transaction.
- Uses user/source/fingerprint idempotency and explicit post-success cleanup.
- Supports normalized `templateCategories` while retaining older name-only template compatibility.

## Route Ledger design and accessibility

**Status:** Complete

**Files:** `src/styles/globals.css`, `src/components/layout/`, `src/components/feedback/`, `src/components/data-visualization/`, retained route/components.

- Warm-neutral light tokens, graphite dark surfaces, restrained rust/amber interaction accents, preserved semantic status pairs, self-hosted Geist typography, and IBM Plex Mono utility labels form the product system.
- Shared cards use the old shadcn-like `0.625rem` radius and flat bordered surfaces. Page headers use a smaller Geist hierarchy and suppress the decorative route spine by default; routes can opt into it explicitly.
- Shared page/section/empty/chart primitives establish semantic hierarchy.
- Mobile controls, dialogs, reduced motion, forced colors, print manifests, named controls, and chart table alternatives have regression coverage.

## Installable PWA with honest offline behavior

**Status:** Complete

**Files:** `vite.config.ts`, `src/hooks/use-online-status.ts`, `src/components/feedback/offline-banner.tsx`, `src/components/pwa/`, `src/features/shared/async-action-state.ts`, `public/` icons.

- `vite-plugin-pwa` generates `manifest.webmanifest`, `sw.js`, and Workbox output.
- Prompt registration keeps updates user-controlled.
- The worker precaches compiled shell files, fonts, and explicit icons only.
- `runtimeCaching` is empty; no Convex caching, mutation queue, or Background Sync exists.
- Durable actions are disabled or rejected before invocation while offline; drafts remain editable.

## Authoritative bounded list and item contracts

**Status:** Complete

**Files:** `convex/lib/validation.ts`, `convex/lists.ts`, `convex/schema.ts`, `src/features/lists/hooks/use-lists.ts`, `src/features/lists/hooks/use-list-actions.ts`, `src/features/lists/item-mutation-model.ts`, `src/components/items/`, `src/components/categories/category-section.tsx`.

- Shared semantic validation trims required names and enforces 200-character names, 5,000-character optional text, literal priorities, positive integer quantities, finite non-negative weights, and at most 50 non-empty trimmed tags of 100 characters each.
- List, category, item, and nested list-import create/update paths reuse the same stable `VALIDATION` boundary before writes.
- `createList` and `updateList` accept no legacy list-template/publication flags; ordinary lists remain private in storage, and those compatibility fields are omitted from public list query results.
- `getListSummaries` paginates at no more than 50 ordinary lists and returns newest-first metadata plus category/item/packed counts without nested documents; `getListExportPage` is the separate bounded, oldest-first full-detail path for deterministic account export/category aggregation. Both use the `by_user_template` index so legacy template rows cannot leak into list surfaces or account list exports.
- Public category/item creation appends server-side, category updates cannot alter order, and exact-set reorder mutations are the only public ordering path. `updateItemAndMove` validates all field and destination inputs before one atomic write sequence, omits the move path for same-category form edits, and accepts `weight: null` to clear stored weight explicitly. `adjustItemQuantity` derives the next positive integer from the current server value so concurrent increments do not send stale absolutes.
- Nested list imports share client/server limits of 50 categories, 200 items per category, 1,000 total items, and 1,000,000 UTF-8 JSON bytes; oversized input returns `VALIDATION` before the first insert. Direct item deletion removes linked moderation and history rows in the same transaction.
- The dashboard, sidebar, and list index consume summaries; the index keeps load-more reachable even when the currently loaded subset has no filtered match. Full account/category consumers use the paginated export hook. Client forms and rows call atomic mutations directly, and category/create/edit/template submissions use synchronous in-flight guards to reject duplicate dispatch before React pending state renders.

## Authoritative bounded template contracts

**Status:** Complete

**Files:** `convex/templates.ts`, `convex/migrations.ts`, `convex/lib/official_templates.ts`, `convex/lib/validation.ts`, `convex/schema.ts`, `src/features/templates/hooks/use-templates.ts`, `src/components/templates/`, `src/test/mocks/runtime.ts`.

- `getPublicTemplateSummaries` and `getOwnedTemplateSummaries` paginate at no more than 50 records and return explicit public-safe metadata plus denormalized `categoryCount`/`itemCount` without nested children or `createdBy` identifiers. Ownership is represented by `isOwned` on the authorized owned feed.
- `getTemplate({ templateId })` is the separate bounded detail path. Anonymous private and missing IDs both return `NOT_FOUND`; authenticated private access resolves the current user before the protected lookup. Canonical children come from `templateCategories` and `templateItems`, with bounded compatibility for older name-only item records.
- User-created and imported templates enforce the same field normalization as lists, at most 50 categories, 200 items per category, 1,000 total items, and 20 public templates per owner. Public quota validation runs before source child reads, and source items are accumulated sequentially only to the aggregate limit.
- Create, apply, legacy import, and official seed paths use canonical template tables and persist summary counts. A bounded internal metadata backfill repairs older count-less rows and rebuilds global template aggregates. Applying a template revalidates bounded detail before creating the destination list.
- The internal official seed owns one merged nine-template catalog: the primary Next.js definitions win for overlapping Beach Vacation, Business Trip, and Camping Adventure records; Weekend Getaway and International Travel supplement the seven primary definitions. A fresh deployment receives 9 templates, 39 categories, and 264 items. Reruns match official names and insert no duplicates.
- `useTemplates` merges paginated public and owned summaries without duplicate owned-public records and the library exposes an explicit load-more action. `useTemplateDetail` loads children only for the selected branded template ID. `useOwnedTemplateExportData` exhausts the owner-scoped full-detail export pages before settings enables account export. Preview, apply, and export flows never send a Clerk ID.
- Template cards fill their grid row, reserve consistent title/tag/metric regions, and pin actions to the bottom. Stored official icons render in a bounded decorative tile; icon-less user templates receive a neutral package fallback without changing accessible names or actions.

## Bounded administration, moderation, and account safety

**Status:** Complete

**Files:** `convex/users.ts`, `convex/lib/deletion.ts`, `convex/lib/template_stats.ts`, `convex/analytics.ts`, `convex/moderation.ts`, `src/components/admin/`, `src/features/settings/settings-page.tsx`.

- Admin user details count ordinary lists through `by_user_template(userId, false)`, canonical templates through `templates.by_creator`, and return recent-list DTOs without storage-only flags.
- `getAllUsers` requires cursor pagination. The admin table loads 50 users at a time, labels search as filtering the loaded rows, and exposes an explicit load-more state instead of collecting the full table.
- `deleteUser` rejects the authenticated administrator's own user ID before creating a deletion job. Destructive row actions remain disabled until current-user identity resolves and stay disabled for the matching account. `updateUser` returns the authoritative updated record; the client uses it only while a table/details query row has an older `updatedAt`, then discards the override when Convex catches up or returns a newer value.
- Clerk and admin deletion create a resumable `userDeletionJobs` record and remove template/list descendants, linked moderation/history, shares, preferences, imports, and the user through scheduled batches rather than one unbounded mutation.
- Template totals and usage live in the bounded `templateStats` aggregate; popular templates use `by_usage` descending with `take(10)`, so the analytics dashboard no longer multiplies full template-table scans.
- Real-time dashboard list activity also uses `lists.by_template(false)`, preserving ordinary-list-only metrics when migrated deployments still contain legacy template rows.
- Moderation queues use validated cursor pagination and status/content-type indexes. The client exposes load-more, derives preview item types from the generated queue return, renders separate list/template details, and guards confirmation against repeated submission while pending.
- Settings waits for preferences, full list export pages, and full owner-template export pages before enabling save/export. Unresolved preferences never fall back to editable defaults, and account backups contain nested template categories/items across every page.
- Settings controls its active tab from the validated `section` search parameter, updates that parameter on tab changes, and reacts when a same-route migration link changes only the URL search string.

## Deterministic testing

**Status:** Infrastructure complete; client and Convex gates green

**Files:** `src/test/`, `e2e/`, `playwright.config.ts`, `vitest.config.ts`, Convex `*.test.ts` files, `.github/workflows/ci.yml`.

- Client Vitest mounts the real route tree and replaces only external Clerk/Convex/PWA/Vercel edges. Shared render helpers delegate to the real `AppProviders` with an explicit memory router and configurable runtime result, covering both configured and provider-independent unconfigured branches. One file worker and bounded async/test timeouts prevent resource-dependent lazy-route false failures; the current full client gate passes 381 tests across 88 files.
- `convex-test` verifies actual server authorization, webhook, migration, deletion batching, pagination, aggregate, domain behavior, and deployable module paths. The current full Convex gate passes 143 tests across eight files.
- Playwright runs 37 desktop/mobile Chromium journeys through the existing server-only flagged Vite e2e boundary with two workers and zero retries. Clock-controlled auth readiness coverage keeps the complete landing visible through the real ten-second timeout and Retry, while responsive coverage proves landing/auth/dashboard geometry and 44px primary targets at 390×844.
- Production-build contracts prevent test aliases from entering normal bundles.
- Public build validation accepts the Convex CLI-managed HTTPS `VITE_CONVEX_SITE_URL` only as non-runtime HTTP-actions metadata; unknown `VITE_*` values remain rejected.
- GitHub Actions pins Bun 1.3.11, performs a frozen install, runs `bun run check`, `bun run test:build-smoke`, and `bun run test:convex`, installs Chromium/Linux dependencies, and runs `bun run test:e2e` on pushes, pull requests, and manual dispatch.
- The deterministic CI boundary needs no real Clerk, Convex, webhook, Vercel, deploy, or Sentry secrets and deploys nothing.

## Static Vercel SPA deployment

**Status:** Complete locally; Vercel Preview remains a release-environment check

**Files:** `vercel.json`, `README.md`, `DEPLOYMENT.md`, `.env.example`, `PRODUCTION_CHECKLIST.md`.

- Vercel installs with `bun install --frozen-lockfile`, runs `bun run build`, and publishes `dist` with framework `vite`.
- One rewrite sends unmatched paths to `/index.html` without redirecting the browser URL.
- Existing `dist` assets must take precedence, including hashed assets, manifest, worker, Workbox, robots, and icons.
- Vercel receives only public `VITE_*` build values; `CLERK_JWT_ISSUER_DOMAIN` and secrets such as `CLERK_WEBHOOK_SECRET` remain configured in Convex.
- The static Vercel origin hosts no business API and no Clerk webhook.
- Release owners deploy the matching Convex backend revision separately with a Git-SHA audit message, verify function/schema/index/webhook/auth state, then promote Vercel with the matching `VITE_CONVEX_URL`.
- `scripts/smoke-built-artifact.ts` dynamically discovers the hashed JavaScript, CSS, and generated `workbox-*.js`; verifies non-HTML bodies/content types plus manifest, worker, favicon, Apple icon, and PWA icons; and proves 12 direct nested/unknown routes return the byte-identical SPA index shell while static files retain precedence. Preview deployment procedures apply the same contract on Vercel.
- Convex and Vercel have separate rollout and rollback ownership; repository CI deploys neither.

## Follow-up blockers

- Rerun the complete Task 12 repository gate and review before the implementation commit.
- Run Convex code generation and live backend verification after configuring `CONVEX_DEPLOYMENT`.
- Verify authenticated Clerk/Convex flows and webhook delivery with real development/deployment configuration.
- Use a Vercel Preview deployment to confirm platform cache/content-type/static-precedence behavior before production promotion.

_Last updated: July 14, 2026_
