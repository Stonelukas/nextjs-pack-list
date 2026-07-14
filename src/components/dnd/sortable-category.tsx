import type { Id } from "../../../convex/_generated/dataModel";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { CategorySection } from "@/components/categories/category-section";
import type { CategoryDocument } from "@/features/lists/types";

interface SortableCategoryProps {
  listId: Id<"lists">;
  category: CategoryDocument;
  categories: CategoryDocument[];
  offlineReasonId?: string;
  online?: boolean;
}

export function SortableCategory({
  categories,
  category,
  listId,
  offlineReasonId,
  online = true,
}: SortableCategoryProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category._id,
    disabled: !online,
  });
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}><CategorySection listId={listId} category={category} categories={categories} online={online} offlineReasonId={offlineReasonId} isDragging={isDragging} dragHandleProps={online ? { ...attributes, ...listeners } : undefined} /></div>;
}
