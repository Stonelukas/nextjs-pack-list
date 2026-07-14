# Finish Vite React Rewrite

## Goal
Finish the in-place Next.js-to-Vite/React Router rewrite as a reproducible, reviewable static SPA: close the confirmed correctness and scalability defects, remove active migration residue, align documentation with the final behavior, and pass every local exact-revision verification gate that does not require deployment credentials or external platform mutation.

## TODO
- [x] Make the Vite E2E-boundary tests deterministic while preserving production rejection of non-allowlisted `VITE_*` variables, then rerun the focused config suite.
- [x] Prevent an administrator from deleting their own Convex user record at the server boundary, reflect that restriction in the admin UI, and add backend/client regression tests.
- [x] Make repeated admin user edits reopen with the latest successfully submitted values and add a real edit-flow regression test.
- [x] Require bounded pagination for the admin users query, migrate the table to paginated loading with explicit search scope, and add backend/client pagination tests.
- [x] Reconcile the intended rewrite file inventory and remove or archive active Next-era/public residue without resetting, cleaning, or discarding unrelated working-tree changes.
- [x] Remove the unused Sentry Vite build plugin unless source-map upload is intentionally configured, and align package/deployment documentation with the retained runtime-only Sentry contract.
- [x] Update the required Task Master reference documents for any implementation, API, troubleshooting, architecture, and verification changes made during completion.
- [x] Run focused tests after each change, then run `bun run check`, `bun run test:convex`, `bun run test:build-smoke`, `bun run test:e2e`, JSON/YAML/path/stale-claim checks, and `git diff --check`.
- [x] Rebuild and exercise the production preview for real static assets, direct nested routes, service-worker shell behavior, and visible browser errors; record external Convex codegen, Vercel Preview, Clerk JWT, and webhook checks as explicit blockers if their approved environments are unavailable.
- [x] Perform a final read-only review of the complete index/worktree/untracked candidate and leave the branch uncommitted unless the user separately authorizes the implementation commit.

## Progress Notes
- 2026-07-14: Completed a repository-wide migration audit using independent completeness and correctness/security reviewers plus a local baseline gate. Tasks 1–11 are substantially implemented; Task 12 remains open.
- 2026-07-14: `bun run check` initially failed in `src/test/e2e-boundary-config.test.ts` (2 failed, 364 passed) because CLI-generated `VITE_CONVEX_SITE_URL` metadata was not yet represented in the build-env contract and preempted the intended test assertions.
- 2026-07-14: Confirmed a P1 self-deletion lockout in `convex/users.ts`, stale repeated-edit state in `src/components/admin/users/user-management.tsx`, and an unbounded `getAllUsers` production call in `src/components/admin/users/user-table.tsx`.
- 2026-07-14: Rejected the proposed legacy-storage finding: the historical migration plan and active session explicitly require an archive marker and separately confirmed post-success source cleanup; Convex remains authoritative.
- 2026-07-14: Made Vite config contract tests use an explicit public-env fixture and moved the e2e production-boundary rejection ahead of build-env loading. Later live Convex CLI verification showed `VITE_CONVEX_SITE_URL` is intentional generated HTTP-actions metadata rather than obsolete; build validation now accepts its validated public shape without adding it to runtime configuration.
- 2026-07-14: Added server-enforced administrator self-deletion denial, a disabled current-account delete action, mandatory paginated user reads, 50-user incremental loading, loaded-page search disclosure, and successful-edit state propagation. Focused verification passes 22 Convex tests and 8 client tests.
- 2026-07-14: Removed only confirmed unreferenced migration residue: legacy-named/starter SVGs, a source backup, obsolete constants/dev/performance/error utilities, and their dead performance-hook chain. Rewrote shipped `robots.txt`, archive-labeled `prd.txt`, and retained the active monitoring documentation.
- 2026-07-14: Removed unused `@sentry/vite-plugin` through Bun; runtime `@sentry/react` remains and existing no-source-map-upload documentation now matches the dependency graph. Strict typecheck and ESLint pass (0 errors, 20 existing warnings).
- 2026-07-14: Updated all mandatory Task Master references for admin self-deletion, user pagination/search scope, edit-state behavior, cleanup, and the runtime-only Sentry contract.
- 2026-07-14: Final read-only review found two remaining admin UI races. Added red regressions, then cached successful edits by user ID for both table/details paths and kept deletion disabled while current-user identity is unresolved. The focused admin client suite passes 9 tests.
- 2026-07-14: Follow-up review rejected a permanent optimistic override because Convex is authoritative. `updateUser` now returns the exact updated record; table and details handlers retain it only while query data is older and discard it on equal/newer `updatedAt`. Focused verification passes 23 Convex admin tests and 10 admin client tests.
- 2026-07-14: No commit, push, deployment, worktree, Task Master database mutation, or destructive Git cleanup is authorized by this plan.

## Final notes and learnings
- The local Vite/React Router rewrite candidate is complete and final review is approved. Security fixes, bounded admin user pagination, authoritative edit reconciliation, test-harness determinism, active stale-artifact cleanup, and required documentation updates shipped in the working tree.
- Final evidence: frozen Bun install with no changes; `bun run check` with 371 client tests, strict typecheck, 0-error ESLint, and production build; 141 Convex tests; built-artifact smoke over hashed assets/Workbox/7 static files/12 deep routes; 37 zero-retry Chromium journeys; production-preview service-worker/offline shell navigation; JSON/YAML, stale implementation, lockfile, staged/unstaged/untracked whitespace, and final read-only review approval.
- External codegen/live-service/platform checks remain blocked on approved Convex, Clerk, and Vercel environments. The branch intentionally remains uncommitted and undeployed.
