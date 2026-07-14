import type { Id } from "../../../convex/_generated/dataModel";
import { useState } from "react";
import {
  AlertCircle,
  Check,
  GripVertical,
  Minus,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { SwipeableItem } from "@/components/gestures/swipeable-item";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type {
  CategoryDocument,
  ItemDocument,
  ItemFormValue,
} from "@/features/lists/types";
import { mapError, type UserFacingError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { ItemForm } from "./item-form";

interface ItemRowProps {
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
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  offlineReasonId?: string;
  online?: boolean;
}

export function ItemRow({
  availableCategories,
  dragHandleProps,
  isDragging,
  item,
  offlineReasonId,
  online = true,
  onAdjustQuantity,
  onDelete,
  onTogglePacked,
  onUpdate,
}: ItemRowProps) {
  const [editedName, setEditedName] = useState(item.name);
  const [editingName, setEditingName] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<UserFacingError | null>(null);
  const [mutationError, setMutationError] = useState<UserFacingError | null>(null);
  const priorityIcon =
    item.priority === "essential" ? (
      <AlertCircle className="h-3 w-3" />
    ) : item.priority === "high" || item.priority === "medium" ? (
      <Star className="h-3 w-3" />
    ) : null;

  const runDirectAction = async (action: () => void | Promise<unknown>) => {
    if (!online) return false;
    setMutationError(null);
    try {
      await action();
      return true;
    } catch (error) {
      setMutationError(mapError(error));
      return false;
    }
  };

  const saveName = async () => {
    if (!online) return;
    const name = editedName.trim();
    if (name && name !== item.name) {
      const saved = await runDirectAction(() => onUpdate(item._id, { name }));
      if (!saved) return;
    }
    setEditingName(false);
  };

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!online) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(item._id);
      setShowDeleteDialog(false);
    } catch (error) {
      setDeleteError(mapError(error));
    } finally {
      setDeleting(false);
    }
  };

  const content = (
    <div
      className={cn(
        "grid min-h-12 grid-cols-[auto_auto_minmax(0,1fr)] items-start gap-x-2 gap-y-2 bg-card px-2 py-2 md:flex md:items-center",
        item.packed && "bg-muted/50 text-muted-foreground",
        isDragging && "opacity-70 shadow-[var(--shadow-dialog)]",
      )}
    >
      <div
        data-item-primary
        className="col-span-full grid grid-cols-[auto_auto_minmax(0,1fr)] items-start gap-2 md:contents"
      >
        <div
          {...(online ? dragHandleProps : {})}
          aria-label={`Drag ${item.name}`}
          aria-disabled={!online}
          aria-describedby={!online ? offlineReasonId : undefined}
          className={cn(
            "flex size-11 shrink-0 items-center justify-center",
            online ? "cursor-grab" : "cursor-not-allowed opacity-50",
          )}
        >
          <GripVertical
            className="h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <Checkbox
          checked={item.packed}
          aria-label={
            item.packed ? `Mark ${item.name} unpacked` : `Mark ${item.name} packed`
          }
          aria-describedby={!online ? offlineReasonId : undefined}
          disabled={!online}
          onCheckedChange={() =>
            void runDirectAction(() => onTogglePacked(item._id))
          }
          className="mt-3"
        />
        <div className="min-w-0 flex-1 py-2">
          <div className="flex flex-wrap items-center gap-2">
            {editingName ? (
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <Input
                  value={editedName}
                  onChange={(event) => setEditedName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void saveName();
                    if (event.key === "Escape") setEditingName(false);
                  }}
                  autoFocus
                  className="h-9 min-w-0"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Save name for ${item.name}`}
                  aria-describedby={!online ? offlineReasonId : undefined}
                  disabled={!online}
                  onClick={() => void saveName()}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Cancel renaming ${item.name}`}
                  onClick={() => setEditingName(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className={cn(
                  "min-w-0 text-left font-semibold hover:text-primary",
                  item.packed && "text-muted-foreground",
                )}
                onClick={() => setEditingName(true)}
              >
                {item.name}
              </button>
            )}
            <Badge
              variant={
                item.priority === "essential"
                  ? "destructive"
                  : item.priority === "low"
                    ? "outline"
                    : "secondary"
              }
            >
              {priorityIcon}
              {item.priority}
            </Badge>
            {item.weight ? (
              <span className="text-xs text-muted-foreground">{item.weight}kg</span>
            ) : null}
          </div>
          {item.description ? (
            <p className="line-clamp-1 text-sm text-muted-foreground">
              {item.description}
            </p>
          ) : null}
        </div>
      </div>
      <div
        data-item-actions
        className="col-span-full flex flex-wrap items-center justify-end gap-1 border-t border-border pt-2 md:ml-auto md:flex-nowrap md:border-t-0 md:pt-0"
      >
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Decrease quantity for ${item.name}`}
            aria-describedby={!online ? offlineReasonId : undefined}
            disabled={!online || item.quantity <= 1 || !onAdjustQuantity}
            onClick={() =>
              void runDirectAction(() => onAdjustQuantity?.(item._id, -1))
            }
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span
            className="min-w-8 text-center font-mono text-xs tabular-nums"
            aria-label={`Quantity ${item.quantity}`}
          >
            {item.quantity}
          </span>
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Increase quantity for ${item.name}`}
            aria-describedby={!online ? offlineReasonId : undefined}
            disabled={!online || !onAdjustQuantity}
            onClick={() =>
              void runDirectAction(() => onAdjustQuantity?.(item._id, 1))
            }
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <ItemForm
          availableCategories={availableCategories}
          categoryId={item.categoryId}
          item={item}
          online={online}
          onSubmit={(updates, targetCategoryId) =>
            onUpdate(item._id, updates, targetCategoryId)
          }
        />
        <Button
          size="icon"
          variant="ghost"
          className="text-destructive"
          aria-label={`Delete ${item.name}`}
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="md:hidden">
        <SwipeableItem
          disabled={!online}
          onSwipeLeft={() => setShowDeleteDialog(true)}
          onSwipeRight={() =>
            void runDirectAction(() => onTogglePacked(item._id))
          }
          leftAction={{
            icon: item.packed ? (
              <X className="h-5 w-5" />
            ) : (
              <Check className="h-5 w-5" />
            ),
            label: item.packed ? "Unpack" : "Pack",
            color: item.packed ? "bg-warning" : "bg-success",
          }}
          rightAction={{
            icon: <Trash2 className="h-5 w-5" />,
            label: "Delete",
            color: "bg-danger",
          }}
        >
          {content}
        </SwipeableItem>
      </div>
      <div className="hidden md:block">{content}</div>
      {mutationError ? (
        <div role="alert" className="px-2 py-2 text-sm text-destructive">
          <p className="font-semibold">{mutationError.title}</p>
          <p>{mutationError.message}</p>
        </div>
      ) : null}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(nextOpen) => {
          setShowDeleteDialog(nextOpen);
          if (!nextOpen) setDeleteError(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item</AlertDialogTitle>
            <AlertDialogDescription>
              Delete “{item.name}”? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? (
            <div role="alert" className="text-sm text-destructive">
              <p className="font-semibold">{deleteError.title}</p>
              <p>{deleteError.message}</p>
            </div>
          ) : null}
          {!online ? (
            <p
              id="item-delete-offline-reason"
              role="status"
              aria-live="polite"
              className="text-sm text-warning"
            >
              Reconnect to delete this item.
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              disabled={!online || deleting}
              aria-describedby={
                !online ? "item-delete-offline-reason" : undefined
              }
              aria-busy={deleting}
              onClick={(event) => void handleDelete(event)}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
