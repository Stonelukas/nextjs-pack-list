# Route Ledger

Route Ledger is a Vite 7, React 19, and React Router 7 progressive web application for managing packing lists. Clerk provides browser identity and Convex is the authoritative backend for users, lists, categories, items, templates, preferences, and administration.

## Architecture at a glance

- `src/main.tsx` validates browser configuration, initializes Sentry, and mounts React.
- `src/app/providers.tsx` composes theme/runtime configuration first, then mounts Clerk, Convex, auth readiness, state-only account bootstrap, preference sync, and the router only for configured runtime; unconfigured public startup constructs neither Clerk nor Convex.
- `src/app/routes.tsx` defines lazy public, authenticated, administrator, Clerk splat, and not-found routes. Protected recovery belongs to `RequireAuth`, and `/templates` requires configured runtime before connected data mounts.
- `src/features/**/hooks` uses generated Convex `Id<>`, `FunctionArgs`, and `FunctionReturnType` contracts.
- Convex derives identity from `ctx.auth`; the browser never supplies a Clerk ID or role for authorization.
- Zustand and browser storage hold presentation preferences only. The historical `pack-list-storage` key is read only by the explicit one-time migration flow.
- The generated PWA service worker precaches the static shell and icons only. Convex reads and every durable write require a connection; there is no mutation queue or Background Sync.

## Prerequisite

Install [Bun](https://bun.sh/). Bun is the only application package manager supported by this repository. `bun.lock` is the only application lockfile.

## Local development

```bash
bun install
bun run dev
```

The development server defaults to `http://localhost:5173`.

For a reproducible verification or deployment install, use:

```bash
bun install --frozen-lockfile
```

## Required browser environment

Copy `.env.example` to `.env.local` and set:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_or_live_value
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

Optional public browser values:

```env
VITE_APP_URL=http://localhost:5173
VITE_SENTRY_DSN=
```

`bunx convex dev` may also maintain `VITE_CONVEX_SITE_URL=https://<deployment>.convex.site` in `.env.local`. This is public CLI metadata for HTTP actions and the Clerk webhook URL; the application does not consume it and it is not a required Vercel value.

All `VITE_*` values are public by design because Vite embeds them in the browser bundle. Never put webhook secrets, deploy keys, server credentials, or Convex-only configuration such as `CLERK_JWT_ISSUER_DOMAIN` behind a `VITE_` prefix.

Convex deployment values are configured separately:

- `CLERK_JWT_ISSUER_DOMAIN`: exact HTTPS Clerk issuer used by `convex/auth.config.js`.
- `CLERK_WEBHOOK_SECRET`: Svix signing secret used by `convex/http.ts`.
- `CONVEX_DEPLOYMENT`: local Convex project linkage.
- `CONVEX_DEPLOY_KEY`: target-scoped credential for the separate approved Convex release stage; repository CI and the Vercel static build do not receive it.

See [CLERK_SETUP.md](CLERK_SETUP.md) and [DEPLOYMENT.md](DEPLOYMENT.md).

## Commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start Vite development mode. |
| `bun run lint` | Run ESLint. |
| `bun run typecheck` | Run strict TypeScript project references. |
| `bun run test` | Run deterministic client Vitest suites. |
| `bun run build` | Typecheck and build `dist`. |
| `bun run test:build-smoke` | Validate hashed assets, Workbox/PWA files, and byte-identical SPA deep-route shells from `dist`. |
| `bun run check` | Run lint, typecheck, client tests, and production build. |
| `bun run test:convex` | Run Convex authorization, webhook, migration, and domain tests. |
| `bun run test:e2e:install` | Install local Chromium once. |
| `bun run test:e2e:install:ci` | Install Chromium and Linux dependencies on a fresh CI runner. |
| `bun run test:e2e` | Run desktop and mobile Chromium Playwright journeys. |
| `bun run preview --host 127.0.0.1 --port 4173` | Serve the production build locally. |

`bun run check` does not include `bun run test:build-smoke`, `bun run test:convex`, or `bun run test:e2e`; those are separate required gates.

The committed GitHub Actions workflow at `.github/workflows/ci.yml` pins Bun 1.3.11 and runs the frozen install, client/build check, artifact smoke, Convex suite, and two-worker/zero-retry Chromium journeys on pushes and pull requests. Its deterministic test boundary needs no live Clerk, Convex, webhook, Vercel, deployment, or Sentry secrets and performs no deployment.

## Routes

React Router owns `/`, `/sign-in/*`, `/sign-up/*`, `/lists`, `/lists/new`, `/lists/:id`, `/lists/:id/edit`, `/templates`, `/categories`, `/tags`, `/settings`, `/admin`, and the client not-found route.

`RequireAuth` and `RequireAdmin` are loading/navigation guards for user experience. Convex ownership and administrator helpers remain the security boundary.

## Legacy browser-data import

The settings route can inspect the obsolete Zustand `pack-list-storage` envelope as untrusted, read-only input. It normalizes supported records, preserves exact raw recovery data, computes a deterministic fingerprint, and submits one authenticated atomic import through `api.migrations.importLegacyData`. Source cleanup is a separate user action after Convex confirms `imported` or `already_imported`.

New code must not import or recreate `usePackListStore` or `use-convex-store`.

## PWA and offline behavior

`vite-plugin-pwa` generates `dist/manifest.webmanifest`, `dist/sw.js`, and a generated `workbox-*.js`. There is no hand-authored `public/manifest.json`.

The worker caches compiled shell assets, fonts, and explicit icons. It does not cache Convex responses. Cached pages may reopen while offline, but current domain data may be unavailable and all durable controls require reconnecting.

## Monitoring

- `@sentry/react` initializes only when `VITE_SENTRY_DSN` is set and redacts sensitive event fields.
- Vercel Analytics and Speed Insights mount globally.
- Web Vitals reporting starts from the global monitoring component.

No Sentry source-map upload plugin is configured, so this repository does not require `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, or `SENTRY_PROJECT` for the documented build.

## Vercel deployment

The committed [vercel.json](vercel.json) fixes the project contract to Bun frozen install, `bun run build`, `dist`, the Vite framework preset, and a catch-all rewrite to `/index.html` for unmatched React Router paths.

Vercel serves files that exist in `dist` before applying rewrites. Hashed `/assets/*`, `manifest.webmanifest`, `sw.js`, generated Workbox files, `robots.txt`, favicons, Apple icons, and PWA PNGs must therefore remain real files rather than returning the HTML shell. Direct nested-route refreshes preserve the requested browser URL and return the SPA shell.

Production release is two-stage: an approved owner first deploys and verifies the matching Convex backend revision, then the frontend owner verifies and promotes Vercel with `VITE_CONVEX_URL` pointing to that deployment. Repository CI tests both boundaries but deploys neither.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the Convex release stage plus local and Preview verification.

## Known environment blockers

- `bunx convex codegen` and live Convex verification require a real `CONVEX_DEPLOYMENT`.
- Authenticated runtime and Clerk webhook verification require valid Clerk/Convex development or deployment configuration.
- Local static-SPA checks do not replace a final Vercel Preview check.

## Documentation

Start with [.taskmaster/docs/INDEX.md](.taskmaster/docs/INDEX.md) for architecture, API, patterns, troubleshooting, and current-session records. Historical migration specifications and SDD reports remain archival execution records rather than active runtime instructions.
