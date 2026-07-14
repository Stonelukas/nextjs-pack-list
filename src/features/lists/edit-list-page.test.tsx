// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
  error: null as null | { title: string; message: string },
  pending: false,
  updateList: vi.fn(),
}));

vi.mock("@/features/lists/hooks/use-list", () => ({
  useRouteList: () => ({
    loading: false,
    list: {
      _id: "list-1",
      _creationTime: 1,
      name: "Conference",
      description: "Old description",
      tags: [],
      categories: [],
    },
  }),
}));
vi.mock("@/features/lists/hooks/use-list-actions", () => ({
  useListActions: () => actions,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { EditListPage } from "./edit-list-page";

beforeEach(() => {
  actions.error = null;
  actions.pending = false;
  actions.updateList.mockReset().mockResolvedValue("list-1");
});

afterEach(cleanup);

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/lists/list-1/edit"]}>
      <Routes>
        <Route path="/lists/:id/edit" element={<EditListPage />} />
        <Route path="/lists/:id" element={<p>Saved list route</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("EditListPage", () => {
  it("allows only one update request while the first submission is pending", () => {
    const submission = deferred<string>();
    actions.updateList.mockReturnValueOnce(submission.promise);
    renderPage();

    const form = screen.getByRole("button", { name: /save changes/i }).closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(actions.updateList).toHaveBeenCalledTimes(1);
    submission.resolve("list-1");
  });

  it("sends an explicit empty description when clearing an existing value", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.clear(screen.getByLabelText("Description"));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(actions.updateList).toHaveBeenCalledWith({
      listId: "list-1",
      name: "Conference",
      description: "",
      tags: [],
    });
    expect(await screen.findByText("Saved list route")).toBeInTheDocument();
  });

  it("announces asynchronous save errors", () => {
    actions.error = { title: "Could not save list", message: "Try again." };
    renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent("Could not save list");
    expect(screen.getByRole("alert")).toHaveTextContent("Try again.");
  });
});
