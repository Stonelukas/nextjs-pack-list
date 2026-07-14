# Troubleshooting

## First checks

```bash
bun install --frozen-lockfile
bun run check
bun run test:convex
```

Use `bun run test:e2e:install` once for a local Chromium download or `bun run test:e2e:install:ci` on a fresh Linux CI runner before `bun run test:e2e`.

## Missing browser environment

**Expected public behavior:** `/` still renders the complete friendly landing with create/sign-in links and an **Authentication is unavailable right now** recovery panel. The unconfigured branch must not construct Clerk or Convex, render a blank page, or trip the root error boundary. Sign-in/up URLs render the centered unavailable panel from `AuthLayout` rather than mounting Clerk.

**Fix for connected features:** Set `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_CONVEX_URL`. Optional `VITE_APP_URL` falls back to `window.location.origin`; optional `VITE_SENTRY_DSN` disables Sentry when blank. Retry after correcting the runtime configuration.

`bunx convex dev` may add `VITE_CONVEX_SITE_URL`. Do not delete or rename it: current builds validate its HTTPS/localhost shape but exclude it from `RuntimeEnv`. It is public metadata for the `.convex.site` HTTP-actions/webhook origin, not a secret or a required Vercel variable. If `.env.local` contains two `VITE_CONVEX_URL` entries and one points to `localhost:5173`, rename the localhost entry to `VITE_APP_URL` so it cannot override the real `.convex.cloud` deployment.

Every `VITE_*` value is public. Do not use a `VITE_` prefix for webhook secrets, issuer values, or deploy keys.

If Vercel Preview fails with `VITE_VERCEL_GIT_REPO_ID is not an allowlisted public variable`, the platform is automatically exposing reserved Vite metadata. Current builds accept and ignore the `VITE_VERCEL_*` namespace while retaining strict rejection for unknown application variables. Do not create, rename, or copy these Vercel metadata variables manually.

## Unconfigured or loading startup crashes after a header change

`RootLayout` intentionally mounts `Header` for configured and unconfigured runtime. The outer `Header` may call only `useAuthReadiness()` plus provider-independent presentation/navigation state. Move `useRoleBasedAccess()`, Clerk `UserButton`, and any Convex-querying permission/navigation logic into the child rendered only when auth is `ready` and signed in. A unit mock that makes those hooks throw in loading/unavailable branches plus the real unconfigured `AppProviders`/`appRoutes` regression should remain green.

If the header renders but the account target is smaller than 44 pixels, keep a `min-h-11 min-w-11` wrapper with descendant button minimums around Clerk `UserButton`; do not shrink the wordmark, sheet trigger, theme control, or mobile destinations.

If a shared route test passes with hand-built providers but production startup fails, remove the duplicate test composition. `renderAppRoute()` and `renderWithProviders()` must pass their memory router and configured/unconfigured runtime result to the real `AppProviders`; production `App` passes the browser router. Keep `unavailableAuth()` as unresolved `isLoaded=false` input and use the real provider timeout to observe unavailable.

## Readiness timeout browser test waits ten real seconds or blanks the landing

Install Playwright Clock before navigation, wait for the complete friendly landing and connecting notice, then fast-forward exactly 10,000ms. The real `AuthReadinessProvider` should show **Authentication is unavailable right now** without removing the hero, feature headings, or checklist. Clicking **Retry authentication** must return to connecting. Do not encode unavailable in Clerk mocks or replace the landing with a test-only page.

## Packing-list filters lose pagination after the friendly dashboard composition

Keep status/search/sort filtering and `hasMore` independent from visible results. `My packing lists` is the stable page h1; the selected status belongs in the collection h2. Render `Load more lists` from `hasMore` after both the grid and empty state so a filtered empty loaded page can still reach older matches. Keep quick starts immediately after the page header and the search/sort/view/import/create controls inside the collection section.

## Convex code generation has no deployment

**Error:** `No CONVEX_DEPLOYMENT set`.

The checkout is not linked to a real Convex deployment. Configure the intended development project through the normal Convex setup/login flow, then run `bunx convex codegen`. Do not invent or commit a deployment identifier or key.

This blocker does not invalidate deterministic `convex-test` coverage, but it prevents regenerated deployment types and live authenticated/webhook verification.

## Vercel frontend expects a different Convex revision

**Symptoms:** Authenticated queries fail with missing-function, argument-validation, schema, or authorization errors immediately after frontend promotion.

**Fix:** Compare the Vercel source SHA with the Convex deployment audit message `route-ledger:<git-sha>`, confirm `VITE_CONVEX_URL` names that deployment, and inspect `bunx convex function-spec --prod` plus schema/index status in the dashboard. Deploy the matching backend revision before frontend promotion only when it remains compatible with the currently live frontend; otherwise use a coordinated or backward-compatible rollout.

A Vercel rollback does not change Convex. The named Convex release owner must redeploy the known-good backend revision and follow the approved schema/data restoration plan when required.

## Clerk user remains unauthenticated in Convex

Check:

1. Clerk's JWT template/application ID is `convex`.
2. `CLERK_JWT_ISSUER_DOMAIN` is the exact HTTPS issuer in the target Convex deployment.
3. The browser publishable key belongs to the same Clerk application.
4. `VITE_CONVEX_URL` points to the intended Convex deployment.

`convex/auth.config.js` rejects a missing, malformed, or non-HTTPS issuer.

## Clerk user is not synchronized

- Webhook URL must be `https://<deployment>.convex.site/clerk-webhook`.
- Subscribe to `user.created`, `user.updated`, and `user.deleted`.
- Store `CLERK_WEBHOOK_SECRET` in Convex.
- Inspect Clerk delivery logs and Convex HTTP action logs.
- Do not send the webhook to the Vercel origin.

## Signed-in application remains on `Preparing your account`

`ConvexUserBootstrap` is state-only and must always render router children. It preserves the `userId:attempt` plus `startedForUser` once-only pattern under StrictMode, starts one 15-second timeout only while a ready signed-in identity is waiting for Convex authentication or `users.ensureCurrentUser`, and ignores completions whose attempt key is no longer active. Clear the timeout on ready, error, retry, and unmount. After the bound, `RequireAuth` must replace the loading state with **Account setup could not finish** and wire **Retry account setup** to `bootstrap.retry()`; protected children must remain unmounted throughout loading/error states.

If public/home content disappears during bootstrap, confirm the provider still always renders children and that `HomePage` renders `PublicHomePage` for every state except ready signed-in auth plus ready bootstrap. Account bootstrap error must keep the landing mounted with **Retry account setup**, while `RootLayout` withholds only the authenticated navigation/migration/mobile shell.

## Landing exposes two main landmarks

`PublicHomePage` owns `<main id="main-content" tabIndex={-1}>` because the Task 5 landing contract requires a main element. `RootLayout` must render the non-authenticated `/` outlet directly rather than wrapping it in another main. Keep the shared RootLayout main for other public paths and route-loading feedback, and keep the authenticated dashboard inside `NavigationLayout`'s main.

## Unsaved theme selection immediately reverts

`PreferenceThemeSync` should not call `usePreferences()` until bootstrap status is `ready`. Keep the last observed Convex theme ref in the outer component so temporary bootstrap transitions do not reset it. Hydrate only a changed server preference; otherwise a local Appearance draft is overwritten by the unchanged stored preference before the user can save.

## Public templates show a provider or configuration crash

`/templates` must remain under `RequireConfiguredRuntime` with its existing URL and lazy module. Unconfigured state should render the provider-independent **Service is unavailable** card without constructing Clerk/Convex or exposing configuration values. Other public routes remain available through the unconfigured provider branch.

## Public template library is empty after a fresh Convex deployment

Convex deploys functions, schema, and indexes; it does not copy development data into production. Confirm the intended deployment first, then inspect `templates`, `templateCategories`, and `templateItems`. After the matching backend revision is deployed, run the trusted idempotent catalog synchronization:

```bash
bunx convex run templates:seedTemplates '{}' --prod --typecheck enable --codegen disable
```

A fresh catalog produces 9 public official templates, 39 categories, and 264 items. A second run must report `inserted: 0` and `skipped: 9`. Do not restore defaults in browser storage or import development document IDs into production.

## Administrator content is forbidden or flashes

`RequireAdmin` must keep descendants unmounted while `api.users.getCurrentAccess` is unresolved and mount only for an explicit `admin` role. Email checks or browser metadata are not fallbacks. Convex administrative handlers must still call `requireAdmin`.

If the users table stops after 50 rows, keep `getAllUsers` on mandatory `paginationOpts` and restore the `usePaginatedQuery` load-more control; do not add an unbounded `collect()` fallback. Search intentionally filters loaded rows and says so in the UI. Keep deletion disabled until `getCurrentUser` resolves and for the matching account afterward; Convex must still reject matching administrator/target IDs inside `deleteUser`. If an immediate second edit shows old values, use the authoritative `updateUser` result while the reactive row is older, then discard that override when table/details data has an equal or newer `updatedAt`.

## Plain string IDs or client Clerk arguments cause type errors

Use hooks under `src/features/**/hooks` and generated Convex contracts. Preserve `Id<"lists">`, `Id<"categories">`, `Id<"items">`, and `Id<"templates">`. Do not restore `use-convex-store`, recreate `usePackListStore`, or pass `clerkId`/`userId` for authorization.

## Vercel direct routes return 404

Check that:

- project Root Directory is the repository root;
- output directory is `dist`;
- `vercel.json` is committed and dashboard overrides match it;
- the rewrite is `/(.*)` to `/index.html`;
- the rewrite is not a redirect and no competing `routes` array exists.

Verify `/sign-in/factor-two`, `/lists/example`, `/lists/example/edit`, `/templates`, `/settings`, `/admin`, and an unknown path in a Preview deployment.

## Static assets return the HTML shell

Existing files must be served before rewrites. Confirm the requested filename exists in `dist` and that no dashboard/custom route configuration competes with `vercel.json`.

Run `bun run test:build-smoke`. It discovers current hashed JS/CSS and `workbox-*.js` instead of relying on an old hash, rejects HTML/empty static responses and wrong content types, validates manifest/worker/icons, and byte-compares 12 deep routes with `dist/index.html`. Check robots separately in deployment verification. Do not add a negative-lookahead until a platform behavior change is demonstrated.

## Wrong Vercel output or build command

The exact contract is:

```json
{"$schema":"https://openapi.vercel.sh/vercel.json","framework":"vite","installCommand":"bun install --frozen-lockfile","buildCommand":"bun run build","outputDirectory":"dist","rewrites":[{"source":"/(.*)","destination":"/index.html"}]}
```

Vercel needs devDependencies for TypeScript and Vite. Do not use `bun install --production`.

## Generated PWA files are missing

Run `bun run build`, then inspect `dist/manifest.webmanifest`, `dist/sw.js`, generated `dist/workbox-*.js`, and copied icons. `public/manifest.json` is intentionally absent because `vite-plugin-pwa` owns the manifest.

## PWA appears to support offline writes

This is a defect. `workbox.runtimeCaching` must remain empty and no Background Sync may be configured. Durable mutations must stop before a Convex call while offline. Copy should say cached pages may be readable but changes require reconnecting.

## Updated worker activates without consent

Keep `registerType: "prompt"`, `skipWaiting: false`, and `clientsClaim: false`. Call `updateServiceWorker(true)` only after the user selects **Update now**.

## Legacy import source changed or disappeared

The migration compares the current exact raw `pack-list-storage` value with the preview snapshot. Changed data refreshes the preview; missing or inaccessible storage preserves cached recovery but blocks import/cleanup. Reconfirm after reviewing the current source.

Automatic import limits are conservative. Oversized data must be downloaded as exact recovery and handled through manual support; do not split the import into client batches because that loses transaction-wide rollback/idempotency.

## Playwright browser is missing

Local:

```bash
bun run test:e2e:install
bun run test:e2e
```

Fresh Linux CI:

```bash
bun run test:e2e:install:ci
bun run test:e2e
```

Playwright uses deterministic desktop/mobile Chromium projects with two workers and zero retries. The current suite contains 37 first-attempt journeys. If the full run exposes stale friendly-UI assertions such as `Completed packing lists` or `Search route manifests…`, update the journey and its matching Markdown to the current stable `My packing lists` h1, status collection h2, and `Search packing lists…` label; do not mask navigation/loading contention with retries or a blanket timeout increase. Do not claim non-Chromium coverage.

## GitHub Actions CI is missing a release gate

The committed `.github/workflows/ci.yml` must run, in order, `bun install --frozen-lockfile`, `bun run check`, `bun run test:convex`, `bun run test:e2e:install:ci`, and `bun run test:e2e`. It pins Bun 1.3.11 and needs no live application or deployment secrets. If a pull request does not show this workflow, check repository Actions permissions and branch-protection required checks rather than moving credentials into the workflow or skipping a gate.

## Production build accidentally contains test adapters

E2E aliases require a Vite development server, mode `e2e`, `isPreview !== true`, and server-only `ROUTE_LEDGER_E2E=1`. Build or preview with e2e mode must throw. The flag must not have a `VITE_` prefix or be exposed with `define`.

## Final verification fails on bounded list/template contract tests

If client item-form/quantity tests or Convex list-contract tests fail, do not weaken or delete them. Use `convex/lib/validation.ts`, keep list create/update free of legacy template/publication inputs, and query `by_user_template(userId, false)` before paginating. `getListSummaries` is bounded metadata; `getListExportPage` is paginated nested account data; neither may expose storage-only `isTemplate`/`isPublic`. Submit edit fields and destination through `updateItemAndMove`, and send quantity deltas through `adjustItemQuantity`.

If duplicate-submit tests fail, do not rely only on React pending state: two submit events can run before the disabled control renders. Keep a synchronous `useRef` guard around one-shot create/edit/apply/save handlers and clear it in `finally`. Do not serialize quantity stepper clicks, because each click is a separate atomic delta.

If template tests fail, do not restore `getPublicTemplates` or expand children per summary. Use capped `getPublicTemplateSummaries` and authenticated `getOwnedTemplateSummaries`, persist `categoryCount`/`itemCount` on every create/import/seed write, run the bounded metadata backfill for older rows, expose the next summary page in the library, and load children only through `getTemplate({ templateId })` before preview/apply. Public DTOs must omit `createdBy`; ownership comes from `isOwned`. Anonymous private and missing IDs must both return `NOT_FOUND`. Check public quota before source fanout and enforce the 50-category, 200-items-per-category, 1,000-total-item, 50-summary-page, and 20-public-templates-per-owner limits before the first write.

If account export omits templates or never enables, verify settings uses `useOwnedTemplateExportData`, not summary rows. The hook must request every five-record `getOwnedTemplateExportPage` page and return `undefined` until exhausted. Preference loading is also part of export readiness; unresolved preferences must keep preference/theme controls, Save, and Export disabled rather than exposing editable defaults.

If item edits rewrite sibling timestamps, inspect `getUpdateItemAndMoveInput`: same-category edits must omit destination fields. If a cleared weight reappears, ensure the adapter uses an own-property check and sends `weight: null`, while Convex maps null to an undefined patch. Public add/update contracts must not accept order; only exact-set reorder mutations own sibling order.

If list import fails with a platform transaction error instead of `VALIDATION`, keep the shared preflight in `convex/lib/import_limits.ts` and `src/lib/export-utils.ts`: 50 categories, 200 items per category, 1,000 total items, and 1,000,000 UTF-8 bytes before the first insert.

If webhook deletion tests still find the user, deletion is now scheduled and resumable. Use fake timers and drain `finishAllScheduledFunctions` before asserting final cleanup. Production callers should treat `{ success: true, pending: true }` as accepted cleanup, not immediate physical deletion.

If moderation rows beyond 50 are unreachable, use `paginationOpts` plus `usePaginatedQuery` and keep the load-more control visible. Repeated history entries indicate the client confirmation guard or pending dialog lock was removed.

When strict typecheck reports missing template API members, minimally align `convex/_generated/api.d.ts` only if `CONVEX_DEPLOYMENT` still blocks code generation, then regenerate normally once the real environment is configured. A direct `vite build` does not replace the `tsc -b && vite build` contract.

## `bun run check` passed but release verification is incomplete

`bun run check` does not include `bun run test:convex` or `bun run test:e2e`. Deployment work also requires frozen-install proof, production-preview static-asset/nested-route checks, JSON validation, stale-claim scans, link/path checks, and a Vercel Preview platform check.

## Source-contract test reports `use client`

The active browser application is Vite, not a Next/RSC module graph. Remove only the reported top-level directive line from the non-test source file; do not reorder imports or otherwise reformat the module. Confirm with `bun run test -- src/app/task-6-source-contracts.test.ts`, strict typecheck, and the repository `rg` scan before broader verification.

## Lockfile still appears to mention `next`

Optional peer metadata from unrelated packages may name several supported frameworks without installing them. Prove cleanup with a clean frozen install and dependency listing. Installed `next`, `@next/*`, or `styled-jsx` packages are not expected.

## Sentry events expose sensitive data

`src/lib/monitoring/sentry.ts` must redact authorization values, cookies, tokens, email addresses, user IDs, mutation argument containers, and legacy payloads. Expected domain errors must not be reported as unexpected failures. No Sentry source-map upload plugin is currently configured.

_Last updated: July 14, 2026_
