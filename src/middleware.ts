import { clerkMiddleware } from '@clerk/nextjs/server'

// This middleware runs on all routes
export default clerkMiddleware()

export const config = {
  matcher: [
    // Match all paths - this ensures Clerk middleware runs on every route
    '/(.*)',
    '/(?!monitoring)', // Exclude Sentry monitoring route
  ],
}
