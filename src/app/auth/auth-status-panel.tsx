import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UserFacingError } from "@/lib/errors";

interface AuthUnavailableStateProps {
  message: string | null;
  onRetry(): void;
}

interface AccountBootstrapUnavailableStateProps {
  error: UserFacingError | null;
  onRetry(): void;
}

const panelClassName = "mx-auto w-full max-w-lg shadow-sm";
const panelFooterClassName = "flex flex-col gap-3 sm:flex-row";

export function AuthLoadingState() {
  return (
    <Card
      aria-labelledby="auth-loading-title"
      className={panelClassName}
      role="status"
    >
      <CardHeader>
        <CardTitle as="h2" id="auth-loading-title">
          Connecting to authentication
        </CardTitle>
        <CardDescription>
          Route Ledger is checking your session before continuing.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export function AuthUnavailableState({
  message,
  onRetry,
}: AuthUnavailableStateProps) {
  return (
    <Card
      aria-labelledby="auth-unavailable-title"
      className={panelClassName}
      role="alert"
    >
      <CardHeader>
        <CardTitle as="h2" id="auth-unavailable-title">
          Authentication is unavailable
        </CardTitle>
        <CardDescription>
          {message ?? "Route Ledger could not connect to authentication."}
        </CardDescription>
      </CardHeader>
      {import.meta.env.DEV ? (
        <CardContent className="text-sm text-muted-foreground">
          For local development, confirm that VITE_CLERK_PUBLISHABLE_KEY and
          VITE_CONVEX_URL are configured. Their values are never shown here.
        </CardContent>
      ) : null}
      <CardFooter className={panelFooterClassName}>
        <Button type="button" onClick={onRetry}>
          Retry authentication
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Return home</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function AccountBootstrapUnavailableState({
  error,
  onRetry,
}: AccountBootstrapUnavailableStateProps) {
  return (
    <Card
      aria-labelledby="account-bootstrap-unavailable-title"
      className={panelClassName}
      role="alert"
    >
      <CardHeader>
        <CardTitle as="h2" id="account-bootstrap-unavailable-title">
          Account setup could not finish
        </CardTitle>
        <CardDescription>
          {error?.message ??
            "Route Ledger could not prepare your account. Try again to continue."}
        </CardDescription>
      </CardHeader>
      <CardFooter className={panelFooterClassName}>
        <Button type="button" onClick={onRetry}>
          Retry account setup
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Return home</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
