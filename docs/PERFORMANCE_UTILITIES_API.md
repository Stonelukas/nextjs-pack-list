# Monitoring Reference

## Active locations

- `src/lib/monitoring/web-vitals.ts`: active Web Vitals bootstrap.
- `src/components/monitoring/monitoring.tsx`: global Vercel Analytics, Speed Insights, and Web Vitals mount.
- `src/lib/monitoring/sentry.ts`: optional Sentry React initialization and event redaction.

## Active Web Vitals integration

The root layout mounts `Monitoring` once. Its effect calls `reportWebVitals()` from `src/lib/monitoring/web-vitals.ts`; Vercel Analytics and Speed Insights mount beside it.

Do not add framework-specific app/layout callbacks. The browser entry is Vite and the route tree is React Router.

## Sentry

`src/main.tsx` initializes `@sentry/react` before React mounts when `VITE_SENTRY_DSN` is configured. The `beforeSend` hook recursively redacts authorization values, cookies, tokens, email addresses, user identifiers, mutation argument containers, and legacy payloads. Expected domain errors are not reported as unexpected failures.

No source-map upload plugin is configured in `vite.config.ts`, so source-map upload credentials are not part of the documented build contract.

## Measurement claims

Do not publish estimated Lighthouse, timing, or bundle-size values as current facts. Record measurements against the exact production artifact and environment, including the command/tool and date. The Vite build may emit a large-chunk advisory; document the advisory rather than replacing it with an unverified target.

## PWA and caching

Hashed Vite assets can use immutable CDN caching. `index.html`, `sw.js`, and Workbox update artifacts must remain revalidatable. The service worker caches static shell assets only and must not cache Convex responses or queue mutations.
