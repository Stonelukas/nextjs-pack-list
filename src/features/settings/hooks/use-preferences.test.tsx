// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const convex = vi.hoisted(() => ({
  getCurrentUser: Symbol("getCurrentUser"),
  updateCurrentUserPreferences: Symbol("updateCurrentUserPreferences"),
  currentUser: undefined as unknown,
  update: vi.fn(),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    users: {
      getCurrentUser: convex.getCurrentUser,
      updateCurrentUserPreferences: convex.updateCurrentUserPreferences,
    },
  },
}));

vi.mock("convex/react", () => ({
  useQuery: () => convex.currentUser,
  useMutation: () => convex.update,
}));

import { usePreferences } from "./use-preferences";

beforeEach(() => {
  convex.currentUser = undefined;
  convex.update.mockReset().mockResolvedValue("user_123");
});

describe("usePreferences", () => {
  it("keeps current-user preferences loading explicit", () => {
    const { result } = renderHook(() => usePreferences());

    expect(result.current.preferences).toBeUndefined();
    expect(result.current.loading).toBe(true);
  });

  it("writes only the complete preference value without a Clerk ID", async () => {
    convex.currentUser = {
      preferences: { theme: "system", defaultPriority: "medium", autoSave: true },
    };
    const preferences = {
      theme: "dark",
      defaultPriority: "high",
      autoSave: false,
    } as const;
    const { result } = renderHook(() => usePreferences());

    await act(async () => {
      await result.current.updatePreferences(preferences);
    });

    expect(convex.update).toHaveBeenCalledWith({ preferences });
    expect(convex.update.mock.calls[0]?.[0]).not.toHaveProperty("clerkId");
  });
});
