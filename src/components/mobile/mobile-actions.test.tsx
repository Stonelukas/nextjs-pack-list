// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  FloatingActionButton,
  SpeedDialAction,
} from "./floating-action-button";
import { MobileNav } from "./mobile-nav";
import { PullToRefresh } from "./pull-to-refresh";

const listeners = new Set<(event: MediaQueryListEvent) => void>();

vi.mock("@/hooks/use-role-based-navigation", () => ({
  useRoleBasedAccess: () => ({
    hasAllPermissions: () => true,
    isAdmin: false,
  }),
}));

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
        listeners.add(listener),
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
        listeners.delete(listener),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  listeners.clear();
});

describe("mobile navigation", () => {
  it("uses a soft active surface while preserving 44px-or-larger destinations", () => {
    render(
      <MemoryRouter initialEntries={["/lists"]}>
        <MobileNav />
      </MemoryRouter>,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Mobile navigation",
    });
    const activeLink = screen.getByRole("link", {
      name: "Lists",
      current: "page",
    });

    expect(navigation).toBeVisible();
    expect(activeLink).toHaveClass(
      "min-h-16",
      "min-w-11",
      "rounded-xl",
      "bg-primary/10",
    );
    expect(screen.getByRole("link", { name: "Templates" })).not.toHaveClass(
      "bg-primary/10",
    );
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
  });
});

describe("mobile action motion and disclosure", () => {
  it("exposes quick actions as a named disclosure and returns focus on Escape", async () => {
    const user = userEvent.setup();
    render(
      <FloatingActionButton>
        <SpeedDialAction icon={<span aria-hidden="true">+</span>} label="Add category" onClick={vi.fn()} />
      </FloatingActionButton>,
    );

    const trigger = screen.getByRole("button", { name: "Open quick actions" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAccessibleName("Close quick actions");
    const actions = screen.getByRole("group", { name: "Quick actions" });
    expect(trigger).toHaveAttribute("aria-controls", actions.id);
    await waitFor(() => expect(screen.getByRole("button", { name: "Add category" })).toHaveFocus());

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("group", { name: "Quick actions" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("provides an explicit refresh button instead of a motion gesture when reduction is requested", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(
      <PullToRefresh onRefresh={onRefresh}>
        <p>Manifest</p>
      </PullToRefresh>,
    );

    await user.click(screen.getByRole("button", { name: "Refresh list" }));
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("pull-to-refresh-indicator")).not.toBeInTheDocument();
  });
});
