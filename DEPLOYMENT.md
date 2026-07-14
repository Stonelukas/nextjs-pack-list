# Static Vercel Deployment

Route Ledger is a static Vite single-page application. Vercel builds and serves `dist`; the browser talks directly to Clerk and Convex. There is no application server, Vercel business API, process manager, container runtime, or application health endpoint in this repository.

## Committed Vercel contract

The repository-root `vercel.json` is authoritative:

```json
{"$schema":"https://openapi.vercel.sh/vercel.json","framework":"vite","installCommand":"bun install --frozen-lockfile","buildCommand":"bun run build","outputDirectory":"dist","rewrites":[{"source":"/(.*)","destination":"/index.html"}]}
```

In the Vercel project:

1. Set **Root Directory** to the repository root.
2. Remove dashboard build overrides, or make them exactly match `vercel.json`.
3. Install all dependencies, including devDependencies required by TypeScript and Vite. Never use `bun install --production` for the build.
4. Do not add `cleanUrls`, functions, API routes, a server runtime, or a competing `routes` array.

## SPA rewrite and static-file precedence

Vercel serves an existing file from `dist` before applying `rewrites`. The catch-all rewrite is for unmatched paths only.

These paths must return their real files and content types, never `index.html`:

- `/assets/*`
- `/manifest.webmanifest`
- `/sw.js`
- `/workbox-*.js`
- `/robots.txt`
- `/favicon.ico`
- `/apple-touch-icon.png`
- `/pwa-192x192.png`
- `/pwa-512x512.png`
- `/pwa-maskable-512x512.png`

Do not add a negative-lookahead rewrite unless a future Vercel platform change proves filesystem precedence is no longer sufficient.

Unmatched browser routes preserve their URL and receive `/index.html`, including:

- `/sign-in/factor-two` and other `/sign-in/*` steps
- `/sign-up/*`
- `/lists`, `/lists/:id`, and `/lists/:id/edit`
- `/templates`, `/categories`, `/tags`, `/settings`, and `/admin`
- unknown paths handled by the React Router not-found page

The rewrite is not a redirect to `/`.

## Environment placement

### Vercel Preview and Production

Required public browser/build values:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_or_live_value
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

Optional public values:

```env
VITE_APP_URL=https://your-environment.example
VITE_SENTRY_DSN=
```

`VITE_APP_URL` may be omitted; the application then uses `window.location.origin`. Every `VITE_*` value is embedded in client JavaScript and is public by design.

Local `bunx convex dev` may write `VITE_CONVEX_SITE_URL=https://<deployment>.convex.site` for HTTP actions. The build allowlists and validates this public metadata, but Route Ledger does not consume it and Vercel Preview/Production does not require it. Use the exact `.convex.site` value as the Clerk webhook origin.

Do not configure `CLERK_WEBHOOK_SECRET`, `CLERK_JWT_ISSUER_DOMAIN`, `CONVEX_DEPLOY_KEY`, or any other server credential with a `VITE_` prefix.

### Convex deployment environment

Configure through the intended Convex deployment, not the Vite bundle:

```env
CLERK_JWT_ISSUER_DOMAIN=https://your-exact-clerk-issuer.example
CLERK_WEBHOOK_SECRET=whsec_...
```

- `convex/auth.config.js` requires a valid HTTPS issuer and application ID `convex`.
- `convex/http.ts` verifies Svix headers and the raw body before calling internal user synchronization mutations.
- `CONVEX_DEPLOYMENT` links a local checkout to a Convex project; `bunx convex deploy` then targets that project's default production deployment.
- `CONVEX_DEPLOY_KEY` is a target-scoped secret for an approved Convex release job or operator shell. Repository CI and the static Vercel build do not consume it.
- Use exactly one approved deployment selector for a release and confirm the target in the Convex dashboard before running a non-dry-run deploy.
- `CLERK_SECRET_KEY` is not consumed by this application and must not be added to the documented environment.

## Clerk JWT and webhook setup

1. In Clerk, create/configure the JWT template used for Convex with application ID `convex`.
2. Copy the exact HTTPS Clerk issuer into Convex as `CLERK_JWT_ISSUER_DOMAIN`.
3. Create a Clerk webhook endpoint at:

   ```text
   https://<deployment>.convex.site/clerk-webhook
   ```

4. Subscribe to `user.created`, `user.updated`, and `user.deleted`.
5. Store the webhook signing secret as `CLERK_WEBHOOK_SECRET` in Convex.

The Vercel origin does not host `/clerk-webhook`.

## Convex backend release stage

The frontend build does not deploy Convex. A release owner must deploy the matching `convex/` schema, indexes, functions, migrations, authorization code, and HTTP webhook separately from the exact source revision being promoted.

### Select and preflight the target

Use one of these approved selectors, never both implicitly:

- **Release CI/operator shell:** load the production deployment's target-scoped `CONVEX_DEPLOY_KEY` from the secret manager. The key selects its associated deployment.
- **Authenticated linked checkout:** configure the intended project through the Convex setup flow so `CONVEX_DEPLOYMENT` names the linked development deployment. `bunx convex deploy` targets that project's default production deployment.

Before a non-dry-run deploy:

1. Start from a clean checkout of the release candidate and record `git rev-parse HEAD`.
2. Confirm the selected Convex project and production deployment in the dashboard. The deployment URL must be the value planned for Vercel's `VITE_CONVEX_URL`.
3. Confirm `CLERK_JWT_ISSUER_DOMAIN` and `CLERK_WEBHOOK_SECRET` exist on that production deployment. From a linked operator checkout, list names without printing secret values:

   ```bash
   bunx convex env list --prod --names-only
   ```

4. Review the generated deployment plan without changing the backend:

   ```bash
   REVISION="$(git rev-parse HEAD)"
   bunx convex deploy --dry-run --typecheck enable --message "route-ledger:$REVISION"
   ```

### Deploy and verify

After approval, deploy from the same clean revision:

```bash
REVISION="$(git rev-parse HEAD)"
bunx convex deploy --typecheck enable --message "route-ledger:$REVISION"
```

The deploy typechecks Convex, regenerates generated API code, and pushes functions, indexes, and schema. Do not add this command to `vercel.json` or the repository CI test workflow.

Post-deploy checks owned by the Convex release owner:

1. Confirm the Convex deployment audit log contains `route-ledger:<git-sha>` for the release candidate.
2. Inspect production function metadata and confirm expected public APIs such as `users:getCurrentAccess`, list/template operations, and `migrations:importLegacyData` are present:

   ```bash
   bunx convex function-spec --prod
   ```

3. In the Convex dashboard, confirm schema validation succeeded and all required indexes are ready before frontend promotion.
4. Send a Svix-signed Clerk test delivery to `https://<deployment>.convex.site/clerk-webhook`, then inspect Clerk delivery status and Convex logs:

   ```bash
   bunx convex logs --prod --history 50
   ```

5. Verify a real Clerk session can query the target deployment and that tenant/admin authorization behaves as expected.

Deploy Convex before promoting Vercel only when the backend remains compatible with the currently live frontend. If this revision removes or changes APIs used by the live frontend, use a coordinated release window or first deploy a backward-compatible backend; never leave an incompatible frontend/backend pair running.

### Release sequence and rollback ownership

1. Repository CI and release-candidate checks pass for the exact revision.
2. The Convex release owner deploys and verifies the matching backend revision.
3. Vercel Preview uses that deployment's URL and passes static, route, Clerk, and Convex checks.
4. The frontend release owner promotes Vercel Production.

A Vercel rollback does not roll back Convex. The Convex release owner must redeploy the last known-good backend revision when function rollback is required. Schema or data changes that are not backward-reversible require a pre-approved restore/migration plan and ownership before release.

## Local verification

Use a clean frozen Bun install and all quality gates:

```bash
bun install --frozen-lockfile
bun run check
bun run test:convex
bun run build
bun run test:build-smoke
bun run preview --host 127.0.0.1 --port 4173
```

`bun run test:build-smoke` already discovers the exact hashed JS/CSS and Workbox filename, validates manifest/worker/icons, and byte-compares 12 deep routes with `dist/index.html`. Keep the manual preview checks below as operator-visible evidence and to include `robots.txt`:

```bash
set -euo pipefail

BASE_URL=http://127.0.0.1:4173
ASSET_FILE="$(find dist/assets -maxdepth 1 -type f \( -name '*-*.js' -o -name '*-*.css' \) -print -quit)"
WORKBOX_FILE="$(find dist -maxdepth 1 -type f -name 'workbox-*.js' -print -quit)"
test -n "$ASSET_FILE"
test -n "$WORKBOX_FILE"

ASSET_PATH="/${ASSET_FILE#dist/}"
WORKBOX_PATH="/${WORKBOX_FILE#dist/}"
ASSET_BODY="$(mktemp)"
WORKBOX_BODY="$(mktemp)"
ROUTE_BODY="$(mktemp)"
trap 'rm -f "$ASSET_BODY" "$WORKBOX_BODY" "$ROUTE_BODY"' EXIT

ASSET_TYPE="$(curl --fail --silent --show-error --output "$ASSET_BODY" --write-out '%{content_type}' "$BASE_URL$ASSET_PATH")"
WORKBOX_TYPE="$(curl --fail --silent --show-error --output "$WORKBOX_BODY" --write-out '%{content_type}' "$BASE_URL$WORKBOX_PATH")"

case "$ASSET_FILE:$ASSET_TYPE" in
  *.js:*javascript*|*.css:text/css*) ;;
  *) printf 'Unexpected content type for %s: %s\n' "$ASSET_PATH" "$ASSET_TYPE" >&2; exit 1 ;;
esac
case "$WORKBOX_TYPE" in
  *javascript*) ;;
  *) printf 'Unexpected content type for %s: %s\n' "$WORKBOX_PATH" "$WORKBOX_TYPE" >&2; exit 1 ;;
esac

if cmp -s "$ASSET_BODY" dist/index.html; then
  printf '%s was rewritten to index.html\n' "$ASSET_PATH" >&2
  exit 1
fi
if cmp -s "$WORKBOX_BODY" dist/index.html; then
  printf '%s was rewritten to index.html\n' "$WORKBOX_PATH" >&2
  exit 1
fi

for static_path in manifest.webmanifest sw.js robots.txt favicon.ico apple-touch-icon.png; do
  curl --fail --silent --show-error --dump-header - --output /dev/null "$BASE_URL/$static_path"
done

for route_path in lists/example sign-in/factor-two; do
  curl --fail --silent --show-error --output "$ROUTE_BODY" "$BASE_URL/$route_path"
  cmp -s "$ROUTE_BODY" dist/index.html
done
```

The generated asset and Workbox response types must match their file types, their bodies must differ from `dist/index.html`, and each nested route must equal the SPA shell. A local Vite preview verifies the generated output and SPA fallback; the Vercel Preview deployment remains the final proof of platform ordering, cache headers, and content types.

## Playwright

Playwright is a separate deterministic application-flow gate. It intentionally runs the flagged Vite e2e development boundary rather than `dist`, so it does not prove the Vercel rewrite.

Local first run:

```bash
bun run test:e2e:install
bun run test:e2e
```

Fresh Linux CI runner:

```bash
bun run test:e2e:install:ci
bun run test:e2e
```

## PWA caching semantics

`vite-plugin-pwa` owns `manifest.webmanifest`, `sw.js`, and Workbox output.

- Hashed files under `dist/assets` are content-addressed and can be cached immutably by the CDN.
- `index.html`, `sw.js`, and generated Workbox update files must remain revalidatable so new revisions are discovered.
- The service worker precaches the static shell and explicit icons only.
- No Convex response, authenticated domain data, mutation, or background-sync queue is cached by the service worker.

## Monitoring

- `@sentry/react` uses the optional public `VITE_SENTRY_DSN` and filters sensitive event data before sending.
- Vercel Analytics and Speed Insights are client integrations.
- Web Vitals reporting mounts globally.
- No `@sentry/nextjs` package, framework wizard, or source-map upload plugin is part of the active build.

## Vercel Preview verification

Build the exact Preview revision locally first, then use its generated filenames to test the deployed output. Set `PREVIEW_URL` to the deployment origin without a trailing slash:

```bash
set -euo pipefail

PREVIEW_URL=https://your-preview.example
ASSET_FILE="$(find dist/assets -maxdepth 1 -type f \( -name '*-*.js' -o -name '*-*.css' \) -print -quit)"
WORKBOX_FILE="$(find dist -maxdepth 1 -type f -name 'workbox-*.js' -print -quit)"
test -n "$ASSET_FILE"
test -n "$WORKBOX_FILE"

ASSET_PATH="/${ASSET_FILE#dist/}"
WORKBOX_PATH="/${WORKBOX_FILE#dist/}"
INDEX_BODY="$(mktemp)"
ASSET_BODY="$(mktemp)"
WORKBOX_BODY="$(mktemp)"
trap 'rm -f "$INDEX_BODY" "$ASSET_BODY" "$WORKBOX_BODY"' EXIT

curl --fail --silent --show-error --output "$INDEX_BODY" "$PREVIEW_URL/"
ASSET_TYPE="$(curl --fail --silent --show-error --output "$ASSET_BODY" --write-out '%{content_type}' "$PREVIEW_URL$ASSET_PATH")"
WORKBOX_TYPE="$(curl --fail --silent --show-error --output "$WORKBOX_BODY" --write-out '%{content_type}' "$PREVIEW_URL$WORKBOX_PATH")"

case "$ASSET_FILE:$ASSET_TYPE" in
  *.js:*javascript*|*.css:text/css*) ;;
  *) printf 'Unexpected content type for %s: %s\n' "$ASSET_PATH" "$ASSET_TYPE" >&2; exit 1 ;;
esac
case "$WORKBOX_TYPE" in
  *javascript*) ;;
  *) printf 'Unexpected content type for %s: %s\n' "$WORKBOX_PATH" "$WORKBOX_TYPE" >&2; exit 1 ;;
esac

if cmp -s "$ASSET_BODY" "$INDEX_BODY" || cmp -s "$ASSET_BODY" dist/index.html; then
  printf '%s matched an index shell instead of its generated asset body\n' "$ASSET_PATH" >&2
  exit 1
fi
if cmp -s "$WORKBOX_BODY" "$INDEX_BODY" || cmp -s "$WORKBOX_BODY" dist/index.html; then
  printf '%s matched an index shell instead of its generated Workbox body\n' "$WORKBOX_PATH" >&2
  exit 1
fi
```

Before promoting a deployment, also verify:

1. The root and direct nested-route refreshes return the application.
2. Clerk splat paths remain on their original URL.
3. Unknown paths reach the client not-found page.
4. Static assets return correct bytes, content types, and sensible cache behavior.
5. `manifest.webmanifest`, `sw.js`, the discovered Workbox file, robots, and icons are not rewritten to HTML.
6. Clerk authentication can reach the matching Convex backend revision.
7. `/clerk-webhook` is not expected on the Vercel origin.

## Rollback and recovery

The frontend release owner uses Vercel's deployment history to promote a known-good static deployment. The Convex release owner separately redeploys a known-good backend revision and owns any approved schema/data restoration procedure. Clerk JWT or webhook configuration is restored in Clerk/Convex by the identity/backend owner. For local recovery, rebuild `dist` from a known-good revision with a frozen Bun install; never assume one platform's rollback changes the others.

## Known blockers

- Convex code generation and live backend verification require a real `CONVEX_DEPLOYMENT`.
- Authenticated route and webhook verification require valid Clerk/Convex configuration.
- Do not invent or commit deployment identifiers, deploy keys, webhook secrets, or Clerk credentials.
