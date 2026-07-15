// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  auth: {
    status: "ready" as "loading" | "ready" | "unavailable",
    isSignedIn: false,
    userId: null as string | null,
    message: null as string | null,
    retry: vi.fn(),
  },
  bootstrap: {
    status: "idle" as "idle" | "loading" | "ready" | "error",
    error: null as {
      code: "UNEXPECTED";
      title: string;
      message: string;
      retryable: boolean;
    } | null,
    retry: vi.fn(),
  },
}));

vi.mock("@/app/auth/auth-readiness", () => ({
  useAuthReadiness: () => state.auth,
}));

vi.mock("@/app/guards/convex-user-bootstrap", () => ({
  useConvexUserBootstrap: () => state.bootstrap,
}));

vi.mock("@clerk/clerk-react", () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
  SignUpButton: ({ children }: { children: React.ReactNode }) => children,
  useUser: () => ({
    isLoaded: state.auth.status === "ready",
    isSignedIn: state.auth.isSignedIn,
  }),
}));

vi.mock("@/components/lists/list-overview", () => ({
  ListOverview: () => <section data-testid="list-overview">Your lists</section>,
}));

import { HomePage } from "./home-page";

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  state.auth.status = "ready";
  state.auth.isSignedIn = false;
  state.auth.userId = null;
  state.auth.message = null;
  state.bootstrap.status = "idle";
  state.bootstrap.error = null;
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("HomePage readiness adapter", () => {
  it("keeps the complete landing visible while authentication is loading", () => {
    state.auth.status = "loading";

    renderHomePage();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Everything you need, ready when you are.",
      }),
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Connecting to authentication",
    );
    expect(screen.getByRole("link", { name: /create a list/i })).toHaveAttribute(
      "href",
      "/sign-up",
    );
    expect(screen.queryByTestId("list-overview")).not.toBeInTheDocument();
  });

  it("keeps the complete landing visible and retries unavailable authentication", () => {
    state.auth.status = "unavailable";
    state.auth.message = "Authentication did not become ready.";

    renderHomePage();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Everything you need, ready when you are.",
      }),
    ).toBeVisible();
    expect(screen.getByText("Authentication is unavailable right now.")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Retry authentication" }),
    );
    expect(state.auth.retry).toHaveBeenCalledOnce();
    expect(screen.queryByTestId("list-overview")).not.toBeInTheDocument();
  });

  it("shows account actions when authentication is ready and signed out", () => {
    renderHomePage();

    expect(screen.getByRole("link", { name: /create a list/i })).toHaveAttribute(
      "href",
      "/sign-up",
    );
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.queryByTestId("list-overview")).not.toBeInTheDocument();
  });

  it.each(["idle", "loading"] as const)(
    "keeps the complete landing visible while signed-in account setup is %s",
    (bootstrapStatus) => {
      state.auth.isSignedIn = true;
      state.auth.userId = "user_123";
      state.bootstrap.status = bootstrapStatus;

      renderHomePage();

      expect(
        screen.getByRole("heading", {
          level: 1,
          name: "Everything you need, ready when you are.",
        }),
      ).toBeVisible();
      expect(screen.getByRole("status")).toHaveTextContent(
        "Preparing your account",
      );
      expect(screen.queryByTestId("list-overview")).not.toBeInTheDocument();
    },
  );

  it("keeps the complete landing visible and retries failed account setup", () => {
    state.auth.isSignedIn = true;
    state.auth.userId = "user_123";
    state.bootstrap.status = "error";
    state.bootstrap.error = {
      code: "UNEXPECTED",
      title: "Account setup failed",
      message: "The account record could not be prepared.",
      retryable: true,
    };

    renderHomePage();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Everything you need, ready when you are.",
      }),
    ).toBeVisible();
    expect(screen.getByText("Account setup could not finish.")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Retry account setup" }),
    );
    expect(state.bootstrap.retry).toHaveBeenCalledOnce();
    expect(screen.queryByTestId("list-overview")).not.toBeInTheDocument();
  });

  it("mounts ListOverview only after signed-in account setup is ready", () => {
    state.auth.isSignedIn = true;
    state.auth.userId = "user_123";
    state.bootstrap.status = "ready";

    renderHomePage();

    expect(screen.getByTestId("list-overview")).toBeVisible();
    expect(
      screen.queryByRole("heading", {
        level: 1,
        name: "Everything you need, ready when you are.",
      }),
    ).not.toBeInTheDocument();
  });
});
