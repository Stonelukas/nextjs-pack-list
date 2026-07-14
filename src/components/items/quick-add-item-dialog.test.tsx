// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Id } from "../../../convex/_generated/dataModel";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/settings/hooks/use-preferences", () => ({
  usePreferences: () => ({
    preferences: { theme: "system", defaultPriority: "essential", autoSave: true },
  }),
}));

import { QuickAddItemDialog } from "./quick-add-item-dialog";

const categoryId = "category-1" as Id<"categories">;
const categories = [
  { _id: categoryId, _creationTime: 1, listId: "list-1", name: "Documents", order: 0, items: [] },
] as never;

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

beforeEach(() => {
  Object.defineProperties(HTMLElement.prototype, {
    hasPointerCapture: { configurable: true, value: () => false },
    releasePointerCapture: { configurable: true, value: () => undefined },
    setPointerCapture: { configurable: true, value: () => undefined },
    scrollIntoView: { configurable: true, value: () => undefined },
  });
});

afterEach(cleanup);

describe("QuickAddItemDialog", () => {
  it("initializes the priority from the authenticated preference", () => {
    render(
      <QuickAddItemDialog
        open
        onOpenChange={vi.fn()}
        categories={categories}
        onAddItem={vi.fn()}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Priority" })).toHaveTextContent("Essential");
  });

  it("allows only one quick-add submission while the first mutation is pending", async () => {
    const user = userEvent.setup();
    const submission = deferred<unknown>();
    const onAddItem = vi.fn(() => submission.promise);
    render(
      <QuickAddItemDialog
        open
        onOpenChange={vi.fn()}
        categories={categories}
        onAddItem={onAddItem}
      />,
    );

    await user.click(screen.getByLabelText("Category"));
    await user.click(screen.getByRole("option", { name: "Documents" }));
    await user.type(screen.getByLabelText("Item name"), "Passport");
    const form = screen.getByRole("dialog").querySelector("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(onAddItem).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Adding item…" })).toBeDisabled(),
    );

    submission.resolve(undefined);
  });

  it("preserves its draft and disables the durable submit offline", async () => {
    const user = userEvent.setup();
    const onAddItem = vi.fn();
    render(
      <QuickAddItemDialog
        open
        online={false}
        onOpenChange={vi.fn()}
        categories={categories}
        onAddItem={onAddItem}
      />,
    );

    await user.type(screen.getByLabelText("Item name"), "Passport");

    expect(screen.getByLabelText("Item name")).toHaveValue("Passport");
    const addButton = screen.getByRole("button", { name: "Add item" });
    expect(addButton).toBeDisabled();
    expect(addButton).toHaveAttribute(
      "aria-describedby",
      "quick-add-item-offline-reason",
    );
    expect(screen.getByText("Reconnect to add this item.")).toBeInTheDocument();

    await user.click(addButton);
    expect(onAddItem).not.toHaveBeenCalled();
  });

  it("keeps the dialog and entered values when item creation fails", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onAddItem = vi.fn().mockRejectedValue({
      data: { code: "VALIDATION", message: "Could not add item" },
    });

    render(
      <QuickAddItemDialog
        open
        onOpenChange={onOpenChange}
        categories={categories}
        onAddItem={onAddItem}
      />,
    );

    await user.click(screen.getByLabelText("Category"));
    await user.click(screen.getByRole("option", { name: "Documents" }));
    await user.type(screen.getByLabelText("Item name"), "Passport");
    await user.click(screen.getByRole("button", { name: "Add item" }));

    await waitFor(() => expect(onAddItem).toHaveBeenCalledTimes(1));
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Item name")).toHaveValue("Passport");
    expect(screen.getByText("Could not add item")).toBeInTheDocument();
  });
});
