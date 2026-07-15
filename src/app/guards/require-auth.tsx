import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuthReadiness } from "@/app/auth/auth-readiness";
import {
  AccountBootstrapUnavailableState,
  AuthUnavailableState,
} from "@/app/auth/auth-status-panel";
import { useConvexUserBootstrap } from "@/app/guards/convex-user-bootstrap";
import { RouteLoading } from "@/app/loading/route-loading";

export interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const auth = useAuthReadiness();
  const bootstrap = useConvexUserBootstrap();
  const location = useLocation();

  if (auth.status === "loading") {
    return <RouteLoading label="Checking your session" />;
  }

  if (auth.status === "unavailable") {
    return (
      <AuthUnavailableState message={auth.message} onRetry={auth.retry} />
    );
  }

  if (!auth.isSignedIn) {
    const returnUrl = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        replace
        to={`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`}
      />
    );
  }

  if (bootstrap.status === "loading" || bootstrap.status === "idle") {
    return <RouteLoading label="Preparing your account" />;
  }

  if (bootstrap.status === "error") {
    return (
      <AccountBootstrapUnavailableState
        error={bootstrap.error}
        onRetry={bootstrap.retry}
      />
    );
  }

  return children;
}
