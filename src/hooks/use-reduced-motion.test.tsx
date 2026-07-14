// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useReducedMotion } from "./use-reduced-motion";

let matches = false;
let listener: ((event: MediaQueryListEvent) => void) | undefined;

function Probe() {
  return <output>{useReducedMotion() ? "reduce" : "animate"}</output>;
}

beforeEach(() => {
  matches = false;
  listener = undefined;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({
      get matches() {
        return matches;
      },
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: (_type: string, next: (event: MediaQueryListEvent) => void) => {
        listener = next;
      },
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(cleanup);

describe("useReducedMotion", () => {
  it("reacts when the system motion preference changes", () => {
    render(<Probe />);
    expect(screen.getByText("animate")).toBeInTheDocument();

    matches = true;
    act(() => listener?.({ matches: true } as MediaQueryListEvent));

    expect(screen.getByText("reduce")).toBeInTheDocument();
  });
});
