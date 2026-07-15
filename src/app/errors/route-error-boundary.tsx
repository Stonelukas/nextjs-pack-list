import { useEffect, useRef } from "react";
import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

import { isExpectedError, mapError, type UserFacingError } from "@/lib/errors";
import { captureUnexpectedError } from "@/lib/monitoring/sentry";

const routeStatusCodes = {
  400: "VALIDATION",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
} as const;

export function mapRouteError(error: unknown): UserFacingError {
  if (isRouteErrorResponse(error) && error.status in routeStatusCodes) {
    const code = routeStatusCodes[
      error.status as keyof typeof routeStatusCodes
    ];
    const message =
      error.data &&
      typeof error.data === "object" &&
      "message" in error.data &&
      typeof error.data.message === "string"
        ? error.data.message
        : error.statusText || "The requested operation could not be completed.";
    return mapError({ data: { code, message } });
  }
  return mapError(error);
}

const NOT_REPORTED = Symbol("not-reported");

export function RouteErrorBoundary() {
  const thrownError = useRouteError();
  const error = mapRouteError(thrownError);
  const expected = isExpectedError(error);
  const reportedError = useRef<unknown>(NOT_REPORTED);

  useEffect(() => {
    if (!expected && reportedError.current !== thrownError) {
      reportedError.current = thrownError;
      captureUnexpectedError(thrownError, { boundary: "route" });
    }
  }, [expected, thrownError]);

  return (
    <section className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{error.title}</h1>
      <p className="mt-4 text-muted-foreground">{error.message}</p>
      <div className="mt-8 flex justify-center gap-4">
        {error.code === "UNAUTHENTICATED" ? (
          <Link className="underline underline-offset-4" to="/sign-in">
            Sign in
          </Link>
        ) : null}
        {error.retryable ? (
          <button
            className="underline underline-offset-4"
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        ) : null}
        <Link className="underline underline-offset-4" to="/">
          Return home
        </Link>
      </div>
    </section>
  );
}
