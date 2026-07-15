// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const listState = vi.hoisted(() => ({
  exportLists: [
    { _id: "list-1", tags: ["first-page"] },
    { _id: "list-51", tags: ["later-list"] },
  ],
  firstPageLists: [{ _id: "list-1", tags: ["first-page"] }],
}));
const templateState = vi.hoisted(() => ({
  templates: [{ _id: "template-1", tags: ["first-page"] }],
  loading: false,
  loadingMore: false,
  canLoadMore: true,
  loadMore: vi.fn(),
}));

vi.mock("@/features/lists/hooks/use-lists", () => ({
  useLists: () => ({ lists: listState.firstPageLists, loading: false }),
  useListExportData: () => ({ lists: listState.exportLists, loading: false }),
}));
vi.mock("@/features/templates/hooks/use-templates", () => ({
  useTemplates: () => templateState,
}));

import { TagsPage } from "./tags-page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  templateState.templates = [{ _id: "template-1", tags: ["first-page"] }];
  templateState.loading = false;
  templateState.loadingMore = false;
  templateState.canLoadMore = true;
});

describe("TagsPage", () => {
  it("waits for every list and template page before computing tag totals", async () => {
    const { rerender } = render(
      <MemoryRouter>
        <TagsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Loading tag registry…")).toBeInTheDocument();
    await waitFor(() => expect(templateState.loadMore).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("#first-page")).not.toBeInTheDocument();

    templateState.templates = [
      { _id: "template-1", tags: ["first-page"] },
      { _id: "template-51", tags: ["later-template"] },
    ];
    templateState.canLoadMore = false;
    rerender(
      <MemoryRouter>
        <TagsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("#first-page")).toBeInTheDocument();
    expect(screen.getByText("#later-list")).toBeInTheDocument();
    expect(screen.getByText("#later-template")).toBeInTheDocument();
    expect(
      screen.getByText("Used by 1 lists and 1 templates"),
    ).toBeInTheDocument();
  });
});
