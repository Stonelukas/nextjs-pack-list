import { usePaginatedQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useCallback, useEffect, useRef } from "react";

import { api } from "../../../../convex/_generated/api";

const LIST_SUMMARY_PAGE_SIZE = 50;
const LIST_EXPORT_PAGE_SIZE = 25;

export type ListSummary = FunctionReturnType<
  typeof api.lists.getListSummaries
>["page"][number];
export type ExportList = FunctionReturnType<
  typeof api.lists.getListExportPage
>["page"][number];

export interface UseListsResult {
  lists: ListSummary[] | undefined;
  loading: boolean;
  hasMore: boolean;
  loadMore(): void;
}

export function useLists(): UseListsResult {
  const { results, status, loadMore } = usePaginatedQuery(
    api.lists.getListSummaries,
    {},
    { initialNumItems: LIST_SUMMARY_PAGE_SIZE },
  );
  const loading = status === "LoadingFirstPage";
  const loadNextPage = useCallback(() => {
    if (status === "CanLoadMore") loadMore(LIST_SUMMARY_PAGE_SIZE);
  }, [loadMore, status]);

  return {
    lists: loading ? undefined : results,
    loading,
    hasMore: status === "CanLoadMore" || status === "LoadingMore",
    loadMore: loadNextPage,
  };
}

export interface UseListExportDataResult {
  lists: ExportList[] | undefined;
  loading: boolean;
}

export function useListExportData(): UseListExportDataResult {
  const { results, status, loadMore } = usePaginatedQuery(
    api.lists.getListExportPage,
    {},
    { initialNumItems: LIST_EXPORT_PAGE_SIZE },
  );
  const requestedResultCount = useRef(-1);

  useEffect(() => {
    if (
      status === "CanLoadMore" &&
      requestedResultCount.current !== results.length
    ) {
      requestedResultCount.current = results.length;
      loadMore(LIST_EXPORT_PAGE_SIZE);
    }
    if (status === "Exhausted") requestedResultCount.current = -1;
  }, [loadMore, results.length, status]);

  const loading = status !== "Exhausted";
  return { lists: loading ? undefined : results, loading };
}
