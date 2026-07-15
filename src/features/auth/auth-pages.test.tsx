// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const clerk = vi.hoisted(() => ({ signIn: vi.fn(), signUp: vi.fn() }));
const auth = vi.hoisted(() => ({
  status: "ready" as "loading" | "ready" | "unavailable",
  isSignedIn: false,
  userId: null as string | null,
  message: null as string | null,
  retry: vi.fn(),
}));

vi.mock("@clerk/clerk-react", () => ({
  SignIn: (props: unknown) => {
    clerk.signIn(props);
    return <div>Sign in form</div>;
  },
  SignUp: (props: unknown) => {
    clerk.signUp(props);
    return <div>Sign up form</div>;
  },
}));

vi.mock("@/app/auth/auth-readiness", () => ({
  useAuthReadiness: () => auth,
}));

import { AuthLayout } from "@/app/layouts/auth-layout";
import { SignInPage } from "./sign-in-page";
import { SignUpPage } from "./sign-up-page";

function renderAuthRoute(path = "/sign-in") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/lists" element={<div>Authenticated home</div>} />
        <Route element={<AuthLayout />}>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  auth.status = "ready";
  auth.isSignedIn = false;
  auth.userId = null;
  auth.message = null;
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("authentication routes", () => {
  it("uses the Route Ledger auth shell without introducing a legacy brand", () => {
    const { container } = renderAuthRoute();

    expect(screen.queryByRole("link", { name: "Pack List" })).not.toBeInTheDocument();
    expect(container.querySelector("[data-auth-layout]" )).toBeInTheDocument();
    expect(screen.getByText("Pack from a list you trust.")).toBeVisible();
  });

  it("redirects an authenticated user away from sign-in routes", () => {
    auth.isSignedIn = true;
    auth.userId = "user-1";

    renderAuthRoute();

    expect(screen.getByText("Authenticated home")).toBeVisible();
    expect(clerk.signIn).not.toHaveBeenCalled();
  });

  it("keeps the Clerk form unmounted while authentication readiness is loading", () => {
    auth.status = "loading";

    renderAuthRoute();

    expect(
      screen.getByRole("heading", { name: "Connecting to authentication" }),
    ).toBeVisible();
    expect(clerk.signIn).not.toHaveBeenCalled();
  });

  it("shows authentication recovery in AuthLayout without mounting Clerk", () => {
    auth.status = "unavailable";
    auth.message = "Authentication did not become ready.";

    renderAuthRoute();

    expect(
      screen.getByRole("heading", { name: "Authentication is unavailable" }),
    ).toBeVisible();
    expect(screen.getByText("Authentication did not become ready.")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Retry authentication" }),
    );
    expect(auth.retry).toHaveBeenCalledOnce();
    expect(clerk.signIn).not.toHaveBeenCalled();
  });

  it.each([
    ["sign in", "/sign-in", SignInPage, clerk.signIn],
    ["sign up", "/sign-up", SignUpPage, clerk.signUp],
  ] as const)("themes the %s card with explicit Graphite style rules", (_name, path, Page, spy) => {
    const { container } = render(
      <MemoryRouter initialEntries={[path]}>
        <Page />
      </MemoryRouter>,
    );

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        appearance: expect.objectContaining({
          variables: expect.objectContaining({
            colorBackground: "var(--card)",
            colorPrimary: "var(--primary)",
            colorText: "var(--foreground)",
            colorTextSecondary: "var(--muted-foreground)",
          }),
          elements: expect.objectContaining({
            card: expect.objectContaining({
              backgroundColor: "var(--card)",
              borderRadius: "var(--radius)",
            }),
            socialButtonsBlockButtonText: expect.objectContaining({
              color: "var(--foreground)",
            }),
          }),
        }),
      }),
    );
    expect(
      Array.from(container.querySelectorAll("*")).some((element) =>
        element.className.includes("min-h-[70vh]"),
      ),
    ).toBe(false);
  });
});
