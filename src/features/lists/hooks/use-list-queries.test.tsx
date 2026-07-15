// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { beforeEach, describe, expect, it, vi } from "vitest";

const convex = vi.hoisted(() => ({
  getListSummaries: Symbol("getListSummaries"),
  getListExportPage: Symbol("getListExportPage"),
  getList: Symbol("getList"),
  getListByRouteId: Symbol("getListByRouteId"),
  values: new Map<symbol, unknown>(),
  paginatedValues: new Map<symbol, unknown>(),
  useQuery: vi.fn(),
  usePaginatedQuery: vi.fn(),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    lists: {
      getListSummaries: convex.getListSummaries,
      getListExportPage: convex.getListExportPage,
      getList: convex.getList,
      getListByRouteId: convex.getListByRouteId,
    },
  },
}));

vi.mock("convex/react", () => ({
  useQuery: (reference: symbol, args?: unknown) => {
    convex.useQuery(reference, args);
    return convex.values.get(reference);
  },
  usePaginatedQuery: (
    reference: symbol,
    args: unknown,
    options: unknown,
  ) => {
    convex.usePaginatedQuery(reference, args, options);
    return (
      convex.paginatedValues.get(reference) ?? {
        results: [],
        status: "LoadingFirstPage",
        loadMore: vi.fn(),
      }
    );
  },
}));

import { useList, useRouteList } from "./use-list";
import { useListExportData, useLists } from "./use-lists";

beforeEach(() => {
  convex.values.clear();
  convex.paginatedValues.clear();
  convex.useQuery.mockClear();
  convex.usePaginatedQuery.mockClear();
});

describe("list query hooks", () => {
  it("uses the bounded summary query and preserves its first-page loading state", () => {
    const { result } = renderHook(() => useLists());

    expect(result.current).toMatchObject({ lists: undefined, loading: true });
    expect(convex.usePaginatedQuery).toHaveBeenCalledWith(
      convex.getListSummaries,
      {},
      { initialNumItems: 50 },
    );
  });

  it("returns summary records without requiring nested detail documents", () => {
    const loadMore = vi.fn();
    convex.paginatedValues.set(convex.getListSummaries, {
      results: [{ _id: "list_123", itemCount: 2, packedCount: 1 }],
      status: "CanLoadMore",
      loadMore,
    });

    const { result } = renderHook(() => useLists());

    expect(result.current).toMatchObject({
      lists: [{ _id: "list_123", itemCount: 2, packedCount: 1 }],
      loading: false,
      hasMore: true,
    });
    result.current.loadMore();
    expect(loadMore).toHaveBeenCalledWith(50);
  });

  it("uses a separate paginated path for complete account export data", () => {
    convex.paginatedValues.set(convex.getListExportPage, {
      results: [{ _id: "list_export", categories: [] }],
      status: "Exhausted",
      loadMore: vi.fn(),
    });

    const { result } = renderHook(() => useListExportData());

    expect(result.current).toEqual({
      lists: [{ _id: "list_export", categories: [] }],
      loading: false,
    });
    expect(convex.usePaginatedQuery).toHaveBeenCalledWith(
      convex.getListExportPage,
      {},
      { initialNumItems: 25 },
    );
  });

  it("skips an absent list ID and passes a generated ID unchanged", () => {
    const listId = "list_123" as Id<"lists">;
    renderHook(() => useList(undefined));
    expect(convex.useQuery).toHaveBeenLastCalledWith(convex.getList, "skip");

    renderHook(() => useList(listId));
    expect(convex.useQuery).toHaveBeenLastCalledWith(convex.getList, { listId });
  });

  it("passes untrusted route strings to the normalizing route query", () => {
    renderHook(() => useRouteList("not-a-convex-id"));

    expect(convex.useQuery).toHaveBeenLastCalledWith(convex.getListByRouteId, {
      listId: "not-a-convex-id",
    });
  });
});
