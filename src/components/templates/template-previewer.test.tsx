// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TemplateWithCategories } from "@/features/templates/hooks/use-templates";

vi.mock("./template-manager", () => ({ TemplateManager: () => null }));

import { TemplatePreviewer } from "./template-previewer";

const template = {
  _id: "template-1",
  _creationTime: 1,
  name: "Weekend",
  description: "A short trip",
  isPublic: true,
  categories: [
    {
      name: "Clothes",
      items: [{ name: "Shirt", quantity: 1, priority: "medium" }],
    },
  ],
} as unknown as TemplateWithCategories;
const secondTemplate = {
  ...template,
  _id: "template-2",
  name: "Expedition",
  description: "A longer route",
} as TemplateWithCategories;

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

afterEach(cleanup);

describe("TemplatePreviewer", () => {
  it("allows only one create request while the first template application is pending", async () => {
    const user = userEvent.setup();
    const submission = deferred<void>();
    const onUse = vi.fn(() => submission.promise);

    render(
      <TemplatePreviewer template={template} isOpen onClose={vi.fn()} onUse={onUse} />,
    );

    await user.click(screen.getByRole("button", { name: "Use template" }));
    const createButton = screen.getByRole("button", { name: "Create list" });
    await user.click(createButton);
    createButton.click();

    expect(onUse).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Creating list…" })).toBeDisabled();

    submission.resolve();
  });

  it("resets create state when the preview closes or changes templates", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const view = render(
      <TemplatePreviewer template={template} isOpen onClose={onClose} onUse={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "Use template" }));
    await user.clear(screen.getByLabelText("List name"));
    await user.type(screen.getByLabelText("List name"), "Stale name");

    view.rerender(
      <TemplatePreviewer template={null} isOpen={false} onClose={onClose} onUse={vi.fn()} />,
    );
    view.rerender(
      <TemplatePreviewer template={secondTemplate} isOpen onClose={onClose} onUse={vi.fn()} />,
    );

    expect(screen.getByRole("heading", { name: "Expedition" })).toBeInTheDocument();
    expect(screen.queryByLabelText("List name")).not.toBeInTheDocument();
  });

  it("does not close when applying the template fails", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onUse = vi.fn().mockRejectedValue({
      data: { code: "FORBIDDEN", message: "Template is unavailable" },
    });

    render(
      <TemplatePreviewer
        template={template}
        isOpen
        onClose={onClose}
        onUse={onUse}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Use template" }));
    await user.click(screen.getByRole("button", { name: "Create list" }));

    await waitFor(() => expect(onUse).toHaveBeenCalledTimes(1));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Template is unavailable")).toBeInTheDocument();
  });
});
