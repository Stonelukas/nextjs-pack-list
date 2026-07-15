// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UserFacingError } from "@/lib/errors";

const actionState = vi.hoisted(() => ({
  createTemplateFromList: vi.fn(),
  error: null as UserFacingError | null,
  pending: false,
}));
const connectivity = vi.hoisted(() => ({ online: false }));
const toastSuccess = vi.hoisted(() => vi.fn());

vi.mock("@/features/templates/hooks/use-templates", () => ({
  useTemplates: () => actionState,
}));
vi.mock("@/hooks/use-online-status", () => ({
  useOnlineStatus: () => connectivity,
}));
vi.mock("sonner", () => ({
  toast: { success: toastSuccess },
}));

import { SaveAsTemplate } from "./save-as-template";

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

const list = {
  _id: "list-1",
  _creationTime: 1,
  userId: "user-1",
  name: "Weekend",
  isTemplate: false,
  categories: [
    {
      _id: "category-1",
      _creationTime: 2,
      listId: "list-1",
      name: "Clothes",
      order: 0,
      items: [],
    },
  ],
} as never;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  actionState.error = null;
  actionState.pending = false;
  connectivity.online = false;
});

describe("SaveAsTemplate", () => {
  it("allows only one save request while the first submission is pending", async () => {
    const user = userEvent.setup();
    const submission = deferred<string>();
    connectivity.online = true;
    actionState.createTemplateFromList.mockReturnValueOnce(submission.promise);
    render(<SaveAsTemplate list={list} />);

    await user.click(screen.getByRole("button", { name: /save as template/i }));
    await user.type(screen.getByLabelText("Description"), "Reusable weekend list");
    const save = screen.getByRole("button", { name: "Save template" });
    save.click();
    save.click();

    expect(actionState.createTemplateFromList).toHaveBeenCalledTimes(1);
    submission.resolve("template-1");
  });

  it("keeps every draft field editable offline while disabling only the durable save action", async () => {
    const user = userEvent.setup();
    render(<SaveAsTemplate list={list} />);

    await user.click(screen.getByRole("button", { name: /save as template/i }));

    const name = screen.getByLabelText("Name");
    const description = screen.getByLabelText("Description");
    const category = screen.getByLabelText("Category");
    const visibility = screen.getByRole("switch", { name: /private template/i });
    const cancel = screen.getByRole("button", { name: "Cancel" });

    await user.clear(name);
    await user.type(name, "Offline draft");
    await user.type(description, "Keep this description while disconnected.");
    await user.clear(category);
    await user.type(category, "weekend");
    await user.click(visibility);

    expect(name).toHaveValue("Offline draft");
    expect(description).toHaveValue("Keep this description while disconnected.");
    expect(category).toHaveValue("weekend");
    expect(visibility).toBeChecked();
    expect(name).toBeEnabled();
    expect(description).toBeEnabled();
    expect(category).toBeEnabled();
    expect(visibility).toBeEnabled();
    expect(cancel).toBeEnabled();

    const save = screen.getByRole("button", { name: "Save template" });
    expect(save).toBeDisabled();
    expect(save).toHaveAttribute(
      "aria-describedby",
      "save-template-offline-reason",
    );
    expect(
      screen.getByText(/reconnect to save this template/i),
    ).toBeVisible();

    await user.click(save);
    expect(actionState.createTemplateFromList).not.toHaveBeenCalled();
    expect(name).toHaveValue("Offline draft");
    expect(description).toHaveValue("Keep this description while disconnected.");
    expect(category).toHaveValue("weekend");
    expect(visibility).toBeChecked();
  });

  it("requests rethrow behavior when saving so the dialog owns failed submission flow", async () => {
    const user = userEvent.setup();
    connectivity.online = true;
    actionState.createTemplateFromList.mockResolvedValueOnce("template-1");
    render(<SaveAsTemplate list={list} />);

    await user.click(screen.getByRole("button", { name: /save as template/i }));
    await user.type(screen.getByLabelText("Description"), "Reusable weekend list");
    await user.click(screen.getByRole("button", { name: "Save template" }));

    await waitFor(() => {
      expect(actionState.createTemplateFromList).toHaveBeenCalledWith(
        {
          listId: "list-1",
          name: "Weekend Template",
          description: "Reusable weekend list",
          category: "custom",
          isPublic: false,
        },
        { rethrow: true },
      );
    });
  });

  it("renders mapped non-connectivity failures inside the open dialog", async () => {
    const user = userEvent.setup();
    connectivity.online = true;
    actionState.error = {
      code: "FORBIDDEN",
      title: "Access denied",
      message: "You cannot create a template from this list.",
      retryable: false,
    };
    render(<SaveAsTemplate list={list} />);

    await user.click(screen.getByRole("button", { name: /save as template/i }));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Access denied");
    expect(alert).toHaveTextContent(
      "You cannot create a template from this list.",
    );
  });
});
