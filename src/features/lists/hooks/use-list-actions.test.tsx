// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { beforeEach, describe, expect, it, vi } from "vitest";

const convex = vi.hoisted(() => {
  const references = {
    createList: Symbol("createList"),
    importList: Symbol("importList"),
    updateList: Symbol("updateList"),
    markListCompleted: Symbol("markListCompleted"),
    markListIncomplete: Symbol("markListIncomplete"),
    deleteList: Symbol("deleteList"),
    duplicateList: Symbol("duplicateList"),
    addCategory: Symbol("addCategory"),
    updateCategory: Symbol("updateCategory"),
    deleteCategory: Symbol("deleteCategory"),
    toggleCategoryCollapse: Symbol("toggleCategoryCollapse"),
    reorderCategories: Symbol("reorderCategories"),
    addItem: Symbol("addItem"),
    updateItem: Symbol("updateItem"),
    updateItemAndMove: Symbol("updateItemAndMove"),
    adjustItemQuantity: Symbol("adjustItemQuantity"),
    deleteItem: Symbol("deleteItem"),
    toggleItemPacked: Symbol("toggleItemPacked"),
    reorderItems: Symbol("reorderItems"),
    moveItem: Symbol("moveItem"),
  };

  return {
    references,
    mutations: new Map<symbol, ReturnType<typeof vi.fn>>(),
  };
});

vi.mock("../../../../convex/_generated/api", () => ({
  api: { lists: convex.references },
}));

vi.mock("convex/react", () => ({
  useMutation: (reference: symbol) => convex.mutations.get(reference),
}));

import { useListActions } from "./use-list-actions";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: true,
  });
  convex.mutations.clear();
  for (const reference of Object.values(convex.references)) {
    convex.mutations.set(reference, vi.fn().mockResolvedValue(undefined));
  }
});

describe("useListActions", () => {
  it("delegates validated list imports to one Convex mutation", async () => {
    const importList = convex.mutations.get(convex.references.importList)!;
    importList.mockResolvedValueOnce("list-imported");
    const payload = {
      version: 1 as const,
      list: { name: "Imported" },
      categories: [],
    };
    const { result } = renderHook(() => useListActions());

    await act(async () => {
      await result.current.importList(payload);
    });

    expect(importList).toHaveBeenCalledWith(payload);
  });

  it("passes generated Convex IDs unchanged and never injects Clerk IDs", async () => {
    const listId = "list_123" as Id<"lists">;
    const updateList = convex.mutations.get(convex.references.updateList)!;
    const { result } = renderHook(() => useListActions());

    await act(async () => {
      await result.current.updateList({ listId, name: "Carry on" });
    });

    expect(updateList).toHaveBeenCalledWith({ listId, name: "Carry on" });
    expect(updateList.mock.calls[0]?.[0]).not.toHaveProperty("clerkId");
    type UpdateListInput = Parameters<typeof result.current.updateList>[0];
    const legacyVisibilityIsAbsent: "isPublic" extends keyof UpdateListInput
      ? false
      : true = true;
    expect(legacyVisibilityIsAbsent).toBe(true);
  });

  it("delegates atomic item edits, moves, and quantity deltas", async () => {
    const itemId = "item_123" as Id<"items">;
    const categoryId = "category_456" as Id<"categories">;
    const updateItemAndMove = convex.mutations.get(
      convex.references.updateItemAndMove,
    )!;
    const adjustItemQuantity = convex.mutations.get(
      convex.references.adjustItemQuantity,
    )!;
    const { result } = renderHook(() => useListActions());

    await act(async () => {
      await result.current.updateItemAndMove({
        itemId,
        name: "Passport",
        toCategoryId: categoryId,
        toIndex: 0,
      });
      await result.current.adjustItemQuantity({ itemId, delta: 1 });
    });

    expect(updateItemAndMove).toHaveBeenCalledWith({
      itemId,
      name: "Passport",
      toCategoryId: categoryId,
      toIndex: 0,
    });
    expect(adjustItemQuantity).toHaveBeenCalledWith({ itemId, delta: 1 });
  });

  it("exposes pending while a mutation is in flight", async () => {
    const createResult = deferred<Id<"lists">>();
    const createList = convex.mutations.get(convex.references.createList)!;
    createList.mockReturnValueOnce(createResult.promise);
    const { result } = renderHook(() => useListActions());

    let action!: Promise<Id<"lists"> | undefined>;
    act(() => {
      action = result.current.createList({ name: "Weekend" });
    });

    expect(result.current.pending).toBe(true);

    await act(async () => {
      createResult.resolve("list_created" as Id<"lists">);
      await action;
    });

    expect(result.current.pending).toBe(false);
  });

  it("returns a success signal for void mutations and can rethrow for composition", async () => {
    const listId = "list_delete" as Id<"lists">;
    const deleteList = convex.mutations.get(convex.references.deleteList)!;
    const { result } = renderHook(() => useListActions());

    let succeeded: true | undefined;
    await act(async () => {
      succeeded = await result.current.deleteList({ listId });
    });
    expect(succeeded!).toBe(true);

    deleteList.mockRejectedValueOnce({
      data: { code: "FORBIDDEN", message: "Cannot compose deletion" },
    });
    await expect(
      act(async () => {
        await result.current.deleteList({ listId }, { rethrow: true });
      }),
    ).rejects.toEqual({
      data: { code: "FORBIDDEN", message: "Cannot compose deletion" },
    });
  });

  it("ignores an older failure after a newer action succeeds", async () => {
    const older = deferred<void>();
    const deleteList = convex.mutations.get(convex.references.deleteList)!;
    deleteList.mockReturnValueOnce(older.promise);
    const { result } = renderHook(() => useListActions());

    let olderAction!: Promise<true | undefined>;
    act(() => {
      olderAction = result.current.deleteList({
        listId: "list_old" as Id<"lists">,
      });
    });
    await act(async () => {
      await result.current.updateList({
        listId: "list_new" as Id<"lists">,
        name: "Latest",
      });
    });
    await act(async () => {
      older.reject({ data: { code: "VALIDATION", message: "Stale failure" } });
      await olderAction;
    });

    expect(result.current.error).toBeNull();
  });

  it("maps mutation failures and clears them with resetError", async () => {
    const listId = "list_forbidden" as Id<"lists">;
    const deleteList = convex.mutations.get(convex.references.deleteList)!;
    deleteList.mockRejectedValueOnce({
      data: { code: "FORBIDDEN", message: "You cannot delete this list" },
    });
    const { result } = renderHook(() => useListActions());

    await act(async () => {
      await result.current.deleteList({ listId });
    });

    expect(result.current.pending).toBe(false);
    expect(result.current.error).toEqual({
      code: "FORBIDDEN",
      title: "Access denied",
      message: "You cannot delete this list",
      retryable: false,
    });

    act(() => result.current.resetError());
    expect(result.current.error).toBeNull();
  });

  it("blocks durable mutations offline with the OFFLINE error contract", async () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });
    const createList = convex.mutations.get(convex.references.createList)!;
    const { result } = renderHook(() => useListActions());

    let created: Id<"lists"> | undefined;
    await act(async () => {
      created = await result.current.createList({ name: "Offline trip" });
    });

    expect(created!).toBeUndefined();
    expect(createList).not.toHaveBeenCalled();
    expect(result.current.error).toEqual({
      code: "OFFLINE",
      title: "You are offline",
      message: "Reconnect before saving changes.",
      retryable: true,
    });
  });
});
