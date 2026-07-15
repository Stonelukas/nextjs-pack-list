// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Id } from "../../../convex/_generated/dataModel";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const preferenceState = vi.hoisted(() => ({
  preferences: {
    theme: "system",
    defaultPriority: "essential" as "essential" | "high" | "medium" | "low",
    autoSave: true,
  } as
    | {
        theme: string;
        defaultPriority: "essential" | "high" | "medium" | "low";
        autoSave: boolean;
      }
    | undefined,
}));

vi.mock("@/features/settings/hooks/use-preferences", () => ({
  usePreferences: () => preferenceState,
}));

import { ItemForm } from "./item-form";

const sourceCategoryId = "category-source" as Id<"categories">;
const destinationCategoryId = "category-destination" as Id<"categories">;
const item = {
  _id: "item-1" as Id<"items">,
  _creationTime: 1,
  categoryId: sourceCategoryId,
  name: "Passport",
  quantity: 1,
  priority: "essential",
  packed: false,
  order: 0,
};
const categories = [
  { _id: sourceCategoryId, _creationTime: 1, listId: "list-1", name: "Documents", order: 0, items: [item] },
  { _id: destinationCategoryId, _creationTime: 2, listId: "list-1", name: "Carry on", order: 1, items: [] },
] as never;

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

beforeEach(() => {
  preferenceState.preferences = {
    theme: "system",
    defaultPriority: "essential",
    autoSave: true,
  };
  Object.defineProperties(HTMLElement.prototype, {
    hasPointerCapture: { configurable: true, value: () => false },
    releasePointerCapture: { configurable: true, value: () => undefined },
    setPointerCapture: { configurable: true, value: () => undefined },
    scrollIntoView: { configurable: true, value: () => undefined },
  });
});

afterEach(cleanup);

describe("ItemForm", () => {
  it("initializes new items from the authenticated default priority", async () => {
    const user = userEvent.setup();
    render(<ItemForm categoryId={sourceCategoryId} onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Add item" }));

    expect(screen.getByRole("combobox", { name: "Priority" })).toHaveTextContent("Essential");
  });

  it("adopts a late new-item default while pristine without replacing edits", async () => {
    const user = userEvent.setup();
    preferenceState.preferences = undefined;
    const view = () => (
      <ItemForm categoryId={sourceCategoryId} onSubmit={vi.fn()} />
    );
    const { rerender } = render(view());

    await user.click(screen.getByRole("button", { name: "Add item" }));
    expect(screen.getByRole("combobox", { name: "Priority" })).toHaveTextContent(
      "Medium",
    );

    preferenceState.preferences = {
      theme: "system",
      defaultPriority: "high",
      autoSave: true,
    };
    rerender(view());
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "Priority" })).toHaveTextContent(
        "High",
      ),
    );

    await user.type(screen.getByLabelText("Name"), "Passport");
    preferenceState.preferences = {
      theme: "system",
      defaultPriority: "low",
      autoSave: true,
    };
    rerender(view());

    expect(screen.getByRole("combobox", { name: "Priority" })).toHaveTextContent(
      "High",
    );
  });

  it("allows only one submission while the first item mutation is pending", async () => {
    const user = userEvent.setup();
    const submission = deferred<unknown>();
    const onSubmit = vi.fn(() => submission.promise);
    render(<ItemForm categoryId={sourceCategoryId} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Add item" }));
    await user.type(screen.getByLabelText("Name"), "Passport");
    const form = screen.getByRole("dialog").querySelector("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Adding item…" })).toBeDisabled(),
    );

    submission.resolve(undefined);
  });

  it("keeps the longest form scrollable inside a short viewport", async () => {
    const user = userEvent.setup();
    render(
      <ItemForm
        categoryId={sourceCategoryId}
        item={item as never}
        availableCategories={categories}
        onSubmit={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Edit item" }));

    expect(screen.getByRole("dialog")).toHaveClass(
      "max-h-[calc(100dvh-2rem)]",
      "overflow-y-auto",
    );
    expect(document.querySelector('[data-slot="dialog-header"]')).toHaveClass("sticky", "top-0");
    expect(document.querySelector('[data-slot="dialog-footer"]')).toHaveClass("sticky", "bottom-0");
    expect(screen.getByRole("button", { name: "Update item" })).toBeInTheDocument();
  });

  it("keeps draft fields editable but disables the durable submit offline", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ItemForm
        categoryId={sourceCategoryId}
        item={item as never}
        availableCategories={categories}
        onSubmit={onSubmit}
        online={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Edit item" }));
    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Passport copy");

    expect(screen.getByLabelText("Name")).toHaveValue("Passport copy");
    const updateButton = screen.getByRole("button", { name: "Update item" });
    expect(updateButton).toBeDisabled();
    expect(updateButton).toHaveAttribute(
      "aria-describedby",
      "item-form-offline-reason",
    );
    expect(screen.getByText("Reconnect to save this item.")).toBeInTheDocument();

    await user.click(updateButton);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits field updates and the destination through one atomic action", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({
      data: { code: "VALIDATION", message: "Item update failed" },
    });

    render(
      <ItemForm
        categoryId={sourceCategoryId}
        item={item as never}
        availableCategories={categories}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Edit item" }));
    await user.click(screen.getByLabelText("Category"));
    await user.click(screen.getByRole("option", { name: "Carry on" }));
    await user.click(screen.getByRole("button", { name: "Update item" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Passport" }),
      destinationCategoryId,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Item update failed")).toBeInTheDocument();
  });
});
