// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const navigationState = {
  sidebarOpen: false,
  sidebarCollapsed: false,
  setSidebarOpen: vi.fn(),
  setMobileMenuOpen: vi.fn(),
};

vi.mock("@/store/navigation-store", () => ({
  useNavigationStore: Object.assign(() => navigationState, {
    getState: () => navigationState,
  }),
}));
vi.mock("./breadcrumbs", () => ({ Breadcrumbs: () => null }));
vi.mock("./contextual-nav", () => ({ ContextualNav: () => null }));
vi.mock("./sidebar", () => ({ Sidebar: () => null }));

import { NavigationLayout } from "./navigation-layout";

afterEach(cleanup);

describe("NavigationLayout", () => {
  it("reserves mobile safe-area space above the fixed bottom navigation", () => {
    const { container } = render(
      <NavigationLayout>
        <button>Last page action</button>
      </NavigationLayout>,
    );

    const content = container.querySelector("main > div");
    expect(content).toHaveClass("pb-[calc(5rem+env(safe-area-inset-bottom))]", "md:pb-6");
  });
});
