// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
  importList: vi.fn(),
  createList: vi.fn(),
  addCategory: vi.fn(),
  addItem: vi.fn(),
  updateItem: vi.fn(),
}));

vi.mock("@/features/lists/hooks/use-list-actions", () => ({
  useListActions: () => actions,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ImportDialog } from "./import-dialog";

const validPayload = {
  version: 1,
  list: { name: "Conference", tags: ["work"] },
  categories: [
    {
      name: "Documents",
      items: [
        {
          name: "Passport",
          quantity: 1,
          priority: "essential",
          packed: false,
          description: "Keep accessible",
        },
      ],
    },
  ],
};

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function setOnline(online: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: online,
  });
}

function jsonFile(payload: unknown, name = "packing-list.json") {
  const payloadText = JSON.stringify(payload);
  const file = new File([payloadText], name, { type: "application/json" });
  Object.defineProperty(file, "text", {
    value: () => Promise.resolve(payloadText),
  });
  return file;
}

beforeEach(() => {
  setOnline(true);
  for (const action of Object.values(actions)) action.mockReset();
  actions.importList.mockResolvedValue("list-imported");
});

afterEach(() => {
  cleanup();
  setOnline(true);
});

describe("ImportDialog", () => {
  it("rejects malformed nested data before calling the import mutation", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ImportDialog />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Import" }));
    const invalidPayload = {
      version: 1,
      list: { name: "Broken" },
      categories: [
        {
          name: "Documents",
          items: [{ name: "Passport", quantity: 0, priority: "urgent" }],
        },
      ],
    };
    await user.upload(
      screen.getByLabelText("JSON file"),
      jsonFile(invalidPayload, "broken.json"),
    );
    await user.click(screen.getByRole("button", { name: "Import list" }));

    await waitFor(() => expect(actions.importList).not.toHaveBeenCalled());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("submits one validated transactional import mutation", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ImportDialog />
        <LocationProbe />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Import" }));
    await user.upload(screen.getByLabelText("JSON file"), jsonFile(validPayload));
    await user.click(screen.getByRole("button", { name: "Import list" }));

    await waitFor(() =>
      expect(actions.importList).toHaveBeenCalledWith(validPayload, { rethrow: true }),
    );
    expect(actions.createList).not.toHaveBeenCalled();
    expect(actions.addCategory).not.toHaveBeenCalled();
    expect(actions.addItem).not.toHaveBeenCalled();
    expect(actions.updateItem).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/lists/list-imported",
      ),
    );
  });

  it("preserves the selected file and disables import after going offline", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ImportDialog />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Import" }));
    await user.upload(screen.getByLabelText("JSON file"), jsonFile(validPayload));

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });

    expect(screen.getByText("packing-list.json")).toBeInTheDocument();
    const importButton = screen.getByRole("button", { name: "Import list" });
    expect(importButton).toBeDisabled();
    expect(importButton).toHaveAttribute(
      "aria-describedby",
      "import-list-offline-reason",
    );
    expect(screen.getByText("Reconnect to import this list.")).toBeInTheDocument();

    await user.click(importButton);
    expect(actions.importList).not.toHaveBeenCalled();
  });

  it("maps a domain-shaped offline rejection without clearing the selected file", async () => {
    const user = userEvent.setup();
    actions.importList.mockRejectedValue({
      data: { code: "OFFLINE", message: "Reconnect before saving changes." },
    });
    render(
      <MemoryRouter>
        <ImportDialog />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Import" }));
    await user.upload(screen.getByLabelText("JSON file"), jsonFile(validPayload));
    await user.click(screen.getByRole("button", { name: "Import list" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("You are offline");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Reconnect before saving changes.",
    );
    expect(screen.getByText("packing-list.json")).toBeInTheDocument();
  });
});
