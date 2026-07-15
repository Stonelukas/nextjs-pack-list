// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/gestures/swipeable-item", () => ({
  SwipeableItem: ({
    children,
    disabled,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <div data-testid="swipeable-item" data-disabled={String(Boolean(disabled))}>
      {children}
    </div>
  ),
}));
vi.mock("./item-form", () => ({
  ItemForm: ({
    offlineReasonId,
    online = true,
  }: {
    offlineReasonId?: string;
    online?: boolean;
  }) => (
    <button
      type="button"
      aria-label="Update item draft"
      disabled={!online}
      aria-describedby={!online ? offlineReasonId : undefined}
    >
      Update item
    </button>
  ),
}));

import { ItemRow } from "./item-row";

const item = {
  _id: "item-1",
  _creationTime: 1,
  categoryId: "category-1",
  name: "Passport",
  quantity: 2,
  packed: false,
  priority: "essential",
  order: 0,
} as never;

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

afterEach(cleanup);

describe("ItemRow quantity changes", () => {
  it("sends atomic deltas instead of stale absolute quantities", async () => {
    const user = userEvent.setup();
    const onAdjustQuantity = vi.fn();
    render(
      <ItemRow
        item={item}
        onTogglePacked={vi.fn()}
        onUpdate={vi.fn()}
        onAdjustQuantity={onAdjustQuantity}
        onDelete={vi.fn()}
      />,
    );

    const increment = screen.getAllByRole("button", {
      name: "Increase quantity for Passport",
    })[0]!;
    await user.click(increment);
    await user.click(increment);

    expect(onAdjustQuantity).toHaveBeenNthCalledWith(1, "item-1", 1);
    expect(onAdjustQuantity).toHaveBeenNthCalledWith(2, "item-1", 1);
  });
});

describe("ItemRow accessibility", () => {
  it("separates mobile content and actions into touch-safe rows", () => {
    const { container } = render(
      <ItemRow
        item={item}
        onTogglePacked={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(container.querySelectorAll("[data-item-primary]")).toHaveLength(2);
    expect(container.querySelectorAll("[data-item-actions]")).toHaveLength(2);
    expect(container.querySelector("[data-item-actions]")).toHaveClass(
      "col-span-full",
      "flex-wrap",
    );
  });

  it("names packed, quantity, and inline edit controls for the item", async () => {
    const user = userEvent.setup();
    render(
      <ItemRow
        item={item}
        onTogglePacked={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("checkbox", { name: "Mark Passport packed" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Decrease quantity for Passport" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Increase quantity for Passport" })).toHaveLength(2);

    await user.click(screen.getAllByRole("button", { name: "Passport" })[0]!);
    expect(screen.getAllByRole("button", { name: "Save name for Passport" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Cancel renaming Passport" })).toHaveLength(2);
  });
});

describe("ItemRow offline behavior", () => {
  it("disables durable item controls and swipes while preserving an inline name draft", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const onTogglePacked = vi.fn();
    const onUpdate = vi.fn();
    render(
      <>
        <p id="passport-offline-reason">Reconnect to save item changes.</p>
        <ItemRow
          item={item}
          online={false}
          offlineReasonId="passport-offline-reason"
          onTogglePacked={onTogglePacked}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </>,
    );

    for (const checkbox of screen.getAllByRole("checkbox", {
      name: "Mark Passport packed",
    })) {
      expect(checkbox).toBeDisabled();
      expect(checkbox).toHaveAttribute(
        "aria-describedby",
        "passport-offline-reason",
      );
    }
    for (const button of screen.getAllByRole("button", {
      name: "Increase quantity for Passport",
    })) {
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute(
        "aria-describedby",
        "passport-offline-reason",
      );
    }
    expect(screen.getByTestId("swipeable-item")).toHaveAttribute(
      "data-disabled",
      "true",
    );
    expect(screen.getAllByRole("button", { name: "Update item draft" })[0]).toBeDisabled();

    await user.click(screen.getAllByRole("button", { name: "Passport" })[0]!);
    const nameDraft = screen.getAllByRole("textbox")[0]!;
    await user.clear(nameDraft);
    await user.type(nameDraft, "Passport copy");
    expect(nameDraft).toHaveValue("Passport copy");
    expect(screen.getAllByRole("button", { name: "Save name for Passport" })[0]).toBeDisabled();

    await user.click(screen.getAllByRole("button", { name: "Delete Passport" })[0]!);
    const confirmDelete = screen.getByRole("button", { name: "Delete" });
    expect(confirmDelete).toBeDisabled();
    expect(confirmDelete).toHaveAttribute(
      "aria-describedby",
      "item-delete-offline-reason",
    );
    expect(screen.getByText("Reconnect to delete this item.")).toBeInTheDocument();

    await user.click(confirmDelete);
    expect(onDelete).not.toHaveBeenCalled();
    expect(onTogglePacked).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("keeps the delete confirmation open until deletion succeeds", async () => {
    const user = userEvent.setup();
    const deletion = deferred<unknown>();
    const onDelete = vi.fn(() => deletion.promise);
    render(
      <ItemRow
        item={item}
        onTogglePacked={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "Delete Passport" })[0]!);
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledWith("item-1");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    deletion.resolve(undefined);
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
  });

  it("shows a mapped deletion failure and keeps the confirmation open", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockRejectedValue({
      data: { code: "OFFLINE", message: "Reconnect before saving changes." },
    });
    render(
      <ItemRow
        item={item}
        onTogglePacked={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "Delete Passport" })[0]!);
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("You are offline");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Reconnect before saving changes.",
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });
});
