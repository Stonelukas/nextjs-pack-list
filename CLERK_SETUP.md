# Clerk React and Convex Setup

## Runtime integration

Route Ledger uses `@clerk/clerk-react`, not a framework-specific Clerk SDK.

Provider composition in `src/app/providers.tsx` is:

```text
RootErrorBoundary
  -> ThemeProvider
    -> RuntimeConfigurationProvider
      -> configured: ClerkProvider
        -> ConvexProviderWithClerk
          -> AuthReadinessProvider
            -> ConvexUserBootstrap
              -> PreferenceThemeSync
              -> RouterProvider
      -> unconfigured: UnavailableAuthReadinessProvider
        -> RouterProvider
```

`src/providers/convex-provider.tsx` passes Clerk's `useAuth` to `ConvexProviderWithClerk` only after public runtime configuration is valid. The browser transports the Clerk session to Convex; it does not send a Clerk ID or role as an authorization argument. Unconfigured startup constructs neither external provider and keeps public routing available.

## Browser configuration

Set these public Vite values in `.env.local` and in Vercel Preview/Production:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_or_live_value
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

Optional public values:

```env
VITE_APP_URL=http://localhost:5173
VITE_SENTRY_DSN=
```

Convex CLI may additionally write `VITE_CONVEX_SITE_URL=https://<deployment>.convex.site` to `.env.local`. Keep it: the build validates this public HTTP-actions metadata, and it supplies the Clerk webhook origin, but Route Ledger does not read it as browser runtime configuration and Vercel does not require it.

Do not add `CLERK_SECRET_KEY`; the active browser and Convex webhook implementation do not consume it.

## React Router authentication routes

`src/app/routes.tsx` declares:

- `/sign-in/*`
- `/sign-up/*`

The route modules under `src/features/auth/` render Clerk's `SignIn` and `SignUp` using path routing. The splat is required for nested verification, recovery, and factor steps such as `/sign-in/factor-two`.

`RequireAuth` consumes bounded auth readiness, renders authentication-unavailable recovery when Clerk does not resolve, preserves pathname/search/hash for ready signed-out redirects, and withholds protected descendants until the state-only Convex user bootstrap is ready. Bootstrap failures expose **Retry account setup** after the 15-second authentication/provisioning bound. `RequireAdmin` waits for `api.users.getCurrentAccess` and mounts administrator content only for an explicit server-returned `admin` role. These guards improve startup recovery, navigation, and loading behavior; they are not the authorization boundary.

## Convex JWT configuration

1. Create or configure the Clerk JWT template used for Convex.
2. Use application ID `convex`.
3. Copy the exact HTTPS Clerk issuer into the Convex deployment environment:

   ```env
   CLERK_JWT_ISSUER_DOMAIN=https://your-exact-clerk-issuer.example
   ```

4. Confirm the value includes `https://`. `convex/auth.config.js` rejects missing, malformed, or non-HTTPS values.

Convex resolves `identity.subject` through the `users.by_clerk_id` index. Missing roles behave as regular users; only `role: "admin"` passes `requireAdmin`.

## Signed Clerk webhook

Clerk user synchronization is hosted by Convex, not Vercel.

1. Create the endpoint:

   ```text
   https://<deployment>.convex.site/clerk-webhook
   ```

2. Subscribe to:
   - `user.created`
   - `user.updated`
   - `user.deleted`
3. Store the signing secret in the Convex deployment environment:

   ```env
   CLERK_WEBHOOK_SECRET=whsec_...
   ```

`convex/http.ts` verifies `svix-id`, `svix-timestamp`, and `svix-signature` against the raw request body before dispatching to `internal.users.upsertFromClerk` or `internal.users.deleteFromClerk`. Only a verified `public_metadata.role` value of `admin` grants administrator access; all other values map to `user`.

The Vercel origin does not host `/clerk-webhook` and must not receive the webhook secret.

## Authorization rules

- Browser callers never supply `clerkId`, `userId`, role, or email to select authorization context.
- `requireCurrentUser` maps the authenticated Clerk subject to a Convex user.
- `requireOwnedList`, `requireOwnedCategory`, and `requireOwnedItem` traverse normalized ownership.
- Administration APIs call `requireAdmin`.
- Batch reorder/move/import mutations validate the complete owned set before writing.
- Stable `ConvexError.data.code` values drive user-facing error handling.

## Local verification

```bash
bun install --frozen-lockfile
bun run check
bun run test:convex
bun run dev
```

The deterministic Vitest and Playwright boundaries do not require personal Clerk accounts. Live sign-in, JWT, authenticated Convex queries, and webhook delivery still require real Clerk/Convex development configuration.

## Troubleshooting

### Signed-in users appear unauthenticated

- Confirm the JWT template/application ID is `convex`.
- Confirm `CLERK_JWT_ISSUER_DOMAIN` is the exact HTTPS issuer in the target Convex deployment.
- Confirm the browser uses the publishable key belonging to that Clerk application.

### User exists in Clerk but not Convex

- Check Clerk webhook delivery to the `.convex.site/clerk-webhook` URL.
- Confirm all three user events are subscribed.
- Confirm `CLERK_WEBHOOK_SECRET` is set in Convex.
- Inspect Convex HTTP action logs for Svix verification or payload errors.

### Administrator route is forbidden

The trusted webhook must synchronize `public_metadata.role: "admin"`. Browser metadata, email checks, and client route guards cannot grant the role.

### Code generation cannot run

`bunx convex codegen` requires a configured `CONVEX_DEPLOYMENT`. Do not invent or commit deployment credentials.
