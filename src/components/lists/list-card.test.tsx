// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteList: vi.fn(),
  duplicateList: vi.fn(),
  markListCompleted: vi.fn(),
  markListIncomplete: vi.fn(),
  createTemplateFromList: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/features/lists/hooks/use-list-actions", () => ({
  useListActions: () => ({
    deleteList: mocks.deleteList,
    duplicateList: mocks.duplicateList,
    markListCompleted: mocks.markListCompleted,
    markListIncomplete: mocks.markListIncomplete,
  }),
}));
vi.mock("@/features/templates/hooks/use-templates", () => ({
  useTemplates: () => ({ createTemplateFromList: mocks.createTemplateFromList }),
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

import { ListCard } from "./list-card";

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

const list = {
  _id: "list-1",
  _creationTime: 1,
  userId: "user-1",
  name: "Weekend",
  isTemplate: false,
  categoryCount: 2,
  itemCount: 4,
  packedCount: 1,
} as never;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ListCard", () => {
  it("exposes the list name as a section heading and names its progress", () => {
    render(
      <MemoryRouter>
        <ListCard list={list} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Weekend" })).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Weekend packing progress" }),
    ).toBeInTheDocument();
    expect(screen.getByText("4 items")).toBeInTheDocument();
    expect(screen.getByText("1 packed")).toBeInTheDocument();
  });

  it("uses Completed copy while keeping the native overlay link", () => {
    render(
      <MemoryRouter>
        <ListCard list={Object.assign({}, list, { completedAt: 2 }) as never} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Completed")).toBeVisible();
    expect(screen.queryByText("Cleared")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Weekend" })).toHaveAttribute(
      "href",
      "/lists/list-1",
    );
  });

  it("opens the list through a keyboard-accessible native link", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<><ListCard list={list} /><LocationProbe /></>} />
        </Routes>
      </MemoryRouter>,
    );

    const openLink = screen.getByRole("link", { name: "Open Weekend" });
    openLink.focus();
    await user.keyboard("{Enter}");

    expect(screen.getByTestId("location")).toHaveTextContent("/lists/list-1");
  });

  it("keeps the delete dialog open and shows mapped feedback when deletion fails", async () => {
    const user = userEvent.setup();
    mocks.deleteList.mockRejectedValueOnce({
      data: { code: "FORBIDDEN", message: "You cannot delete this list." },
    });
    render(
      <MemoryRouter>
        <ListCard list={list} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "List actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mocks.deleteList).toHaveBeenCalledWith(
        { listId: "list-1" },
        { rethrow: true },
      );
    });
    expect(screen.getByRole("alertdialog", { name: "Delete list" })).toBeInTheDocument();
    expect(mocks.toastError).toHaveBeenCalledWith("Access denied", {
      description: "You cannot delete this list.",
    });
  });

  it("shows mapped feedback when duplication fails", async () => {
    const user = userEvent.setup();
    mocks.duplicateList.mockRejectedValueOnce(new Error("database unavailable"));
    render(
      <MemoryRouter>
        <ListCard list={list} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "List actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Duplicate" }));

    await waitFor(() => {
      expect(mocks.duplicateList).toHaveBeenCalledWith(
        { listId: "list-1" },
        { rethrow: true },
      );
    });
    expect(mocks.toastError).toHaveBeenCalledWith("Something went wrong", {
      description: "An unexpected error interrupted the page. Please try again.",
    });
  });
});
