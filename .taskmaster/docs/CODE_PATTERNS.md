# Code Patterns

## Project layout

```text
src/
├── main.tsx
├── app/                         # providers, routes, layouts, guards, boundaries
├── features/
│   ├── auth/
│   ├── lists/                   # route modules, typed hooks, pure adapters
│   ├── templates/
│   ├── settings/
│   ├── admin/
│   ├── legacy-migration/
│   └── shared/
├── components/
├── providers/
├── store/navigation-store.ts    # presentation only
└── lib/

convex/
├── lib/                         # auth, authorization, errors, validation
├── lists.ts / templates.ts
├── users.ts / settings.ts
├── migrations.ts / http.ts
└── schema.ts
```

## Vite source module contract

Do not add top-level `"use client"` or `'use client'` directives. They are Next/RSC client-boundary markers, not Vite requirements. `src/app/task-6-source-contracts.test.ts` recursively scans retained non-test JavaScript/TypeScript source and rejects either quote style, an optional semicolon, and surrounding horizontal whitespace.

## Provider composition

```tsx
<RootErrorBoundary>
  <ThemeProvider>
    <RuntimeConfigurationProvider value={runtimeConfiguration}>
      {configured ? (
        <ClerkProvider publishableKey={env.clerkPublishableKey}>
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <AuthReadinessProvider
              providerAttempt={providerAttempt}
              retry={retryProviders}
            >
              <ConvexUserBootstrap>
                <PreferenceThemeSync />
                <RouterProvider router={router} />
              </ConvexUserBootstrap>
            </AuthReadinessProvider>
          </ConvexProviderWithClerk>
        </ClerkProvider>
      ) : (
        <UnavailableAuthReadinessProvider retry={retryProviders}>
          <RouterProvider router={router} />
        </UnavailableAuthReadinessProvider>
      )}
    </RuntimeConfigurationProvider>
  </ThemeProvider>
</RootErrorBoundary>
```

Initialize Sentry before mounting React. Do not recreate identity or authorization in a parallel client provider. The bootstrap is state-only: it always renders children, calls `users.ensureCurrentUser` once per `userId:attempt`, retains `startedForUser` across StrictMode effect replay, ignores stale completions, and converts signed-in Convex authentication/provisioning that remains pending for 15 seconds into a retryable mapped error. Clear the timer on ready, error, retry, and unmount. `RequireAuth` owns all protected loading and recovery UI. `AppProviders` receives its router explicitly; production `App` supplies the browser router, while shared render helpers supply a memory router and call the same `AppProviders` rather than duplicating provider markup. Test options may provide a configured or unconfigured `RuntimeEnvResult`. Mount the preference-querying child only after bootstrap is ready, and keep the last server preference in the outer component so an unchanged Convex value cannot overwrite an unsaved local appearance draft.

## Provider-safe shared header

Keep the readiness hook in the outer component and every provider-dependent hook/control in the ready signed-in child:

```tsx
export function Header() {
  const auth = useAuthReadiness();
  return auth.status === "ready" && auth.isSignedIn
    ? <ReadySignedInHeader />
    : <PublicHeader />;
}

function ReadySignedInHeader() {
  const access = useRoleBasedAccess();
  return <HeaderFrame accountControl={<UserButton />} /* filtered items */ />;
}
```

`PublicHeader`, loading, unavailable, and unconfigured branches must not call `useRoleBasedAccess`, Clerk account hooks, or Convex-querying navigation code. `RootLayout` may therefore mount `Header` unconditionally. Keep one-line branding, direct React Router links, 44-pixel targets (including a wrapper that expands Clerk's account button), the existing mobile sheet focus behavior, and the same permission filtering in the signed-in child.

## Lazy React Router module

```tsx
{
  path: "lists/:id",
  lazy: async () => {
    const route = await import("@/features/lists/list-detail-page");
    return { Component: route.ListDetailPage };
  },
}
```

Keep Clerk components under `/sign-in/*` and `/sign-up/*`. Keep `/admin` below both `RequireAuth` and `RequireAdmin`. Put only connected public data routes such as `/templates` below `RequireConfiguredRuntime`; configured state renders the lazy child and unconfigured state renders provider-independent recovery without changing the URL or lazy module path.

`RequireAuth` evaluates states in this order: auth loading, auth unavailable, ready signed-out redirect, bootstrap idle/loading, bootstrap error, then protected children. Preserve `pathname + search + hash` before encoding the sign-in return URL. `RootLayout` uses the same auth/bootstrap contexts and mounts authenticated navigation, migration, and mobile shells only when both boundaries are ready.

## Public-first home and auth surfaces

Keep `PublicHomePage` provider-independent. It accepts only presentation state and retry callbacks, uses `Link` for exact `/sign-up` and `/sign-in` navigation, and never imports Clerk or Convex:

```typescript
interface PublicHomePageProps {
  authStatus: "loading" | "ready" | "unavailable";
  accountStatus?: "idle" | "loading" | "error";
  onRetryAuth?(): void;
  onRetryAccount?(): void;
}
```

`HomePage` is the only adapter over `useAuthReadiness()` and `useConvexUserBootstrap()`. Mount `ListOverview` only when auth is ready/signed-in and bootstrap is ready; render the complete landing for every other state, including account failure, and pass retry ownership to the failed boundary. `PublicHomePage` must own `<main id="main-content" tabIndex={-1}>`; when the non-authenticated pathname is `/`, `RootLayout` renders the outlet directly so the composed page has exactly one main landmark. Keep `RootLayout`'s shared main for navigation loading and every other public pathname, and keep the landing copy focused on trip preparation and a useful packing/checklist metaphor rather than provider details or operational labels.

`AuthLayout` owns the responsive first-party auth composition plus loading/unavailable panels. Sign-in/up pages mount Clerk directly inside it. If auth is already signed in, redirect only to a single-slash internal `redirect_url` that is not another auth route; otherwise use `/lists`. `ClerkProvider` owns Route Ledger localization and the shared `clerkAppearance`. Use explicit Clerk style objects for provider text, inputs, buttons, and account navigation because Clerk's generated CSS can outrank utility-class strings. Pass the same appearance to `UserProfile` so account management does not become a light vendor island inside the Graphite shell.

## Friendly packing workspace composition

Keep `ListOverview`'s hook/data/action behavior separate from presentation. The composition order is:

```text
PageHeader("My packing lists", spine="none")
  -> QuickStartTemplates
  -> <dl aria-label="Packing list statistics"> plain headline values
  -> collection Section
       -> search/sort/view/import/create toolbar
       -> existing grid or empty state
       -> existing load-more control
```

Stat tiles are not charts: use text tokens for labels/values, no trend or distribution language, no categorical/status colors, and proportional Geist numerals. Preserve the filtered-empty `hasMore` control. Group sidebar links under Lists, Organize, Recent, and Settings while retaining exact query matching and permissions; active links use the restrained accent surface. Shared cards are flat bordered surfaces with the shared `0.625rem` radius, while semantic statuses remain icon-plus-label with reserved colors.

## Typed Convex query hook

```typescript
export function useList(listId: Id<"lists"> | null | undefined) {
  const list = useQuery(api.lists.getList, listId ? { listId } : "skip");
  return { list, loading: Boolean(listId) && list === undefined };
}
```

Preserve query `undefined`; do not turn loading into an empty collection.

## Bounded summary and full-data pagination

Use `usePaginatedQuery` with the server-capped summary contract for dashboard, sidebar, and list-index surfaces. Summary rows contain ordinary-list metadata plus `categoryCount`, `itemCount`, and `packedCount`; they never contain nested categories/items or the storage-only `isTemplate`/`isPublic` compatibility fields. Query the compound `by_user_template` index with `isTemplate === false` so hiding the flag does not accidentally promote legacy template rows into the list UI. Expose explicit `hasMore`/`loadMore` state.

Use the separate `getListExportPage`/`useListExportData` path only when complete nested account data is required, such as account export or cross-list category aggregation. It uses the same ordinary-list index, paginates oldest-first for deterministic export order, and loads all pages deliberately rather than restoring an unbounded all-lists query. Keep `getList` for one owned detail record and list routes only.

## Bounded template summary and authorized detail

Template browsing uses two capped metadata feeds and one selected-record detail query:

```typescript
const publicTemplates = usePaginatedQuery(
  api.templates.getPublicTemplateSummaries,
  {},
  { initialNumItems: 50 },
);
const ownedTemplates = usePaginatedQuery(
  api.templates.getOwnedTemplateSummaries,
  currentUser ? {} : "skip",
  { initialNumItems: 50 },
);
const detail = useQuery(
  api.templates.getTemplate,
  templateId ? { templateId } : "skip",
);
```

Summary records contain denormalized `categoryCount` and `itemCount`, explicit `isOwned`, and never load children or expose the stable `createdBy` document ID. Merge public and owned pages by branded template ID because an owner's public template appears in both feeds, and expose explicit load-more/loading-more state in the library. Resolve optional identity before detail lookup: anonymous private and missing IDs both map to `NOT_FOUND`; authenticated private access resolves the current user before protected lookup. Load canonical `templateCategories`/`templateItems` only for the selected public-or-owned template, wait for that detail before preview or apply, cap child reads before materialization, and retain name-only item grouping solely as a bounded compatibility path.

Template cards are flex columns that fill the grid cell. Give title/description, tag, and metric regions bounded minimum heights and use `mt-auto` on the footer so sparse and rich metadata align. Render the optional stored icon in a fixed decorative tile and provide an icon-only package fallback for custom templates without metadata.

Template create/import/seed writes must populate summary counts. Run public-owner quota validation immediately after ownership authorization, then read categories and items sequentially with a remaining aggregate capacity so the source cannot fan out to thousands of records before the 1,000-item check. A cursor-sized internal backfill repairs older count-less rows and rebuilds `templateStats`. Applying a template reuses the authorized bounded detail loader so malformed legacy children cannot be copied into a list.

Keep predefined templates backend-owned in `convex/lib/official_templates.ts`. `internal.templates.seedTemplates` must query official records, match by canonical name, insert only missing definitions, and return inserted/skipped totals. Never seed from browser startup or copy development database IDs into production; Convex environments do not share data. After a fresh production deployment or catalog expansion, invoke the internal seed through authenticated Convex CLI tooling and verify the public summary count.

For complete account backup, use `getOwnedTemplateExportPage` through `useOwnedTemplateExportData`. Auto-request each five-record full-detail page until status is `Exhausted`; return `undefined` while any page remains and enable the export action only after both list and template export hooks are complete.

## Shared semantic validation

`convex/lib/validation.ts` is the canonical write boundary for list/category/item create, update, atomic edit/move, duplicate metadata, nested import, template create/apply/detail validation, publication quota, and template count limits:

- required names are trimmed, non-empty, and at most 200 characters;
- optional text is at most 5,000 characters;
- priorities are `low | medium | high | essential`;
- quantities are positive integers;
- weights are finite and non-negative;
- records contain at most 50 trimmed, non-empty tags of at most 100 characters each.

Authenticate/authorize first, normalize and validate every supplied field, then write. Return stable `VALIDATION` domain errors rather than relying on UI-only checks.

Nested list JSON import shares `convex/lib/import_limits.ts` between the Zod parser and Convex mutation: at most 50 categories, 200 items per category, 1,000 total items, and 1,000,000 UTF-8 bytes. Run structural and byte preflight before the list insert so the transaction either writes the complete import or nothing.

## Typed Convex action hook

```typescript
type UpdateListInput = FunctionArgs<typeof api.lists.updateList>;

const updateList = useCallback(
  (input: UpdateListInput, options?: AsyncActionOptions) =>
    runAction(() => updateListMutation(input), options),
  [runAction, updateListMutation],
);
```

Rules:

- Preserve branded `Id<>` values end to end.
- Mirror generated argument objects.
- Never inject `clerkId`, `userId`, email, or role.
- Use `{ rethrow: true }` when a caller coordinates several writes or owns dialog close/reset behavior.
- Map errors for presentation and close only after success.
- Put a synchronous `useRef` in-flight guard at form/dialog submission boundaries. React pending state disables controls after render, but it cannot by itself stop two submit events dispatched in the same turn. Do not apply this guard to quantity steppers: each click is an intentional atomic delta.

## Server authorization

```typescript
const user = await requireCurrentUser(ctx);
const list = await requireOwnedList(ctx, args.listId);
const { category, list: categoryList } = await requireOwnedCategory(
  ctx,
  args.categoryId,
);
```

Authenticate before resource lookup. Traverse `item -> category -> list -> user`; do not trust redundant client ownership fields. Only `requireAdmin` grants administrator operations.

## Atomic batch mutation

Load and validate every referenced record before the first write. Reject missing, duplicate, foreign, or wrong-parent IDs. Then patch/insert within the one Convex transaction.

Use complete atomic mutations for item creation, list import, template application, reorder, and moves rather than client-orchestrated partial sequences.

For item editing, derive the item's current category from the loaded category collection. Omit `toCategoryId`/`toIndex` for same-category field edits so siblings keep their order and timestamps; include both fields only for a real category change. Use an own-property check for weight: omitted means unchanged, numeric means set, and `null` means clear to `undefined` in the Convex patch. Validate the owned item, every supplied field, destination ownership, and destination index before patching any item/order. Quantity steppers call `adjustItemQuantity({ itemId, delta })`; the mutation reads the current authoritative quantity and validates the resulting positive integer inside the transaction.

Public add-category/add-item mutations compute `max(order) + 1`, and category updates do not accept order. Exact-set reorder mutations are the only public path that can rewrite sibling order.

## Resumable deletion and bounded administration

Large ownership graphs must not be deleted in one mutation. Create or reuse a `userDeletionJobs` record, schedule `internal.users.continueUserDeletion`, and remove one bounded child/link batch per invocation. Delete template items, template categories, template parents, list items/categories/shares/parents, preferences/import records, user-related shares/moderator references, then the user and job. Clerk and admin deletion both start the same workflow; tests must drain scheduled functions before asserting final removal.

Reject current-administrator deletion before starting that workflow. `requireAdmin` returns the authenticated database user, so compare its `_id` with the requested target at the Convex boundary. Keep destructive browser actions disabled while `getCurrentUser` is unresolved and for the matching user after resolution; this is explanatory UX, not the security control.

Administrative user collections follow the same bounded rule as lists/templates/moderation: require `paginationOptsValidator`, return `paginate(...)`, and consume them with `usePaginatedQuery`. If search is client-side, label it as filtering only the rows loaded so far and keep the load-more control reachable.

For immediate admin edit reopen, return the updated user and exact `updatedAt` from the Convex mutation. A client override may bridge only while a reactive table/details row is older; discard it as soon as the authoritative row has an equal or newer timestamp. Never let optimistic UI state permanently supersede Convex.

Maintain template total/usage counters in the singleton `templateStats` row from every create/apply/import/seed/backfill/delete path. Analytics reads that aggregate and queries `templates.by_usage` descending with `take(10)` rather than collecting the template table in each dashboard query.

Moderation queue reads use `paginationOptsValidator`, page-size validation, `by_status` or `by_status_content_type`, and `usePaginatedQuery` with a visible load-more control. Derive client item unions from `FunctionReturnType<typeof api.moderation.getModerationQueue>`. Guard confirmation with a synchronous ref, disable confirm/cancel and dialog closure while pending, and keep mapped errors open.

## Preference-gated settings state

Do not materialize editable defaults while `usePreferences()` is unresolved. Derive the draft only after loading is false and the server returns either preferences or confirmed `null`; disable preference/theme controls and Save until then. Include preference loading in account-export readiness together with exhaustive list and owner-template export hooks.

## Signed webhook to internal mutation

```typescript
const verified = new Webhook(secret).verify(rawBody, svixHeaders);
await ctx.runMutation(internal.users.upsertFromClerk, mapClerkUser(verified.data));
```

The signed HTTP action is the trust boundary. Browser callers cannot call synchronization functions or choose roles.

## Presentation-only Zustand

Persist only navigation/display preferences. Derive active route, breadcrumbs, and history from React Router. Never mirror Convex domain collections or create an offline mutation queue in Zustand/local storage.

## Legacy import boundary

- Read only `pack-list-storage`.
- Preserve exact raw text for recovery.
- Normalize records independently and retain `{ path, reason, raw }` rejections.
- Compute the shared deterministic fingerprint from server-valid data.
- Compare the current raw value with the preview snapshot before import and cleanup.
- Model source reads as `found`, `missing`, or `inaccessible`.
- Commit through one authenticated `migrations.importLegacyData` mutation.
- Insert user-scoped completion last; offer explicit cleanup only after confirmed success.

## PWA shell-only pattern

```typescript
VitePWA({
  registerType: "prompt",
  workbox: {
    globPatterns: ["**/*.{js,css,html,woff,woff2}"],
    navigateFallback: "/index.html",
    runtimeCaching: [],
    skipWaiting: false,
    clientsClaim: false,
  },
});
```

Do not cache Convex responses, queue writes, or add Background Sync. Keep draft fields editable offline and disable only durable actions with visible reconnect guidance.

## Vercel static SPA pattern

```json
{"$schema":"https://openapi.vercel.sh/vercel.json","framework":"vite","installCommand":"bun install --frozen-lockfile","buildCommand":"bun run build","outputDirectory":"dist","rewrites":[{"source":"/(.*)","destination":"/index.html"}]}
```

Rely on Vercel filesystem-before-rewrite handling. Do not add a server runtime, API route, `cleanUrls`, or competing `routes` configuration. Built-artifact smoke must parse `dist/index.html` to discover real hashed JavaScript/CSS, discover `workbox-*.js` by filename pattern, reject HTML/empty responses for every static asset, validate manifest/worker/icons, and byte-compare direct nested/unknown routes with `dist/index.html`; never hard-code generated hashes.

## Two-stage Convex and Vercel release pattern

Repository CI verifies the source revision but deploys neither platform. The Convex release owner selects the production target with one approved selector, reviews a dry run, and deploys with the Git SHA in the audit message:

```bash
REVISION="$(git rev-parse HEAD)"
bunx convex deploy --dry-run --typecheck enable --message "route-ledger:$REVISION"
bunx convex deploy --typecheck enable --message "route-ledger:$REVISION"
bunx convex run templates:seedTemplates '{}' --prod --typecheck enable --codegen disable
```

Verify function metadata, schema/index readiness, a signed Clerk webhook delivery, and an authenticated session before Vercel promotion. `VITE_CONVEX_URL` must name that exact deployment. Backend-first rollout is allowed only while the currently live frontend remains compatible; otherwise use a coordinated or backward-compatible rollout. Vercel and Convex have separate rollback owners.

## Environment ownership

- Browser/public runtime: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_CONVEX_URL`, optional `VITE_APP_URL`, optional `VITE_SENTRY_DSN`.
- Convex CLI-managed local public metadata: optional `VITE_CONVEX_SITE_URL`; validate HTTPS (or localhost only in development), do not project it into runtime configuration, and do not require it in Vercel.
- Vercel automatically exposes reserved build metadata as `VITE_VERCEL_*` when system-variable exposure is enabled. Permit that reserved namespace during build validation, but never project it into Route Ledger runtime configuration. Continue rejecting unknown application-owned `VITE_*` names.
- Convex deployment: `CLERK_JWT_ISSUER_DOMAIN`, `CLERK_WEBHOOK_SECRET`.
- Local linkage: `CONVEX_DEPLOYMENT`.
- Approved backend release only: target-scoped `CONVEX_DEPLOY_KEY`.

Never put a server secret behind `VITE_`, and never expose `CONVEX_DEPLOY_KEY` to repository test CI or the Vercel static build.

## Deterministic test boundary

Mount real routes, pages, components, and feature hooks. Replace only external Clerk React, Convex React transport, PWA registration, and Vercel telemetry edges. Keep generated Convex references real. Use `unavailableAuth()` only as unresolved external Clerk input (`isLoaded: false`); never encode final readiness in the mock because `AuthReadinessProvider` owns the ten-second unavailable projection. Run the client Vitest project with one file worker; concurrent jsdom lazy-route transforms can otherwise leave real routes indefinitely on their Suspense fallback under constrained CI. Keep Testing Library waits bounded at ten seconds and tests bounded at fifteen seconds instead of adding retries. Use Playwright Clock to fast-forward the real auth timeout, then assert Retry returns to connecting without removing the friendly landing. Keep Playwright at two workers and zero retries so the reported 37 journeys are first-attempt results rather than retry-masked outcomes.

Vite e2e aliases require all of:

- `command === "serve"`
- `mode === "e2e"`
- `isPreview !== true`
- `ROUTE_LEDGER_E2E === "1"`

Reject build/preview e2e mode and keep the flag without a `VITE_` prefix.

## Repository CI gate pattern

`.github/workflows/ci.yml` runs the deterministic repository boundary on pushes, pull requests, and manual dispatch:

```text
Bun 1.3.11
  -> bun install --frozen-lockfile
  -> bun run check
  -> bun run test:build-smoke
  -> bun run test:convex
  -> bun run test:e2e:install:ci
  -> bun run test:e2e
```

Keep deployment credentials out of this workflow. Playwright supplies deterministic Clerk/Convex test adapters through its server-only Vite mode, so CI needs no live Clerk, Convex, webhook, Vercel, deployment, or Sentry secrets and performs no deployment.

## Verification commands

```bash
bun run check
bun run test:convex
bun run test:e2e:install      # first local run
bun run test:e2e
bun run build
bun run preview --host 127.0.0.1 --port 4173
```

`bun run check` does not include Convex or Playwright.

_Last updated: July 14, 2026_
