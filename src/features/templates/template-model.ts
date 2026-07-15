export interface FilterableTemplate {
  _id: string;
  _creationTime: number;
  name: string;
  description: string;
  category?: string;
  season?: string;
  difficulty?: string;
  isPublic?: boolean;
  isOwned?: boolean;
  tags?: string[];
}

export interface TemplateFilterOptions {
  filter: "all" | "mine" | "recent";
  search: string;
  category: string;
}

export function filterTemplates<T extends FilterableTemplate>(
  templates: T[],
  options: TemplateFilterOptions,
): T[] {
  const query = options.search.trim().toLocaleLowerCase();
  const filtered = templates.filter((template) => {
    if (options.filter === "mine" && template.isOwned !== true) {
      return false;
    }
    if (
      options.category !== "all" &&
      template.category !== options.category
    ) {
      return false;
    }
    if (!query) return true;

    return [
      template.name,
      template.description,
      template.category ?? "",
      template.season ?? "",
      template.difficulty ?? "",
      ...(template.tags ?? []),
    ]
      .join(" ")
      .toLocaleLowerCase()
      .includes(query);
  });

  if (options.filter === "recent") {
    return [...filtered].sort(
      (left, right) => right._creationTime - left._creationTime,
    );
  }

  return filtered;
}
