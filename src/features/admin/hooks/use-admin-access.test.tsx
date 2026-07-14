// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const convex = vi.hoisted(() => ({
  getCurrentAccess: Symbol("getCurrentAccess"),
  access: undefined as
    | undefined
    | { authenticated: false; role: null }
    | { authenticated: true; role: "user" | "admin" },
  useQuery: vi.fn(),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: { users: { getCurrentAccess: convex.getCurrentAccess } },
}));

vi.mock("convex/react", () => ({
  useQuery: (reference: symbol) => {
    convex.useQuery(reference);
    return convex.access;
  },
}));

import { useAdminAccess } from "./use-admin-access";

describe("useAdminAccess", () => {
  it("uses the server-derived access query and exposes admin state", () => {
    convex.access = { authenticated: true, role: "admin" };
    const { result } = renderHook(() => useAdminAccess());

    expect(convex.useQuery).toHaveBeenCalledWith(convex.getCurrentAccess);
    expect(result.current).toMatchObject({
      loading: false,
      authenticated: true,
      role: "admin",
      isAdmin: true,
    });
  });
});
