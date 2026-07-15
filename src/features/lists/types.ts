import type { FunctionReturnType } from "convex/server";

import { api } from "../../../convex/_generated/api";

export type ListDocument = FunctionReturnType<typeof api.lists.getList>;
export type ListSummary = FunctionReturnType<
  typeof api.lists.getListSummaries
>["page"][number];
export type CategoryDocument = ListDocument["categories"][number];
export type ItemDocument = CategoryDocument["items"][number];

export interface ItemFormValue {
  name: string;
  description?: string;
  quantity: number;
  priority: ItemDocument["priority"];
  packed?: boolean;
  notes?: string;
  weight?: number;
  tags?: string[];
}
