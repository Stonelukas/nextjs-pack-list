// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../convex/_generated/api", () => ({
  api: {
    users: { getUserStats: Symbol("users") },
    analytics: { getSystemUsageAnalytics: Symbol("usage") },
  },
}));
vi.mock("convex/react", () => ({
  useQuery: () => undefined,
}));
vi.mock("@/components/admin/analytics/analytics-dashboard", () => ({ AnalyticsDashboard: () => null }));
vi.mock("@/components/admin/moderation/content-moderation", () => ({ ContentModeration: () => null }));
vi.mock("@/components/admin/settings/system-settings", () => ({ SystemSettings: () => null }));
vi.mock("@/components/admin/users/user-management", () => ({ UserManagement: () => null }));

import { AdminPage } from "./admin-page";

afterEach(cleanup);

describe("AdminPage heading hierarchy", () => {
  it("uses one printable h1 followed by an h2 for the active workspace", () => {
    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Admin dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "System overview" })).toBeInTheDocument();
  });
});
