import { useAuth } from "@clerk/clerk-react";
import { useCallback, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

interface NavigationGuardOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  onBlocked?: () => void;
  message?: string;
}

export function useNavigationGuard({ requireAuth = false, redirectTo = "/sign-in", onBlocked, message = "You need to sign in to access this page" }: NavigationGuardOptions = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn, isLoaded } = useAuth();
  useEffect(() => {
    if (!isLoaded || !requireAuth || isSignedIn) return;
    toast.error(message);
    onBlocked?.();
    const target = `${location.pathname}${location.search}${location.hash}`;
    navigate(`${redirectTo}?redirect_url=${encodeURIComponent(target)}`, { replace: true });
  }, [isLoaded, isSignedIn, location.hash, location.pathname, location.search, message, navigate, onBlocked, redirectTo, requireAuth]);
  return { canNavigate: isLoaded && (!requireAuth || Boolean(isSignedIn)), isChecking: !isLoaded, isBlocked: isLoaded && requireAuth && !isSignedIn };
}

export function useProtectedNavigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isSignedIn, isLoaded } = useAuth();
  const navigateWithAuth = useCallback((path: string, requireAuth = true) => {
    if (!isLoaded) return;
    if (requireAuth && !isSignedIn) {
      navigate(`/sign-in?redirect_url=${encodeURIComponent(path)}`);
      toast.info("Please sign in to continue");
    } else navigate(path);
  }, [isLoaded, isSignedIn, navigate]);
  const navigateBack = (fallback = "/") => {
    if (window.history.length > 1) navigate(-1);
    else navigate(fallback);
  };
  return { navigateWithAuth, navigateBack, isAuthenticated: isSignedIn, currentPath: pathname };
}

export function useAuthRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isSignedIn, isLoaded } = useAuth();
  const handlePostAuthRedirect = useCallback(() => {
    if (!isLoaded || !isSignedIn) return;
    const redirectPath = searchParams.get("redirect_url");
    navigate(redirectPath?.startsWith("/") && !redirectPath.startsWith("//") ? redirectPath : "/", { replace: true });
  }, [isLoaded, isSignedIn, navigate, searchParams]);
  useEffect(handlePostAuthRedirect, [handlePostAuthRedirect]);
  return { handlePostAuthRedirect };
}
