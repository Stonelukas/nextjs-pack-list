// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  authStatus: "ready" as "loading" | "ready" | "unavailable",
  signedIn: true,
  userId: "clerk-user" as string | null,
  convexAuthenticated: false,
  convexLoading: true,
  ensureCurrentUser: vi.fn(),
}));

vi.mock("@/app/auth/auth-readiness", () => ({
  useAuthReadiness: () => ({
    status: state.authStatus,
    isSignedIn: state.authStatus === "ready" && state.signedIn,
    userId:
      state.authStatus === "ready" && state.signedIn ? state.userId : null,
    message: null,
    retry: vi.fn(),
  }),
}));
vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => {
    throw new Error("ConvexUserBootstrap must consume auth readiness");
  },
}));
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({
    isAuthenticated: state.convexAuthenticated,
    isLoading: state.convexLoading,
  }),
  useMutation: () => state.ensureCurrentUser,
}));
vi.mock("../../../convex/_generated/api", () => ({
  api: { users: { ensureCurrentUser: Symbol("ensureCurrentUser") } },
}));

import * as BootstrapModule from "./convex-user-bootstrap";

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, reject, resolve };
}

function BootstrapProbe() {
  const bootstrap = BootstrapModule.useConvexUserBootstrap();

  return (
    <div>
      <p>Router child</p>
      <output data-testid="bootstrap-status">{bootstrap.status}</output>
      <output data-testid="bootstrap-error">
        {bootstrap.error?.message ?? "no-error"}
      </output>
      <output data-testid="bootstrap-retryable">
        {bootstrap.error?.retryable ? "retryable" : "not-retryable"}
      </output>
      <button type="button" onClick={bootstrap.retry}>
        Retry account setup
      </button>
    </div>
  );
}

beforeEach(() => {
  state.authStatus = "ready";
  state.signedIn = true;
  state.userId = "clerk-user";
  state.convexAuthenticated = false;
  state.convexLoading = true;
  state.ensureCurrentUser.mockReset();
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ConvexUserBootstrap", () => {
  it("uses an exact fifteen-second account bootstrap timeout", () => {
    expect(
      (
        BootstrapModule as typeof BootstrapModule & {
          ACCOUNT_BOOTSTRAP_TIMEOUT_MS?: number;
        }
      ).ACCOUNT_BOOTSTRAP_TIMEOUT_MS,
    ).toBe(15_000);
  });

  it("lets route guards own unresolved authentication without starting a timeout", () => {
    vi.useFakeTimers();
    state.authStatus = "loading";

    render(
      <BootstrapModule.ConvexUserBootstrap>
        <BootstrapProbe />
      </BootstrapModule.ConvexUserBootstrap>,
    );

    expect(screen.getByText("Router child")).toBeVisible();
    expect(screen.getByTestId("bootstrap-status")).toHaveTextContent("idle");
    expect(state.ensureCurrentUser).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps router children mounted while Convex authentication is pending", () => {
    render(
      <BootstrapModule.ConvexUserBootstrap>
        <BootstrapProbe />
      </BootstrapModule.ConvexUserBootstrap>,
    );

    expect(screen.getByText("Router child")).toBeVisible();
    expect(screen.getByTestId("bootstrap-status")).toHaveTextContent("loading");
    expect(state.ensureCurrentUser).not.toHaveBeenCalled();
  });

  it("creates a missing local user once and publishes ready state", async () => {
    const ensuring = deferred<string>();
    state.convexAuthenticated = true;
    state.convexLoading = false;
    state.ensureCurrentUser.mockReturnValue(ensuring.promise);

    render(
      <BootstrapModule.ConvexUserBootstrap>
        <BootstrapProbe />
      </BootstrapModule.ConvexUserBootstrap>,
    );

    await waitFor(() => expect(state.ensureCurrentUser).toHaveBeenCalledTimes(1));
    expect(state.ensureCurrentUser).toHaveBeenCalledWith({});
    expect(screen.getByText("Router child")).toBeVisible();
    expect(screen.getByTestId("bootstrap-status")).toHaveTextContent("loading");

    await act(async () => ensuring.resolve("user-created"));

    expect(screen.getByTestId("bootstrap-status")).toHaveTextContent("ready");
    expect(state.ensureCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("publishes a retryable error while keeping router children mounted", async () => {
    state.convexAuthenticated = true;
    state.convexLoading = false;
    state.ensureCurrentUser.mockRejectedValue(new Error("provisioning failed"));

    render(
      <BootstrapModule.ConvexUserBootstrap>
        <BootstrapProbe />
      </BootstrapModule.ConvexUserBootstrap>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("bootstrap-status")).toHaveTextContent("error"),
    );
    expect(screen.getByText("Router child")).toBeVisible();
    expect(screen.getByTestId("bootstrap-error")).not.toHaveTextContent(
      "no-error",
    );
    expect(screen.getByTestId("bootstrap-retryable")).toHaveTextContent(
      "retryable",
    );
  });

  it("bounds pending Convex authentication and clears the timeout immediately", async () => {
    vi.useFakeTimers();

    render(
      <BootstrapModule.ConvexUserBootstrap>
        <BootstrapProbe />
      </BootstrapModule.ConvexUserBootstrap>,
    );

    expect(screen.getByTestId("bootstrap-status")).toHaveTextContent("loading");
    expect(vi.getTimerCount()).toBe(1);

    await act(() =>
      vi.advanceTimersByTimeAsync(
        ((BootstrapModule as { ACCOUNT_BOOTSTRAP_TIMEOUT_MS?: number })
          .ACCOUNT_BOOTSTRAP_TIMEOUT_MS ?? 15_000) - 1,
      ),
    );
    expect(screen.getByTestId("bootstrap-status")).toHaveTextContent("loading");

    await act(() => vi.advanceTimersByTimeAsync(1));

    expect(screen.getByTestId("bootstrap-status")).toHaveTextContent("error");
    expect(screen.getByTestId("bootstrap-retryable")).toHaveTextContent(
      "retryable",
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it("bounds pending user provisioning and ignores its late completion", async () => {
    vi.useFakeTimers();
    const ensuring = deferred<string>();
    state.convexAuthenticated = true;
    state.convexLoading = false;
    state.ensureCurrentUser.mockReturnValue(ensuring.promise);

    render(
      <BootstrapModule.ConvexUserBootstrap>
        <BootstrapProbe />
      </BootstrapModule.ConvexUserBootstrap>,
    );

    expect(state.ensureCurrentUser).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(1);

    await act(() => vi.advanceTimersByTimeAsync(15_000));

    expect(screen.getByTestId("bootstrap-status")).toHaveTextContent("error");
    expect(vi.getTimerCount()).toBe(0);

    await act(async () => ensuring.resolve("late-user"));

    expect(screen.getByTestId("bootstrap-status")).toHaveTextContent("error");
  });

  it("can retry after bounded Convex authentication failure", async () => {
    vi.useFakeTimers();

    render(
      <BootstrapModule.ConvexUserBootstrap>
        <BootstrapProbe />
      </BootstrapModule.ConvexUserBootstrap>,
    );

    await act(() => vi.advanceTimersByTimeAsync(15_000));
    expect(screen.getByTestId("bootstrap-status")).toHaveTextContent("error");

    state.convexAuthenticated = true;
    state.convexLoading = false;
    state.ensureCurrentUser.mockResolvedValue("user-created");
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Retry account setup" }),
      );
    });

    expect(state.ensureCurrentUser).toHaveBeenCalledOnce();
    expect(screen.getByTestId("bootstrap-status")).toHaveTextContent("ready");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears the provisioning timeout immediately when setup becomes ready", async () => {
    vi.useFakeTimers();
    const ensuring = deferred<string>();
    state.convexAuthenticated = true;
    state.convexLoading = false;
    state.ensureCurrentUser.mockReturnValue(ensuring.promise);

    render(
      <BootstrapModule.ConvexUserBootstrap>
        <BootstrapProbe />
      </BootstrapModule.ConvexUserBootstrap>,
    );

    expect(vi.getTimerCount()).toBe(1);

    await act(async () => ensuring.resolve("user-created"));

    expect(screen.getByTestId("bootstrap-status")).toHaveTextContent("ready");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears the provisioning timeout immediately when setup fails", async () => {
    vi.useFakeTimers();
    const ensuring = deferred<string>();
    state.convexAuthenticated = true;
    state.convexLoading = false;
    state.ensureCurrentUser.mockReturnValue(ensuring.promise);

    render(
      <BootstrapModule.ConvexUserBootstrap>
        <BootstrapProbe />
      </BootstrapModule.ConvexUserBootstrap>,
    );

    expect(vi.getTimerCount()).toBe(1);

    await act(async () => ensuring.reject(new Error("provisioning failed")));

    expect(screen.getByTestId("bootstrap-status")).toHaveTextContent("error");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears the active timeout before starting a retry attempt", () => {
    vi.useFakeTimers();
    state.convexAuthenticated = true;
    state.convexLoading = false;
    state.ensureCurrentUser.mockReturnValue(new Promise(() => undefined));
    const clearTimeout = vi.spyOn(window, "clearTimeout");

    render(
      <BootstrapModule.ConvexUserBootstrap>
        <BootstrapProbe />
      </BootstrapModule.ConvexUserBootstrap>,
    );

    expect(state.ensureCurrentUser).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Retry account setup" }));

    expect(clearTimeout).toHaveBeenCalled();
    expect(state.ensureCurrentUser).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(1);
  });

  it("clears the active timeout immediately on unmount", () => {
    vi.useFakeTimers();

    const rendered = render(
      <BootstrapModule.ConvexUserBootstrap>
        <BootstrapProbe />
      </BootstrapModule.ConvexUserBootstrap>,
    );

    expect(vi.getTimerCount()).toBe(1);

    rendered.unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it("finishes account setup under StrictMode without starting twice", async () => {
    state.convexAuthenticated = true;
    state.convexLoading = false;
    state.ensureCurrentUser.mockResolvedValue("user-created");

    render(
      <StrictMode>
        <BootstrapModule.ConvexUserBootstrap>
          <BootstrapProbe />
        </BootstrapModule.ConvexUserBootstrap>
      </StrictMode>,
    );

    expect(await screen.findByTestId("bootstrap-status")).toHaveTextContent(
      "ready",
    );
    expect(state.ensureCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("ignores a stale completion from the attempt before retry", async () => {
    const firstAttempt = deferred<string>();
    const secondAttempt = deferred<string>();
    state.convexAuthenticated = true;
    state.convexLoading = false;
    state.ensureCurrentUser
      .mockReturnValueOnce(firstAttempt.promise)
      .mockReturnValueOnce(secondAttempt.promise);

    render(
      <BootstrapModule.ConvexUserBootstrap>
        <BootstrapProbe />
      </BootstrapModule.ConvexUserBootstrap>,
    );

    await waitFor(() => expect(state.ensureCurrentUser).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole("button", { name: "Retry account setup" }));
    await waitFor(() => expect(state.ensureCurrentUser).toHaveBeenCalledTimes(2));

    await act(async () => secondAttempt.reject(new Error("new attempt failed")));
    expect(screen.getByTestId("bootstrap-status")).toHaveTextContent("error");

    await act(async () => firstAttempt.resolve("stale-success"));

    expect(screen.getByTestId("bootstrap-status")).toHaveTextContent("error");
  });

  it("does not require a Convex user or timer for signed-out public routes", () => {
    vi.useFakeTimers();
    state.signedIn = false;

    render(
      <BootstrapModule.ConvexUserBootstrap>
        <BootstrapProbe />
      </BootstrapModule.ConvexUserBootstrap>,
    );

    expect(screen.getByText("Router child")).toBeVisible();
    expect(screen.getByTestId("bootstrap-status")).toHaveTextContent("idle");
    expect(state.ensureCurrentUser).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
