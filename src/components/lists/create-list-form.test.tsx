// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const listActions = vi.hoisted(() => ({
  createList: vi.fn(),
  error: null,
  pending: false,
}));
const templateActions = vi.hoisted(() => ({
  applyTemplate: vi.fn(),
  detailLoading: false,
  error: null,
  pending: false,
  requestedDetailId: undefined as string | undefined,
  selectedDetail: undefined as undefined | { _id: string; name: string },
  templates: [
    {
      _id: "template-1",
      _creationTime: 1,
      createdBy: "user-1",
      name: "Weekend starter",
      description: "A short trip",
      category: "travel",
      isPublic: true,
      usageCount: 0,
      categories: [],
    },
  ],
}));

vi.mock("@/features/lists/hooks/use-list-actions", () => ({
  useListActions: () => listActions,
}));
vi.mock("@/features/templates/hooks/use-templates", () => ({
  useTemplateDetail: (templateId?: string) => {
    templateActions.requestedDetailId = templateId;
    return {
      template: templateActions.selectedDetail,
      loading: templateActions.detailLoading,
    };
  },
  useTemplates: () => templateActions,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { CreateListForm } from "./create-list-form";

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

beforeEach(() => {
  setOnline(true);
  listActions.createList.mockReset();
  templateActions.applyTemplate.mockReset();
  templateActions.detailLoading = false;
  templateActions.requestedDetailId = undefined;
  templateActions.selectedDetail = undefined;
  Object.defineProperties(HTMLElement.prototype, {
    hasPointerCapture: { configurable: true, value: () => false },
    releasePointerCapture: { configurable: true, value: () => undefined },
    setPointerCapture: { configurable: true, value: () => undefined },
    scrollIntoView: { configurable: true, value: () => undefined },
  });
});

afterEach(() => {
  cleanup();
  setOnline(true);
});

describe("CreateListForm selection semantics", () => {
  it("exposes the mutually exclusive start source as a labeled radio group", async () => {
    const user = userEvent.setup();
    render(<CreateListForm />);

    await user.click(screen.getByRole("button", { name: "Create new list" }));

    const scratch = screen.getByRole("radio", { name: "Scratch" });
    const template = screen.getByRole("radio", { name: "Template" });
    expect(screen.getByRole("radiogroup", { name: "Start from" })).toBeInTheDocument();
    expect(scratch).toBeChecked();
    expect(template).not.toBeChecked();

    await user.click(template);
    expect(template).toBeChecked();
    expect(scratch).not.toBeChecked();
  });
});

describe("CreateListForm submissions", () => {
  it("discards a canceled draft before reopening", async () => {
    const user = userEvent.setup();
    render(<CreateListForm />);

    await user.click(screen.getByRole("button", { name: "Create new list" }));
    await user.type(screen.getByLabelText("List name"), "Canceled trip");
    await user.type(screen.getByLabelText("Description"), "Should be discarded");
    await user.click(screen.getByRole("radio", { name: "Template" }));
    await user.click(screen.getByRole("combobox", { name: "Template" }));
    await user.click(screen.getByRole("option", { name: "Weekend starter" }));

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Create new list" }));

    expect(screen.getByLabelText("List name")).toHaveValue("");
    expect(screen.getByLabelText("Description")).toHaveValue("");
    expect(screen.getByRole("radio", { name: "Scratch" })).toBeChecked();
    expect(
      screen.queryByRole("combobox", { name: "Template" }),
    ).not.toBeInTheDocument();
  });

  it("loads selected template detail before enabling template application", async () => {
    const user = userEvent.setup();
    templateActions.detailLoading = true;
    render(<CreateListForm />);

    await user.click(screen.getByRole("button", { name: "Create new list" }));
    await user.type(screen.getByLabelText("List name"), "Trail weekend");
    await user.click(screen.getByRole("radio", { name: "Template" }));
    await user.click(screen.getByRole("combobox", { name: "Template" }));
    await user.click(screen.getByRole("option", { name: "Weekend starter" }));

    expect(templateActions.requestedDetailId).toBe("template-1");
    expect(screen.getByRole("button", { name: "Loading template…" })).toBeDisabled();
    expect(templateActions.applyTemplate).not.toHaveBeenCalled();
  });

  it("allows only one create request while the first submission is pending", async () => {
    const user = userEvent.setup();
    const submission = deferred<string>();
    listActions.createList.mockReturnValueOnce(submission.promise);
    render(<CreateListForm />);

    await user.click(screen.getByRole("button", { name: "Create new list" }));
    await user.type(screen.getByLabelText("List name"), "Trail weekend");
    const form = screen.getByRole("dialog").querySelector("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(listActions.createList).toHaveBeenCalledTimes(1);
    submission.resolve("list-1");
  });
});

describe("CreateListForm offline behavior", () => {
  it("preserves the draft and disables creation when connectivity is lost", async () => {
    const user = userEvent.setup();
    render(<CreateListForm />);

    await user.click(screen.getByRole("button", { name: "Create new list" }));
    await user.type(screen.getByLabelText("List name"), "Trail weekend");
    await user.type(screen.getByLabelText("Description"), "Drafted before the train tunnel");
    await user.click(screen.getByRole("radio", { name: "Template" }));
    await user.click(screen.getByRole("combobox", { name: "Template" }));
    await user.click(screen.getByRole("option", { name: "Weekend starter" }));

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });

    expect(screen.getByLabelText("List name")).toHaveValue("Trail weekend");
    expect(screen.getByLabelText("Description")).toHaveValue(
      "Drafted before the train tunnel",
    );
    expect(screen.getByRole("combobox", { name: "Template" })).toHaveTextContent("Weekend starter");

    const createButton = screen.getByRole("button", { name: "Create list" });
    expect(createButton).toBeDisabled();
    expect(createButton).toHaveAttribute(
      "aria-describedby",
      "create-list-dialog-offline-reason",
    );
    expect(screen.getByText("Reconnect to create this list.")).toBeInTheDocument();

    await user.click(createButton);
    expect(listActions.createList).not.toHaveBeenCalled();
    expect(templateActions.applyTemplate).not.toHaveBeenCalled();
  });
});
