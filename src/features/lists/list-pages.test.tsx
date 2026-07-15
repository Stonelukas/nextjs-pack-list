// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryRouter,
  MemoryRouter,
  Route,
  RouterProvider,
  Routes,
} from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const listDetailProps = vi.hoisted(() => vi.fn());
const routeListState = vi.hoisted(() => ({
  requestedId: "" as string | undefined,
  list: undefined as undefined | { _id: string; name: string },
  listsById: {} as Record<string, { _id: string; name: string }>,
  loading: false,
}));

vi.mock("@/components/lists/list-detail", () => ({
  ListDetail: (props: { list: { _id: string; name: string } }) => {
    listDetailProps(props);
    return (
      <>
        <p>Detail component</p>
        <input
          aria-label="Template name"
          defaultValue={`${props.list.name} Template`}
        />
      </>
    );
  },
}));
vi.mock("@/features/lists/hooks/use-list", () => ({
  useList: () => ({ list: undefined, loading: false }),
  useRouteList: (id?: string) => {
    routeListState.requestedId = id;
    return {
      list: (id && routeListState.listsById[id]) ?? routeListState.list,
      loading: routeListState.loading,
    };
  },
}));
vi.mock("@/features/lists/hooks/use-list-actions", () => ({
  useListActions: () => ({ error: null, pending: false, updateList: vi.fn() }),
}));
vi.mock("@/features/lists/hooks/use-lists", () => ({
  useLists: () => ({ lists: [], loading: false }),
}));
vi.mock("@/components/export/import-dialog", () => ({ ImportDialog: () => null }));
vi.mock("@/components/templates/quick-start-templates", () => ({ QuickStartTemplates: () => null }));
vi.mock("@/components/lists/create-list-form", () => ({ CreateListForm: () => null }));
vi.mock("@/components/search/search-bar", () => ({ SearchBar: () => null }));

import { EditListPage } from "./edit-list-page";
import { ListDetailPage } from "./list-detail-page";
import { ListIndexPage } from "./list-index-page";

afterEach(() => {
  cleanup();
  listDetailProps.mockClear();
  routeListState.requestedId = undefined;
  routeListState.list = undefined;
  routeListState.listsById = {};
  routeListState.loading = false;
});

describe("list feature pages", () => {
  it("consumes the status search parameter on direct list-index entry", () => {
    render(
      <MemoryRouter initialEntries={["/lists?status=active"]}>
        <ListIndexPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "My packing lists" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Active lists" })).toBeInTheDocument();
  });

  it("normalizes the dynamic route id before rendering list detail", () => {
    routeListState.list = { _id: "normalized-list", name: "Normalized" };
    render(
      <MemoryRouter initialEntries={["/lists/list-abc"]}>
        <Routes>
          <Route path="/lists/:id" element={<ListDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(routeListState.requestedId).toBe("list-abc");
    expect(listDetailProps).toHaveBeenCalledWith({ list: routeListState.list });
  });

  it("remounts list-derived detail state when navigating between list ids", async () => {
    routeListState.listsById = {
      "list-a": { _id: "normalized-a", name: "Alpine" },
      "list-b": { _id: "normalized-b", name: "Beach" },
    };
    const router = createMemoryRouter(
      [{ path: "/lists/:id", element: <ListDetailPage /> }],
      { initialEntries: ["/lists/list-a"] },
    );
    render(<RouterProvider router={router} />);

    const templateName = screen.getByRole("textbox", { name: "Template name" });
    expect(templateName).toHaveValue("Alpine Template");
    fireEvent.change(templateName, { target: { value: "Unsaved Alpine draft" } });
    expect(templateName).toHaveValue("Unsaved Alpine draft");

    await router.navigate("/lists/list-b");

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Template name" })).toHaveValue(
        "Beach Template",
      );
    });
  });

  it.each([
    ["detail", "/lists/example", <ListDetailPage />],
    ["edit", "/lists/example/edit", <EditListPage />],
  ])("renders the designed not-found state for malformed %s route ids", (_label, entry, element) => {
    render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/lists/:id" element={element} />
          <Route path="/lists/:id/edit" element={element} />
        </Routes>
      </MemoryRouter>,
    );

    expect(routeListState.requestedId).toBe("example");
    expect(screen.getByText("List not found.")).toBeInTheDocument();
  });
});
