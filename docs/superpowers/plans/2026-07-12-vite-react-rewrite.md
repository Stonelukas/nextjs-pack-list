# Vite React Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Next.js completely with a production-ready Vite React SPA that preserves packing-list functionality, introduces a calm editorial redesign, uses Clerk-backed Convex authorization, supports one-time legacy data import, and is verified by unit, authorization, build, and browser tests.

**Architecture:** React Router owns client routing and nested layouts; Clerk React supplies identity; Convex is the only durable data and server-side policy boundary. Feature hooks expose typed Convex operations, Zustand is limited to ephemeral UI state, and Vite provides build, PWA, monitoring, testing, and Vercel deployment integration.

**Tech Stack:** React 19, TypeScript, Vite, React Router, Clerk React, Convex, Tailwind CSS 4, Radix/shadcn UI, Zustand, Vitest, Testing Library, convex-test, Playwright, vite-plugin-pwa, Sentry React, Vercel Analytics and Speed Insights, Bun.

## Global Constraints

- Work only on `feat/vite-react-rewrite`.
- Use Bun as the sole package manager; remove `package-lock.json`.
- Remove every Next.js package, import, generated type, configuration file, route convention, and documentation instruction.
- Use Clerk as the sole identity provider and derive authorization from `ctx.auth.getUserIdentity()` in Convex.
- Never trust browser-supplied user IDs, owner IDs, roles, or emails for authorization.
- Preserve core packing-list behavior while redesigning the interface in a calm editorial direction.
- PWA support caches the application shell only; Convex-backed editing requires connectivity.
- Import legacy browser data explicitly, atomically, idempotently, and without silent deletion.
- Retain only the secured `/admin` utility route; remove seed, test, analytics-test, and Sentry-example routes.
- Consolidate profile, account, preferences, appearance, data, and migration controls under `/settings`.
- Retain Sentry, Vercel Analytics, Speed Insights, and web vitals; remove Plausible.
- Do not push, open a pull request, or deploy.
- The user requested implementation commits only after all work is complete. Do not commit individual tasks; create the implementation commit only in Task 12 after verification.

## Target File Structure

```text
index.html                         # Vite HTML shell and static metadata
vite.config.ts                     # React, aliases, PWA, and conditional Sentry plugins
vitest.config.ts                   # Unit/component test environment
playwright.config.ts               # Browser test server and projects
vercel.json                        # Bun build, dist output, SPA rewrite
src/main.tsx                       # Environment validation, monitoring, React mount
src/app/
  App.tsx                          # Top-level application component
  providers.tsx                    # Clerk, Convex, theme, and global UI providers
  router.tsx                       # Lazy React Router route tree
  guards/                          # Auth/admin UX guards
  layouts/                         # Root and auth layouts
  errors/                          # Root and route error boundaries
  loading/                         # Route fallback
  routes/                          # Not-found route
src/features/
  auth/                            # Clerk route pages
  home/                            # Landing/dashboard route
  lists/                           # List routes, hooks, and adapters
  templates/                       # Template route and hooks
  settings/                        # Consolidated settings route
  admin/                           # Server-authorized admin route
  legacy-migration/                # Pure parser, normalizer, hook, and dialog
src/components/
  layout/                          # Editorial page-level primitives
  feedback/                        # Empty/offline/error feedback
  monitoring/                      # Vercel analytics and web-vitals mount
  pwa/                             # Install/update prompts
  ui/                              # Existing Radix/shadcn primitives
src/lib/
  env.ts                           # Vite environment parsing
  errors.ts                        # User-facing error mapping
  monitoring/                     # Sentry and web-vitals setup
src/styles/globals.css             # Tailwind 4 and editorial design tokens
src/test/                          # Test setup, render helpers, service mocks
convex/lib/                        # Auth, ownership, and error helpers
convex/migrations.ts               # Idempotent legacy import mutation
e2e/                               # Playwright fixtures and journeys
```

---

### Task 1: Replace the Next.js toolchain with a compiling Vite shell

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/vite-env.d.ts`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/lib/env.ts`
- Move/Modify: `src/app/globals.css` → `src/styles/globals.css`
- Modify: `components.json`
- Modify: `.gitignore`
- Modify: `.env.example`
- Delete: `next.config.ts`
- Delete: `.eslintrc.json`
- Delete: `package-lock.json`
- Delete: `next-env.d.ts` if present
- Delete: `src/middleware.ts`
- Delete: `src/instrumentation.ts`
- Delete: `src/instrumentation-client.ts`
- Delete: `sentry.edge.config.ts`
- Delete: `sentry.server.config.ts`

**Interfaces:**
- Produces: `env` with validated `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_CONVEX_URL`, optional `VITE_SENTRY_DSN`, and optional `VITE_APP_URL`.
- Produces: a Vite entry point that can render `<App />` before route migration is complete.

- [ ] **Step 1: Capture the baseline without suppressing failures**

Run:

```bash
git branch --show-current
bun run lint || true
bunx tsc --noEmit || true
bun run build || true
```

Expected: branch is `feat/vite-react-rewrite`; existing checks may expose Next-suppressed errors. Save relevant failures in the work log, not as permanent fixtures.

- [ ] **Step 2: Replace package scripts and dependencies**

Use scripts with these contracts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:convex": "vitest run convex/**/*.test.ts",
    "test:e2e": "playwright test",
    "check": "bun run lint && bun run typecheck && bun run test && bun run build"
  }
}
```

Remove Next, Next-specific Clerk/Sentry/Plausible/theme/bundle-analysis dependencies, `@convex-dev/auth`, unused React Query packages, and Next ESLint packages. Add the stack listed in the plan header.

- [ ] **Step 3: Configure strict TypeScript projects**

`tsconfig.app.json` must include `src`, `convex`, and generated Convex types, use `jsx: "react-jsx"`, `moduleResolution: "Bundler"`, `strict: true`, `noEmit: true`, and Vite/Vitest types. `tsconfig.node.json` covers Vite, Vitest, and Playwright configuration files.

- [ ] **Step 4: Create typed Vite environment parsing**

Implement:

```ts
export interface AppEnv {
  clerkPublishableKey: string;
  convexUrl: string;
  sentryDsn?: string;
  appUrl: string;
}

function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env: AppEnv = {
  clerkPublishableKey: required("VITE_CLERK_PUBLISHABLE_KEY"),
  convexUrl: required("VITE_CONVEX_URL"),
  sentryDsn: import.meta.env.VITE_SENTRY_DSN?.trim() || undefined,
  appUrl: import.meta.env.VITE_APP_URL?.trim() || window.location.origin,
};
```

Declare matching `ImportMetaEnv` fields in `src/vite-env.d.ts`.

- [ ] **Step 5: Create the minimal Vite entry and HTML shell**

`src/main.tsx` mounts `App` into `#root` with `React.StrictMode` and imports `src/styles/globals.css`. `index.html` contains product title, description, theme color, favicon links, and the module entry.

- [ ] **Step 6: Preserve Tailwind 4 while relocating global CSS**

Move existing print/reduced-motion rules, then make `components.json` use `src/styles/globals.css` and `rsc: false`.

- [ ] **Step 7: Install with Bun and verify the shell**

Run:

```bash
rm -f package-lock.json
bun install
bun run typecheck
bun run build
```

Expected: Bun regenerates `bun.lock`; the minimal Vite shell builds. Product files not yet migrated may temporarily be excluded only by the route shell—not by disabling strict checks.

---

### Task 2: Establish Convex identity and authorization primitives

**Files:**
- Create: `convex/lib/auth.ts`
- Create: `convex/lib/authorization.ts`
- Create: `convex/lib/errors.ts`
- Modify: `convex/schema.ts`
- Modify: `convex/auth.config.js`
- Test: `convex/lib/authorization.test.ts`

**Interfaces:**
- Produces: `requireIdentity`, `requireCurrentUser`, `requireAdmin`, `requireOwnedList`, `requireOwnedCategory`, and `requireOwnedItem`.
- Produces: stable public error codes `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, and `OFFLINE`.

- [ ] **Step 1: Write failing authorization tests with convex-test**

Cover unauthenticated rejection, missing user records, owner success, foreign-owner rejection, category-to-list traversal, item-to-category-to-list traversal, and non-admin rejection.

Use assertions on stable error data rather than full English messages:

```ts
await expect(asAnonymous.query(api.lists.getById, { listId })).rejects.toMatchObject({
  data: { code: "UNAUTHENTICATED" },
});
```

- [ ] **Step 2: Run the focused tests and confirm failure**

Run:

```bash
bunx vitest run convex/lib/authorization.test.ts
```

Expected: FAIL because helpers and enforced policies do not exist.

- [ ] **Step 3: Implement stable Convex errors**

Use `ConvexError` data objects:

```ts
export type DomainErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION";

export function domainError(code: DomainErrorCode, message: string): ConvexError<{ code: DomainErrorCode; message: string }> {
  return new ConvexError({ code, message });
}
```

- [ ] **Step 4: Implement identity and ownership helpers**

Required signatures:

```ts
export async function requireIdentity(ctx: QueryCtx | MutationCtx): Promise<UserIdentity>;
export async function requireCurrentUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">>;
export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">>;
export async function requireOwnedList(ctx: QueryCtx | MutationCtx, listId: Id<"lists">): Promise<Doc<"lists">>;
export async function requireOwnedCategory(ctx: QueryCtx | MutationCtx, categoryId: Id<"categories">): Promise<{ category: Doc<"categories">; list: Doc<"lists"> }>;
export async function requireOwnedItem(ctx: QueryCtx | MutationCtx, itemId: Id<"items">): Promise<{ item: Doc<"items">; category: Doc<"categories">; list: Doc<"lists"> }>;
```

`requireCurrentUser` looks up `identity.subject` through the Clerk-ID index. `requireAdmin` requires `role === "admin"`; missing roles behave as `user` during migration.

- [ ] **Step 5: Align the schema**

Add `users.role` as an optional or defaultable `"user" | "admin"` field for existing data compatibility. Add all ownership lookup indexes needed by helpers. Do not accept a client role during normal user creation.

- [ ] **Step 6: Verify authorization primitives**

Run:

```bash
bunx convex codegen
bunx vitest run convex/lib/authorization.test.ts
```

Expected: generated APIs succeed and all focused tests pass.

---

### Task 3: Harden every Convex public operation and Clerk webhook

**Files:**
- Modify: `convex/lists.ts`
- Modify: `convex/templates.ts`
- Modify: `convex/users.ts`
- Modify: `convex/analytics.ts`
- Modify: `convex/moderation.ts`
- Modify: `convex/settings.ts`
- Modify: `convex/http.ts`
- Delete: `convex/auth.ts`
- Test: `convex/lists.authorization.test.ts`
- Test: `convex/templates.authorization.test.ts`
- Test: `convex/admin.authorization.test.ts`
- Test: `convex/http.test.ts`

**Interfaces:**
- Consumes: authorization helpers from Task 2.
- Produces: Convex APIs that never accept `clerkId` for authorization.
- Produces: `users.getCurrentAccess(): { authenticated: boolean; role: "user" | "admin" | null }`.

- [ ] **Step 1: Write failing tenant-isolation tests**

Create two authenticated identities and prove user A cannot read/update/delete user B's list, category, item, or private template. Test foreign IDs inside reorder and move arrays.

- [ ] **Step 2: Write failing admin and webhook tests**

Prove non-admin users cannot call user, analytics, moderation, or settings administration. Assert webhook synchronization functions are absent from `api` and available only through `internal`.

- [ ] **Step 3: Refactor list APIs**

Remove `clerkId` arguments. Authorize all list reads and mutations. Add/fix:

```ts
reorderCategories({ listId, categoryIds }): Promise<void>
moveItem({ itemId, toCategoryId, toIndex }): Promise<void>
```

Before reordering, verify every category belongs to the authorized list. Before moving, authorize both the source item and destination category and require both lists to be owned by the current user.

- [ ] **Step 4: Refactor template APIs**

Public reads return public templates only. Authenticated reads may include caller-owned private templates. Applying permits only public or caller-owned templates. Creating from a list requires list ownership. Convert seed behavior to internal/admin-only code and remove browser exposure.

- [ ] **Step 5: Refactor user and admin APIs**

Expose only current-user operations to normal clients:

```ts
getCurrentUser()
ensureCurrentUser()
updateCurrentUserPreferences({ preferences })
getCurrentAccess()
```

Apply `requireAdmin` to every administration query/mutation. Replace browser-callable webhook mutations with `internalMutation` functions.

- [ ] **Step 6: Refactor Clerk webhook dispatch**

Remove `@clerk/nextjs/server` types. Validate Svix signatures with `CLERK_WEBHOOK_SECRET`, map signed event data, default role to `user`, accept `public_metadata.role === "admin"` only from the signed payload, and invoke `internal.users.upsertFromClerk` or `internal.users.deleteFromClerk`.

- [ ] **Step 7: Secure analytics, moderation, and settings**

Call `requireAdmin` before every read or write. Remove test-content initialization from the public API.

- [ ] **Step 8: Verify the hardened backend**

Run:

```bash
bunx convex codegen
bun run test:convex
```

Expected: all authorization, ownership, admin, and webhook tests pass.

---

### Task 4: Build the Vite provider tree, router, theme, errors, and monitoring bootstrap

**Files:**
- Create: `src/app/providers.tsx`
- Create: `src/app/router.tsx`
- Create: `src/app/layouts/root-layout.tsx`
- Create: `src/app/layouts/auth-layout.tsx`
- Create: `src/app/guards/require-auth.tsx`
- Create: `src/app/guards/require-admin.tsx`
- Create: `src/app/errors/root-error-boundary.tsx`
- Create: `src/app/errors/route-error-boundary.tsx`
- Create: `src/app/loading/route-loading.tsx`
- Create: `src/app/routes/not-found-page.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/providers/convex-provider.tsx` or replace it through `providers.tsx`
- Rewrite: `src/providers/theme-provider.tsx`
- Create: `src/lib/errors.ts`
- Create: `src/lib/monitoring/sentry.ts`
- Create: `src/lib/monitoring/web-vitals.ts`
- Create: `src/components/monitoring/monitoring.tsx`
- Delete: `src/contexts/auth-context.tsx`
- Delete: `src/providers/query-provider.tsx`
- Delete: `src/providers/development-provider.tsx`
- Delete: `src/components/debug/vercel-debug.tsx`
- Test: `src/app/guards/require-auth.test.tsx`
- Test: `src/app/guards/require-admin.test.tsx`
- Test: `src/providers/theme-provider.test.tsx`

**Interfaces:**
- Consumes: `env` from Task 1 and `api.users.getCurrentAccess` from Task 3.
- Produces: `useTheme(): { theme; resolvedTheme; setTheme }`.
- Produces: lazy route placeholders into which feature pages are migrated.

- [ ] **Step 1: Write guard and theme tests**

Test signed-out redirect with preserved return URL, signed-in rendering, pending admin state, forbidden admin state, successful admin rendering, local theme persistence, system-theme resolution, and DOM class updates.

- [ ] **Step 2: Implement provider composition**

Use this order:

```tsx
<ClerkProvider publishableKey={env.clerkPublishableKey}>
  <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </ConvexProviderWithClerk>
</ClerkProvider>
```

Mount global toaster, monitoring, offline banner, and PWA prompts from the root layout rather than duplicating them per route.

- [ ] **Step 3: Implement framework-neutral theme handling**

Persist only `light`, `dark`, or `system`. Resolve `system` through `matchMedia`, update the document root class, and unsubscribe on cleanup.

- [ ] **Step 4: Implement router and guards**

Use lazy route modules and paths from the approved design. Declare Clerk routes as `/sign-in/*` and `/sign-up/*`. Guard product routes with `RequireAuth`; guard `/admin` with both `RequireAuth` and server-derived `RequireAdmin`.

- [ ] **Step 5: Implement error mapping and boundaries**

Map Convex/domain errors to `UserFacingError`:

```ts
export interface UserFacingError {
  code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | "OFFLINE" | "UNEXPECTED";
  title: string;
  message: string;
  retryable: boolean;
}
```

Expected errors render actionable UI and do not go to Sentry. Unexpected render/lazy errors do.

- [ ] **Step 6: Initialize monitoring**

Initialize `@sentry/react` before React mount when a DSN exists. Mount Vercel Analytics, Speed Insights, and standard `web-vitals`. Strip tokens, authorization headers, emails, mutation arguments, and legacy payloads in `beforeSend`.

- [ ] **Step 7: Verify shell behavior**

Run:

```bash
bunx vitest run src/app src/providers/theme-provider.test.tsx
bun run typecheck
bun run build
```

Expected: providers, router, guards, theme, and error boundaries pass tests and build without Next.js.

---

### Task 5: Replace the monolithic store adapter with typed feature hooks

**Files:**
- Create: `src/features/lists/hooks/use-lists.ts`
- Create: `src/features/lists/hooks/use-list.ts`
- Create: `src/features/lists/hooks/use-list-actions.ts`
- Create: `src/features/templates/hooks/use-templates.ts`
- Create: `src/features/settings/hooks/use-preferences.ts`
- Create: `src/features/admin/hooks/use-admin-access.ts`
- Create: `src/features/shared/async-action-state.ts`
- Modify: `src/store/navigation-store.ts`
- Delete after migration: `src/hooks/use-convex-store.ts`
- Test: `src/features/lists/hooks/use-list-actions.test.tsx`
- Test: `src/features/templates/hooks/use-templates.test.tsx`

**Interfaces:**
- Consumes: generated Convex APIs from Task 3.
- Produces typed `Id<...>` actions and explicit pending/error state.

- [ ] **Step 1: Write failing hook contract tests**

Test that hooks pass Convex IDs without string coercion, expose `pending`, surface mapped errors, clear errors with `resetError`, and never inject Clerk IDs.

- [ ] **Step 2: Implement shared async action state**

Use:

```ts
export interface AsyncActionState {
  pending: boolean;
  error: UserFacingError | null;
  resetError(): void;
}
```

Wrap mutations with a focused helper that sets pending, maps errors, rethrows only when the caller needs transactional composition, and always resets pending.

- [ ] **Step 3: Implement list hooks**

Expose list queries and actions with Convex ID types. Implement create/update/delete/duplicate/complete, category operations, item operations, reorder, and move without broad `any` casts.

- [ ] **Step 4: Implement template, preferences, and admin hooks**

Keep public and owned template visibility explicit. Read/write current-user preferences only. Admin access must consume the server-derived access query.

- [ ] **Step 5: Reduce navigation Zustand state**

Keep sidebar open/collapse and mobile presentation preferences only. Remove custom route history, breadcrumbs, or durable packing data from the store.

- [ ] **Step 6: Verify typed hooks**

Run:

```bash
bunx vitest run src/features/*/hooks
bun run typecheck
```

Expected: hooks compile with generated Convex IDs and tests pass.

---

### Task 6: Migrate retained routes and remove the Next.js app tree

**Files:**
- Create/Move: `src/features/home/home-page.tsx`
- Create/Move: `src/features/auth/sign-in-page.tsx`
- Create/Move: `src/features/auth/sign-up-page.tsx`
- Create/Move: `src/features/lists/list-index-page.tsx`
- Create/Move: `src/features/lists/create-list-page.tsx`
- Create/Move: `src/features/lists/list-detail-page.tsx`
- Create/Move: `src/features/lists/edit-list-page.tsx`
- Create/Move: `src/features/lists/categories-page.tsx`
- Create/Move: `src/features/lists/tags-page.tsx`
- Create/Move: `src/features/templates/templates-page.tsx`
- Create/Move: `src/features/settings/settings-page.tsx`
- Create/Move: `src/features/admin/admin-page.tsx`
- Modify: all retained components/hooks importing `next/link`, `next/navigation`, or `next/dynamic`
- Delete: obsolete `src/app/**` Next route files after behavior is moved
- Delete: `src/components/lazy/lazy-routes.tsx`
- Test: `src/app/router.test.tsx`
- Test: route-specific tests under `src/features/**`

**Interfaces:**
- Consumes: router shell from Task 4 and feature hooks from Task 5.
- Produces: all approved SPA routes and no obsolete diagnostic routes.

- [ ] **Step 1: Write route-tree tests**

Test route matching for `/`, nested list paths, Clerk splats, settings, admin, and unknown paths. Test `/lists?status=active` search-parameter preservation.

- [ ] **Step 2: Migrate navigation APIs mechanically**

Use:

```ts
const navigate = useNavigate();
navigate(`/lists/${listId}`);

const { id } = useParams<{ id: string }>();
const [searchParams, setSearchParams] = useSearchParams();
```

Replace `next/link` with React Router `Link`/`NavLink`; replace route-prefetch assumptions with lazy route modules.

- [ ] **Step 3: Migrate landing, auth, and list routes**

Preserve signed-out Clerk calls to action, authenticated dashboard, list search/filter/sort, create/edit/detail operations, progress, drag-and-drop, quick-add, completion, duplicate, import/export, print, PDF/image, and QR flows.

- [ ] **Step 4: Migrate template, category, and tag routes**

Normalize Convex `_id` usage and remove assumptions that documents have an `id` field. Preserve template search/filter/apply/save behavior.

- [ ] **Step 5: Consolidate settings**

Combine profile, Clerk account management, preferences, appearance, data export/import, and legacy migration into one `/settings` page with accessible sections/tabs. Remove standalone settings route files.

- [ ] **Step 6: Migrate and secure admin UI**

Remove all hard-coded email checks. Do not mount privileged queries until `RequireAdmin` confirms server-derived access. Preserve useful users, analytics, moderation, content, and settings panels.

- [ ] **Step 7: Remove obsolete routes and Next app conventions**

Delete analytics-test, test, seed-templates, Sentry example, API example, Next layouts, loading files, metadata wrappers, global error files, and old not-found files after their approved behavior is represented in the SPA.

- [ ] **Step 8: Verify routing and core components**

Run:

```bash
bunx vitest run src/app/router.test.tsx src/features
bun run typecheck
bun run build
```

Expected: every approved route renders; removed routes resolve to not-found; no retained source imports Next navigation modules.

---

### Task 7: Implement one-time legacy browser data import

**Files:**
- Create: `src/features/legacy-migration/schema.ts`
- Create: `src/features/legacy-migration/normalize.ts`
- Create: `src/features/legacy-migration/legacy-storage.ts`
- Create: `src/features/legacy-migration/use-legacy-migration.ts`
- Create: `src/features/legacy-migration/legacy-import-dialog.tsx`
- Create: `convex/migrations.ts`
- Modify: `convex/schema.ts`
- Modify: `src/features/settings/settings-page.tsx`
- Delete after extraction: `src/store/usePackListStore.ts`
- Test: `src/features/legacy-migration/legacy-storage.test.ts`
- Test: `src/features/legacy-migration/normalize.test.ts`
- Test: `src/features/legacy-migration/legacy-import-dialog.test.tsx`
- Test: `convex/migrations.test.ts`

**Interfaces:**
- Produces: `inspectLegacyStorage(storage: Storage): LegacyImportPreview | null`.
- Produces: authenticated `api.migrations.importLegacyData` with idempotent status.

- [ ] **Step 1: Freeze legacy fixtures before deleting the store**

Create fixtures for the Zustand `{ state, version }` envelope, old dates, optional fields, custom templates, preferences, malformed records, and duplicate imports.

- [ ] **Step 2: Write failing parser and normalization tests**

Require:

```ts
export interface LegacyImportPreview {
  sourceKey: string;
  fingerprint: string;
  lists: NormalizedLegacyList[];
  templates: NormalizedLegacyTemplate[];
  rejected: Array<{ path: string; reason: string; raw: unknown }>;
}

export function inspectLegacyStorage(storage: Storage): LegacyImportPreview | null;
```

Test supported keys and ensure malformed records are rejected individually without discarding valid siblings.

- [ ] **Step 3: Implement pure parsing, validation, and fingerprinting**

Support the explicit legacy keys from the design. Normalize dates, priorities, missing optional fields, categories, items, and templates. Fingerprinting must be deterministic for equivalent normalized data.

- [ ] **Step 4: Write failing Convex import tests**

Test authenticated ownership, transaction-wide success, `already_imported` retry behavior, no partial records on validation failure, and user-scoped deduplication.

- [ ] **Step 5: Add `legacyImports` schema and atomic mutation**

Implement:

```ts
importLegacyData(args: {
  sourceKey: "zustand:pack-list-storage:v1";
  fingerprint: string;
  lists: LegacyListInput[];
  templates: LegacyTemplateInput[];
}): Promise<{
  status: "imported" | "already_imported";
  listsImported: number;
  templatesImported: number;
}>;
```

Derive the user server-side. Reject oversized imports with a validation error and manual-export guidance rather than partial writes.

- [ ] **Step 6: Implement preview and confirmation UX**

Display valid counts, rejected records, a downloadable recovery export, explicit confirmation, pending state, success state, and retryable failure state. Write an archive marker and offer source deletion only after successful persistence.

- [ ] **Step 7: Remove legacy durable Zustand state**

Delete `usePackListStore.ts` after all consumers are moved and fixtures preserve its historical schema.

- [ ] **Step 8: Verify migration behavior**

Run:

```bash
bunx vitest run src/features/legacy-migration convex/migrations.test.ts
bun run typecheck
```

Expected: parser, UI, authorization, idempotency, and loss-prevention tests pass.

---

### Task 8: Apply the calm editorial redesign and accessibility system

**Files:**
- Modify: `src/styles/globals.css`
- Create: `src/components/layout/page-header.tsx`
- Create: `src/components/layout/section.tsx`
- Create: `src/components/feedback/empty-state.tsx`
- Create: `src/components/feedback/offline-banner.tsx`
- Modify: navigation, list-card, list-detail, template, settings, admin, dialog, form, and feedback components used by retained routes
- Test: `src/components/layout/page-header.test.tsx`
- Test: `src/components/feedback/empty-state.test.tsx`
- Test: accessibility-focused tests beside major routes

**Interfaces:**
- Consumes: migrated feature routes from Task 6.
- Produces: reusable page hierarchy and feedback primitives across light/dark themes.

- [ ] **Step 1: Write semantic and interaction tests**

Test heading order, landmark labels, keyboard-visible focus, dialog names, destructive confirmation semantics, icon-button labels, reduced-motion behavior, and mobile navigation disclosure.

- [ ] **Step 2: Define editorial tokens**

Create named CSS variables for warm neutral canvas/surfaces, ink, muted ink, border, restrained accent, success/warning/danger, focus ring, shadows, radii, type scale, and spacing. Define intentional dark equivalents rather than inverting colors.

- [ ] **Step 3: Build shared page primitives**

`PageHeader` owns eyebrow/title/description/actions hierarchy. `Section` owns titled content grouping. `EmptyState` owns icon/title/description/action semantics. Avoid route-specific styling in these primitives.

- [ ] **Step 4: Redesign global navigation and overview screens**

Apply editorial rhythm to signed-out landing, signed-in dashboard, list index, templates, categories, tags, and settings. Preserve fast access to primary actions and existing responsive behavior.

- [ ] **Step 5: Redesign dense workspaces**

Keep list detail and admin compact: clear category boundaries, legible item states, efficient controls, visible progress, restrained motion, and touch-safe mobile actions.

- [ ] **Step 6: Consolidate theme controls and motion policy**

Use one theme component backed by Task 4's provider. Honor `prefers-reduced-motion` for transitions, drag affordances, and celebratory effects.

- [ ] **Step 7: Verify UI tests and responsive rendering**

Run:

```bash
bunx vitest run src/components src/features
bun run typecheck
bun run build
```

Expected: semantic tests pass and the redesigned app builds in both themes.

---

### Task 9: Add installable PWA behavior and honest offline states

**Files:**
- Modify: `vite.config.ts`
- Create: `src/hooks/use-online-status.ts`
- Create: `src/components/pwa/pwa-update-prompt.tsx`
- Create: `src/components/pwa/install-prompt.tsx`
- Add: required icon assets under `public/`
- Delete: `public/manifest.json`
- Delete: `src/lib/service-worker-utils.ts`
- Test: `src/hooks/use-online-status.test.ts`
- Test: `src/components/pwa/pwa-update-prompt.test.tsx`

**Interfaces:**
- Produces: `{ online: boolean }` state and user-controlled PWA update prompt.
- Consumes: global root layout and mutation controls.

- [ ] **Step 1: Write online-status and update-prompt tests**

Simulate browser `online`/`offline` events and service-worker update availability. Assert mutation controls explain why they are disabled offline.

- [ ] **Step 2: Configure VitePWA**

Use `registerType: "prompt"`, plugin-generated manifest, valid 192px/512px/maskable/favicon/Apple icons, application-shell precaching, and navigation fallback. Do not add runtime caching or background sync for Convex APIs.

- [ ] **Step 3: Implement global offline and update UI**

Show a non-blocking offline banner. Keep cached reading UI available where possible but disable or guard durable mutations with an `OFFLINE` user-facing error. Prompt users before activating an updated worker.

- [ ] **Step 4: Remove misleading legacy service-worker code and claims**

Delete custom cache-strategy utilities and the stale manifest after plugin configuration and real assets are in place.

- [ ] **Step 5: Verify the production service worker**

Run:

```bash
bun run build
bun run preview
```

Inspect the generated manifest/service worker, icon responses, offline shell, and update flow. Expected: installability works; no Convex mutation queue or user-data cache is generated.

---

### Task 10: Complete test infrastructure and end-to-end journeys

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/render.tsx`
- Create: `src/test/mocks/clerk.tsx`
- Create: `src/test/mocks/convex.ts`
- Create: `playwright.config.ts`
- Create: `e2e/fixtures/auth.ts`
- Create: `e2e/fixtures/convex.ts`
- Create: `e2e/auth.spec.ts`
- Create: `e2e/lists.spec.ts`
- Create: `e2e/templates.spec.ts`
- Create: `e2e/settings.spec.ts`
- Create: `e2e/admin.spec.ts`
- Create: `e2e/routing.spec.ts`
- Create: `e2e/responsive.spec.ts`

**Interfaces:**
- Produces: deterministic render helpers and browser fixtures independent of live personal Clerk accounts.
- Consumes: all application and Convex behavior from Tasks 2–9.

- [ ] **Step 1: Configure Vitest and shared rendering**

Use jsdom, Testing Library cleanup, jest-dom matchers, deterministic time where needed, and a render helper that accepts auth/Convex/router state.

- [ ] **Step 2: Close unit/component coverage gaps**

Ensure coverage exists for validation, import/export, URL filters, guards, settings, migration, loading/error/empty states, dialogs, and accessibility semantics.

- [ ] **Step 3: Configure Playwright**

Start `bun run dev --host 127.0.0.1` for tests. Define desktop Chromium and a mobile viewport project. Use deterministic Clerk/Convex boundaries for normal CI; keep real authorization enforcement in convex-test.

- [ ] **Step 4: Implement core browser journeys**

Cover signed-out landing/auth routing, dashboard, list creation, category/item operations, packing, reorder/move, deletion, templates, settings/theme, legacy migration, admin denial/success, and not-found recovery.

- [ ] **Step 5: Test direct nested-route refreshes**

Open `/lists/:id`, `/settings`, `/admin`, `/sign-in/*`, and unknown paths directly rather than only navigating from `/`.

- [ ] **Step 6: Run the complete automated suite**

Run:

```bash
bun run lint
bun run typecheck
bun run test
bun run test:convex
bun run build
bun run test:e2e
```

Expected: every command exits zero.

---

### Task 11: Configure Vercel and update all project documentation

**Files:**
- Create: `vercel.json`
- Modify: `README.md`
- Modify: `DEPLOYMENT.md`
- Modify: `.env.example`
- Modify: `CLAUDE.md`
- Modify: `CLERK_SETUP.md`
- Modify: `PRODUCTION_CHECKLIST.md`
- Modify: `.taskmaster/docs/CURRENT_WORK_SESSION.md`
- Modify: `.taskmaster/docs/FEATURE_IMPLEMENTATIONS.md`
- Modify: `.taskmaster/docs/CODE_PATTERNS.md`
- Modify: `.taskmaster/docs/API_REFERENCE.md`
- Modify: `.taskmaster/docs/TROUBLESHOOTING.md`
- Modify: `.taskmaster/docs/ARCHITECTURE.md`
- Modify: `.taskmaster/docs/CONVEX_INTEGRATION_SUMMARY.md`
- Modify: `.taskmaster/docs/QUICK_REFERENCE.md`

**Interfaces:**
- Produces: Vercel static-SPA deployment contract and accurate Vite/Clerk/Convex operator documentation.

- [ ] **Step 1: Add Vercel build and SPA rewrite configuration**

Configure Bun install, `bun run build`, `dist`, and a catch-all rewrite to `/index.html` after static asset handling. Do not introduce a business API server.

- [ ] **Step 2: Rewrite developer and deployment instructions**

Document Bun-only setup, `bun run dev`, `bun run check`, Playwright, Vite environment variables, Convex environment variables, Clerk JWT template, Clerk webhook, PWA online-data limitation, and Vercel nested-route behavior.

- [ ] **Step 3: Update mandatory Task Master references**

Record the Vite architecture, React Router patterns, typed Convex hooks, server-side authorization rules, legacy import API, PWA behavior, testing commands, known troubleshooting steps, and completed session state.

- [ ] **Step 4: Remove stale claims repository-wide**

Run searches for Next.js, `.next`, `NEXT_PUBLIC_`, local-only persistence, full offline editing, ignored type errors, old scripts, and removed routes. Update or delete every stale instruction that describes current behavior.

- [ ] **Step 5: Verify deployment configuration locally**

Build and serve with rewrite-equivalent behavior. Verify static assets are not swallowed by the catch-all and direct nested routes resolve to the SPA.

---

### Task 12: Perform final verification, review, and implementation commit

**Files:**
- Review: all changed files
- Update if needed: tests, docs, and configuration uncovered by verification

**Interfaces:**
- Consumes: all previous tasks.
- Produces: a verified branch with one final implementation commit after the existing design-spec commit.

- [ ] **Step 1: Prove no Next.js implementation remains**

Run:

```bash
git grep -nE 'from ["'"']next|@clerk/nextjs|@sentry/nextjs|next/navigation|next/link|next/image|next/dynamic|next-plausible|@convex-dev/auth' || true
git grep -niE 'next\.js|nextjs|next build|next dev|\.next/|NEXT_PUBLIC_' || true
git grep -nE 'clerkId: v\.string|args\.clerkId|TODO: Add admin role check' || true
git grep -nE 'ignoreBuildErrors|ignoreDuringBuilds' || true
find . -name package-lock.json -o -name 'next.config.*' -o -name next-env.d.ts
```

Expected: no implementation/configuration hits. Historical design documents may mention the migration from Next.js, but operational docs must not instruct its use.

- [ ] **Step 2: Run clean dependency and generation checks**

Run:

```bash
rm -rf node_modules dist coverage playwright-report test-results
bun install --frozen-lockfile
bunx convex codegen
```

Expected: frozen install and code generation succeed.

- [ ] **Step 3: Run the full quality gate**

Run:

```bash
bun run lint
bun run typecheck
bun run test
bun run test:convex
bun run build
bun run test:e2e
```

Expected: all commands exit zero. Do not mark the rewrite complete while any check fails.

- [ ] **Step 4: Exercise the application end-to-end**

Launch the production-equivalent app and observe signed-out landing, auth routing, lists, templates, consolidated settings, migration prompt, admin authorization, PWA installation/update, offline state, mobile navigation, and nested-route refreshes.

- [ ] **Step 5: Review the full diff**

Run:

```bash
git status --short
git diff --check
git diff --stat
git diff --name-status main...HEAD
```

Inspect security-sensitive Convex changes, environment exposure, route deletions, generated assets, lockfile changes, and documentation accuracy.

- [ ] **Step 6: Run code review and simplification passes**

Use the project review tools to verify correctness, security, reuse, and unnecessary compatibility code. Apply confirmed fixes and rerun affected tests plus the full quality gate.

- [ ] **Step 7: Create the final implementation commit**

Only after every verification step passes:

```bash
git add -A
git commit -m "feat: rewrite application with Vite and React

Co-Authored-By: Claude <noreply@anthropic.com>"
```

Expected: the branch contains the earlier design-spec commit and one verified implementation commit. Do not push, open a PR, or deploy.
