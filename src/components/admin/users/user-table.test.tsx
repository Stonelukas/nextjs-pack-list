// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const convex = vi.hoisted(() => ({
  currentUser: undefined as
    | undefined
    | {
        _id: string;
        clerkId: string;
        name: string;
        role: "admin";
      },
  loadMore: vi.fn(),
  results: [
    {
      _id: "user-1",
      clerkId: "clerk-user-1",
      name: "Avery Stone",
      email: "avery@example.com",
      role: "user" as const,
    },
  ],
  status: "CanLoadMore" as
    | "LoadingFirstPage"
    | "CanLoadMore"
    | "LoadingMore"
    | "Exhausted",
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    users: {
      getAllUsers: Symbol("getAllUsers"),
      getCurrentUser: Symbol("getCurrentUser"),
    },
  },
}));
vi.mock("convex/react", () => ({
  useQuery: () => convex.currentUser,
  usePaginatedQuery: () => ({
    results: convex.results,
    status: convex.status,
    loadMore: convex.loadMore,
  }),
}));

import { UserTable } from "./user-table";

beforeEach(() => {
  convex.currentUser = {
    _id: "admin-user",
    clerkId: "clerk-admin",
    name: "Admin User",
    role: "admin",
  };
  convex.loadMore.mockReset();
  convex.status = "CanLoadMore";
  Object.defineProperty(window, "confirm", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(cleanup);

describe("UserTable", () => {
  it("stacks the toolbar on small screens and exposes semantic table labels", () => {
    const { container } = render(<UserTable />);

    expect(container.querySelector("[data-user-table-toolbar]")).toHaveClass(
      "flex-col",
      "sm:flex-row",
    );
    expect(screen.getByRole("searchbox", { name: "Search users" })).toHaveClass(
      "w-full",
      "sm:w-[300px]",
    );
    const table = screen.getByRole("table", { name: "User accounts" });
    expect(within(table).getByText("Manage user accounts and permissions")).toBeInTheDocument();
    expect(within(table).getByRole("rowheader", { name: /Avery Stone/ })).toBeInTheDocument();
  });

  it("delegates deletion to the parent confirmation dialog without native confirm", async () => {
    const user = userEvent.setup();
    const onUserDelete = vi.fn();
    render(<UserTable onUserDelete={onUserDelete} />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete User" }));

    expect(window.confirm).not.toHaveBeenCalled();
    expect(onUserDelete).toHaveBeenCalledTimes(1);
    expect(onUserDelete).toHaveBeenCalledWith(expect.objectContaining({ name: "Avery Stone" }));
  });

  it("does not offer deletion for the authenticated administrator", async () => {
    convex.currentUser = {
      _id: "user-1",
      clerkId: "clerk-user-1",
      name: "Avery Stone",
      role: "admin",
    };
    const user = userEvent.setup();
    const onUserDelete = vi.fn();
    render(<UserTable onUserDelete={onUserDelete} />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    expect(screen.getByRole("menuitem", { name: "Delete current account" })).toHaveAttribute(
      "data-disabled",
    );
    expect(onUserDelete).not.toHaveBeenCalled();
  });

  it("keeps deletion disabled until the current user resolves", async () => {
    convex.currentUser = undefined;
    const user = userEvent.setup();
    const onUserDelete = vi.fn();
    render(<UserTable onUserDelete={onUserDelete} />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    expect(screen.getByRole("menuitem", { name: "Delete User" })).toHaveAttribute(
      "data-disabled",
    );
    expect(onUserDelete).not.toHaveBeenCalled();
  });

  it("loads the next bounded page and explains the loaded-page search scope", async () => {
    const user = userEvent.setup();
    render(<UserTable />);

    expect(screen.getByText(/search filters the users loaded so far/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Load more users" }));

    expect(convex.loadMore).toHaveBeenCalledWith(50);
  });
});
