// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/lazy-imports", () => ({
  lazyImportQRCode: () => Promise.resolve({ toDataURL: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ExportDialog } from "./export-dialog";

const list = {
  _id: "list-1",
  _creationTime: 1,
  userId: "user-1",
  name: "Weekend",
  isTemplate: false,
  categories: [],
} as never;

afterEach(cleanup);

describe("ExportDialog device link", () => {
  it("describes the list URL as owner-only instead of shareable", async () => {
    const user = userEvent.setup();
    render(<ExportDialog list={list} categories={[]} items={[]} />);

    await user.click(screen.getByRole("button", { name: "Export" }));
    expect(screen.getByRole("tab", { name: "Open on another device" })).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Open on another device" }));
    expect(screen.getByText(/signed in to the same account/i)).toBeInTheDocument();
    expect(screen.queryByText(/shareable/i)).not.toBeInTheDocument();
  });
});
