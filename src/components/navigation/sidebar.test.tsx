// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const roleAccess = vi.hoisted(() => ({ isAdmin: false }));

vi.mock("@/features/lists/hooks/use-lists", () => ({
  useLists: () => ({
    lists: [
      { _id: "active", name: "Active trip", _creationTime: 1, updatedAt: 1 },
      { _id: "done", name: "Done trip", _creationTime: 2, updatedAt: 2, completedAt: 2 },
    ],
  }),
}));
vi.mock("@/hooks/use-role-based-navigation", () => ({
  useRoleBasedAccess: () => ({
    hasPermission: () => true,
    isAdmin: roleAccess.isAdmin,
  }),
}));

import { Sidebar } from "./sidebar";

beforeEach(() => {
  roleAccess.isAdmin = false;
});

afterEach(cleanup);

describe("Sidebar list filters", () => {
  it("groups the packing workspace into clear navigation sections", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Lists" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Organize" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Recent" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  it("shows human-readable list count badges without zero padding", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(
      within(screen.getByRole("link", { name: "All lists, 2" })).getByText("2"),
    ).toBeVisible();
    expect(
      within(screen.getByRole("link", { name: "Active, 1" })).getByText("1"),
    ).toBeVisible();
    expect(screen.queryByText("02")).not.toBeInTheDocument();
    expect(screen.queryByText("01")).not.toBeInTheDocument();
  });

  it("marks only the exact status filter as the current page", () => {
    render(
      <MemoryRouter initialEntries={["/lists?status=active"]}>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { current: "page" })).toHaveAttribute(
      "href",
      "/lists?status=active",
    );
    expect(screen.getByRole("link", { name: /all lists/i })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByRole("link", { name: /completed/i })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.queryByRole("link", { name: /archived/i })).not.toBeInTheDocument();
  });

  it("hides administration from regular users", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("links server-confirmed administrators to the admin dashboard", () => {
    roleAccess.isAdmin = true;

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Admin", current: "page" })).toHaveAttribute(
      "href",
      "/admin",
    );
  });
});
