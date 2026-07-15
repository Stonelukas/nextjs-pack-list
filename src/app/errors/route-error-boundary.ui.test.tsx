// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const routeErrorState = vi.hoisted(() => ({
  value: {
    status: 401,
    statusText: "Unauthorized",
    internal: false,
    data: null,
  },
}));

vi.mock("react-router-dom", () => ({
  isRouteErrorResponse: () => true,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useRouteError: () => routeErrorState.value,
}));

vi.mock("@/lib/monitoring/sentry", () => ({
  captureUnexpectedError: vi.fn(),
}));

import { RouteErrorBoundary } from "@/app/errors/route-error-boundary";

afterEach(cleanup);

describe("RouteErrorBoundary", () => {
  it("offers a sign-in action for unauthenticated route errors", () => {
    render(<RouteErrorBoundary />);

    expect(screen.getByRole("heading", { name: /sign in required/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });
});
