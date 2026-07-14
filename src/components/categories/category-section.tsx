import type { Id } from "../../../convex/_generated/dataModel";
import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Edit2,
  GripVertical,
  Package,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { SortableItem } from "@/components/dnd/sortable-item";
import { ItemForm } from "@/components/items/item-form";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useListActions } from "@/features/lists/hooks/use-list-actions";
import {
  getAddItemInput,
  getUpdateItemAndMoveInput,
} from "@/features/lists/item-mutation-model";
import type { CategoryDocument, ItemFormValue } from "@/features/lists/types";
import { mapError, type UserFacingError } from "@/lib/errors";
import { cn } from "@/lib/utils";

interface CategorySectionProps {
  listId: Id<"lists">;
  category: CategoryDocument;
  categories: CategoryDocument[];
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
  offlineReasonId?: string;
  online?: boolean;
}

export function CategorySection({
  categories,
  category,
  dragHandleProps,
  isDragging,
  offlineReasonId,
  online = true,
}: CategorySectionProps) {
  const actions = useListActions();
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState(category.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categoryError, setCategoryError] = useState<UserFacingError | null>(null);
  const [deleteError, setDeleteError] = useState<UserFacingError | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const packed = category.items.filter((item) => item.packed).length;
  const progress = category.items.length
    ? Math.round((packed / category.items.length) * 100)
    : 0;

  const runCategoryAction = async (
    action: () => void | Promise<unknown>,
  ) => {
    if (!online) return false;
    setCategoryError(null);
    try {
      await action();
      return true;
    } catch (error) {
      setCategoryError(mapError(error));
      return false;
    }
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!online || !over || active.id === over.id) return;
    const oldIndex = category.items.findIndex((item) => item._id === active.id);
    const newIndex = category.items.findIndex((item) => item._id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(category.items, oldIndex, newIndex);
    await runCategoryAction(() =>
      actions.reorderItems(
        {
          categoryId: category._id,
          itemIds: reordered.map((item) => item._id),
        },
        { rethrow: true },
      ),
    );
  };

  const saveName = async () => {
    if (!online) return;
    const name = editedName.trim();
    if (name && name !== category.name) {
      const saved = await runCategoryAction(() =>
        actions.updateCategory(
          { categoryId: category._id, name },
          { rethrow: true },
        ),
      );
      if (!saved) return;
      toast.success("Category renamed");
    }
    setEditingName(false);
  };

  const addItem = async (item: ItemFormValue) => {
    const itemId = await actions.addItem(getAddItemInput(category._id, item), {
      rethrow: true,
    });
    if (!itemId) throw new Error("Item creation did not return an ID");
    toast.success("Item added");
  };

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!online) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await actions.deleteCategory(
        { categoryId: category._id },
        { rethrow: true },
      );
      setShowDeleteDialog(false);
    } catch (error) {
      setDeleteError(mapError(error));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card
        className={cn(
          "overflow-hidden border-l-4",
          isDragging && "opacity-70 shadow-[var(--shadow-dialog)]",
        )}
        style={{ borderLeftColor: category.color ?? "var(--accent)" }}
      >
        <CardHeader className="px-3 pb-3">
          <div
            data-category-header
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <div
                {...(online ? dragHandleProps : {})}
                aria-label={`Drag ${category.name} category`}
                aria-disabled={!online}
                aria-describedby={!online ? offlineReasonId : undefined}
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center",
                  online ? "cursor-grab" : "cursor-not-allowed opacity-50",
                )}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled={!online}
                aria-describedby={!online ? offlineReasonId : undefined}
                onClick={() =>
                  void runCategoryAction(() =>
                    actions.toggleCategoryCollapse(
                      { categoryId: category._id },
                      { rethrow: true },
                    ),
                  )
                }
              >
                {category.collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle category</span>
              </Button>
              {editingName ? (
                <div className="flex flex-1 items-center gap-1">
                  <Input
                    value={editedName}
                    onChange={(event) => setEditedName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void saveName();
                      if (event.key === "Escape") setEditingName(false);
                    }}
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Save category name for ${category.name}`}
                    aria-describedby={!online ? offlineReasonId : undefined}
                    disabled={!online}
                    onClick={() => void saveName()}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Cancel renaming ${category.name}`}
                    onClick={() => setEditingName(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  className="font-semibold hover:underline"
                  onClick={() => setEditingName(true)}
                >
                  {category.name}
                </button>
              )}
              <Badge variant="outline" className="font-mono tabular-nums">
                {category.items.length} items
              </Badge>
              {progress ? (
                <Badge variant="outline">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {progress}%
                </Badge>
              ) : null}
            </div>
            <div
              data-category-actions
              className="flex flex-wrap gap-1 self-end sm:self-auto"
            >
              <ItemForm
                categoryId={category._id}
                onSubmit={addItem}
                online={online}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingName(true)}
              >
                <Edit2 className="h-4 w-4" />
                <span className="sr-only">Rename category</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete category</span>
              </Button>
            </div>
          </div>
          {!category.collapsed && category.items.length ? (
            <div className="mt-3 space-y-1">
              <Progress
                value={progress}
                aria-label={`${category.name} packing progress`}
              />
              <p className="text-xs text-muted-foreground">
                {packed} of {category.items.length} packed
              </p>
            </div>
          ) : null}
          {categoryError ? (
            <div role="alert" className="mt-3 text-sm text-destructive">
              <p className="font-semibold">{categoryError.title}</p>
              <p>{categoryError.message}</p>
            </div>
          ) : null}
        </CardHeader>
        {!category.collapsed ? (
          <CardContent className="px-3">
            {category.items.length === 0 ? (
              <div className="flex flex-col items-center py-8">
                <Package className="mb-3 h-12 w-12 text-muted-foreground" />
                <p className="mb-3 text-sm text-muted-foreground">No items yet.</p>
                <ItemForm
                  categoryId={category._id}
                  onSubmit={addItem}
                  online={online}
                  trigger={<Button size="sm">Add first item</Button>}
                />
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => void handleDragEnd(event)}
              >
                <SortableContext
                  items={category.items.map((item) => item._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="divide-y divide-border border-y border-border">
                    {category.items.map((item) => (
                      <SortableItem
                        key={item._id}
                        item={item}
                        availableCategories={categories}
                        online={online}
                        offlineReasonId={offlineReasonId}
                        onTogglePacked={(itemId) =>
                          actions.toggleItemPacked(
                            { itemId },
                            { rethrow: true },
                          )
                        }
                        onUpdate={(itemId, updates, targetCategoryId) =>
                          actions.updateItemAndMove(
                            getUpdateItemAndMoveInput(
                              itemId,
                              updates,
                              targetCategoryId ?? category._id,
                              categories,
                            ),
                            { rethrow: true },
                          )
                        }
                        onAdjustQuantity={(itemId, delta) =>
                          actions.adjustItemQuantity(
                            { itemId, delta },
                            { rethrow: true },
                          )
                        }
                        onDelete={(itemId) =>
                          actions.deleteItem({ itemId }, { rethrow: true })
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        ) : null}
      </Card>
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(nextOpen) => {
          setShowDeleteDialog(nextOpen);
          if (!nextOpen) setDeleteError(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category</AlertDialogTitle>
            <AlertDialogDescription>
              Delete “{category.name}” and all its items? This cannot be undone.
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
              id="category-delete-offline-reason"
              role="status"
              aria-live="polite"
              className="text-sm text-warning"
            >
              Reconnect to delete this category.
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              disabled={!online || deleting}
              aria-describedby={
                !online ? "category-delete-offline-reason" : undefined
              }
              aria-busy={deleting}
              onClick={(event) => void handleDelete(event)}
            >
              {deleting ? "Deleting…" : "Delete category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
