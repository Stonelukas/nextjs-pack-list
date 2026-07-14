// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { RequireConfiguredRuntime } from "@/app/guards/require-configured-runtime";
import { RuntimeConfigurationProvider } from "@/app/runtime/runtime-configuration";

function renderGuard(configured: boolean) {
  return render(
    <MemoryRouter>
      <RuntimeConfigurationProvider
        value={
          configured
            ? {
                status: "configured",
                env: {
                  clerkPublishableKey: "pk_test_route_ledger_vitest",
                  convexUrl: "https://route-ledger-vitest.convex.cloud",
                  appUrl: "http://localhost",
                  sentryDsn: undefined,
                },
              }
            : {
                status: "unconfigured",
                issues: [
                  {
                    key: "VITE_CONVEX_URL",
                    message: "Missing required environment variable",
                  },
                ],
              }
        }
      >
        <RequireConfiguredRuntime>
          <p>Connected public data</p>
        </RequireConfiguredRuntime>
      </RuntimeConfigurationProvider>
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe("RequireConfiguredRuntime", () => {
  it("renders connected public data when runtime services are configured", () => {
    renderGuard(true);

    expect(screen.getByText("Connected public data")).toBeVisible();
  });

  it("renders a provider-independent service unavailable card when unconfigured", () => {
    renderGuard(false);

    expect(
      screen.getByRole("heading", { name: "Service is unavailable" }),
    ).toBeVisible();
    expect(screen.queryByText("Connected public data")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.queryByText("pk_test_route_ledger_vitest")).not.toBeInTheDocument();
  });
});
