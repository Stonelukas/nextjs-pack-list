// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider, useTheme } from "@/providers/theme-provider";

type MediaListener = (event: MediaQueryListEvent) => void;

let prefersDark = false;
let mediaListener: MediaListener | undefined;
const removeEventListener = vi.fn();
const storage = new Map<string, string>();
const localStorageMock: Storage = {
  get length() {
    return storage.size;
  },
  clear: () => storage.clear(),
  getItem: (key) => storage.get(key) ?? null,
  key: (index) => [...storage.keys()][index] ?? null,
  removeItem: (key) => storage.delete(key),
  setItem: (key, value) => storage.set(key, value),
};

function installMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: prefersDark,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addEventListener: (_event: string, listener: MediaListener) => {
        mediaListener = listener;
      },
      removeEventListener,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

afterEach(cleanup);

function ThemeHarness() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div>
      <output data-testid="theme">{theme}</output>
      <output data-testid="resolved-theme">{resolvedTheme}</output>
      <button type="button" onClick={() => setTheme("light")}>Light</button>
      <button type="button" onClick={() => setTheme("dark")}>Dark</button>
      <button type="button" onClick={() => setTheme("system")}>System</button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });
    window.localStorage.clear();
    document.documentElement.className = "unrelated";
    prefersDark = false;
    mediaListener = undefined;
    removeEventListener.mockClear();
    installMatchMedia();
  });

  it("persists explicit theme changes and updates the document class", () => {
    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Dark" }));

    expect(window.localStorage.getItem("pack-list-theme")).toBe("dark");
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement).not.toHaveClass("light");
    expect(document.documentElement).toHaveClass("unrelated");
  });

  it("resolves system theme changes and unsubscribes on cleanup", () => {
    window.localStorage.setItem("pack-list-theme", "system");
    prefersDark = true;

    const { unmount } = render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");

    act(() => {
      mediaListener?.({ matches: false } as MediaQueryListEvent);
    });

    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    expect(document.documentElement).toHaveClass("light");

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("falls back to system when persisted storage is invalid", () => {
    window.localStorage.setItem("pack-list-theme", "sepia");

    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(window.localStorage.getItem("pack-list-theme")).toBe("system");
  });

  it("keeps the application usable when browser storage is unavailable", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        ...localStorageMock,
        getItem: () => {
          throw new DOMException("Storage denied", "SecurityError");
        },
        setItem: () => {
          throw new DOMException("Storage denied", "SecurityError");
        },
      },
    });

    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(document.documentElement).toHaveClass("light");
  });
});
