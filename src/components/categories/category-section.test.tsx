// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Id } from "../../../convex/_generated/dataModel";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
  addItem: vi.fn(),
  adjustItemQuantity: vi.fn(),
  deleteCategory: vi.fn(),
  deleteItem: vi.fn(),
  reorderItems: vi.fn(),
  toggleCategoryCollapse: vi.fn(),
  toggleItemPacked: vi.fn(),
  updateCategory: vi.fn(),
  updateItemAndMove: vi.fn(),
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
    <div data-testid="item-dnd" data-sensors-enabled={String(Boolean(sensors?.length))}>
      <button
        type="button"
        onClick={() =>
          onDragEnd?.({
            active: { id: "item-1" },
            over: { id: "item-2" },
          })
        }
      >
        Reorder items
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
vi.mock("@/features/lists/hooks/use-list-actions", () => ({
  useListActions: () => ({
    ...actions,
    error: null,
    pending: false,
    resetError: vi.fn(),
  }),
}));
vi.mock("@/components/items/item-form", () => ({
  ItemForm: ({
    offlineReasonId,
    onSubmit,
    online = true,
  }: {
    offlineReasonId?: string;
    onSubmit: (value: unknown) => Promise<unknown>;
    online?: boolean;
  }) => (
    <button
      type="button"
      disabled={!online}
      aria-describedby={!online ? offlineReasonId : undefined}
      onClick={() =>
        void onSubmit({
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
      Submit item
    </button>
  ),
}));
vi.mock("@/components/dnd/sortable-item", () => ({
  SortableItem: ({ online = true }: { online?: boolean }) => (
    <output data-testid="sortable-item-online">{String(online)}</output>
  ),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { CategorySection } from "./category-section";

const listId = "list-1" as Id<"lists">;
const categoryId = "category-1" as Id<"categories">;
const category = {
  _id: categoryId,
  _creationTime: 1,
  listId,
  name: "Documents",
  order: 0,
  collapsed: false,
  items: [],
};
const categoryWithItems = {
  ...category,
  items: [
    {
      _id: "item-1",
      _creationTime: 2,
      categoryId,
      name: "Passport",
      order: 0,
      packed: true,
      priority: "essential",
      quantity: 1,
    },
    {
      _id: "item-2",
      _creationTime: 3,
      categoryId,
      name: "Tickets",
      order: 1,
      packed: false,
      priority: "high",
      quantity: 1,
    },
  ],
} as never;

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

beforeEach(() => {
  for (const action of Object.values(actions)) action.mockReset();
  actions.addItem.mockResolvedValue("item-1");
});

afterEach(cleanup);

describe("CategorySection", () => {
  it("wraps category metadata and actions into mobile-safe rows", () => {
    const { container } = render(
      <CategorySection listId={listId} category={category} categories={[category]} />,
    );

    expect(container.querySelector("[data-category-header]")).toHaveClass(
      "flex-col",
      "sm:flex-row",
    );
    expect(container.querySelector("[data-category-actions]")).toHaveClass(
      "flex-wrap",
      "self-end",
    );
  });

  it("names the inline rename controls and category progress", async () => {
    const user = userEvent.setup();

    render(
      <CategorySection
        listId={listId}
        category={categoryWithItems}
        categories={[categoryWithItems]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Rename category" }));
    expect(
      screen.getByRole("button", { name: "Save category name for Documents" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancel renaming Documents" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Documents packing progress" }),
    ).toBeInTheDocument();
  });

  it("submits the complete item in one mutation with transactional failure propagation", async () => {
    const user = userEvent.setup();
    render(
      <CategorySection
        listId={listId}
        category={category}
        categories={[category]}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "Submit item" })[0]!);

    await waitFor(() =>
      expect(actions.addItem).toHaveBeenCalledWith(
        {
          categoryId,
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
    expect(actions.updateItemAndMove).not.toHaveBeenCalled();
  });

  it("disables category and item mutations plus item reordering while offline", async () => {
    const user = userEvent.setup();
    render(
      <>
        <p id="documents-offline-reason">Reconnect to save list changes.</p>
        <CategorySection
          listId={listId}
          category={categoryWithItems}
          categories={[categoryWithItems]}
          online={false}
          offlineReasonId="documents-offline-reason"
        />
      </>,
    );

    expect(screen.getByRole("button", { name: "Toggle category" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Submit item" })).toBeDisabled();
    expect(screen.getByTestId("item-dnd")).toHaveAttribute(
      "data-sensors-enabled",
      "true",
    );
    expect(screen.getAllByTestId("sortable-item-online")[0]).toHaveTextContent("false");

    await user.click(screen.getByRole("button", { name: "Reorder items" }));
    expect(actions.reorderItems).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete category" }));
    const confirmDelete = screen.getByRole("button", { name: "Delete category" });
    expect(confirmDelete).toBeDisabled();
    expect(confirmDelete).toHaveAttribute(
      "aria-describedby",
      "category-delete-offline-reason",
    );
    expect(screen.getByText("Reconnect to delete this category.")).toBeInTheDocument();

    await user.click(confirmDelete);
    expect(actions.deleteCategory).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("keeps the category delete confirmation open until deletion succeeds", async () => {
    const user = userEvent.setup();
    const deletion = deferred<unknown>();
    actions.deleteCategory.mockReturnValue(deletion.promise);
    render(
      <CategorySection listId={listId} category={category} categories={[category]} />,
    );

    await user.click(screen.getByRole("button", { name: "Delete category" }));
    await user.click(screen.getByRole("button", { name: "Delete category" }));

    expect(actions.deleteCategory).toHaveBeenCalledWith(
      { categoryId },
      { rethrow: true },
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    deletion.resolve(true);
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
  });

  it("shows a mapped category deletion failure and keeps the confirmation open", async () => {
    const user = userEvent.setup();
    actions.deleteCategory.mockReturnValue({
      then(_resolve: (value: unknown) => void, reject: (reason: unknown) => void) {
        reject({
          data: { code: "OFFLINE", message: "Reconnect before saving changes." },
        });
      },
    });
    render(
      <CategorySection listId={listId} category={category} categories={[category]} />,
    );

    await user.click(screen.getByRole("button", { name: "Delete category" }));
    await user.click(screen.getByRole("button", { name: "Delete category" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("You are offline");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Reconnect before saving changes.",
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });
});
