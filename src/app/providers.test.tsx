import { render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { appRoutes } from "@/app/routes";
import type { RuntimeEnvResult } from "@/lib/env";

import { AppProviders } from "./providers";

const convexClientSpy = vi.hoisted(() => vi.fn());
const unconfiguredRuntime: RuntimeEnvResult = {
  status: "unconfigured",
  issues: [
    {
      key: "VITE_CLERK_PUBLISHABLE_KEY",
      message: "Missing required environment variable",
    },
  ],
};

vi.mock("@/app/router", () => ({ router: null }));
vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}));
vi.mock("@/providers/convex-provider", () => ({
  createConvexClient: convexClientSpy,
  ConvexProvider: () => null,
}));

describe("AppProviders", () => {
  it("renders an unconfigured public route without constructing Convex", () => {
    const routerInstance = createMemoryRouter([
      { path: "/", element: <h1>Public landing</h1> },
    ]);

    render(
      <AppProviders
        routerInstance={routerInstance}
        runtimeConfiguration={{
          status: "unconfigured",
          issues: [
            {
              key: "VITE_CLERK_PUBLISHABLE_KEY",
              message: "Missing required environment variable",
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Public landing" })).toBeVisible();
    expect(convexClientSpy).not.toHaveBeenCalled();
  });

  it("renders the complete unconfigured landing with one main landmark", async () => {
    const routerInstance = createMemoryRouter(appRoutes, {
      initialEntries: ["/"],
    });

    const { container } = render(
      <AppProviders
        routerInstance={routerInstance}
        runtimeConfiguration={unconfiguredRuntime}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Everything you need, ready when you are.",
      }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /create a list/i })).toHaveAttribute(
      "href",
      "/sign-up",
    );
    const signInLinks = screen.getAllByRole("link", { name: /sign in/i });
    expect(signInLinks.length).toBeGreaterThanOrEqual(2);
    signInLinks.forEach((link) => expect(link).toHaveAttribute("href", "/sign-in"));
    expect(screen.getByLabelText("Example packing checklist")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "A calmer way to get out the door." }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Make the last check the easy part." }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Retry authentication" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Route Ledger home" })).toHaveTextContent(
      "Route Ledger",
    );
    expect(
      screen.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeVisible();
    expect(screen.queryByText("Packing operations")).not.toBeInTheDocument();
    const mainLandmarks = screen.getAllByRole("main");
    expect(mainLandmarks).toHaveLength(1);
    expect(mainLandmarks[0]).toHaveAttribute("id", "main-content");
    expect(mainLandmarks[0]).toHaveAttribute("tabindex", "-1");
    expect(mainLandmarks[0]).toHaveClass("friendly-landing");
    expect(container.querySelectorAll("main")).toHaveLength(1);
    expect(convexClientSpy).not.toHaveBeenCalled();
  });

  it("renders the provider-independent service-unavailable route when unconfigured", async () => {
    const routerInstance = createMemoryRouter(appRoutes, {
      initialEntries: ["/templates"],
    });

    render(
      <AppProviders
        routerInstance={routerInstance}
        runtimeConfiguration={unconfiguredRuntime}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Service is unavailable" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Something went wrong" }),
    ).not.toBeInTheDocument();
    expect(convexClientSpy).not.toHaveBeenCalled();
  });
});
