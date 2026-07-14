// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    clear: () => storage.clear(),
    getItem: (key: string) => storage.get(key) ?? null,
    key: (index: number) => [...storage.keys()][index] ?? null,
    get length() {
      return storage.size;
    },
    removeItem: (key: string) => storage.delete(key),
    setItem: (key: string, value: string) => storage.set(key, value),
  } satisfies Storage,
});

const { useNavigationStore } = await import("./navigation-store");

describe("navigation-store", () => {
  it("contains presentation preferences but no custom route history", () => {
    const state = useNavigationStore.getState();

    expect(state).toMatchObject({
      sidebarOpen: true,
      sidebarCollapsed: false,
      mobileMenuOpen: false,
    });
    expect(state).not.toHaveProperty("activeSection");
    expect(state).not.toHaveProperty("breadcrumbs");
    expect(state).not.toHaveProperty("navigationHistory");
    expect(state).not.toHaveProperty("recentPages");
  });
});
