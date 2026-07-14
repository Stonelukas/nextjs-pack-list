# Legacy Browser Storage and Presentation-Only Zustand

> This file replaces the obsolete domain-store guide. `usePackListStore` has been removed and must not be restored.

## Active Zustand scope

`src/store/navigation-store.ts` stores presentation state such as sidebar collapse and mobile navigation state. Theme persistence is owned by `src/providers/theme-provider.tsx`.

Zustand does not own lists, categories, items, templates, users, account preferences, route history, or offline mutation queues.

## Authoritative domain access

Use typed Convex feature hooks:

- `src/features/lists/hooks/use-lists.ts`
- `src/features/lists/hooks/use-list.ts`
- `src/features/lists/hooks/use-list-actions.ts`
- `src/features/templates/hooks/use-templates.ts`
- `src/features/settings/hooks/use-preferences.ts`
- `src/features/admin/hooks/use-admin-access.ts`

These hooks preserve generated `Id<>`, `FunctionArgs`, and `FunctionReturnType` contracts. Convex derives identity and authorization from `ctx.auth`.

## Historical `pack-list-storage` boundary

The browser key `pack-list-storage` is recognized only as source `zustand:pack-list-storage:v1` for an explicit one-time migration.

The migration flow:

1. Reads the exact raw value without mutating it.
2. Treats the Zustand envelope and every nested record as untrusted.
3. Normalizes supported lists, templates, and preferences while retaining rejected records and exact recovery text.
4. Computes a deterministic fingerprint shared with Convex.
5. Sends one bounded authenticated transaction through `api.migrations.importLegacyData`.
6. Records user-scoped completion in `legacyImports`.
7. Offers source cleanup only after Convex confirms `imported` or `already_imported`.

If the source changes, disappears, or becomes inaccessible after preview, import and cleanup stop while the cached recovery snapshot remains available.

## Offline behavior

The PWA service worker caches only the static shell and icons. It does not turn Zustand or local storage into an offline domain database. Durable mutations are disabled or rejected before a Convex call when the browser is offline.

## Anti-patterns

Do not:

- create a new persisted Zustand domain store;
- widen Convex IDs to plain strings;
- inject Clerk IDs or roles into mutation arguments;
- mirror reactive Convex query results into durable browser state;
- queue mutations for later synchronization;
- clear `pack-list-storage` automatically.

See [.taskmaster/docs/CODE_PATTERNS.md](../.taskmaster/docs/CODE_PATTERNS.md) and [.taskmaster/docs/API_REFERENCE.md](../.taskmaster/docs/API_REFERENCE.md).
