# Clerk Authentication Setup Guide

## Overview
Clerk authentication has been integrated into the Pack List application following the official App Router approach.

## Setup Steps

### 1. Create Clerk Account
1. Go to [https://clerk.com](https://clerk.com)
2. Sign up for a free account
3. Create a new application

### 2. Get Your API Keys
1. In the Clerk Dashboard, go to **API Keys**
2. Copy your keys:
   - **Publishable Key**: Starts with `pk_test_` or `pk_live_`
   - **Secret Key**: Starts with `sk_test_` or `sk_live_`

### 3. Configure Environment Variables
Create a `.env.local` file in the project root with your Clerk keys:

```bash
# Clerk Authentication Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# Clerk URLs (optional - defaults work fine)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Convex Configuration (if using)
NEXT_PUBLIC_CONVEX_URL=your_convex_url_here
```

### 4. Customize Authentication Pages (Optional)
If you want custom sign-in/sign-up pages instead of modals:

1. Create `app/sign-in/[[...sign-in]]/page.tsx`:
```tsx
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return <SignIn />;
}
```

2. Create `app/sign-up/[[...sign-up]]/page.tsx`:
```tsx
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return <SignUp />;
}
```

## Implementation Details

### Files Modified/Created
- **`src/middleware.ts`**: Created with `clerkMiddleware()` for authentication
- **`src/app/layout.tsx`**: Wrapped with `ClerkProvider` and added auth UI components
- **`src/contexts/auth-context.tsx`**: Updated to sync with Clerk user data
- **`.env.example`**: Added Clerk environment variable templates

### Key Components
- **ClerkProvider**: Wraps the entire application to provide auth context
- **SignInButton/SignUpButton**: Authentication triggers (currently using modals)
- **UserButton**: User menu with sign out option
- **SignedIn/SignedOut**: Conditional rendering based on auth state

### Middleware Configuration
The middleware protects routes and handles authentication:
- Skips static files and Next.js internals
- Always runs for API routes
- Can be customized to protect specific routes

## Testing

### Local Development
```bash
# Install dependencies
bun install

# Run development server
bun run dev
```

### Production Build
```bash
# Build the application
bun run build

# Start production server
bun run start
```

## Customization

### Protected Routes
To protect specific routes, update `src/middleware.ts`:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/lists(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});
```

### Custom User Data
To store additional user data, you can:
1. Use Clerk's user metadata features
2. Sync with your database (Convex) using webhooks
3. Store preferences in localStorage (current approach)

## Troubleshooting

### Missing API Keys Error
- Ensure `.env.local` exists with valid Clerk keys
- Restart the development server after adding keys

### Build Errors
- Check that all Clerk imports are from `@clerk/nextjs` or `@clerk/nextjs/server`
- Verify middleware.ts is in the `src` directory

### Authentication Not Working
- Check browser console for errors
- Verify Clerk application is active in dashboard
- Ensure environment variables are loaded correctly

## Resources
- [Clerk Documentation](https://clerk.com/docs)
- [Next.js App Router Guide](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Dashboard](https://dashboard.clerk.com)