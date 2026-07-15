// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const deleteUser = vi.hoisted(() => vi.fn());
const testUser = {
  _id: "user-1",
  clerkId: "clerk-1",
  name: "Avery Stone",
  updatedAt: 1,
};
let tableUser = testUser;
let detailsUser = testUser;

vi.mock("../../../../convex/_generated/api", () => ({
  api: { users: { deleteUser: Symbol("deleteUser") } },
}));
vi.mock("convex/react", () => ({ useMutation: () => deleteUser }));
vi.mock("@/hooks/use-online-status", () => ({ useOnlineStatus: () => ({ online: true }) }));
vi.mock("./user-table", () => ({
  UserTable: ({
    onUserDelete,
    onUserEdit,
    onUserSelect,
  }: {
    onUserDelete: (user: typeof testUser) => void;
    onUserEdit: (user: typeof testUser) => void;
    onUserSelect: (user: typeof testUser) => void;
  }) => (
    <>
      <button type="button" onClick={() => onUserDelete(testUser)}>Delete Avery</button>
      <button type="button" onClick={() => onUserEdit(tableUser)}>Edit Avery</button>
      <button type="button" onClick={() => onUserSelect(testUser)}>View Avery</button>
    </>
  ),
}));
vi.mock("./user-details", () => ({
  UserDetails: ({ onEdit }: { onEdit: (user: typeof testUser) => void }) => (
    <button type="button" onClick={() => onEdit(detailsUser)}>Edit from details</button>
  ),
}));
vi.mock("./user-edit-form", () => ({
  UserEditForm: ({
    user,
    onSuccess,
  }: {
    user: typeof testUser;
    onSuccess: (updatedUser: typeof testUser) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onSuccess({ ...user, name: "Avery Updated", updatedAt: 2 })
      }
    >
      Save {user.name}
    </button>
  ),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { UserManagement } from "./user-management";

const userManagementSource = readFileSync(
  path.join(process.cwd(), "src/components/admin/users/user-management.tsx"),
  "utf8",
);

beforeEach(() => {
  deleteUser.mockReset();
  tableUser = testUser;
  detailsUser = testUser;
});
afterEach(cleanup);

describe("UserManagement deletion", () => {
  it("keeps mapped deletion errors in dialog state instead of closing in cleanup", () => {
    expect(userManagementSource).toContain("setDeleteError(mapError(error))");
    expect(userManagementSource).not.toMatch(/finally\s*\([^)]*\)\s*=>\s*\{[^}]*setIsDeleteDialogOpen\(false\)/s);
    expect(userManagementSource).toContain("if (deletePending && !open) return");
  });

  it("disables confirmation actions while deletion is pending and closes only on success", async () => {
    const user = userEvent.setup();
    let resolve!: () => void;
    deleteUser.mockReturnValue(new Promise<void>((promiseResolve) => { resolve = promiseResolve; }));
    render(<UserManagement />);

    await user.click(screen.getByRole("button", { name: "Delete Avery" }));
    await user.click(screen.getByRole("button", { name: "Delete User" }));

    expect(screen.getByRole("alertdialog")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Deleting user…" })).toBeDisabled();

    resolve();
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });
});

describe("UserManagement editing", () => {
  it("reopens a direct table edit with the latest successful values", async () => {
    const user = userEvent.setup();
    render(<UserManagement />);

    await user.click(screen.getByRole("button", { name: "Edit Avery" }));
    await user.click(screen.getByRole("button", { name: "Save Avery Stone" }));
    await user.click(screen.getByRole("button", { name: "Edit Avery" }));

    expect(screen.getByRole("button", { name: "Save Avery Updated" })).toBeInTheDocument();

    tableUser = {
      ...testUser,
      name: "Avery Authoritative",
      updatedAt: 3,
    };
    await user.click(screen.getByRole("button", { name: "Edit Avery" }));

    expect(
      screen.getByRole("button", { name: "Save Avery Authoritative" }),
    ).toBeInTheDocument();
  });

  it("reopens the editor with the latest successfully submitted values", async () => {
    const user = userEvent.setup();
    render(<UserManagement />);

    await user.click(screen.getByRole("button", { name: "View Avery" }));
    await user.click(screen.getByRole("button", { name: "Edit from details" }));
    await user.click(screen.getByRole("button", { name: "Save Avery Stone" }));
    await user.click(screen.getByRole("button", { name: "Edit from details" }));

    expect(screen.getByRole("button", { name: "Save Avery Updated" })).toBeInTheDocument();

    detailsUser = {
      ...testUser,
      name: "Avery Authoritative",
      updatedAt: 3,
    };
    await user.click(screen.getByRole("button", { name: "Edit from details" }));

    expect(
      screen.getByRole("button", { name: "Save Avery Authoritative" }),
    ).toBeInTheDocument();
  });
});
