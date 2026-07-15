// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  status: "ready" as "loading" | "ready" | "unavailable",
  isSignedIn: false,
  userId: null as string | null,
  message: null as string | null,
  retry: vi.fn(),
}));
const roleAccessSpy = vi.hoisted(() => vi.fn());
const userButtonSpy = vi.hoisted(() => vi.fn());

vi.mock("@/app/auth/auth-readiness", () => ({
  useAuthReadiness: () => authState,
}));
vi.mock("@clerk/clerk-react", () => ({
  UserButton: (props: unknown) => {
    userButtonSpy(props);
    return <button type="button">Account menu</button>;
  },
  useUser: () => ({ isSignedIn: authState.isSignedIn }),
}));
vi.mock("@/components/theme/theme-toggle", () => ({
  ThemeToggle: () => <button type="button">Theme</button>,
}));
vi.mock("@/hooks/use-role-based-navigation", () => ({
  useRoleBasedAccess: () => {
    roleAccessSpy();
    return { hasPermission: () => true, isAdmin: false };
  },
}));
vi.mock("@/store/navigation-store", () => ({
  useNavigationStore: () => ({
    mobileMenuOpen: false,
    setMobileMenuOpen: vi.fn(),
    sidebarOpen: false,
    toggleSidebar: vi.fn(),
  }),
}));

import { Header } from "./header";

beforeEach(() => {
  authState.status = "ready";
  authState.isSignedIn = false;
  authState.userId = null;
  authState.message = null;
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("Header", () => {
  it("uses one friendly product wordmark and exposes public navigation", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const home = screen.getByRole("link", { name: "Route Ledger home" });
    expect(home).toHaveAttribute("href", "/");
    expect(home).toHaveTextContent("Route Ledger");
    expect(home).toHaveClass("min-h-11", "min-w-11");
    expect(screen.queryByText("Packing operations")).not.toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeVisible();
  });

  it.each(["loading", "unavailable"] as const)(
    "does not mount provider-dependent account hooks while auth is %s",
    (status) => {
      authState.status = status;

      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>,
      );

      expect(screen.getByRole("link", { name: "Route Ledger home" })).toBeVisible();
      expect(roleAccessSpy).not.toHaveBeenCalled();
      expect(userButtonSpy).not.toHaveBeenCalled();
    },
  );

  it("mounts role access and Clerk account controls only for ready signed-in auth", () => {
    authState.isSignedIn = true;
    authState.userId = "clerk-user";

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(roleAccessSpy).toHaveBeenCalledTimes(1);
    expect(userButtonSpy).toHaveBeenCalledTimes(1);
    expect(userButtonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        appearance: expect.objectContaining({
          userButton: expect.objectContaining({
            elements: expect.objectContaining({
              userButtonPopoverActionButton: expect.objectContaining({
                color: "var(--foreground)",
              }),
              userButtonPopoverFooter: expect.objectContaining({
                display: "none",
              }),
            }),
          }),
        }),
      }),
    );
    const accountButton = screen.getByRole("button", { name: "Account menu" });
    expect(accountButton).toBeVisible();
    expect(accountButton.parentElement).toHaveClass(
      "min-h-11",
      "min-w-11",
      "[&_button]:min-h-11",
      "[&_button]:min-w-11",
    );
    expect(screen.getByRole("button", { name: "New list" })).toBeVisible();
  });
});
