# API and Configuration Reference

Generated Convex types are authoritative. Examples below describe the active browser/server contract and intentionally avoid legacy plain-string domain models.

## Browser environment

```typescript
interface AppEnv {
  clerkPublishableKey: string; // VITE_CLERK_PUBLISHABLE_KEY, required
  convexUrl: string;           // VITE_CONVEX_URL, required
  sentryDsn?: string;          // VITE_SENTRY_DSN, optional
  appUrl: string;              // VITE_APP_URL or window.location.origin
}
```

Every `VITE_*` value is public in the built client.

## Provider contract

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

```typescript
const ACCOUNT_BOOTSTRAP_TIMEOUT_MS = 15_000;
type BootstrapStatus = "idle" | "loading" | "ready" | "error";
interface ConvexUserBootstrapValue {
  status: BootstrapStatus;
  error: UserFacingError | null;
  retry(): void;
}
```

`ConvexUserBootstrap` always renders children. For a ready signed-in identity it waits for Convex authentication and calls `api.users.ensureCurrentUser({})` once per `userId:attempt`; a 15-second pending boundary publishes a retryable mapped error. Timers clear on ready/error/retry/unmount, and keyed promise completions from prior attempts are ignored. `PreferenceThemeSync` does not mount its Convex preference hook until bootstrap is ready and retains changed-server-value protection for unsaved local selections.

```typescript
interface AppProvidersProps {
  runtimeConfiguration: RuntimeEnvResult;
  routerInstance: RouterProviderProps["router"];
}

const AUTH_READINESS_TIMEOUT_MS = 10_000;

interface SharedRenderOptions {
  runtimeConfiguration?: RuntimeEnvResult;
  // scenario/auth/convex/theme/storage/connectivity options omitted here
}

function unavailableAuth(): MockAuthState; // isLoaded=false only
```

Production `App` passes the browser router explicitly. `renderAppRoute()` and `renderWithProviders()` pass memory routers to the same `AppProviders` component, so tests exercise the production provider order and can choose configured or unconfigured runtime branches. `unavailableAuth()` does not encode a final readiness status; the real provider converts unresolved input to unavailable after ten seconds and Retry creates a fresh provider attempt.

`RootLayout` always renders `Header`. The outer header contract consumes only `useAuthReadiness()` and selects `PublicHeader` unless status is `ready` and `isSignedIn` is true. Only `ReadySignedInHeader` may call `useRoleBasedAccess()`, mount Clerk `UserButton`, or derive provider-backed permissions. This makes the same one-line home link, public primary navigation, theme control, and sign-in route available during loading, signed-out, unavailable, and unconfigured startup without constructing or querying Clerk/Convex.

## Public home contract

```typescript
interface PublicHomePageProps {
  authStatus: "loading" | "ready" | "unavailable";
  accountStatus?: "idle" | "loading" | "error";
  onRetryAuth?(): void;
  onRetryAccount?(): void;
}
```

`PublicHomePage` has no Clerk or Convex dependency, always exposes React Router links to `/sign-up` and `/sign-in`, and owns `<main id="main-content" tabIndex={-1}>`. `HomePage` supplies readiness/bootstrap state and renders `ListOverview` only for ready signed-in auth plus ready bootstrap. Auth loading/unavailability and account idle/loading/error retain the complete landing; failed boundaries expose their matching retry callback. For non-authenticated `/`, `RootLayout` renders the route content directly to avoid a nested main; other public paths and navigation loading retain its shared `main-content` wrapper. `AuthLayout` withholds Clerk forms until auth readiness is `ready` and otherwise owns the centered loading/unavailable status panel.

`ListOverview` keeps the list summary/filter/action contracts unchanged. Its page heading is always `My packing lists`; the status query selects the collection heading (`Packing lists`, `Active lists`, or `Completed lists`). Quick starts precede the stat group. `<dl role="group" aria-label="Packing list statistics">` exposes Packing lists, Completed, Items, and Average packed as single values. Search, sort, layout, import, and create controls live with the collection, and `hasMore` renders `Load more lists` even when the loaded filtered result is empty.

## Route contract

Declared in `src/app/routes.tsx`:

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

`RequireAuth` evaluates auth loading, auth unavailable, signed-out redirect, bootstrap idle/loading, bootstrap error, then protected children; it preserves the complete pathname, search, and hash return URL. `RequireConfiguredRuntime` wraps only `/templates` and renders a provider-independent service-unavailable card when public runtime values are invalid. `RequireAdmin` waits for `api.users.getCurrentAccess` and requires `{ authenticated: true, role: "admin" }`.

## Domain error contract

```typescript
type DomainErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "OFFLINE";

interface DomainErrorData {
  code: DomainErrorCode;
  message: string;
}

interface UserFacingError {
  code: DomainErrorCode | "UNEXPECTED";
  title: string;
  message: string;
  retryable: boolean;
}
```

`mapError(error)` maps Convex/domain/network failures. Expected domain failures are not reported to Sentry as unexpected exceptions.

## Convex identity and authorization helpers

```typescript
function requireIdentity(ctx: QueryCtx | MutationCtx): Promise<UserIdentity>;
function requireCurrentUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">>;
function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">>;
function requireOwnedList(
  ctx: QueryCtx | MutationCtx,
  listId: Id<"lists">,
): Promise<Doc<"lists">>;
function requireOwnedCategory(
  ctx: QueryCtx | MutationCtx,
  categoryId: Id<"categories">,
): Promise<{ category: Doc<"categories">; list: Doc<"lists"> }>;
function requireOwnedItem(
  ctx: QueryCtx | MutationCtx,
  itemId: Id<"items">,
): Promise<{
  item: Doc<"items">;
  category: Doc<"categories">;
  list: Doc<"lists">;
}>;
```

`requireCurrentUser` maps `identity.subject` through `users.by_clerk_id`. Browser callers never provide the authorization identity.

## Typed list query hooks

```typescript
type ListWithCategories = FunctionReturnType<typeof api.lists.getList>;
type ListSummary = FunctionReturnType<
  typeof api.lists.getListSummaries
>["page"][number];
type ExportList = FunctionReturnType<
  typeof api.lists.getListExportPage
>["page"][number];

function useLists(): {
  lists: ListSummary[] | undefined;
  loading: boolean;
  hasMore: boolean;
  loadMore(): void;
};

function useListExportData(): {
  lists: ExportList[] | undefined;
  loading: boolean;
};

function useList(listId: Id<"lists"> | null | undefined): {
  list: ListWithCategories | undefined;
  loading: boolean;
};
```

`getListSummaries({ paginationOpts })` enforces `1..50` items and returns newest-first ordinary-list metadata plus `categoryCount`, `itemCount`, and `packedCount` without nested data. `getListExportPage({ paginationOpts })` is separately capped and returns oldest-first full categories/items for deterministic account export and aggregate views. Both collection queries use `lists.by_user_template(userId, false)`, exclude legacy template rows, and omit the storage-only `isTemplate` and `isPublic` compatibility fields. `getList({ listId })` remains the owned detail query and omits those fields as well.

## Typed list action hook

`useListActions()` exposes exact `FunctionArgs` contracts for:

- list create/update/complete/incomplete/delete/duplicate;
- category add/update/delete/collapse/reorder;
- item add/update/delete/toggle/reorder/move;
- atomic item field update plus destination move;
- authoritative quantity deltas;
- atomic nested list import.

Representative signatures:

```typescript
type CreateListInput = FunctionArgs<typeof api.lists.createList>;
type UpdateListInput = FunctionArgs<typeof api.lists.updateList>;
type MoveItemInput = FunctionArgs<typeof api.lists.moveItem>;
type UpdateItemAndMoveInput = FunctionArgs<typeof api.lists.updateItemAndMove>;
type AdjustItemQuantityInput = FunctionArgs<typeof api.lists.adjustItemQuantity>;
type ImportListInput = FunctionArgs<typeof api.lists.importList>;

interface AsyncActionOptions {
  rethrow?: boolean;
}

interface AsyncActionState {
  pending: boolean;
  error: UserFacingError | null;
  resetError(): void;
}
```

Successful void mutations are wrapped as `true`; mapped failures return `undefined` unless rethrow is requested.

`createList` accepts only `{ name, description?, tags? }`; `updateList` accepts only `{ listId, name?, description?, tags? }`. They never accept legacy list-template/publication flags. `addCategory`, `updateCategory`, and `addItem` expose no `order` argument; adds append server-side and exact-set reorder mutations are the only public ordering contract. New records still store `isTemplate: false` plus `isPublic: false` internally for schema compatibility, but public client contracts do not expose those fields.

`updateItem` and `updateItemAndMove` accept `weight?: number | null`: omitted leaves weight unchanged, a number sets it, and `null` clears it. The item form adapter omits destination fields when the selected category already contains the item; a real category change includes both `toCategoryId` and `toIndex` and remains atomic. Direct `deleteItem` removes linked moderation/history rows before deleting the item.

Authoritative list/category/item/import writes share these semantic limits: trimmed required names up to 200 characters, optional text up to 5,000, priorities `low | medium | high | essential`, positive integer quantities, finite non-negative weights, and at most 50 non-empty trimmed tags up to 100 characters each. `importList` additionally allows at most 50 categories, 200 items per category, 1,000 total items, and 1,000,000 UTF-8 JSON bytes; limit failures return `VALIDATION` before any write.

## Templates, preferences, and access

```typescript
type TemplateSummary = FunctionReturnType<
  typeof api.templates.getPublicTemplateSummaries
>["page"][number];
type TemplateWithCategories = FunctionReturnType<
  typeof api.templates.getTemplate
>;
type OwnedTemplateExport = FunctionReturnType<
  typeof api.templates.getOwnedTemplateExportPage
>["page"][number];
type ApplyTemplateInput = FunctionArgs<typeof api.templates.applyTemplate>;
type CreateTemplateFromListInput = FunctionArgs<
  typeof api.templates.createTemplateFromList
>;

type UserPreferences = FunctionArgs<
  typeof api.users.updateCurrentUserPreferences
>["preferences"];

type AdminAccess = FunctionReturnType<typeof api.users.getCurrentAccess>;
```

Server template reads:

```typescript
getPublicTemplateSummaries(args: {
  paginationOpts: PaginationOptions; // numItems 1..50
}): PaginationResult<TemplateSummary>;
getOwnedTemplateSummaries(args: {
  paginationOpts: PaginationOptions; // authenticated, numItems 1..50
}): PaginationResult<TemplateSummary>;
getOwnedTemplateExportPage(args: {
  paginationOpts: PaginationOptions; // authenticated, numItems 1..5
}): PaginationResult<OwnedTemplateExport>;
getTemplate(args: {
  templateId: Id<"templates">;
}): TemplateWithCategories;
```

Public summaries contain only public templates. Owned summaries contain only records whose `createdBy` equals the server-derived current user; public owned records may therefore appear in both feeds. Summary/detail/export DTOs are explicit, include `isOwned`, and omit the stable internal `createdBy` ID. Each summary includes `categoryCount` and `itemCount` and omits nested categories/items. `getTemplate` loads one public or caller-owned record and returns bounded canonical children; anonymous private and missing IDs both return `NOT_FOUND`.

`useTemplates()` merges paginated public and owned summaries by `Id<"templates">`, exposes `loading`, `loadingMore`, `canLoadMore`, `loadMore`, and apply/create actions. The template library renders the next-page control whenever either feed can continue. `useTemplateDetail(templateId)` loads children separately for the selected template. `useOwnedTemplateExportData()` requests every five-record owner export page and returns full nested templates only after status is `Exhausted`. Preview, apply, and account-export entry points wait for their complete authorized data. No template hook accepts or sends a Clerk ID.

User-created and imported templates permit at most 50 categories, 200 items per category, 1,000 total items, and 20 public templates per owner. The public quota check precedes source child reads; sequential reads stop at the aggregate limit. Template/category/item fields reuse the shared name, optional-text, priority, quantity, weight, order, and tag validation. Create, legacy import, and official seed writes persist denormalized counts in `templates`; a bounded internal backfill repairs older rows and rebuilds `templateStats`; children remain in `templateCategories` and `templateItems`.

`internal.templates.seedTemplates({})` synchronizes the backend-owned catalog in `convex/lib/official_templates.ts`. The canonical catalog contains nine public official templates, 39 categories, and 264 items. It matches existing official templates by name, inserts only missing definitions, returns `{ inserted, skipped, total }`, and starts bounded metadata/stat repair. It is callable only through trusted Convex tooling, never from the browser.

- `usePreferences()` returns current-user preferences and an update action. Settings keeps controls and account export disabled while preferences are unresolved.
- `useAdminAccess()` returns loading, authenticated, role, and `isAdmin` projections.

## Clerk synchronization

```typescript
internal.users.upsertFromClerk(args: {
  clerkId: string;
  name: string;
  email?: string;
  imageUrl?: string;
  role: "user" | "admin";
}): Id<"users">;

internal.users.deleteFromClerk(args: {
  clerkId: string;
}): { success: true; pending: boolean };
```

Only the signed Convex HTTP webhook calls these internal functions. Clerk and admin deletion enqueue the same `userDeletionJobs` workflow; `internal.users.continueUserDeletion({ jobId })` removes bounded batches until descendants, linked records, the user, and the job are gone.

## Administration and moderation APIs

```typescript
getAllUsers(args: {
  paginationOpts: PaginationOptions;
}): PaginationResult<Doc<"users">>;

deleteUser(args: {
  userId: Id<"users">;
}): { success: true; pending: true };

updateUser(args: {
  userId: Id<"users">;
  updates: {
    name?: string;
    email?: string;
    preferences?: UserPreferences;
  };
}): Doc<"users">;

getUserDetails(args: { userId: Id<"users"> }): {
  user: Doc<"users">;
  stats: {
    totalLists: number;
    completedLists: number;
    activeLists: number;
    templateCount: number;
  };
  recentLists: Array<PublicOrdinaryListDto>;
};

getModerationQueue(args: {
  contentType?: string;
  status?: string;
  paginationOpts: PaginationOptions; // numItems 1..50
}): PaginationResult<ModerationQueueItem>;
```

`getAllUsers` has no unbounded branch; the client requests 50-record pages and filters only loaded rows. `deleteUser` requires an explicit admin and rejects the authenticated administrator's own user ID before scheduling deletion. `updateUser` returns the post-patch authoritative user with its exact `updatedAt`, allowing a short-lived client bridge that is discarded once reactive queries catch up. User details count lists from `lists.by_user_template(userId, false)` and templates from `templates.by_creator`; recent list DTOs omit `isTemplate`/`isPublic`. Moderation queue items form a generated discriminated union for list, template, user-profile, and category content. Template preview fields are canonical (`isPublic`, category, difficulty, season, duration); list completion is list-only.

`templateStats` stores singleton `{ key: "global", totalTemplates, totalUsage, updatedAt }`. Template analytics reads that aggregate and `templates.by_usage` descending with `take(10)` rather than scanning every template.

## Legacy import API

```typescript
const LEGACY_STORAGE_KEY = "pack-list-storage";
const LEGACY_SOURCE_KEY = "zustand:pack-list-storage:v1";
const LEGACY_ARCHIVE_KEY = "pack-list-storage:legacy-import:v1";

type LegacySourceRead =
  | { state: "found"; raw: string }
  | { state: "missing" }
  | { state: "inaccessible" };

interface LegacyImportPreview {
  sourceKey: "zustand:pack-list-storage:v1";
  rawSource: string;
  fingerprint: `fnv1a128:${string}`;
  lists: unknown[];       // normalized validator-compatible list records
  templates: unknown[];   // normalized validator-compatible template records
  preferences?: {
    theme?: "light" | "dark" | "system";
    defaultPriority?: "low" | "medium" | "high" | "essential";
    autoSave?: boolean;
  };
  rejected: Array<{ path: string; reason: string; raw: unknown }>;
  manualExportRequired?: string;
}
```

```typescript
api.migrations.getLegacyImportStatus(args: {
  sourceKey: "zustand:pack-list-storage:v1";
  fingerprint: string;
}): {
  status: "already_imported";
  listsImported: number;
  templatesImported: number;
} | null;

api.migrations.importLegacyData(args: {
  sourceKey: "zustand:pack-list-storage:v1";
  fingerprint: string;
  lists: LegacyListInput[];
  templates: LegacyTemplateInput[];
  preferences?: LegacyPreferences;
}): {
  status: "imported" | "already_imported";
  listsImported: number;
  templatesImported: number;
};
```

Both APIs require the current authenticated Convex user. The mutation recomputes the fingerprint, enforces shared limits, validates all records before writing, and records completion last.

## PWA build contract

`vite.config.ts` configures:

```typescript
{
  registerType: "prompt",
  manifest: {
    name: "Route Ledger",
    short_name: "Route Ledger",
    start_url: "/",
    scope: "/",
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html,woff,woff2}"],
    navigateFallback: "/index.html",
    runtimeCaching: [],
    skipWaiting: false,
    clientsClaim: false,
  },
}
```

Generated artifacts include `manifest.webmanifest`, `sw.js`, and `workbox-*.js`. There is no hand-authored source manifest and no offline domain-data cache.

## Browser source compatibility contract

Vite source files do not use Next/RSC client-boundary directives. `src/app/task-6-source-contracts.test.ts` scans retained non-test JavaScript/TypeScript source and rejects a top-level `"use client"` or `'use client'` marker with either optional semicolon form.

## Vercel configuration

```json
{"$schema":"https://openapi.vercel.sh/vercel.json","framework":"vite","installCommand":"bun install --frozen-lockfile","buildCommand":"bun run build","outputDirectory":"dist","rewrites":[{"source":"/(.*)","destination":"/index.html"}]}
```

Existing static files are served before the rewrite. The static origin has no business API or Clerk webhook.

## Environment ownership

### Public Vite/Vercel

```env
VITE_CLERK_PUBLISHABLE_KEY=
VITE_CONVEX_URL=
VITE_APP_URL=
VITE_SENTRY_DSN=
# Optional local Convex CLI metadata; not part of RuntimeEnv
VITE_CONVEX_SITE_URL=https://your-deployment.convex.site
```

### Convex deployment

```env
CLERK_JWT_ISSUER_DOMAIN=
CLERK_WEBHOOK_SECRET=
```

### Local/CI linkage

```env
CONVEX_DEPLOYMENT=
CONVEX_DEPLOY_KEY=
```

`CONVEX_DEPLOY_KEY` is a target-scoped secret used only by the approved Convex production release stage. Repository verification CI and the Vercel static build do not consume it. `CLERK_SECRET_KEY` and Sentry upload variables are not part of the active build contract.

## Convex production release contract

```bash
REVISION="$(git rev-parse HEAD)"
bunx convex deploy --dry-run --typecheck enable --message "route-ledger:$REVISION"
bunx convex deploy --typecheck enable --message "route-ledger:$REVISION"
bunx convex run templates:seedTemplates '{}' --prod --typecheck enable --codegen disable
bunx convex function-spec --prod
bunx convex logs --prod --history 50
```

The operator uses exactly one target selector: a production `CONVEX_DEPLOY_KEY`, or an authenticated checkout whose `CONVEX_DEPLOYMENT` links the intended project and whose default production deployment has been confirmed. The deployment audit message must match the frontend Git revision. Run the idempotent official-template synchronization after deploying a fresh backend or expanding the catalog, then verify nine public summaries. Schema/index readiness, expected function metadata, signed Clerk webhook delivery, and authenticated access are required before Vercel promotion.

## Configuration files

- `vite.config.ts`: React, Tailwind, generated PWA, aliases, and test-boundary gate.
- `vercel.json`: frozen Bun static-SPA deployment.
- `components.json`: Shadcn aliases with `rsc: false`.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.test.json`: strict project references.
- `playwright.config.ts`: deterministic desktop/mobile Chromium projects with two workers and zero retries.
- `scripts/smoke-built-artifact.ts`: dynamic hashed JS/CSS/Workbox discovery, non-HTML static asset validation, manifest/worker/icon checks, and byte-identical direct-route shell proof.
- `vitest.config.ts`: client and Convex projects.
- `.github/workflows/ci.yml`: Bun 1.3.11 frozen install, client/build checks, built-artifact smoke, Convex tests, Chromium installation, and Playwright journeys; no deployment credentials or deploy steps.

Project type and lint errors are not ignored.

_Last updated: July 14, 2026_
