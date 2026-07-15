import type { Id } from "../../convex/_generated/dataModel";
import { useMemo } from "react";

import { useList } from "@/features/lists/hooks/use-list";
import { useListExportData } from "@/features/lists/hooks/use-lists";
import { calculateListProgress } from "@/features/lists/list-model";

export function useOptimizedList(listId: Id<"lists">) {
  const { list, loading } = useList(listId);
  const categories = useMemo(
    () => [...(list?.categories ?? [])].sort((left, right) => left.order - right.order),
    [list?.categories],
  );
  const items = useMemo(
    () => categories.flatMap((category) => category.items),
    [categories],
  );
  const progress = list ? calculateListProgress(list) : null;
  const stats = progress
    ? {
        ...progress,
        priorityCounts: {
          essential: items.filter((item) => item.priority === "essential").length,
          high: items.filter((item) => item.priority === "high").length,
          medium: items.filter((item) => item.priority === "medium").length,
          low: items.filter((item) => item.priority === "low").length,
        },
        essentialsPacked: items
          .filter((item) => item.priority === "essential")
          .every((item) => item.packed),
      }
    : null;
  return { list, categories, items, stats, loading };
}

export function useOptimizedCategories() {
  const { lists, loading } = useListExportData();
  const allCategories = useMemo(
    () => (lists ?? []).flatMap((list) => list.categories),
    [lists],
  );
  const uniqueCategories = useMemo(() => {
    const seen = new Set<string>();
    return allCategories.filter((category) => {
      const key = category.name.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [allCategories]);
  return { allCategories, uniqueCategories, loading };
}
