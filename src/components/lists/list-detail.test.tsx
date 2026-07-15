// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { Id } from "../../../convex/_generated/dataModel";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
  addCategory: vi.fn(),
  addItem: vi.fn(),
  markListCompleted: vi.fn(),
  markListIncomplete: vi.fn(),
  reorderCategories: vi.fn(),
  updateItem: vi.fn(),
}));
const queryState = vi.hoisted(() => ({
  list: null as null | Record<string, unknown>,
}));

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({
    children,
    onDragEnd,
    sensors,
  }: {
    children: React.ReactNode;
    onDragEnd?: (event: unknown) => void;
    sensors?: unknown[];
  }) => (
    <div
      data-testid="category-dnd"
      data-sensors-enabled={String(Boolean(sensors?.length))}
    >
      <button
        type="button"
        onClick={() =>
          onDragEnd?.({
            active: { id: "category-1" },
            over: { id: "category-2" },
          })
        }
      >
        Reorder categories
      </button>
      {children}
    </div>
  ),
  KeyboardSensor: function KeyboardSensor() {},
  PointerSensor: function PointerSensor() {},
  closestCenter: vi.fn(),
  useSensor: () => ({}),
  useSensors: (...sensors: unknown[]) => sensors,
}));
vi.mock("@/features/lists/hooks/use-list", () => ({
  useList: () => ({ loading: false, list: queryState.list }),
}));
vi.mock("@/features/lists/hooks/use-list-actions", () => ({
  useListActions: () => ({
    ...actions,
    error: null,
    pending: false,
    resetError: vi.fn(),
  }),
}));
vi.mock("@/components/items/quick-add-item-dialog", () => ({
  QuickAddItemDialog: ({
    offlineReasonId,
    onAddItem,
    online = true,
    open,
  }: {
    offlineReasonId?: string;
    onAddItem: (categoryId: Id<"categories">, value: unknown) => Promise<unknown>;
    online?: boolean;
    open: boolean;
  }) =>
    open ? (
      <div role="dialog" aria-label="Quick add item">
        <input aria-label="Quick item name" defaultValue="Passport" />
        <button
          type="button"
          disabled={!online}
          aria-describedby={!online ? offlineReasonId : undefined}
          onClick={() =>
            void onAddItem("category-1" as Id<"categories">, {
              name: "Passport",
              description: "Keep accessible",
              quantity: 1,
              priority: "essential",
              packed: false,
              notes: "Front pocket",
              weight: 0.2,
              tags: ["documents"],
            })
          }
        >
          Submit quick item
        </button>
      </div>
    ) : null,
}));
vi.mock("@/components/dnd/sortable-category", () => ({
  SortableCategory: ({ online = true }: { online?: boolean }) => (
    <output data-testid="sortable-category-online">{String(online)}</output>
  ),
}));
vi.mock("@/components/lazy/lazy-export-dialog", () => ({ LazyExportDialog: () => null }));
vi.mock("@/components/lazy/lazy-import-dialog", () => ({ LazyImportDialog: () => null }));
vi.mock("@/components/mobile/floating-action-button", () => ({
  FloatingActionButton: () => null,
  SpeedDialAction: () => null,
}));
vi.mock("@/components/mobile/pull-to-refresh", () => ({
  PullToRefresh: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pull-to-refresh">
      <button type="button">Refresh list</button>
      {children}
    </div>
  ),
}));
vi.mock("@/components/progress/list-progress", () => ({
  ListProgress: () => <section>Progress</section>,
}));
vi.mock("@/components/templates/save-as-template", () => ({ SaveAsTemplate: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ListDetail } from "./list-detail";

const listId = "list-1" as Id<"lists">;

function baseList() {
  return {
    _id: listId,
    _creationTime: 1,
    userId: "user-1",
    name: "Weekend",
    isTemplate: false,
    categories: [
      {
        _id: "category-1",
        _creationTime: 2,
        listId,
        name: "Documents",
        order: 0,
        collapsed: false,
        items: [],
      },
    ],
  };
}

function setOnline(online: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: online,
  });
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

function rejectedThenable(error: unknown) {
  return {
    then(_resolve: (value: unknown) => void, reject: (reason: unknown) => void) {
      reject(error);
    },
  };
}

beforeEach(() => {
  setOnline(true);
  queryState.list = baseList();
  for (const action of Object.values(actions)) action.mockReset();
  actions.addItem.mockResolvedValue("item-1");
});

afterEach(() => {
  cleanup();
  setOnline(true);
});

describe("ListDetail", () => {
  it("renders one continuous route spine across the header and progress context", () => {
    const { container } = render(
      <MemoryRouter>
        <ListDetail listId={listId} />
      </MemoryRouter>,
    );

    expect(container.querySelectorAll("[data-route-spine]")).toHaveLength(1);
  });

  it("does not offer a manual refresh for its reactive Convex query", () => {
    render(
      <MemoryRouter>
        <ListDetail listId={listId} />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId("pull-to-refresh")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refresh list" })).not.toBeInTheDocument();
  });

  it("submits all item details in one atomic add mutation", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ListDetail listId={listId} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Quick add item" }));
    await user.click(screen.getByRole("button", { name: "Submit quick item" }));

    await waitFor(() =>
      expect(actions.addItem).toHaveBeenCalledWith(
        {
          categoryId: "category-1",
          name: "Passport",
          description: "Keep accessible",
          quantity: 1,
          priority: "essential",
          packed: false,
          notes: "Front pocket",
          weight: 0.2,
          tags: ["documents"],
        },
        { rethrow: true },
      ),
    );
    expect(actions.updateItem).not.toHaveBeenCalled();
  });

  it("guards category creation against repeated Enter submissions", async () => {
    const user = userEvent.setup();
    const creation = deferred<unknown>();
    actions.addCategory.mockReturnValue(creation.promise);
    render(
      <MemoryRouter>
        <ListDetail listId={listId} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Add category" }));
    const input = screen.getByLabelText("Category name");
    await user.type(input, "Food");
    await user.keyboard("{Enter}{Enter}");

    expect(actions.addCategory).toHaveBeenCalledTimes(1);
    expect(input).toBeDisabled();

    creation.resolve("category-2");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("keeps drafts available but disables list mutations and category reordering offline", async () => {
    const user = userEvent.setup();
    queryState.list = {
      ...baseList(),
      categories: [
        ...(baseList().categories as Record<string, unknown>[]),
        {
          _id: "category-2",
          _creationTime: 3,
          listId,
          name: "Clothing",
          order: 1,
          collapsed: false,
          items: [],
        },
      ],
    };
    setOnline(false);
    render(
      <MemoryRouter>
        <ListDetail listId={listId} />
      </MemoryRouter>,
    );

    const completeButton = screen.getByRole("button", { name: "Mark complete" });
    expect(completeButton).toBeDisabled();
    expect(completeButton).toHaveAttribute(
      "aria-describedby",
      "list-detail-offline-reason",
    );
    expect(screen.getByText("Reconnect to save changes to this list.")).toBeInTheDocument();

    expect(screen.getByTestId("category-dnd")).toHaveAttribute(
      "data-sensors-enabled",
      "true",
    );
    expect(screen.getAllByTestId("sortable-category-online")[0]).toHaveTextContent("false");
    await user.click(screen.getByRole("button", { name: "Reorder categories" }));
    expect(actions.reorderCategories).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Add category" }));
    await user.type(screen.getByLabelText("Category name"), "Food");
    expect(screen.getByLabelText("Category name")).toHaveValue("Food");
    const addCategoryButton = screen.getByRole("button", { name: "Add category" });
    expect(addCategoryButton).toBeDisabled();
    expect(addCategoryButton).toHaveAttribute(
      "aria-describedby",
      "add-category-offline-reason",
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await user.click(screen.getByRole("button", { name: "Quick add item" }));
    expect(screen.getByLabelText("Quick item name")).toHaveValue("Passport");
    expect(screen.getByRole("button", { name: "Submit quick item" })).toBeDisabled();
  });

  it("disables the completion confirmation offline without closing it", async () => {
    const user = userEvent.setup();
    queryState.list = {
      ...baseList(),
      categories: [
        {
          _id: "category-1",
          _creationTime: 2,
          listId,
          name: "Documents",
          order: 0,
          collapsed: false,
          items: [
            {
              _id: "item-1",
              _creationTime: 3,
              categoryId: "category-1",
              name: "Passport",
              order: 0,
              packed: true,
              priority: "essential",
              quantity: 1,
            },
          ],
        },
      ],
    };
    setOnline(false);
    render(
      <MemoryRouter>
        <ListDetail listId={listId} />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Mark complete" });
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAttribute(
      "aria-describedby",
      "complete-list-offline-reason",
    );
    expect(screen.getByText("Reconnect to complete this list.")).toBeInTheDocument();

    await user.click(confirm);
    expect(actions.markListCompleted).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("keeps the completion confirmation open until the mutation succeeds", async () => {
    const user = userEvent.setup();
    const completion = deferred<unknown>();
    actions.markListCompleted.mockReturnValue(completion.promise);
    queryState.list = {
      ...baseList(),
      categories: [
        {
          ...(baseList().categories as Record<string, unknown>[])[0],
          items: [
            {
              _id: "item-1",
              _creationTime: 3,
              categoryId: "category-1",
              name: "Passport",
              order: 0,
              packed: true,
              priority: "essential",
              quantity: 1,
            },
          ],
        },
      ],
    };
    render(
      <MemoryRouter>
        <ListDetail listId={listId} />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mark complete" }));

    expect(actions.markListCompleted).toHaveBeenCalledWith(
      { listId },
      { rethrow: true },
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    completion.resolve(listId);
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
  });

  it("shows a mapped completion failure and keeps the confirmation open", async () => {
    const user = userEvent.setup();
    actions.markListCompleted.mockReturnValue(
      rejectedThenable({
        data: { code: "OFFLINE", message: "Reconnect before saving changes." },
      }),
    );
    queryState.list = {
      ...baseList(),
      categories: [
        {
          ...(baseList().categories as Record<string, unknown>[])[0],
          items: [
            {
              _id: "item-1",
              _creationTime: 3,
              categoryId: "category-1",
              name: "Passport",
              order: 0,
              packed: true,
              priority: "essential",
              quantity: 1,
            },
          ],
        },
      ],
    };
    render(
      <MemoryRouter>
        <ListDetail listId={listId} />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mark complete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("You are offline");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Reconnect before saving changes.",
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });
});
