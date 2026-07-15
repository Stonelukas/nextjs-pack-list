import type { Id } from "../../../convex/_generated/dataModel";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { ItemRow } from "@/components/items/item-row";
import type {
  CategoryDocument,
  ItemDocument,
  ItemFormValue,
} from "@/features/lists/types";

interface SortableItemProps {
  item: ItemDocument;
  availableCategories?: CategoryDocument[];
  onTogglePacked: (itemId: Id<"items">) => void | Promise<unknown>;
  onUpdate: (
    itemId: Id<"items">,
    updates: Partial<ItemFormValue>,
    targetCategoryId?: Id<"categories">,
  ) => void | Promise<unknown>;
  onAdjustQuantity?: (
    itemId: Id<"items">,
    delta: number,
  ) => void | Promise<unknown>;
  onDelete: (itemId: Id<"items">) => void | Promise<unknown>;
  offlineReasonId?: string;
  online?: boolean;
}

export function SortableItem({ online = true, ...props }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.item._id,
    disabled: !online,
  });
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}><ItemRow {...props} online={online} isDragging={isDragging} dragHandleProps={online ? { ...attributes, ...listeners } : undefined} /></div>;
}
