// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const convex = vi.hoisted(() => ({
  details: Symbol("details"),
  activity: Symbol("activity"),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: { users: { getUserDetails: convex.details, getUserActivity: convex.activity } },
}));
vi.mock("convex/react", () => ({
  useQuery: (reference: symbol) =>
    reference === convex.details
      ? {
          user: { _id: "user-1", clerkId: "clerk-1", name: "Avery Stone", role: "user" },
          stats: { totalLists: 1, completedLists: 0, templateCount: 0, activeLists: 1 },
          recentLists: [],
        }
      : [],
}));

import { UserDetails } from "./user-details";

afterEach(cleanup);

describe("UserDetails", () => {
  it("starts nested detail hierarchy at h2 and never creates a second page h1", () => {
    render(<UserDetails userId={"user-1" as never} />);

    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "User details" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /user information/i })).toBeInTheDocument();
  });
});
