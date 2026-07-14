// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const actionState = vi.hoisted(() => ({
  createList: vi.fn(),
  error: null as null | { title: string; message: string },
  pending: false,
}));
const connectivity = vi.hoisted(() => ({ online: false }));

vi.mock("@/features/lists/hooks/use-list-actions", () => ({
  useListActions: () => actionState,
}));
vi.mock("@/hooks/use-online-status", () => ({
  useOnlineStatus: () => connectivity,
}));

import { CreateListPage } from "./create-list-page";

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

afterEach(() => {
  cleanup();
  actionState.createList.mockReset();
  actionState.error = null;
  connectivity.online = false;
});

describe("CreateListPage offline behavior", () => {
  it("allows only one create request while the first submission is pending", async () => {
    const user = userEvent.setup();
    const submission = deferred<string>();
    connectivity.online = true;
    actionState.createList.mockReturnValueOnce(submission.promise);
    render(
      <MemoryRouter>
        <CreateListPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/list name/i), "Trail weekend");
    const form = screen.getByRole("button", { name: /create list/i }).closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(actionState.createList).toHaveBeenCalledTimes(1);
    submission.resolve("list-1");
  });

  it("announces asynchronous create failures", () => {
    connectivity.online = true;
    actionState.error = { title: "Could not create list", message: "Try again." };

    render(
      <MemoryRouter>
        <CreateListPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Could not create list");
    expect(screen.getByRole("alert")).toHaveTextContent("Try again.");
  });

  it("disables the durable create action and explains that reconnection is required", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CreateListPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/list name/i), "Trail weekend");

    const createButton = screen.getByRole("button", { name: /create list/i });
    expect(createButton).toBeDisabled();
    expect(createButton).toHaveAttribute(
      "aria-describedby",
      "create-list-offline-reason",
    );
    expect(screen.getByText(/reconnect to create this list/i)).toBeInTheDocument();
  });
});
