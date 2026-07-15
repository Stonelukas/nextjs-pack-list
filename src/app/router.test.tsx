// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/layouts/root-layout", () => ({
  RootLayout: () => <Outlet />,
}));
vi.mock("@/app/layouts/auth-layout", () => ({
  AuthLayout: () => <Outlet />,
}));
vi.mock("@/app/guards/require-auth", () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => (
    <section data-testid="auth-guard">{children}</section>
  ),
}));
vi.mock("@/app/guards/require-configured-runtime", () => ({
  RequireConfiguredRuntime: ({ children }: { children: React.ReactNode }) => (
    <section data-testid="configured-runtime-guard">{children}</section>
  ),
}));
vi.mock("@/app/guards/require-admin", () => ({
  RequireAdmin: ({ children }: { children: React.ReactNode }) => (
    <section data-testid="admin-guard">{children}</section>
  ),
}));
vi.mock("@/app/errors/route-error-boundary", () => ({
  RouteErrorBoundary: () => <p>Route error</p>,
}));
vi.mock("@/features/home/home-page", () => ({
  HomePage: () => <h1>Home page</h1>,
}));
vi.mock("@/features/lists/list-index-page", async () => {
  const { useLocation } = await import("react-router-dom");
  return {
    ListIndexPage: () => {
      const location = useLocation();
      return <h1>Lists page {location.search}</h1>;
    },
  };
});
vi.mock("@/features/lists/create-list-page", () => ({
  CreateListPage: () => <h1>Create list page</h1>,
}));
vi.mock("@/features/lists/list-detail-page", async () => {
  const { useParams } = await import("react-router-dom");
  return {
    ListDetailPage: () => {
      const { id } = useParams();
      return <h1>List detail {id}</h1>;
    },
  };
});
vi.mock("@/features/lists/edit-list-page", async () => {
  const { useParams } = await import("react-router-dom");
  return {
    EditListPage: () => {
      const { id } = useParams();
      return <h1>Edit list {id}</h1>;
    },
  };
});
vi.mock("@/features/templates/templates-page", () => ({
  TemplatesPage: () => <h1>Templates page</h1>,
}));
vi.mock("@/features/lists/categories-page", () => ({
  CategoriesPage: () => <h1>Categories page</h1>,
}));
vi.mock("@/features/lists/tags-page", () => ({
  TagsPage: () => <h1>Tags page</h1>,
}));
vi.mock("@/features/settings/settings-page", () => ({
  SettingsPage: () => <h1>Settings page</h1>,
}));
vi.mock("@/features/admin/admin-page", () => ({
  AdminPage: () => <h1>Admin page</h1>,
}));
vi.mock("@clerk/clerk-react", () => ({
  SignIn: ({ path, routing }: { path?: string; routing?: string }) => (
    <output data-testid="sign-in" data-path={path} data-routing={routing} />
  ),
  SignUp: ({ path, routing }: { path?: string; routing?: string }) => (
    <output data-testid="sign-up" data-path={path} data-routing={routing} />
  ),
}));

import { appRoutes } from "@/app/routes";

class RouterTestRequest {
  readonly headers: Headers;
  readonly method: string;
  readonly signal: AbortSignal;
  readonly url: string;

  constructor(input: string | URL | Request, init: RequestInit = {}) {
    this.url = typeof input === "string" || input instanceof URL ? String(input) : input.url;
    this.method = init.method ?? "GET";
    this.headers = new Headers(init.headers);
    this.signal = init.signal ?? new AbortController().signal;
  }
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderRoute(initialEntry: string) {
  vi.stubGlobal("Request", RouterTestRequest);
  const routes = [...appRoutes];
  routes.push({ path: "/__location", element: <LocationProbe /> });
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] });
  return render(<RouterProvider router={router} />);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("application routes", () => {
  it.each([
    ["/", "Home page"],
    ["/lists", "Lists page"],
    ["/lists/new", "Create list page"],
    ["/lists/list-123", "List detail list-123"],
    ["/lists/list-123/edit", "Edit list list-123"],
    ["/templates", "Templates page"],
    ["/categories", "Categories page"],
    ["/tags", "Tags page"],
    ["/settings", "Settings page"],
    ["/admin", "Admin page"],
  ])("renders direct entry %s", async (entry, heading) => {
    renderRoute(entry);
    expect(await screen.findByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it("preserves the list status search parameter inside the authenticated branch", async () => {
    renderRoute("/lists?status=active");
    expect(await screen.findByRole("heading", { name: "Lists page ?status=active" })).toBeInTheDocument();
    expect(screen.getByTestId("auth-guard")).toBeInTheDocument();
  });

  it("keeps public template browsing outside auth and inside configured runtime", async () => {
    renderRoute("/templates");

    expect(await screen.findByRole("heading", { name: "Templates page" })).toBeInTheDocument();
    expect(screen.queryByTestId("auth-guard")).not.toBeInTheDocument();
    expect(screen.getByTestId("configured-runtime-guard")).toBeInTheDocument();
  });

  it("renders administration inside both authenticated and administrator guards", async () => {
    renderRoute("/admin");
    expect(await screen.findByRole("heading", { name: "Admin page" })).toBeInTheDocument();
    expect(screen.getByTestId("auth-guard")).toContainElement(screen.getByTestId("admin-guard"));
  });

  it("matches nested Clerk paths with path routing configuration", async () => {
    renderRoute("/sign-in/factor-two");
    const signIn = await screen.findByTestId("sign-in");
    expect(signIn).toHaveAttribute("data-routing", "path");
    expect(signIn).toHaveAttribute("data-path", "/sign-in");

    cleanup();
    renderRoute("/sign-up/verify-email-address");
    const signUp = await screen.findByTestId("sign-up");
    expect(signUp).toHaveAttribute("data-routing", "path");
    expect(signUp).toHaveAttribute("data-path", "/sign-up");
  });

  it("renders the Route Ledger not-found hierarchy for unknown paths", async () => {
    const { container } = renderRoute("/removed-next-route");
    expect(
      await screen.findByRole("heading", { level: 1, name: /not on the itinerary/i }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("[data-route-spine]")).toHaveLength(0);
    expect(
      screen.getByRole("link", { name: "Return to Route Ledger" }),
    ).toHaveAttribute("href", "/");
  });

  it("settles lazy route navigation without route errors", async () => {
    renderRoute("/lists/list-456");
    await waitFor(() => expect(screen.queryByText("Route error")).not.toBeInTheDocument());
  });
});
