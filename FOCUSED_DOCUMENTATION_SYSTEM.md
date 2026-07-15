# Focused Documentation Guide

Use focused documentation work to explain one current file, interface, or workflow without copying obsolete architecture.

## Current targets

Examples:

```text
src/features/lists/hooks/use-list-actions.ts
src/app/routes.tsx
src/app/providers.tsx
src/store/navigation-store.ts
src/features/legacy-migration/use-legacy-migration.ts
src/lib/monitoring/
convex/lib/authorization.ts
convex/migrations.ts
vite.config.ts
vercel.json
components.json
```

## Required context checks

Before documenting a target:

1. Read `CLAUDE.md` and `.taskmaster/docs/INDEX.md`.
2. Confirm the file exists at the repository root path being documented.
3. Inspect generated Convex contracts rather than inventing plain-string domain interfaces.
4. Separate public Vite values from Convex deployment secrets.
5. State whether behavior is production, test-only, migration-only, or historical.
6. Update the relevant Task Master reference document.

## Project-specific rules

- Route modules belong under `src/features/**` and are registered in `src/app/routes.tsx`.
- Domain reads/writes use `useLists`, `useList`, `useListActions`, `useTemplates`, `usePreferences`, and `useAdminAccess`.
- Hook examples preserve `Id<>`, `FunctionArgs`, and `FunctionReturnType`.
- Convex derives identity and authorization server-side.
- `src/store/navigation-store.ts` is presentation-only.
- `pack-list-storage` is untrusted, read-only legacy migration input.
- PWA documentation promises only a cached shell; Convex data and durable writes remain online.
- Deployment documentation publishes `dist` and uses the committed `vercel.json` SPA rewrite.

## Output types

- **Inline:** JSDoc or comments for non-obvious local behavior.
- **Reference:** exact interfaces, arguments, returns, error codes, and environment ownership.
- **Guide:** ordered operator or developer steps with runnable Bun commands.
- **Architecture:** data flow, trust boundaries, persistence ownership, and deployment shape.

## Quality checklist

- File paths exist.
- Commands exist in `package.json`.
- No unverified performance or browser-coverage claim is presented as fact.
- No server runtime or business API is implied for the Vercel static client.
- No server secret is placed behind `VITE_`.
- Links resolve relative to the document.
- Stale operational terms are either corrected or explicitly archival.
