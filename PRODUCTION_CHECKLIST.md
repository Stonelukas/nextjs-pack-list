# Production Readiness Checklist

Use this checklist for a release candidate. Check only results verified for the exact revision being promoted.

## Repository and install

- [ ] The Vercel project Root Directory is the repository root.
- [x] `bun.lock` is the only application lockfile.
- [x] `bun install --frozen-lockfile` succeeds in a clean environment with devDependencies present.
- [x] A clean dependency listing does not install `next`, `@next/*`, or `styled-jsx`.
- [x] `vercel.json` matches the committed Vite/Bun/`dist`/SPA contract.
- [x] `.github/workflows/ci.yml` pins Bun 1.3.11 and contains the frozen install, client/build, built-artifact smoke, Convex, Chromium-install, and Playwright gates without deployment secrets.
- [ ] Branch protection requires the committed CI workflow before merge.

## Quality gates

```bash
bun run check
bun run test:convex
```

- [x] `bun run check` passes lint, strict typecheck, 382 client Vitest tests across 88 files, and build.
- [x] ESLint exits with zero errors and 20 recorded warnings; warnings are not described as ignored application errors.
- [x] `bun run test:convex` passes 138 authorization, webhook, migration, and domain tests across seven files.
- [x] The existing >500 kB chunk advisory is recorded without claiming an unmeasured bundle target.

## Playwright

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

- [x] Desktop Chromium journeys pass.
- [x] Mobile Chromium responsive journeys pass.
- [x] All 37 Playwright cases pass on the first attempt with zero failures, skips, retries, or exclusive tests; configuration uses two workers and zero retries.
- [ ] Do not claim Firefox, Safari/WebKit, or Edge coverage unless those projects are added and run.

## Browser environment scope

Vercel Preview and Production:

- [ ] `VITE_CLERK_PUBLISHABLE_KEY` is set.
- [ ] `VITE_CONVEX_URL` is set.
- [ ] `VITE_APP_URL` is correct for the environment or intentionally omitted.
- [ ] `VITE_SENTRY_DSN` is set only when browser reporting is desired.
- [ ] Every `VITE_*` value is safe to expose publicly.

Convex deployment:

- [ ] `CLERK_JWT_ISSUER_DOMAIN` is the exact HTTPS issuer.
- [ ] Clerk's JWT template/application ID is `convex`.
- [ ] `CLERK_WEBHOOK_SECRET` is stored in Convex.
- [ ] No server secret has a `VITE_` prefix.
- [ ] A target-scoped `CONVEX_DEPLOY_KEY` is loaded only for an approved Convex release job/operator shell; repository CI and the Vercel build do not receive it.
- [ ] `CLERK_SECRET_KEY` is not documented or configured for this application.

## Convex backend release

- [ ] The release candidate is a clean, identified Git revision and the Convex deployment audit message records the same SHA as `route-ledger:<git-sha>`.
- [ ] The selected Convex production deployment is confirmed in the dashboard; its URL exactly matches the `VITE_CONVEX_URL` planned for Vercel.
- [ ] Exactly one approved target selector is active: the deployment's `CONVEX_DEPLOY_KEY`, or an authenticated checkout linked by `CONVEX_DEPLOYMENT` to the intended project's default production deployment.
- [ ] `CLERK_JWT_ISSUER_DOMAIN` and `CLERK_WEBHOOK_SECRET` exist on the target production deployment.
- [ ] `bunx convex deploy --dry-run --typecheck enable --message "route-ledger:<git-sha>"` was reviewed before the non-dry-run deploy.
- [ ] `bunx convex deploy --typecheck enable --message "route-ledger:<git-sha>"` deployed the matching backend revision from the approved release stage.
- [ ] Production function metadata contains the expected user, list, template, and migration APIs.
- [ ] Convex schema validation succeeded and required indexes are ready.
- [ ] The deployed backend remains compatible with the currently live frontend, or a coordinated release/compatibility plan is active.
- [ ] A named Convex rollback owner and any required schema/data restore plan are recorded; Vercel rollback is not treated as backend rollback.

## Clerk webhook

- [ ] Endpoint is `https://<deployment>.convex.site/clerk-webhook`.
- [ ] `user.created`, `user.updated`, and `user.deleted` are subscribed.
- [ ] Svix-signed delivery succeeds in the target Convex deployment.
- [ ] `/clerk-webhook` is not expected on the Vercel origin.

## PWA build artifacts

After `bun run build`, inspect `dist`:

- [x] `manifest.webmanifest` exists and contains Route Ledger metadata.
- [x] `sw.js` exists.
- [x] Generated `workbox-2fbc6a65.js` exists for the verified build.
- [x] `robots.txt`, `favicon.ico`, `apple-touch-icon.png`, and all PWA PNGs exist.
- [x] The verified build reports a 67-entry static-shell precache.
- [x] There is no Convex runtime cache, mutation queue, or Background Sync configuration.
- [x] Offline copy promises cached-shell reading only; durable changes require a connection.

## Local production preview

```bash
bun run build
bun run test:build-smoke
bun run preview --host 127.0.0.1 --port 4173
```

- [x] Artifact smoke dynamically discovered hashed JavaScript and CSS plus `workbox-*.js`; each returned a non-HTML body with the expected content type.
- [x] `manifest.webmanifest`, `sw.js`, Workbox, robots, favicon, Apple icon, and all PWA PNGs returned real artifacts with expected content types.
- [x] Twelve direct routes covering `/`, Clerk splats, list index/detail/edit, templates, categories, tags, settings, admin, and an unknown path returned the byte-identical SPA shell locally.

## Vercel Preview

- [ ] The exact Preview revision was built locally so generated `dist/assets/*-*.(js|css)` and `dist/workbox-*.js` filenames are known.
- [ ] One discovered hashed asset and the discovered Workbox file were fetched from Preview, returned JavaScript/CSS content types, and differed byte-for-byte from the Preview index shell.
- [ ] Existing static files take precedence over the catch-all rewrite.
- [ ] Direct nested-route refreshes work without redirecting to `/`.
- [ ] Clerk sign-in/sign-up splat steps work.
- [ ] The client not-found page handles unknown paths.
- [ ] Static assets have correct content types and sensible cache/revalidation behavior.
- [ ] Clerk can authenticate against the matching, verified Convex backend revision.
- [ ] Sentry, Analytics, Speed Insights, and Web Vitals behave as configured.

## Metadata and compatibility

Verified source artifacts:

- [x] `index.html` contains title, description, theme-color, favicon, and Apple icon metadata.
- [x] `public/robots.txt` exists.
- [x] `vite-plugin-pwa` generates the web manifest; `public/manifest.json` is absent.
- [x] React Router routes are exported from `src/app/routes.tsx`.

Still release-specific:

- [ ] Run Lighthouse and record measured results before publishing performance claims.
- [ ] Verify Open Graph/Twitter metadata if those cards are a release requirement.
- [ ] Run any non-Chromium browser checks required by the release.

## Rollback

- [ ] A known-good Vercel deployment is identified for promotion if rollback is needed.
- [ ] Convex and Clerk configuration changes have separate rollback/restore notes.
- [ ] Local recovery rebuilds `dist` from a known-good revision; it does not restore a server process.

## Known blockers

- Convex code generation and live backend verification require a real `CONVEX_DEPLOYMENT`.
- Live authenticated and webhook verification require valid Clerk/Convex configuration.
- Static local checks cannot prove Vercel platform headers and ordering; use a Preview deployment for the final platform check.
