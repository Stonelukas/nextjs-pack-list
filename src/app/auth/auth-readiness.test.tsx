import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, MemoryRouter } from "react-router-dom";

import {
  AUTH_READINESS_TIMEOUT_MS,
  AuthReadinessProvider,
  UnavailableAuthReadinessProvider,
  useAuthReadiness,
} from "@/app/auth/auth-readiness";
import {
  AccountBootstrapUnavailableState,
  AuthLoadingState,
  AuthUnavailableState,
} from "@/app/auth/auth-status-panel";
import { AppProviders } from "@/app/providers";
import {
  loadingAuth,
  regularUserScenario,
  resetTestRuntime,
  signedInAuth,
  signedOutAuth,
} from "@/test/mocks/runtime";

vi.mock("@/app/router", () => ({ router: null }));

function ReadinessProbe() {
  const readiness = useAuthReadiness();

  return (
    <div>
      <span>{readiness.status}</span>
      <span>{readiness.isSignedIn ? "signed-in" : "signed-out"}</span>
      <span>{readiness.userId ?? "no-user"}</span>
      <span>{readiness.message ?? "no-message"}</span>
      <button type="button" onClick={readiness.retry}>
        Retry authentication
      </button>
    </div>
  );
}

function prepareAuth(auth: ReturnType<typeof loadingAuth>) {
  const scenario = regularUserScenario();
  scenario.auth = auth;
  return resetTestRuntime(scenario);
}

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("AuthReadinessProvider", () => {
  it("uses an exact ten-second readiness timeout", () => {
    expect(AUTH_READINESS_TIMEOUT_MS).toBe(10_000);
  });

  it("becomes unavailable after ten seconds", async () => {
    vi.useFakeTimers();
    prepareAuth(loadingAuth());

    render(
      <AuthReadinessProvider providerAttempt={0} retry={vi.fn()}>
        <ReadinessProbe />
      </AuthReadinessProvider>,
    );

    expect(screen.getByText("loading")).toBeVisible();
    expect(vi.getTimerCount()).toBe(1);

    await act(() => vi.advanceTimersByTimeAsync(10_000));

    expect(screen.getByText("unavailable")).toBeVisible();
    expect(screen.queryByText("loading")).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("owns only one timeout while Clerk is loading", () => {
    vi.useFakeTimers();
    prepareAuth(loadingAuth());
    const retry = vi.fn();
    const { rerender } = render(
      <AuthReadinessProvider providerAttempt={0} retry={retry}>
        <ReadinessProbe />
      </AuthReadinessProvider>,
    );

    rerender(
      <AuthReadinessProvider providerAttempt={0} retry={retry}>
        <ReadinessProbe />
      </AuthReadinessProvider>,
    );

    expect(vi.getTimerCount()).toBe(1);
  });

  it("cancels the timeout when Clerk becomes ready", async () => {
    vi.useFakeTimers();
    const runtime = prepareAuth(loadingAuth());

    render(
      <AuthReadinessProvider providerAttempt={0} retry={vi.fn()}>
        <ReadinessProbe />
      </AuthReadinessProvider>,
    );

    await act(async () => {
      runtime.setAuth(signedOutAuth());
    });

    expect(screen.getByText("ready")).toBeVisible();
    expect(screen.getByText("signed-out")).toBeVisible();
    expect(screen.getByText("no-user")).toBeVisible();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cancels the timeout when unmounted while Clerk is loading", () => {
    vi.useFakeTimers();
    prepareAuth(loadingAuth());

    const { unmount } = render(
      <AuthReadinessProvider providerAttempt={0} retry={vi.fn()}>
        <ReadinessProbe />
      </AuthReadinessProvider>,
    );

    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it("reports the ready signed-in identity", () => {
    const auth = signedInAuth();
    prepareAuth(auth);

    render(
      <AuthReadinessProvider providerAttempt={0} retry={vi.fn()}>
        <ReadinessProbe />
      </AuthReadinessProvider>,
    );

    expect(screen.getByText("ready")).toBeVisible();
    expect(screen.getByText("signed-in")).toBeVisible();
    expect(screen.getByText(auth.user?.id ?? "missing-user")).toBeVisible();
    expect(screen.getByText("no-message")).toBeVisible();
  });

  it("resets unavailable state when the provider attempt changes", async () => {
    vi.useFakeTimers();
    prepareAuth(loadingAuth());
    const retry = vi.fn();
    const { rerender } = render(
      <AuthReadinessProvider providerAttempt={0} retry={retry}>
        <ReadinessProbe />
      </AuthReadinessProvider>,
    );

    await act(() => vi.advanceTimersByTimeAsync(AUTH_READINESS_TIMEOUT_MS));
    expect(screen.getByText("unavailable")).toBeVisible();

    rerender(
      <AuthReadinessProvider providerAttempt={1} retry={retry}>
        <ReadinessProbe />
      </AuthReadinessProvider>,
    );

    expect(screen.getByText("loading")).toBeVisible();
    expect(vi.getTimerCount()).toBe(1);
  });

  it("requests a provider remount on retry", async () => {
    const retry = vi.fn();
    const user = userEvent.setup();

    render(
      <UnavailableAuthReadinessProvider retry={retry}>
        <ReadinessProbe />
      </UnavailableAuthReadinessProvider>,
    );

    expect(screen.getByText("unavailable")).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Retry authentication" }),
    );

    expect(retry).toHaveBeenCalledOnce();
  });

  it("remounts the configured Clerk and Convex subtree on retry", async () => {
    prepareAuth(signedOutAuth());
    const mounted = vi.fn();
    const unmounted = vi.fn();

    function ProviderMountProbe() {
      const { retry } = useAuthReadiness();

      useEffect(() => {
        mounted();
        return unmounted;
      }, []);

      return (
        <button type="button" onClick={retry}>
          Retry authentication
        </button>
      );
    }

    const routerInstance = createMemoryRouter([
      { path: "/", element: <ProviderMountProbe /> },
    ]);
    const user = userEvent.setup();

    render(
      <AppProviders
        routerInstance={routerInstance}
        runtimeConfiguration={{
          status: "configured",
          env: {
            clerkPublishableKey: "pk_test_route_ledger_vitest",
            convexUrl: "https://route-ledger-vitest.convex.cloud",
            appUrl: "http://127.0.0.1:4173",
            sentryDsn: undefined,
          },
        }}
      />,
    );

    expect(mounted).toHaveBeenCalledOnce();
    expect(unmounted).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Retry authentication" }),
    );

    expect(unmounted).toHaveBeenCalledOnce();
    expect(mounted).toHaveBeenCalledTimes(2);
  });
});

describe("auth status panels", () => {
  it("renders an accessible loading card", () => {
    render(<AuthLoadingState />);

    expect(screen.getByRole("status")).toHaveAccessibleName(
      "Connecting to authentication",
    );
  });

  it("renders authentication recovery actions without configuration values", () => {
    const secretValue = "pk_test_secret-value-that-must-not-render";

    render(
      <MemoryRouter>
        <AuthUnavailableState
          message="Authentication did not become ready."
          onRetry={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Authentication is unavailable" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Retry authentication" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Return home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.queryByText(secretValue)).not.toBeInTheDocument();
  });

  it("renders account bootstrap recovery actions", () => {
    render(
      <MemoryRouter>
        <AccountBootstrapUnavailableState
          error={{
            code: "UNEXPECTED",
            title: "Account setup failed",
            message: "The account record could not be prepared.",
            retryable: true,
          }}
          onRetry={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Account setup could not finish" }),
    ).toBeVisible();
    expect(screen.getByText("The account record could not be prepared.")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Retry account setup" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Return home" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
