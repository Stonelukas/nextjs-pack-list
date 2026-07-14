---
description: Launch and smoke-test the Vite browser application.
---

1. Start Vite on an isolated port with configured `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_CONVEX_URL`, and `VITE_APP_URL` values:
   `bunx vite --host 127.0.0.1 --port 4173`
2. Drive the app with Playwright at `http://127.0.0.1:4173`.
3. Public smoke routes: `/removed-next-route` for not-found recovery and `/sign-in/factor-two` for Clerk splat matching.
4. Repeat the public smoke at `390x844` to check responsive layout.
5. Authenticated list/settings/admin flows require valid local Clerk and Convex deployments; dummy endpoints only verify public routing and will emit provider initialization errors.
6. Stop the Vite process after capture.
