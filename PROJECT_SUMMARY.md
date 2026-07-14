# Route Ledger Project Summary

## Current status

The application rewrite is implemented in the working tree as a Vite 7, React 19, React Router 7, Clerk React, and Convex application. Task 11 supplies the static Vercel contract and replaces stale operational documentation. No deployment is performed by this task.

## Current architecture

- Vite builds a static client into `dist`.
- React Router lazy-loads `/`, Clerk splats, list routes, templates, categories, tags, settings, admin, and client not-found recovery.
- Clerk React provides browser sessions.
- `ConvexProviderWithClerk` transports identity to Convex.
- Convex is authoritative for domain data and enforces ownership/admin authorization server-side.
- Typed hooks under `src/features/**/hooks` use generated `Id<>`, `FunctionArgs`, and `FunctionReturnType` contracts.
- Zustand stores presentation state only.
- The one-time legacy import reads `pack-list-storage` as untrusted input and commits a bounded, idempotent, atomic Convex transaction.
- `vite-plugin-pwa` generates the manifest and Workbox worker for a shell-only offline experience.

## Testing

The repository defines separate gates:

```bash
bun run check
bun run test:convex
bun run test:e2e:install      # first local Chromium installation
bun run test:e2e
```

Fresh Linux CI uses `bun run test:e2e:install:ci`. Playwright covers desktop and mobile Chromium through a deterministic Vite development boundary. It does not replace production `dist` or Vercel rewrite verification.

## Deployment

`vercel.json` configures:

- framework: `vite`
- install: `bun install --frozen-lockfile`
- build: `bun run build`
- output: `dist`
- unmatched-path rewrite: `/(.*)` to `/index.html`

Vercel's filesystem handling must serve real static assets before the rewrite. Direct React Router URLs must preserve the requested URL and receive the shell.

## PWA boundary

The service worker precaches compiled shell assets, fonts, and explicit icons. It does not cache Convex traffic, queue writes, or implement Background Sync. Cached pages may reopen for reading; current Convex data and durable changes require connectivity.

## Monitoring

- `@sentry/react` is optional through `VITE_SENTRY_DSN` and redacts sensitive event fields.
- Vercel Analytics and Speed Insights mount globally.
- Web Vitals reporting starts globally.
- No unmeasured Lighthouse, timing, or bundle-size target is asserted as a current result.

## Remaining environment-dependent verification

- `bunx convex codegen` requires `CONVEX_DEPLOYMENT`.
- Live authenticated and webhook flows require real Clerk/Convex configuration.
- A Vercel Preview deployment is required to verify platform content types, cache behavior, filesystem precedence, and nested-route refreshes.

## Historical context

The September 2025 project narrative described a different client-local architecture. It is not operational guidance. Historical specifications and SDD records remain in place as migration evidence and should not be rewritten to claim current runtime behavior.
