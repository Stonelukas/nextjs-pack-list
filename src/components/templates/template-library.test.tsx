// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const applyTemplate = vi.hoisted(() => vi.fn());
const loadMore = vi.hoisted(() => vi.fn());
const auth = vi.hoisted(() => ({ isSignedIn: false }));
const template = {
  _id: "template-public",
  _creationTime: 1,
  name: "Weekend Getaway",
  description: "Public starter",
  isPublic: true,
  categoryCount: 0,
  itemCount: 0,
};

vi.mock("@clerk/clerk-react", () => ({ useUser: () => auth }));
vi.mock("convex/react", () => ({ useQuery: () => null }));
vi.mock("../../../convex/_generated/api", () => ({
  api: { users: { getCurrentUser: Symbol("getCurrentUser") } },
}));
vi.mock("@/features/templates/hooks/use-templates", () => ({
  useTemplates: () => ({
    applyTemplate,
    canLoadMore: true,
    loadMore,
    loading: false,
    loadingMore: false,
    templates: [template],
  }),
  useTemplateDetail: () => ({
    template: { ...template, categories: [] },
    loading: false,
  }),
}));
vi.mock("./template-card", () => ({
  TemplateCard: ({ onUse }: { onUse: (value: typeof template) => void }) => (
    <button type="button" onClick={() => onUse(template)}>Use public template</button>
  ),
}));
vi.mock("./template-previewer", () => ({
  TemplatePreviewer: ({ template: selected, onUse }: { template: typeof template | null; onUse: (value: typeof template, name: string) => void }) =>
    selected ? <button type="button" onClick={() => void onUse(selected, "Weekend copy")}>Create from preview</button> : null,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

import { TemplateLibrary } from "./template-library";

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

afterEach(() => {
  cleanup();
  applyTemplate.mockReset();
  loadMore.mockReset();
  auth.isSignedIn = false;
});

describe("TemplateLibrary guest actions", () => {
  it("offers the next bounded summary page when more templates are available", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/templates"]}>
        <TemplateLibrary />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Load more templates" }));
    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it("lets signed-out visitors browse public templates but preserves the return URL when they apply one", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/templates"]}>
        <Routes>
          <Route path="/templates" element={<TemplateLibrary />} />
          <Route path="/sign-in" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Template library" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Use public template" }));
    await user.click(screen.getByRole("button", { name: "Create from preview" }));

    expect(applyTemplate).not.toHaveBeenCalled();
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/sign-in?redirect_url=%2Ftemplates",
    );
  });
});
