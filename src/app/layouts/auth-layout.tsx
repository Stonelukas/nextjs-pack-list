import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuthReadiness } from "@/app/auth/auth-readiness";
import {
  AuthLoadingState,
  AuthUnavailableState,
} from "@/app/auth/auth-status-panel";

export function AuthLayout() {
  const auth = useAuthReadiness();
  const location = useLocation();

  if (auth.status === "ready" && auth.isSignedIn) {
    const requestedDestination = new URLSearchParams(location.search).get(
      "redirect_url",
    );
    const destination =
      requestedDestination?.startsWith("/") &&
      !requestedDestination.startsWith("//") &&
      !requestedDestination.startsWith("/sign-in") &&
      !requestedDestination.startsWith("/sign-up")
        ? requestedDestination
        : "/lists";

    return <Navigate to={destination} replace />;
  }

  const content =
    auth.status === "loading" ? (
      <AuthLoadingState />
    ) : auth.status === "unavailable" ? (
      <AuthUnavailableState message={auth.message} onRetry={auth.retry} />
    ) : (
      <Outlet />
    );

  return (
    <section className="auth-layout" data-auth-layout>
      <div className="auth-layout__panel">
        <div className="auth-layout__context">
          <p className="auth-layout__eyebrow">Route Ledger</p>
          <div>
            <h1>Pack from a list you trust.</h1>
            <p>
              Keep routes, reusable templates, and departure checks in one
              quiet workspace.
            </p>
          </div>
          <p className="auth-layout__note">
            Lists · Templates · Departure checks
          </p>
        </div>

        <div className="auth-layout__form">{content}</div>
      </div>
    </section>
  );
}
