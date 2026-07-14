import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export type ListWithCategories = FunctionReturnType<typeof api.lists.getList>;
export type RouteList = FunctionReturnType<typeof api.lists.getListByRouteId>;

export interface UseListResult {
  list: ListWithCategories | undefined;
  loading: boolean;
}

export function useList(
  listId: Id<"lists"> | null | undefined,
): UseListResult {
  const list = useQuery(api.lists.getList, listId ? { listId } : "skip");
  return { list, loading: Boolean(listId) && list === undefined };
}

export function useRouteList(routeListId: string | null | undefined): UseListResult {
  const list = useQuery(
    api.lists.getListByRouteId,
    routeListId ? { listId: routeListId } : "skip",
  );
  return { list, loading: Boolean(routeListId) && list === undefined };
}
