// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SwipeableItem } from "./swipeable-item";

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({
      matches: false,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(cleanup);

describe("SwipeableItem", () => {
  it("uses semantic foregrounds for light and dark action surfaces without clipping controls", () => {
    const { container } = render(
      <SwipeableItem
        onSwipeRight={vi.fn()}
        onSwipeLeft={vi.fn()}
        leftAction={{ label: "Pack", color: "bg-success" }}
        rightAction={{ label: "Delete", color: "bg-danger" }}
      >
        <button type="button">Edit item</button>
      </SwipeableItem>,
    );

    expect(screen.getByText("Pack").parentElement).toHaveClass("text-success-foreground");
    expect(screen.getByText("Delete").parentElement).toHaveClass("text-danger-foreground");
    expect(container.firstElementChild).not.toHaveClass("overflow-hidden");
  });

  it("uses the warning foreground for the unpack action", () => {
    render(
      <SwipeableItem
        onSwipeRight={vi.fn()}
        leftAction={{ label: "Unpack", color: "bg-warning" }}
      >
        <button type="button">Edit item</button>
      </SwipeableItem>,
    );

    expect(screen.getByText("Unpack").parentElement).toHaveClass("text-warning-foreground");
  });
});
