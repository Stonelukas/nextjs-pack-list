// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const updateUser = vi.hoisted(() => vi.fn());
const updatedUser = {
  _id: "user-1",
  clerkId: "clerk-1",
  name: "Avery Stone",
  email: "avery@example.com",
  updatedAt: 2,
  preferences: {
    theme: "system",
    defaultPriority: "essential",
    autoSave: true,
  },
};

vi.mock("../../../../convex/_generated/api", () => ({
  api: { users: { updateUser: Symbol("updateUser") } },
}));
vi.mock("convex/react", () => ({ useMutation: () => updateUser }));
vi.mock("@/hooks/use-online-status", () => ({ useOnlineStatus: () => ({ online: true }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { UserEditForm } from "./user-edit-form";

beforeEach(() => {
  updateUser.mockReset().mockResolvedValue(updatedUser);
  Object.defineProperties(HTMLElement.prototype, {
    hasPointerCapture: { configurable: true, value: () => false },
    releasePointerCapture: { configurable: true, value: () => undefined },
    setPointerCapture: { configurable: true, value: () => undefined },
    scrollIntoView: { configurable: true, value: () => undefined },
  });
});

afterEach(cleanup);

describe("UserEditForm", () => {
  it("preserves the supported essential default priority", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(
      <UserEditForm
        open
        onOpenChange={vi.fn()}
        onSuccess={onSuccess}
        user={{
          _id: "user-1" as never,
          clerkId: "clerk-1",
          name: "Avery Stone",
          email: "avery@example.com",
          preferences: {
            theme: "system",
            defaultPriority: "essential",
            autoSave: true,
          },
        }}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Default Priority" })).toHaveTextContent(
      "Essential",
    );
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          updates: expect.objectContaining({
            preferences: expect.objectContaining({ defaultPriority: "essential" }),
          }),
        }),
      ),
    );
    expect(onSuccess).toHaveBeenCalledWith(updatedUser);
  });
});
