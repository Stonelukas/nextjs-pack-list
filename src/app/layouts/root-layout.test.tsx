// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationState = vi.hoisted(() => ({
  state: "idle" as "idle" | "loading",
}));
const locationState = vi.hoisted(() => ({
  pathname: "/",
  search: "",
  hash: "",
}));
const authState = vi.hoisted(() => ({
  status: "ready" as "loading" | "ready" | "unavailable",
  isSignedIn: false,
  userId: null as string | null,
  message: null as string | null,
  retry: vi.fn(),
}));
const bootstrapState = vi.hoisted(() => ({
  status: "idle" as "idle" | "loading" | "ready" | "error",
  error: null,
  retry: vi.fn(),
}));
const runtimeConfigurationState = vi.hoisted(() => ({
  status: "configured" as "configured" | "unconfigured",
}));

vi.mock("@/app/auth/auth-readiness", () => ({
  useAuthReadiness: () => authState,
}));
vi.mock("@/app/guards/convex-user-bootstrap", () => ({
  useConvexUserBootstrap: () => bootstrapState,
}));
vi.mock("@/app/runtime/runtime-configuration", () => ({
  isRuntimeConfigured: (value: { status: string }) =>
    value.status === "configured",
  useRuntimeConfiguration: () => runtimeConfigurationState,
}));
vi.mock("@clerk/clerk-react", () => ({
  useUser: () => {
    throw new Error("RootLayout must use auth readiness instead of Clerk directly");
  },
}));
vi.mock("react-router-dom", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  Outlet: () =>
    locationState.pathname === "/" ? (
      <main className="friendly-landing" id="main-content" tabIndex={-1}>
        <h1>Route content</h1>
      </main>
    ) : (
      <h1>Route content</h1>
    ),
  useLocation: () => locationState,
  useNavigation: () => navigationState,
}));

vi.mock("@/components/accessibility/skip-nav", () => ({ SkipNav: () => null }));
vi.mock("@/components/mobile/mobile-nav", () => ({
  MobileNav: () => <nav>Mobile navigation</nav>,
}));
vi.mock("@/components/monitoring/monitoring", () => ({ Monitoring: () => null }));
vi.mock("@/features/legacy-migration/legacy-migration-prompt", () => ({
  LegacyMigrationPrompt: () => <aside>Legacy migration startup prompt</aside>,
}));
vi.mock("@/components/pwa/install-prompt", () => ({
  InstallPrompt: () => <aside>Install prompt controller</aside>,
}));
vi.mock("@/components/pwa/pwa-update-prompt", () => ({
  PwaUpdatePrompt: () => <aside>Update prompt controller</aside>,
}));
vi.mock("@/components/navigation/header", () => ({
  Header: () => <header>Application header</header>,
}));
vi.mock("@/components/navigation/navigation-layout", () => ({
  NavigationLayout: ({ children }: { children: React.ReactNode }) => (
    <section>
      <p>Authenticated navigation</p>
      {children}
    </section>
  ),
}));
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));

import { RootLayout } from "@/app/layouts/root-layout";

beforeEach(() => {
  navigationState.state = "idle";
  locationState.pathname = "/";
  locationState.search = "";
  locationState.hash = "";
  authState.status = "ready";
  authState.isSignedIn = false;
  authState.userId = null;
  authState.message = null;
  bootstrapState.status = "idle";
  runtimeConfigurationState.status = "configured";
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    callback(0);
    return 1;
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("RootLayout", () => {
  it("shows accessible loading feedback during client-side route navigation", () => {
    navigationState.state = "loading";

    render(<RootLayout />);

    expect(
      screen.getByRole("status", { name: /loading page/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.queryByText("Route content")).not.toBeInTheDocument();
  });

  it("mounts authenticated navigation only after auth and bootstrap are ready", () => {
    authState.isSignedIn = true;
    authState.userId = "clerk-user";
    bootstrapState.status = "ready";

    render(<RootLayout />);

    expect(screen.getByText("Application header")).toBeInTheDocument();
    expect(screen.getByText("Authenticated navigation")).toBeInTheDocument();
    expect(screen.getByText("Mobile navigation")).toBeInTheDocument();
    expect(screen.getByText("Legacy migration startup prompt")).toBeInTheDocument();
    expect(screen.getByText("Route content")).toBeInTheDocument();
  });

  it.each([
    ["auth loading", "loading", true, "ready"],
    ["auth unavailable", "unavailable", false, "idle"],
    ["signed out", "ready", false, "idle"],
    ["bootstrap idle", "ready", true, "idle"],
    ["bootstrap loading", "ready", true, "loading"],
    ["bootstrap error", "ready", true, "error"],
  ] as const)(
    "keeps the landing-owned main outside the signed-in shell while %s",
    (_label, authStatus, isSignedIn, bootstrapStatus) => {
      authState.status = authStatus;
      authState.isSignedIn = isSignedIn;
      authState.userId = isSignedIn ? "clerk-user" : null;
      bootstrapState.status = bootstrapStatus;

      render(<RootLayout />);

      expect(screen.getAllByRole("main")).toHaveLength(1);
      expect(screen.getByRole("main")).toContainElement(
        screen.getByText("Route content"),
      );
      expect(screen.getByRole("main")).toHaveClass("friendly-landing");
      expect(screen.queryByText("Authenticated navigation")).not.toBeInTheDocument();
      expect(screen.queryByText("Mobile navigation")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Legacy migration startup prompt"),
      ).not.toBeInTheDocument();
    },
  );

  it("retains the shared main landmark for other public routes", () => {
    locationState.pathname = "/sign-in";

    render(<RootLayout />);

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(main).toHaveAttribute("tabindex", "-1");
    expect(main).toContainElement(screen.getByText("Route content"));
    expect(main).not.toHaveClass("friendly-landing");
  });

  it("updates route metadata and focuses the new page heading after navigation settles", async () => {
    locationState.pathname = "/templates";

    render(<RootLayout />);

    await waitFor(() =>
      expect(document.title).toBe("Template library | Route Ledger"),
    );
    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Route content",
    });
    expect(heading).toHaveFocus();
    expect(
      screen.getByRole("status", { name: "Template library" }),
    ).toBeInTheDocument();
  });

  it("mounts install and update controllers once for every route", () => {
    render(<RootLayout />);

    expect(screen.getByText("Install prompt controller")).toBeInTheDocument();
    expect(screen.getByText("Update prompt controller")).toBeInTheDocument();
  });
});
