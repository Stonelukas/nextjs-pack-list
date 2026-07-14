# Current Work Session — Vite React Rewrite

## Main goal

Complete the in-place migration to a Vite/React Router client with Clerk-backed Convex data, deterministic tests, shell-only PWA behavior, and a static Vercel SPA contract. Preserve existing uncommitted task work and create no commit, push, worktree, or deployment until the complete rewrite is reviewed.

## Task status

- [x] Task 1: replace the removed framework toolchain with Vite, strict TypeScript references, Vitest, and Bun scripts.
- [x] Task 2: establish Convex identity, domain errors, ownership traversal, and admin primitives.
- [x] Task 3: harden public Convex operations and the signed Clerk webhook.
- [x] Task 4: compose Clerk, Clerk-backed Convex, theme, React Router, errors, and monitoring.
- [x] Task 5: create typed list/template/preferences/admin hooks and presentation-only navigation state.
- [x] Task 6: migrate retained feature routes and remove the compatibility facade.
- [x] Task 7: add bounded, idempotent, atomic legacy `pack-list-storage` import with exact recovery.
- [x] Task 8: apply the Route Ledger design and accessibility system.
- [x] Task 9: add generated PWA assets, prompt updates, and honest offline write protection.
- [x] Task 10: complete deterministic Vitest, Convex, and desktop/mobile Chromium Playwright infrastructure.
- [x] Task 11: add the static Vercel SPA contract, regenerate the Bun lockfile, replace stale operator documentation, and complete local deployment-equivalent verification.

## Startup/Auth UI Recovery Task 4 state

- [x] `ConvexUserBootstrap` is a state-only provider that always renders router children, preserves the StrictMode-safe `userId:attempt`/`startedForUser` once-only pattern, ignores stale attempt completions, and bounds signed-in Convex authentication/provisioning at `ACCOUNT_BOOTSTRAP_TIMEOUT_MS = 15_000`.
- [x] `RequireAuth` owns authentication loading/unavailable, signed-out redirect, account bootstrap loading, and account bootstrap retry UI in that order while preserving pathname, search, and hash in the return URL.
- [x] `/templates` retains its route and lazy module but now sits below `RequireConfiguredRuntime`, so an unconfigured public runtime renders a provider-independent service-unavailable card.
- [x] `RootLayout` mounts authenticated navigation, migration, and mobile shells only after auth is ready/signed-in and account bootstrap is ready; public main content remains mounted otherwise.
- [x] `PreferenceThemeSync` does not start its Convex preference query until account bootstrap is ready and retains the last server theme across bootstrap transitions so unsaved local selections are not overwritten.
- [x] The exact focused Task 4 suite passes 37 tests across five files; strict typecheck, 52 route/provider regression tests including the real unconfigured `AppProviders` `/templates` recovery path and all seven real-route journeys, touched-file ESLint, and touched-file whitespace checks pass.

## Startup/Auth UI Recovery Task 5 state

- [x] `/` renders the provider-independent `PublicHomePage` in every non-dashboard state, with one clear heading, direct `/sign-up` and `/sign-in` links, practical feature headings, and a packing-checklist example instead of operational labels. The landing owns the single `<main id="main-content">` landmark and focus target; `RootLayout` renders it directly instead of nesting it inside the shared public main.
- [x] `HomePage` is a thin adapter over `useAuthReadiness()` and `useConvexUserBootstrap()`; `ListOverview` mounts only for ready signed-in authentication plus ready account bootstrap. Loading, unavailable, bootstrap-pending, and bootstrap-error states retain the complete landing and expose the applicable retry.
- [x] `AuthLayout` owns authentication loading/unavailable panels inside the responsive two-column Route Ledger auth shell, redirects already-authenticated visitors to a validated internal `redirect_url` or `/lists`, and mounts Clerk only when readiness is ready. Explicit Clerk appearance styles provide readable provider controls, Graphite tokens, Geist typography, and the shared themed `UserProfile`; provider localization removes stale `pack-list` branding.
- [x] The unreferenced `src/app/routes/auth-routes.tsx` duplicate was removed after an exact source search found no imports or references.
- [x] The real unconfigured `AppProviders` + exported `appRoutes` `/` composition regression first failed with the expected two main landmarks, then passed after the layout fix. The Task 5 landing/auth/router/provider suite passes 33 tests across five files; the Task 4 root/provider regression suite passes 53 tests across seven files; strict typecheck, touched-file ESLint, and `git diff --check` pass.
- [x] Repeated unconfigured desktop `1440x1000` and mobile `390x844` browser smoke found exactly one route-owned main, the complete landing and retry action, preserved skip-link/focused-heading behavior, no application header, root error, console error/warning, or horizontal overflow.

## Task 11 implementation state

- [x] Repository-root `vercel.json` uses framework `vite`, frozen Bun install, `bun run build`, `dist`, and one unmatched-path rewrite to `/index.html`.
- [x] `bun.lock` was regenerated from `package.json`; obsolete framework packages are no longer resolved as installed dependencies.
- [x] Final review removed the unreferenced legacy-named `public/next.svg` and unused starter/source SVGs after the broader completion request permitted cleanup; generated favicon/PWA assets remain the deployed icon contract.
- [x] README, deployment, Clerk, production, environment, project instructions, knowledge-base, active top-level references, and legacy guides were rewritten or clearly archived.
- [x] Mandatory Task Master references describe current routes, hooks, server authorization, legacy import, PWA boundary, tests, monitoring, environment ownership, and Vercel behavior.
- [x] `.github/workflows/ci.yml` pins Bun 1.3.11 and enforces frozen install, client/build, built-artifact smoke, Convex, Chromium-install, and Playwright gates without live-service or deployment secrets.
- [x] Deployment instructions now discover and fetch a real hashed asset plus generated Workbox file locally and in Vercel Preview, with content-type and index-shell comparisons.
- [x] Production procedure now has an explicit matching-revision Convex release stage, sequencing, post-deploy checks, and separate rollback ownership.
- [x] Imported `.taskmaster/CLAUDE.md` treats SDD rewrite tasks as separate from the legacy Task Master database and forbids conflicting state changes.
- [x] Task 11's frozen-install, quality, production-preview, stale-claim, link/path, JSON, Playwright, and diff verification passed at its completion point.

## Task 12 verification state

- [x] A repository-clean frozen Bun install completed with 812 packages and no installed or resolved Next.js packages.
- [x] Active JSON/YAML, Markdown links, CLAUDE imports, HTML references, removed-framework searches, ignored-error searches, secret scans, production test-boundary scans, PWA no-data-cache scans, and `git diff --check` pass.
- [x] ESLint exits zero with 20 non-blocking warnings.
- [x] Direct Vite/PWA build, ordinary artifact smoke, static-asset/deep-route preview checks, actual service-worker offline navigation, and all 37 Playwright journeys pass with zero failures, skips, or retries.
- [x] Final verification repaired the StrictMode account-bootstrap deadlock, unresolved-Clerk route loading ownership, authenticated test-provider parity, immediate unsaved theme selection, template preview reset, route announcements, CSV formula neutralization lint, and stale Auto-save journey claims.
- [x] The current complete client gate passes all 385 tests across 89 files. Vitest uses one file worker plus bounded 10-second Testing Library waits and a 15-second per-test ceiling so lazy-route transforms remain deterministic on constrained runners without retries.
- [x] Startup/Auth UI Recovery Task 6 restored a provider-safe one-line header, grouped soft-active desktop/mobile navigation, immediate quick starts, accessible packing-list stat tiles, adjacent collection controls, and friendly shared card/tokens. Its exact focused gate passes 27 tests across eight files; provider/root/route regressions pass 52 tests across six files; strict typecheck, touched-file ESLint, and the production build pass. Deterministic desktop, 390×844, dark, dialog, and real unconfigured-header smoke found no horizontal overflow, undersized primary controls, unexpected network traffic, console errors, or page errors. Focused empty-account desktop and 390×844 smoke confirmed readable 0, 0, 0, and 0% tiles before the collection empty state with no horizontal overflow, console errors, or page errors.
- [x] Startup/Auth UI Recovery Task 7 removed the 41 residual first-line `use client` directives without changing retained source behavior. `src/app/task-6-source-contracts.test.ts` now permanently rejects top-level Next/RSC client-boundary markers in non-test Vite source; its five-test focused gate, strict typecheck, zero-match scan, snapshot-only deletion check, and complete client suite pass.
- [x] Startup/Auth UI Recovery Task 8 makes shared render helpers delegate to the real `AppProviders` composition with an explicit memory router and controllable configured/unconfigured runtime result. Tests prove runtime configuration, theme, Clerk/Convex, auth readiness, bootstrap, preference theme sync, and router ordering; `unavailableAuth()` supplies only unresolved external input while the real ten-second readiness provider projects unavailable.
- [x] Task 8 Playwright coverage keeps the full friendly landing visible through unresolved auth, clock-controlled ten-second timeout, and Retry; verifies nested sign-in/up splats and the signed-in dashboard hierarchy; and proves landing/auth/dashboard have no horizontal overflow at 390×844 with primary targets at least 44px. The complete deterministic suite now runs 37 desktop/mobile Chromium journeys with two workers, zero retries, zero skips, and zero failures.
- [x] Task 8 artifact smoke dynamically discovers the built hashed JavaScript, CSS, and `workbox-*.js`; validates non-HTML bodies/content types plus manifest, worker, and icons; and proves 12 direct routes return the byte-identical index shell while static files win over fallback.
- [x] The authoritative list contracts remove public order injection, append on the server, omit no-op same-category moves, support explicit weight clearing, preflight imports at 50 categories/200 items per category/1,000 total items/1,000,000 bytes, clean linked item moderation records, and keep load-more reachable for filtered empty loaded pages.
- [x] Template contracts expose public-safe DTOs without `createdBy`, make anonymous private/missing lookups indistinguishable, preflight public quota before bounded sequential source reads, backfill old summary counts, maintain `templateStats`, and provide exhaustive owner-only full-detail export pages.
- [x] Admin details use ordinary lists plus canonical templates; user deletion runs through scheduled bounded jobs; analytics uses aggregate/index reads; moderation is cursor-paginated with generated preview unions and duplicate-submit guards; unresolved preferences block editing/save/export.
- [x] Final-review remediation makes `users.getAllUsers` pagination mandatory, gives the admin table explicit 50-record load-more behavior, identifies search as loaded-page filtering, keeps deletion disabled until the current-user query resolves, prevents current-administrator deletion in Convex and the UI, and preserves successful edit values across immediate table- or details-originated reopen.
- [x] Final-review cleanup makes Vite config tests independent of ignored local env files, archives the root legacy PRD, rewrites shipped robots guidance for the static SPA, removes confirmed unreferenced Next-era source/assets, and aligns the package graph with the documented runtime-only Sentry contract. Live Convex CLI verification later proved `VITE_CONVEX_SITE_URL` is intentional CLI-managed HTTP-actions metadata; builds now validate it without exposing it through runtime configuration.
- [x] The current complete Convex gate passes 144 tests across eight files, including 24 focused administrator authorization/pagination/analytics tests and the deployable-module-path check. Strict typecheck passes. Full ESLint passes with 0 errors and 20 existing warnings. The current Vite/PWA production build generates a 69-entry shell-only precache and retains the existing >500 kB advisory.
- [x] Final Task 12 local review is approved with no remaining findings. Frozen install, complete client/Convex gates, built-artifact smoke, 37 zero-retry Playwright journeys, production-preview shell/service-worker/offline navigation, JSON/YAML/stale-claim/lockfile/whitespace checks, and untracked-file whitespace checks pass on the final working tree.
- [x] The post-review Graphite visual pass replaces the generic embedded-auth presentation with a responsive Route Ledger composition, explicit high-contrast Clerk styling/localization, a themed account profile, Geist/IBM Plex Mono typography, flatter cards, smaller page headings, neutral graphite surfaces, and restrained rust/amber accents. Authenticated auth-route redirects preserve safe protected deep links. The resulting client gate passes 385 tests and the production Vite/PWA build.
- [x] Vercel Preview compatibility permits automatically injected `VITE_VERCEL_*` system metadata without adding it to runtime configuration; unknown application-owned `VITE_*` names remain rejected. The exact `VITE_VERCEL_GIT_REPO_ID` failure is covered, and a production build with injected Vercel metadata passes.
- [x] Production Vercel and matching-revision Convex functions were deployed to `packlistapp.com` / `hidden-lynx-410` after a strict dry run. Live production Clerk authentication resolves as a Convex user, and production administrator access was verified through `users.getCurrentAccess`.
- [x] The backend-owned merged official catalog was deployed and synchronized idempotently: production contains 9 public official templates, 39 categories, 264 items, and a consistent `templateStats` aggregate; a second run inserted zero records.
- [x] Template-library cards now render stored official icons (or a neutral custom-template fallback), reserve consistent metadata regions, fill grid rows, and pin Preview/Use actions to the bottom. Focused card/library tests, strict typecheck, ESLint, production build, and artifact smoke pass.
- [x] The final commit-candidate E2E gate exposed two simultaneous `DOMContentLoaded` navigation timeouts while the application had already rendered its loading fallback. `gotoApp` now resolves at document commit and retains the authoritative injected-scenario/runtime-boundary checks; the repeated two-worker regression passes 6/6 and the full two-worker, zero-retry suite passes 37/37.
- [x] PR review remediation controls settings tabs from the validated `section` search parameter so same-route migration links update an already-mounted page, and restricts real-time dashboard list activity to `lists.by_template(false)` so legacy template rows cannot inflate metrics. Focused client, Convex, and strict typecheck regressions pass.
- [x] Follow-up PR review remediation resets the mounted administrator edit form whenever its authoritative user prop changes and controls both Radix preference selects, preventing a previous user's unsaved values from being displayed or submitted under a newly selected user ID. The focused edit/reconciliation suite and complete 385-test client/build gate pass.
- [x] List-detail PR review remediation keys the detail subtree by the authoritative list ID, so direct navigation between cached `/lists/:id` records remounts list-derived dialogs, drafts, guards, and completion refs instead of carrying state across lists. The regression fails without the identity key and the complete 385-test client/build gate passes with it.
- [x] Tag-registry PR review remediation exhausts the bounded all-list export and both visible template summary feeds before computing tag totals, preventing labels and usage counts beyond the first page from disappearing. The focused pagination regression and complete 385-test client/build gate pass.
- [x] Public-template PR review remediation fetches visibility before requiring a provisioned Convex user, so a signed-in Clerk identity whose user row is still being created can read the same public detail as an anonymous visitor. Private detail still requires and checks the persisted owner. The focused regression and complete 144-test Convex gate pass.
- [x] Clerk/template follow-up remediation maps webhook email from `primary_email_address_id` before falling back to Clerk array order, and keeps public-template application disabled while signed-in account bootstrap is loading or failed. The preview exposes setup status and a retry action; Convex application starts only after bootstrap is ready. Focused regressions, the complete 385-test client/build gate, and the 144-test Convex gate pass.
- [ ] Automatic production Clerk `user.updated` webhook delivery still requires repair/verification. Administrator metadata is correct in Clerk and Convex, but the confirmed promotion required one trusted internal synchronization after the event did not arrive.

## Active routes

`/`, `/sign-in/*`, `/sign-up/*`, `/lists`, `/lists/new`, `/lists/:id`, `/lists/:id/edit`, `/templates`, `/categories`, `/tags`, `/settings`, `/admin`, and the client `*` not-found route.

## Trust and persistence boundaries

- Clerk identities use `identity.subject` and resolve through `users.by_clerk_id`.
- Public Convex handlers derive current user, role, and ownership from server context.
- Only an explicit `admin` role passes `requireAdmin`; missing legacy roles are regular users.
- Browser route guards are loading/navigation boundaries, not security enforcement.
- Convex is authoritative for domain data. Zustand and browser storage persist presentation only.
- `pack-list-storage` is untrusted, read-only migration input until an explicit post-success cleanup.
- The service worker precaches the static shell and icons only. It does not cache Convex, queue mutations, or use Background Sync.

## Testing and deployment boundaries

- `bun run check` runs lint, strict typecheck, client Vitest, and production build.
- `bun run test:convex` is a separate server-domain gate.
- `bun run test:e2e` is a separate deterministic Chromium gate; first local use needs `bun run test:e2e:install`, and fresh Linux CI needs `bun run test:e2e:install:ci`.
- `.github/workflows/ci.yml` runs all required repository gates on pushes, pull requests, and manual dispatch; it has no deployment credentials and deploys nothing.
- Playwright intentionally uses a flagged Vite e2e development server and cannot prove Vercel rewrite/static-file precedence.
- Local production preview validates `dist`; a Vercel Preview deployment remains the final platform check.
- Convex production deployment is a separate approved release stage that must match the frontend Git revision before Vercel promotion.

## Known blockers

- All validated local review findings are fixed and the complete local gate/review sequence is green; remaining blockers require approved external Convex, Clerk, and Vercel environments.
- `bunx convex codegen` requires a real `CONVEX_DEPLOYMENT`; `convex/_generated/api.d.ts` is minimally aligned until that environment is available.
- Live authenticated routes require matching Clerk and Convex development configuration.
- Live JWT and webhook verification require the Clerk JWT template/application ID `convex`, exact HTTPS `CLERK_JWT_ISSUER_DOMAIN`, and `CLERK_WEBHOOK_SECRET` in Convex.
- Do not invent or commit deployment identifiers, deploy keys, Clerk credentials, or webhook secrets.

## Task Master note

The checked-in Task Master database remains on the legacy `master` tag and its task 11 is an unrelated completed historical task. The rewrite is tracked by this session document and `.superpowers/sdd/task-*-brief.md` / reports. Do not mutate the unrelated Task Master record or manually edit `.taskmaster/tasks/tasks.json`. The imported `.taskmaster/CLAUDE.md` repeats this override and exposes only package-qualified read-only legacy inspection unless a future active session explicitly authorizes database writes.

## Task 11 verification results

- A clean temporary `bun install --frozen-lockfile` installed 812 packages and installed no `next`, `@next/*`, or `styled-jsx`; package records for those modules are absent from `bun.lock`. The old ignored repository `node_modules` may still contain orphan directories because Bun does not prune unrelated existing folders, so clean-install evidence is authoritative.
- At Task 11 completion, `bun run check` passed: ESLint reported 0 errors and 18 recorded warnings, strict typecheck passed, 218 client tests passed across 70 files, and the production build succeeded. The current Task 12 gate has since been reopened by new domain contract tests.
- The build emits the existing >500 kB chunk advisory and generates a 74-entry shell-only precache, `manifest.webmanifest`, `sw.js`, and `workbox-2fbc6a65.js`.
- `bun run test:convex` passes 73 tests across seven files.
- `bun run test:e2e` passes all 34 desktop/mobile Chromium cases.
- Production preview serves hashed assets, manifest, worker, Workbox, robots, favicon, Apple icon, and all PWA PNGs as their real bytes/content types. Direct Clerk/list/feature/admin/unknown routes return the exact SPA shell.
- Exact `vercel.json` structure, parsing of all 18 existing tracked JSON files, 44 local links/imports across 21 active Markdown files, 20 required operational paths, final active stale-claim scans, and `git diff --check` pass.
- At Task 11 completion, `.github/workflows/ci.yml` parsed as YAML, contained the pinned Bun install plus all five required install/check/test commands, and the same gates passed locally. The current Task 12 exceptions are listed above.
- Production preview revalidated a discovered hashed CSS asset and the generated Workbox file as non-HTML with correct content types, plus eight static files and ten direct deep routes.
- No deployment was performed. Vercel Preview behavior and live Clerk/Convex runtime/webhook behavior remain environment/platform checks.

## Historical records

`docs/superpowers/specs/`, `docs/superpowers/plans/`, `.superpowers/sdd/`, and the archive-labeled root `prd.txt` preserve migration/product requirements and execution evidence. Removed-framework references in those files are archival context and are excluded from active-operator stale-claim cleanup.

_Last updated: July 14, 2026_
