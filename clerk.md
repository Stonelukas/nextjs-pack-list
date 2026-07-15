# Clerk React Guardrails for Route Ledger

**Purpose:** Keep generated Clerk guidance aligned with the active Vite, React Router, and Convex architecture.

## Required integration

- Use `@clerk/clerk-react`.
- Mount `ClerkProvider` in `src/app/providers.tsx`.
- Pass Clerk's `useAuth` to `ConvexProviderWithClerk` in `src/providers/convex-provider.tsx`.
- Use React Router path routes `/sign-in/*` and `/sign-up/*` for Clerk nested verification/recovery steps.
- Keep `RequireAuth` as a user-experience loading/redirect guard.
- Keep `RequireAdmin` dependent on `api.users.getCurrentAccess`.
- Treat Convex helpers and mutations as the authorization boundary.

## Environment

Public browser value:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_or_live_value
```

Convex deployment values:

```env
CLERK_JWT_ISSUER_DOMAIN=https://your-exact-clerk-issuer.example
CLERK_WEBHOOK_SECRET=whsec_...
```

The Clerk JWT template/application ID for Convex is `convex`.

## Webhook

Configure Clerk to send `user.created`, `user.updated`, and `user.deleted` to:

```text
https://<deployment>.convex.site/clerk-webhook
```

`convex/http.ts` verifies Svix signatures and calls internal synchronization mutations. The Vercel static origin does not host this endpoint.

## Authorization rules

- Never accept a browser-supplied Clerk ID, user ID, email, or role as authorization context.
- Resolve `identity.subject` through `users.by_clerk_id`.
- Require explicit `admin`; missing roles are regular users.
- Traverse item ownership through category and list.
- Keep webhook synchronization functions internal.

## Do not introduce

- A framework-specific Clerk SDK or server middleware.
- Framework filesystem auth routes or server layouts.
- Framework-prefixed public-variable conventions; use the documented `VITE_*` values.
- `CLERK_SECRET_KEY` unless new server code is deliberately added and reviewed to consume it.
- Email-based administrator checks.
- A Vercel webhook/API handler for Clerk.

See [CLERK_SETUP.md](CLERK_SETUP.md) for operator setup.
