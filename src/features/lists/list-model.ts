export interface NormalizedItem {
  _id: string;
  name: string;
  packed: boolean;
  quantity: number;
  priority: string;
}

export interface NormalizedCategory {
  _id: string;
  name: string;
  order: number;
  items: NormalizedItem[];
}

export interface NormalizedListMetadata {
  _id: string;
  _creationTime: number;
  name: string;
  description?: string;
  completedAt?: number;
  createdAt?: number;
  updatedAt?: number;
  tags?: string[];
}

export interface NormalizedList extends NormalizedListMetadata {
  categories: NormalizedCategory[];
}

export interface NormalizedListSummary extends NormalizedListMetadata {
  categoryCount: number;
  itemCount: number;
  packedCount: number;
}

export type NormalizedListEntry = NormalizedList | NormalizedListSummary;

export type ListSort = "name" | "date" | "completion";
export type ListStatus = "active" | "completed" | null;

export interface ListFilterOptions {
  status: ListStatus;
  search: string;
  sort: ListSort;
}

export function calculateListProgress(
  list:
    | Pick<NormalizedList, "categories">
    | Pick<NormalizedListSummary, "itemCount" | "packedCount">,
) {
  const { totalItems, packedItems } =
    "categories" in list
      ? (() => {
          const items = list.categories.flatMap((category) => category.items);
          return {
            totalItems: items.length,
            packedItems: items.filter((item) => item.packed).length,
          };
        })()
      : { totalItems: list.itemCount, packedItems: list.packedCount };

  return {
    totalItems,
    packedItems,
    completionPercentage:
      totalItems === 0 ? 0 : Math.round((packedItems / totalItems) * 100),
  };
}

function listTimestamp(list: NormalizedListMetadata) {
  return list.createdAt ?? list._creationTime;
}

export function filterAndSortLists<T extends NormalizedListEntry>(
  lists: T[],
  options: ListFilterOptions,
): T[] {
  const query = options.search.trim().toLocaleLowerCase();
  const filtered = lists.filter((list) => {
    if (options.status === "active" && list.completedAt) return false;
    if (options.status === "completed" && !list.completedAt) return false;
    if (!query) return true;

    return [list.name, list.description ?? "", ...(list.tags ?? [])]
      .join(" ")
      .toLocaleLowerCase()
      .includes(query);
  });

  return [...filtered].sort((left, right) => {
    if (options.sort === "name") return left.name.localeCompare(right.name);
    if (options.sort === "completion") {
      return (
        calculateListProgress(right).completionPercentage -
        calculateListProgress(left).completionPercentage
      );
    }
    return listTimestamp(right) - listTimestamp(left);
  });
}

export interface CategorySummary {
  name: string;
  itemCount: number;
  packedCount: number;
  lists: Array<{ _id: string; name: string }>;
}

export function summarizeCategories(
  lists: NormalizedList[],
): CategorySummary[] {
  const summaries = new Map<string, CategorySummary>();

  for (const list of lists) {
    for (const category of list.categories) {
      const key = category.name.trim().toLocaleLowerCase();
      const existing = summaries.get(key) ?? {
        name: category.name,
        itemCount: 0,
        packedCount: 0,
        lists: [],
      };
      existing.itemCount += category.items.length;
      existing.packedCount += category.items.filter((item) => item.packed).length;
      if (!existing.lists.some((entry) => entry._id === list._id)) {
        existing.lists.push({ _id: list._id, name: list.name });
      }
      summaries.set(key, existing);
    }
  }

  return [...summaries.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

export interface TagSummary {
  name: string;
  listCount: number;
  templateCount: number;
}

export function summarizeTags(
  lists: Array<Pick<NormalizedList, "tags">>,
  templates: Array<{ tags?: string[] }> = [],
): TagSummary[] {
  const summaries = new Map<string, TagSummary>();

  for (const list of lists) {
    for (const tag of new Set(list.tags ?? [])) {
      const key = tag.trim().toLocaleLowerCase();
      if (!key) continue;
      const summary = summaries.get(key) ?? {
        name: tag,
        listCount: 0,
        templateCount: 0,
      };
      summary.listCount += 1;
      summaries.set(key, summary);
    }
  }

  for (const template of templates) {
    for (const tag of new Set(template.tags ?? [])) {
      const key = tag.trim().toLocaleLowerCase();
      if (!key) continue;
      const summary = summaries.get(key) ?? {
        name: tag,
        listCount: 0,
        templateCount: 0,
      };
      summary.templateCount += 1;
      summaries.set(key, summary);
    }
  }

  return [...summaries.values()].sort((left, right) => {
    const leftTotal = left.listCount + left.templateCount;
    const rightTotal = right.listCount + right.templateCount;
    return rightTotal - leftTotal || left.name.localeCompare(right.name);
  });
}
