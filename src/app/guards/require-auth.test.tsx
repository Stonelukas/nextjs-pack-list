// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  status: "ready" as "loading" | "ready" | "unavailable",
  isSignedIn: false,
  userId: null as string | null,
  message: null as string | null,
  retry: vi.fn(),
}));
const bootstrapState = vi.hoisted(() => ({
  status: "idle" as "idle" | "loading" | "ready" | "error",
  error: null as {
    code: "UNEXPECTED";
    title: string;
    message: string;
    retryable: boolean;
  } | null,
  retry: vi.fn(),
}));

vi.mock("@/app/auth/auth-readiness", () => ({
  useAuthReadiness: () => authState,
}));
vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => {
    throw new Error("RequireAuth must use bounded auth readiness");
  },
}));
vi.mock("@/app/guards/convex-user-bootstrap", () => ({
  useConvexUserBootstrap: () => bootstrapState,
}));

import { RequireAuth } from "@/app/guards/require-auth";

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {`${location.pathname}${location.search}${location.hash}`}
    </output>
  );
}

afterEach(cleanup);

function renderGuard(initialEntry = "/lists?status=active#packing") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="*"
          element={
            <RequireAuth>
              <p>Protected content</p>
            </RequireAuth>
          }
        />
        <Route path="/sign-in" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RequireAuth", () => {
  beforeEach(() => {
    authState.status = "ready";
    authState.isSignedIn = false;
    authState.userId = null;
    authState.message = null;
    authState.retry.mockReset();
    bootstrapState.status = "idle";
    bootstrapState.error = null;
    bootstrapState.retry.mockReset();
  });

  it("shows a loading state while authentication readiness is unresolved", () => {
    authState.status = "loading";
    authState.isSignedIn = true;

    renderGuard();

    expect(
      screen.getByRole("status", { name: /checking your session/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("shows auth unavailable without mounting protected children", async () => {
    authState.status = "unavailable";
    authState.message = "Authentication did not become ready.";
    const user = userEvent.setup();

    renderGuard();

    expect(
      screen.getByRole("heading", { name: "Authentication is unavailable" }),
    ).toBeVisible();
    expect(screen.getByText(authState.message)).toBeVisible();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Retry authentication" }),
    );
    expect(authState.retry).toHaveBeenCalledOnce();
  });

  it("preserves pathname search and hash after auth becomes ready signed out", () => {
    renderGuard();

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/sign-in?redirect_url=%2Flists%3Fstatus%3Dactive%23packing",
    );
  });

  it.each(["idle", "loading"] as const)(
    "keeps protected descendants unmounted while account bootstrap is %s",
    (status) => {
      authState.isSignedIn = true;
      authState.userId = "clerk-user";
      bootstrapState.status = status;

      renderGuard();

      expect(
        screen.getByRole("status", { name: /preparing your account/i }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    },
  );

  it("shows account bootstrap retry after provisioning fails", async () => {
    authState.isSignedIn = true;
    authState.userId = "clerk-user";
    bootstrapState.status = "error";
    bootstrapState.error = {
      code: "UNEXPECTED",
      title: "Account setup failed",
      message: "The account record could not be prepared.",
      retryable: true,
    };
    const user = userEvent.setup();

    renderGuard();

    expect(
      screen.getByRole("heading", { name: "Account setup could not finish" }),
    ).toBeVisible();
    expect(
      screen.getByText("The account record could not be prepared."),
    ).toBeVisible();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Retry account setup" }),
    );
    expect(bootstrapState.retry).toHaveBeenCalledOnce();
  });

  it("renders protected content only after signed-in account bootstrap is ready", () => {
    authState.isSignedIn = true;
    authState.userId = "clerk-user";
    bootstrapState.status = "ready";

    renderGuard();

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
