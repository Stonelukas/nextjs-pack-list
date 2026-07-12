# Vite React Rewrite Design

**Date:** 2026-07-12  
**Status:** Approved  
**Branch:** `feat/vite-react-rewrite`

## Objective

Replace Next.js completely with a client-rendered React 19 application built with Vite and TypeScript. Preserve the product's core packing-list capabilities while delivering a calm editorial redesign, consolidating authentication around Clerk, enforcing authorization in Convex, importing legacy browser data once, and establishing automated unit and browser testing.

The completed repository must contain no Next.js dependency, import, generated type, configuration, route convention, or documentation instruction.

## Decisions

- Use a direct in-place migration rather than maintaining parallel Next.js and Vite application trees.
- Deploy the Vite SPA to Vercel with fallback routing to `index.html`.
- Use Bun as the sole package manager and remove `package-lock.json`.
- Use Clerk as the sole identity provider for the React application and Convex.
- Fix existing TypeScript defects and Convex authorization gaps during the migration.
- Preserve core product capabilities but fully redesign the interface using a calm editorial direction.
- Keep PWA installation and static-shell caching, but require connectivity for Convex-backed data operations.
- Offer a one-time authenticated import of legacy Zustand/localStorage packing data into Convex.
- Retain `/admin`, secured in Convex, and remove seed, test, analytics-test, and Sentry-example routes.
- Consolidate settings into one `/settings` experience.
- Retain Sentry, Vercel Analytics, Vercel Speed Insights, and web vitals; remove Plausible.
- Add Vitest, Testing Library, and Playwright coverage.
- Do not push, open a pull request, or deploy without a separate explicit request.

## Architecture

### Runtime

The application is a React 19 SPA compiled by Vite. React Router owns navigation, nested layouts, dynamic parameters, search parameters, lazy route loading, route guards, and the catch-all not-found experience.

The browser application communicates directly with Convex through its React client. Convex remains the persistence and server-side policy layer. Clerk React provides browser authentication and Clerk-backed Convex identity. No Vite development or production server contains business APIs.

### Application boundaries

- `src/app/` owns provider composition, router creation, layouts, route guards, global loading, and error boundaries.
- `src/features/` groups domain-oriented code for authentication, lists, templates, settings, administration, and legacy migration.
- `src/components/` contains reusable design-system, navigation, feedback, and shared product components.
- `src/hooks/` contains focused adapters for Clerk, Convex, routing, responsive behavior, and monitoring.
- `src/lib/` contains pure validation, formatting, import/export, environment, and monitoring helpers.
- `src/store/` retains only client UI state that does not belong in Convex or URL state.
- `convex/` owns data definitions, authenticated queries and mutations, role enforcement, and the Clerk webhook.

These boundaries should be introduced incrementally where they improve migrated code. Unrelated refactoring is out of scope.

## Route model

- `/` — signed-out editorial landing page or signed-in dashboard
- `/sign-in/*` — Clerk sign-in
- `/sign-up/*` — Clerk sign-up
- `/lists` — list index with filters and search parameters
- `/lists/new` — authenticated list creation
- `/lists/:id` — authenticated list details
- `/lists/:id/edit` — authenticated list metadata editing
- `/templates` — template library and application flow
- `/categories` — authenticated cross-list category view
- `/tags` — authenticated cross-list tag view
- `/settings` — consolidated profile, account, preferences, appearance, data, and migration sections
- `/admin` — authenticated admin interface
- `*` — redesigned not-found experience

Client route guards improve navigation and signed-out UX. They are not authorization boundaries. Every sensitive Convex operation must independently authorize the current request.

## Authentication and authorization

Clerk is the only identity provider. The browser uses `@clerk/clerk-react`, and Convex uses Clerk-issued identity through `ctx.auth.getUserIdentity()`.

Convex functions must not trust a user ID, owner ID, email, or role supplied by the browser. Queries and mutations derive the current Clerk subject from authenticated identity and apply ownership checks before reading or modifying lists, categories, items, templates, user records, or settings.

Administrative functions require a server-verified role. A hard-coded client email or email substring is not sufficient. The role source must be represented in authenticated server-readable data or Clerk claims and checked inside Convex.

The mixed `@convex-dev/auth` path is removed unless a package is independently required by Convex internals after authentication consolidation.

## Data flow

React components use typed feature hooks. Feature hooks invoke generated Convex APIs and expose view-ready state and actions. URL state owns navigation-relevant filters. Convex owns durable product data. Zustand is limited to ephemeral UI state that cannot be represented locally in a component or URL.

Mutations should expose clear loading and failure states. Optimistic behavior may be used where Convex reconciliation is reliable, but failed mutations must not leave permanent local divergence.

## Legacy data migration

After an authenticated user loads the app, the migration feature detects supported legacy storage keys. If migratable content exists and migration has not been recorded, the user receives an explicit import prompt.

The importer:

1. Parses and validates legacy JSON without mutating it.
2. Presents the number of lists/templates that can be imported and any rejected records.
3. Sends normalized data to an authenticated, idempotent Convex mutation.
4. Associates all imported records with the server-derived current identity.
5. Records a migration marker only after successful persistence.
6. Clears or archives legacy storage only after success and user confirmation.

Malformed or unsupported data remains available for manual export and is never silently discarded.

## Visual design

The redesign uses a calm editorial travel-journal direction:

- warm neutral surfaces with a restrained travel-inspired accent palette;
- expressive but readable display typography paired with a highly legible interface face;
- clear content hierarchy and generous rhythm on overview screens;
- compact, efficient controls on list-detail and administration screens;
- purposeful imagery or illustration only where it reinforces product meaning;
- coherent light and dark themes rather than simple color inversion;
- subtle transitions with reduced-motion support;
- responsive navigation designed deliberately for desktop and mobile.

The redesign preserves familiar workflows while allowing layout and interaction changes that improve clarity, accessibility, or task speed.

## PWA behavior

Use `vite-plugin-pwa` to provide a valid manifest, required icons, service-worker registration, update behavior, and static application-shell caching.

Offline behavior is limited to loading cached static assets and an informative offline state. Creating or modifying Convex-backed data requires connectivity. The UI and documentation must not promise full offline editing or synchronization.

## Monitoring

- Use `@sentry/react` and the Sentry Vite plugin where source-map upload is configured.
- Use Vite-compatible Vercel Analytics and Speed Insights packages.
- Use the standard `web-vitals` package.
- Remove `@sentry/nextjs`, Next instrumentation files, the Sentry sample route/API, `next-plausible`, and Next-specific tunnels or monitor configuration.
- Expected validation and authorization errors remain user-facing and should not be reported as unexpected crashes.

## Error handling

- Global and route-level error boundaries render designed recovery states.
- Lazy route loading has accessible loading fallbacks.
- Authentication, authorization, not-found, validation, connectivity, and unexpected failures remain distinguishable.
- Convex mutation failures produce actionable feedback and preserve retryable user input.
- Legacy migration errors preserve source data.
- Unexpected client errors are reported to Sentry with sensitive data filtered.

## Testing strategy

### Static checks

- ESLint uses a Vite/React-compatible flat configuration.
- TypeScript runs in strict mode without ignored build errors.
- The production Vite build must succeed without framework-specific shims.

### Unit and component tests

Use Vitest, jsdom, React Testing Library, and user-event to cover:

- validation and normalization helpers;
- legacy migration parsing and idempotency rules;
- import/export transformations;
- route-guard behavior;
- search/filter URL-state behavior;
- important loading, empty, error, and interaction states;
- accessibility semantics for dialogs, forms, navigation, and destructive actions.

### Convex tests

Exercise authenticated identity, owner isolation, category/item ownership, template permissions, and administrative authorization. Tests must demonstrate that client-supplied IDs cannot cross tenant boundaries.

### Browser tests

Use Playwright for deterministic core journeys:

- signed-out landing and authentication route behavior;
- authenticated dashboard and list creation;
- category and item creation, editing, packing, reordering, and deletion;
- template browsing and application;
- consolidated settings and theme changes;
- one-time legacy-data import;
- denied cross-user and non-admin access;
- direct navigation and refresh on nested Vercel routes;
- responsive desktop and mobile navigation.

Where live Clerk accounts make CI unreliable, use documented test fixtures or mock service boundaries while preserving separate authorization tests at the Convex layer.

## Deployment

Vercel builds the application with Bun and publishes Vite's `dist/` directory. Rewrites send application routes to `index.html` while allowing static assets and external Convex endpoints to resolve normally.

Environment variables exposed to Vite use the `VITE_` prefix and contain only browser-safe values. Server secrets remain in Convex, Clerk, Sentry, or Vercel server-side configuration.

## Documentation updates

Update all project references that currently describe Next.js, local-only persistence, incomplete offline behavior, obsolete commands, or ignored type errors. At minimum, update:

- `README.md`
- `DEPLOYMENT.md`
- environment examples
- `.taskmaster/docs/CURRENT_WORK_SESSION.md`
- `.taskmaster/docs/FEATURE_IMPLEMENTATIONS.md`
- `.taskmaster/docs/CODE_PATTERNS.md`
- `.taskmaster/docs/API_REFERENCE.md`
- `.taskmaster/docs/TROUBLESHOOTING.md`
- `.taskmaster/docs/ARCHITECTURE.md`

## Completion criteria

The migration is complete when:

1. No Next.js dependency, import, generated type, configuration file, route convention, or documentation instruction remains.
2. Bun install, lint, strict typecheck, unit tests, Convex authorization tests, production build, and Playwright tests pass.
3. Core packing-list, template, settings, import/export, responsive navigation, and secured admin flows work.
4. Direct visits and refreshes on nested routes work on the Vercel SPA configuration.
5. PWA installation works and its online-data limitation is accurately communicated.
6. Legacy data can be imported once without silent loss or duplication.
7. Convex proves owner isolation and server-side admin enforcement.
8. The documentation accurately describes the Vite architecture and workflows.
9. Work remains on `feat/vite-react-rewrite` until the user separately requests pushing, a pull request, or deployment.
