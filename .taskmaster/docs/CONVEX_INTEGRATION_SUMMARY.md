# Convex Integration Summary

## Identity and providers

The browser uses `@clerk/clerk-react` only in the configured runtime branch. `src/app/providers.tsx` places `ThemeProvider` and `RuntimeConfigurationProvider` outside the branch; configured state mounts Clerk, `ConvexProviderWithClerk`, `AuthReadinessProvider`, and the state-only `ConvexUserBootstrap`, while unconfigured state mounts `UnavailableAuthReadinessProvider` plus the router without constructing Clerk or Convex. `AppProviders` receives its router explicitly: production supplies the browser router and deterministic render helpers supply memory routers to the same component. Unresolved Clerk input becomes unavailable only through the real ten-second readiness provider and Retry creates a fresh provider attempt. Bootstrap always renders children, calls `users.ensureCurrentUser` once per `userId:attempt`, preserves `startedForUser` through React StrictMode replay, ignores stale completions, and converts 15 seconds of pending signed-in Convex authentication/provisioning into a retryable error. `RequireAuth` owns protected loading/unavailable/retry UI, and `/templates` separately requires configured runtime. `RootLayout` always mounts the shared header, but its outer branch consumes only auth readiness; `useRoleBasedAccess`, Clerk account UI, and any Convex-querying permission path mount only for ready signed-in auth. The public `HomePage` reads readiness/bootstrap only as a state adapter: it keeps the provider-independent landing mounted until both signed-in auth and account bootstrap are ready, then mounts `ListOverview`. The landing owns the non-authenticated `/` route's single `main-content` landmark; RootLayout renders it directly, retains its shared main for other public paths/loading, and hands the ready dashboard landmark to `NavigationLayout`. `AuthLayout` owns auth readiness panels and does not mount Clerk forms while loading or unavailable.

Required public browser values:

```env
VITE_CLERK_PUBLISHABLE_KEY=
VITE_CONVEX_URL=
# Optional local Convex CLI HTTP-actions metadata; not RuntimeEnv
VITE_CONVEX_SITE_URL=https://your-deployment.convex.site
```

Convex auth configuration requires:

```env
CLERK_JWT_ISSUER_DOMAIN=https://your-exact-clerk-issuer.example
```

The Clerk JWT template/application ID is `convex`.

## Server-derived authorization

- `requireIdentity` obtains the Clerk identity.
- `requireCurrentUser` maps `identity.subject` through `users.by_clerk_id`.
- `requireAdmin` accepts only an explicit stored `admin` role.
- `requireOwnedList`, `requireOwnedCategory`, and `requireOwnedItem` traverse normalized ownership.
- Public browser functions do not accept Clerk IDs or roles for authorization.
- Batch reorder/move/import functions validate complete relationships before writes.

Stable `ConvexError.data.code` values are `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, and `OFFLINE` at the client mapping boundary.

## Typed client integration

Current hooks:

- `useLists`
- `useListExportData`
- `useList`
- `useListActions`
- `useTemplates`
- `useTemplateDetail`
- `useOwnedTemplateExportData`
- `usePreferences`
- `useAdminAccess`

They use generated `Id<>`, `FunctionArgs`, and `FunctionReturnType` contracts, preserve query loading, and expose mapped async action state. The removed `use-convex-store` and `usePackListStore` APIs must not be restored. Retained client modules are ordinary Vite modules without Next/RSC `use client` directives; the source-contract test enforces that marker boundary across non-test source.

## Authoritative list and item contracts

`convex/lib/validation.ts` centralizes trimmed 200-character names, 5,000-character optional text, literal priorities, positive integer quantities, finite non-negative weights, and bounded trimmed tags. List/category/item create/update/import paths call it after ownership checks and before writes. `createList` and `updateList` have no legacy template/publication inputs; new ordinary lists remain private in storage.

`getListSummaries` is capped at 50 records and returns newest-first metadata plus category/item/packed counts without nested documents. `getList` remains the one-record detail query. `getListExportPage` is the separately paginated, oldest-first full nested path used for deterministic account export and category aggregation. Public list outputs omit `isTemplate`/`isPublic`, and collection queries use `by_user_template(userId, false)` so legacy template rows are excluded rather than silently reclassified.

Public category/item adds append order server-side; category updates cannot set order; exact-set reorder mutations are the only sibling-order API. `updateItemAndMove` validates fields, destination ownership, and destination index before one atomic write sequence, while the client omits destination fields for same-category edits. `weight: null` explicitly clears a stored weight; omitted weight remains unchanged. `adjustItemQuantity` reads the current item and applies the integer delta within the transaction. Direct item deletion cleans linked moderation/history records. Client submission handlers use synchronous in-flight guards where one durable action must not dispatch twice.

`importList` and the browser Zod parser share a pre-write ceiling of 50 categories, 200 items per category, 1,000 total items, and 1,000,000 UTF-8 JSON bytes. Limit failures return `VALIDATION` before the list insert.

## Authoritative persistence

Convex stores normalized users, lists, categories, items, templates, template categories/items, shares, preferences, legacy import markers, moderation, analytics inputs, and system settings. Browser persistence is presentation-only except for read-only access to the historical legacy source.

## Clerk webhook

`convex/http.ts` hosts:

```text
POST https://<deployment>.convex.site/clerk-webhook
```

It verifies Svix headers and the raw body with `CLERK_WEBHOOK_SECRET`, then dispatches:

- `user.created` / `user.updated` -> `internal.users.upsertFromClerk`
- `user.deleted` -> `internal.users.deleteFromClerk`

Only verified `public_metadata.role: "admin"` maps to administrator access. The Vercel origin does not host this endpoint.

## Legacy import

`convex/migrations.ts` provides current-user `getLegacyImportStatus` and `importLegacyData` APIs. The client reads only `pack-list-storage`, normalizes supported data, preserves exact recovery text, and submits a shared deterministic fingerprint. Convex recomputes it, enforces bounded transaction limits, deduplicates by user/source/fingerprint, and writes completion last.

## Bounded template contracts

`templates.getPublicTemplateSummaries` and `templates.getOwnedTemplateSummaries` paginate explicit public-safe metadata at no more than 50 records, return stored category/item counts, carry `isOwned`, and omit `createdBy`. `templates.getTemplate` makes anonymous private and missing IDs indistinguishable, then loads no more than 50 categories, 200 items per category, or 1,000 items total from canonical template tables. Public quota validation runs before sequential bounded source reads. `convex/lib/official_templates.ts` defines nine backend-owned predefined templates; `internal.templates.seedTemplates` inserts missing official names idempotently and starts bounded metadata/stat repair. A fresh catalog contains 39 categories and 264 items. Create, legacy import, and official seed paths persist counts; `internal.templates.backfillTemplateMetadata` pages through older rows, repairs counts, and rebuilds `templateStats`. Applying a template revalidates the same bounded detail before creating the list.

The typed template hooks merge public and owned summary pages by branded template ID and load detail only for the selected record. `useOwnedTemplateExportData` exhausts authenticated five-record full-detail pages before account export becomes ready. Browser code never supplies a Clerk identifier or owner.

## Bounded administration and deletion

Admin user details query ordinary lists via `by_user_template(userId, false)` and canonical templates via `templates.by_creator`. User deletion is accepted as a resumable `userDeletionJobs` workflow; scheduled internal batches remove template/list descendants, linked moderation/history, shares, preferences/imports, moderator references, the user, and finally the job.

The administrator user directory requires cursor pagination and is consumed in 50-record browser pages; there is no public full-table branch. `deleteUser` rejects a target equal to the authenticated administrator before a deletion job is created. The UI disables deletion until current-user identity resolves and mirrors the self-delete rule afterward. `updateUser` returns the authoritative record; a per-user client bridge survives only while table/details query data has an older `updatedAt`, then is discarded.

Template analytics reads the singleton `templateStats` total/usage aggregate and `templates.by_usage` descending `take(10)`. Moderation queue reads use validated cursor pagination with status/content-type indexes; generated discriminated DTOs keep list/template preview fields distinct. The browser load-more control and ref-backed pending guard prevent hidden queue rows and duplicate history writes.

Settings treats unresolved preferences as blocking state and waits for exhaustive list plus owner-template export pages before producing account JSON.

## Offline boundary

Convex remains network-authoritative. The generated service worker does not cache Convex responses or queue mutations. Shared client action state maps offline attempts before calling Convex.

## Testing

```bash
bun run test:convex
```

This suite verifies actual server authorization, webhook parsing/signatures, scheduled deletion, preferences, tenant isolation, validation, bounded reads, atomic item writes, import limits, template quotas/privacy/backfill/aggregates, administration pagination/self-deletion denial/authoritative edit returns, moderation pagination, migration behavior, and deployable Convex module paths. The full Convex gate passes 143 tests across eight files. The full single-worker client gate passes 383 tests across 88 files, including production `AppProviders` parity for configured/unconfigured memory-router rendering, unresolved-auth input ownership, the no-Next/RSC-marker source contract, provider-safe unconfigured header composition, grouped navigation, accessible dashboard stat tiles, exhaustive template export, blocked unresolved preferences, filtered list/user pagination, list-detail identity remounting, authoritative admin edit reconciliation, canonical moderation previews, duplicate-submit guards, and the Graphite Clerk/auth contract. Playwright separately passes 37 deterministic desktop/mobile Chromium journeys with two workers and zero retries, including clock-controlled readiness timeout/Retry plus 390×844 landing/auth/dashboard geometry. `.github/workflows/ci.yml` runs the frozen install, client/build gate, built-artifact smoke, this Convex suite, and deterministic Chromium journeys without production credentials or deployment steps.

## Deployment ownership

Vercel receives public `VITE_*` values and builds the static client. Convex receives `CLERK_JWT_ISSUER_DOMAIN` and `CLERK_WEBHOOK_SECRET`. `CONVEX_DEPLOYMENT` is local linkage; a target-scoped `CONVEX_DEPLOY_KEY` belongs only in the approved backend release stage and is not available to repository test CI or the Vercel build.

The Convex release owner deploys the exact frontend source revision separately with `bunx convex deploy --typecheck enable --message "route-ledger:<git-sha>"`, then verifies the audit SHA, function metadata, schema/index readiness, signed Clerk webhook delivery, and authenticated access. Vercel's `VITE_CONVEX_URL` must point at that verified deployment. Convex and Vercel have separate rollback owners.

## Known blockers

Focused and full client/Convex domain gates, strict typecheck, ESLint (0 errors, 20 existing warnings), 37 zero-retry Playwright journeys, built-artifact smoke, diff checks, and the production build with documented public test values are green. `bunx convex codegen` and live authenticated/webhook verification still require a configured real Convex deployment; the checked-in API declaration is minimally aligned until then. Do not invent or commit deployment credentials.

_Last updated: July 14, 2026_
