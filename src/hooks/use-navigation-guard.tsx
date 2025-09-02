"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

interface NavigationGuardOptions {
  requireAuth?: boolean;
  requireRole?: string;
  redirectTo?: string;
  onBlocked?: () => void;
  message?: string;
}

/**
 * Hook to protect routes and handle navigation guards
 */
export function useNavigationGuard(options: NavigationGuardOptions = {}) {
  const {
    requireAuth = false,
    requireRole,
    redirectTo = "/sign-in",
    onBlocked,
    message = "You need to sign in to access this page",
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn, isLoaded, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    // Check authentication requirement
    if (requireAuth && !isSignedIn) {
      toast.error(message);
      onBlocked?.();
      router.push(`${redirectTo}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check role requirement (would need to be extended with actual role checking)
    if (requireRole && isSignedIn) {
      // This is a placeholder - you would check actual user roles here
      // For now, we'll skip role checking
      // const hasRole = checkUserRole(userId, requireRole);
      // if (!hasRole) {
      //   toast.error("You don't have permission to access this page");
      //   onBlocked?.();
      //   router.push("/");
      // }
    }
  }, [isLoaded, isSignedIn, requireAuth, requireRole, pathname, router, redirectTo, message, onBlocked, userId]);

  const canNavigate = useCallback(() => {
    if (!isLoaded) return false;
    if (requireAuth && !isSignedIn) return false;
    // Add role checking here when implemented
    return true;
  }, [isLoaded, requireAuth, isSignedIn]);

  return {
    canNavigate: canNavigate(),
    isChecking: !isLoaded,
    isBlocked: isLoaded && requireAuth && !isSignedIn,
  };
}

/**
 * Hook for conditional navigation based on authentication state
 */
export function useProtectedNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();

  const navigateWithAuth = useCallback(
    (path: string, requireAuth = true) => {
      if (!isLoaded) {
        console.warn("Auth not loaded yet");
        return;
      }

      if (requireAuth && !isSignedIn) {
        // Store intended destination and redirect to sign-in
        router.push(`/sign-in?redirect=${encodeURIComponent(path)}`);
        toast.info("Please sign in to continue");
      } else {
        router.push(path);
      }
    },
    [isSignedIn, isLoaded, router]
  );

  const navigateBack = useCallback(
    (fallback = "/") => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push(fallback);
      }
    },
    [router]
  );

  return {
    navigateWithAuth,
    navigateBack,
    isAuthenticated: isSignedIn,
    currentPath: pathname,
  };
}

/**
 * Hook to handle post-authentication redirects
 */
export function useAuthRedirect() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  const handlePostAuthRedirect = useCallback(() => {
    if (!isLoaded || !isSignedIn) return;

    // Check for redirect parameter in URL
    const params = new URLSearchParams(window.location.search);
    const redirectPath = params.get("redirect");

    if (redirectPath) {
      // Validate the redirect path to prevent open redirects
      if (redirectPath.startsWith("/") && !redirectPath.startsWith("//")) {
        router.push(redirectPath);
      } else {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    handlePostAuthRedirect();
  }, [handlePostAuthRedirect]);

  return { handlePostAuthRedirect };
}