// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  bootstrapStatus: "ready" as "idle" | "loading" | "ready" | "error",
  activeTheme: "system" as "light" | "dark" | "system",
  preferenceTheme: "system" as "light" | "dark" | "system",
  setTheme: vi.fn(),
  usePreferences: vi.fn(),
}));

vi.mock("@/app/guards/convex-user-bootstrap", () => ({
  useConvexUserBootstrap: () => ({
    status: state.bootstrapStatus,
    error: null,
    retry: vi.fn(),
  }),
}));
vi.mock("@/features/settings/hooks/use-preferences", () => ({
  usePreferences: () => {
    state.usePreferences();
    return {
      preferences: {
        theme: state.preferenceTheme,
        defaultPriority: "medium",
        autoSave: true,
      },
    };
  },
}));
vi.mock("@/providers/theme-provider", () => ({
  useTheme: () => ({ theme: state.activeTheme, setTheme: state.setTheme }),
}));

import { PreferenceThemeSync } from "./preference-theme-sync";

beforeEach(() => {
  state.bootstrapStatus = "ready";
  state.activeTheme = "system";
  state.preferenceTheme = "system";
  state.setTheme.mockReset();
  state.usePreferences.mockReset();
});

afterEach(cleanup);

describe("PreferenceThemeSync", () => {
  it("skips the Convex preference query until account bootstrap is ready", () => {
    state.bootstrapStatus = "loading";
    const rendered = render(<PreferenceThemeSync />);

    expect(state.usePreferences).not.toHaveBeenCalled();
    expect(state.setTheme).not.toHaveBeenCalled();

    state.bootstrapStatus = "ready";
    rendered.rerender(<PreferenceThemeSync />);

    expect(state.usePreferences).toHaveBeenCalledOnce();
  });

  it("hydrates the authenticated Convex theme into the active theme provider", () => {
    state.activeTheme = "light";
    state.preferenceTheme = "dark";

    render(<PreferenceThemeSync />);

    expect(state.setTheme).toHaveBeenCalledWith("dark");
  });

  it("does not overwrite an unsaved local theme draft", () => {
    const rendered = render(<PreferenceThemeSync />);
    expect(state.setTheme).not.toHaveBeenCalled();

    state.activeTheme = "dark";
    rendered.rerender(<PreferenceThemeSync />);

    expect(state.setTheme).not.toHaveBeenCalled();
  });
});
