import type { Id } from "../../../convex/_generated/dataModel";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { format } from "date-fns";
import { Check, Edit2, Package, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { SortableCategory } from "@/components/dnd/sortable-category";
import { PrintView } from "@/components/export/print-view";
import { QuickAddItemDialog } from "@/components/items/quick-add-item-dialog";
import { LazyExportDialog } from "@/components/lazy/lazy-export-dialog";
import { LazyImportDialog } from "@/components/lazy/lazy-import-dialog";
import { PageHeader } from "@/components/layout/page-header";
import {
  FloatingActionButton,
  SpeedDialAction,
} from "@/components/mobile/floating-action-button";
import { ListProgress } from "@/components/progress/list-progress";
import { SaveAsTemplate } from "@/components/templates/save-as-template";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useListActions } from "@/features/lists/hooks/use-list-actions";
import { useList } from "@/features/lists/hooks/use-list";
import { getAddItemInput } from "@/features/lists/item-mutation-model";
import { calculateListProgress } from "@/features/lists/list-model";
import type { ItemFormValue, ListDocument } from "@/features/lists/types";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { mapError, type UserFacingError } from "@/lib/errors";

interface ListDetailProps {
  listId?: Id<"lists">;
  list?: ListDocument;
}

export function ListDetail({ list: preloadedList, listId: requestedListId }: ListDetailProps) {
  const query = useList(preloadedList ? undefined : requestedListId);
  const list = preloadedList ?? query.list;
  const loading = !preloadedList && query.loading;
  const listId = list?._id ?? requestedListId;
  const {
    addCategory,
    addItem,
    markListCompleted,
    markListIncomplete,
    pending,
    reorderCategories,
  } = useListActions();
  const { online } = useOnlineStatus();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryCreationPending, setCategoryCreationPending] = useState(false);
  const categoryCreationGuard = useRef(false);
  const [isQuickAddItemOpen, setIsQuickAddItemOpen] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completionPending, setCompletionPending] = useState(false);
  const [completionError, setCompletionError] =
    useState<UserFacingError | null>(null);
  const [listError, setListError] = useState<UserFacingError | null>(null);
  const previouslyAllPacked = useRef(false);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const categories = useMemo(
    () =>
      [...(list?.categories ?? [])].sort((left, right) => left.order - right.order),
    [list?.categories],
  );
  const progress = list ? calculateListProgress(list) : null;
  const allItemsPacked = Boolean(
    progress && progress.totalItems > 0 && progress.packedItems === progress.totalItems,
  );

  useEffect(() => {
    if (!list || list.completedAt) return;
    if (allItemsPacked && !previouslyAllPacked.current) {
      setCompletionError(null);
      setShowCompletionDialog(true);
    }
    previouslyAllPacked.current = allItemsPacked;
  }, [allItemsPacked, list]);

  if (loading) {
    return <p className="py-16 text-center text-muted-foreground">Loading list…</p>;
  }
  if (!list || !listId) {
    return (
      <div className="flex flex-col items-center py-16">
        <Package className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">List not found</h2>
      </div>
    );
  }

  const runListAction = async (action: () => void | Promise<unknown>) => {
    if (!online) return false;
    setListError(null);
    try {
      await action();
      return true;
    } catch (error) {
      setListError(mapError(error));
      return false;
    }
  };

  const handleAddCategory = async () => {
    if (
      categoryCreationGuard.current ||
      !online ||
      !newCategoryName.trim()
    ) {
      return;
    }
    categoryCreationGuard.current = true;
    setCategoryCreationPending(true);
    try {
      const added = await runListAction(async () => {
        const categoryId = await addCategory(
          { listId, name: newCategoryName.trim() },
          { rethrow: true },
        );
        if (!categoryId) {
          throw new Error("Category creation did not return an ID");
        }
      });
      if (added) {
        setNewCategoryName("");
        setIsAddingCategory(false);
        toast.success("Category added");
      }
    } finally {
      categoryCreationGuard.current = false;
      setCategoryCreationPending(false);
    }
  };

  const handleQuickAddItem = async (
    categoryId: Id<"categories">,
    item: ItemFormValue,
  ) => {
    const itemId = await addItem(getAddItemInput(categoryId, item), {
      rethrow: true,
    });
    if (!itemId) throw new Error("Item creation did not return an ID");
    toast.success("Item added");
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!online || !over || active.id === over.id) return;
    const oldIndex = categories.findIndex((category) => category._id === active.id);
    const newIndex = categories.findIndex((category) => category._id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(categories, oldIndex, newIndex);
    await runListAction(() =>
      reorderCategories(
        {
          listId,
          categoryIds: reordered.map((category) => category._id),
        },
        { rethrow: true },
      ),
    );
  };

  const toggleCompletion = async () => {
    const changed = await runListAction(() =>
      list.completedAt
        ? markListIncomplete({ listId }, { rethrow: true })
        : markListCompleted({ listId }, { rethrow: true }),
    );
    if (changed) {
      toast.success(list.completedAt ? "List reopened" : "List completed");
    }
  };

  const confirmCompletion = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    if (!online) return;
    setCompletionPending(true);
    setCompletionError(null);
    try {
      await markListCompleted({ listId }, { rethrow: true });
      toast.success("List completed");
      setShowCompletionDialog(false);
    } catch (error) {
      setCompletionError(mapError(error));
    } finally {
      setCompletionPending(false);
    }
  };

  const mainContent = (
    <div className="space-y-6 print:hidden" data-list-detail>
      <div className="relative md:pl-7">
        <span
          data-route-spine
          aria-hidden="true"
          className="route-spine absolute inset-y-0 left-0 hidden md:block"
        />
        <PageHeader
          compact
          spine="none"
          className="mb-0"
          eyebrow={`Active manifest / ${String(categories.length).padStart(2, "0")} categories`}
          title={list.name}
          description={list.description}
          actions={
            <>
              <LazyExportDialog listId={listId} />
              <LazyImportDialog />
              <SaveAsTemplate list={list} />
              <Button
                variant={list.completedAt ? "default" : "outline"}
                size="sm"
                disabled={!online || pending}
                aria-describedby={!online ? "list-detail-offline-reason" : undefined}
                onClick={() => void toggleCompletion()}
              >
                <Check aria-hidden="true" />
                {list.completedAt ? "Mark incomplete" : "Mark complete"}
              </Button>
              <Button asChild variant="outline" size="icon">
                <Link to={`/lists/${listId}/edit`} aria-label="Edit list">
                  <Edit2 aria-hidden="true" />
                </Link>
              </Button>
            </>
          }
        />
        <ListProgress list={list} className="mt-6" />
        {!online ? (
          <p
            id="list-detail-offline-reason"
            role="status"
            aria-live="polite"
            className="mt-4 text-sm text-warning"
          >
            Reconnect to save changes to this list.
          </p>
        ) : null}
        {listError ? (
          <div role="alert" className="mt-4 text-sm text-destructive">
            <p className="font-semibold">{listError.title}</p>
            <p>{listError.message}</p>
          </div>
        ) : null}
      </div>
      <dl className="grid grid-cols-2 border-y border-border sm:grid-cols-4">
        {[
          ["Total items", progress?.totalItems ?? 0],
          ["Packed", progress?.packedItems ?? 0],
          ["Categories", categories.length],
          [
            "Remaining",
            (progress?.totalItems ?? 0) - (progress?.packedItems ?? 0),
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            className="border-b border-border px-4 py-4 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0"
          >
            <dt className="font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-1 font-display text-3xl font-bold tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <section
        className="space-y-4 border-t border-border pt-6"
        aria-labelledby="manifest-categories-heading"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-muted-foreground">
              Operational rows
            </p>
            <h2 id="manifest-categories-heading" className="text-2xl font-semibold">
              Packing manifest
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!categories.length}
              onClick={() => setIsQuickAddItemOpen(true)}
            >
              <Package className="mr-2 h-4 w-4" />
              Quick add item
            </Button>
            <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add category</DialogTitle>
                  <DialogDescription>
                    Create a category for related packing items.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-2 py-4">
                  <Label htmlFor="category-name">Category name</Label>
                  <Input
                    id="category-name"
                    value={newCategoryName}
                    disabled={categoryCreationPending}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !categoryCreationPending) {
                        event.preventDefault();
                        void handleAddCategory();
                      }
                    }}
                  />
                  {!online ? (
                    <p
                      id="add-category-offline-reason"
                      role="status"
                      aria-live="polite"
                      className="text-sm text-warning"
                    >
                      Reconnect to add this category.
                    </p>
                  ) : null}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    disabled={categoryCreationPending}
                    onClick={() => setIsAddingCategory(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={
                      !online ||
                      pending ||
                      categoryCreationPending ||
                      !newCategoryName.trim()
                    }
                    aria-describedby={
                      !online ? "add-category-offline-reason" : undefined
                    }
                    onClick={() => void handleAddCategory()}
                  >
                    Add category
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {!categories.length ? (
          <div className="border-y border-border py-10 text-center">
            <Package
              className="mx-auto mb-3 h-10 w-10 text-primary"
              aria-hidden="true"
            />
            <p className="text-muted-foreground">
              Add a category to start organizing items.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => void handleDragEnd(event)}
          >
            <SortableContext
              items={categories.map((category) => category._id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {categories.map((category) => (
                  <SortableCategory
                    key={category._id}
                    listId={listId}
                    category={category}
                    categories={categories}
                    online={online}
                    offlineReasonId="list-detail-offline-reason"
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>
      <Card className="bg-surface-muted">
        <CardHeader>
          <CardTitle
            as="h2"
            className="font-mono text-xs uppercase tracking-[0.1em]"
          >
            Manifest metadata
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Created</span>
            <p>{format(new Date(list.createdAt ?? list._creationTime), "PPP")}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Updated</span>
            <p>{format(new Date(list.updatedAt ?? list._creationTime), "PPP")}</p>
          </div>
          {list.tags?.length ? (
            <div className="col-span-2 flex flex-wrap gap-1">
              {list.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {mainContent}
      <PrintView list={list} className="hidden print:block" />
      <div className="md:hidden">
        <FloatingActionButton
          onClick={() => setIsAddingCategory(true)}
          icon={<Plus className="h-6 w-6" />}
          label="Add category"
        >
          <SpeedDialAction
            icon={<Plus className="h-4 w-4" />}
            label="Add category"
            onClick={() => setIsAddingCategory(true)}
          />
          <SpeedDialAction
            icon={<Package className="h-4 w-4" />}
            label="Quick add item"
            onClick={() => setIsQuickAddItemOpen(true)}
          />
        </FloatingActionButton>
      </div>
      <QuickAddItemDialog
        open={isQuickAddItemOpen}
        onOpenChange={setIsQuickAddItemOpen}
        categories={categories}
        onAddItem={handleQuickAddItem}
        online={online}
      />
      <AlertDialog
        open={showCompletionDialog}
        onOpenChange={(nextOpen) => {
          setShowCompletionDialog(nextOpen);
          if (!nextOpen) setCompletionError(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>All items packed</AlertDialogTitle>
            <AlertDialogDescription>
              Mark “{list.name}” as completed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {completionError ? (
            <div role="alert" className="text-sm text-destructive">
              <p className="font-semibold">{completionError.title}</p>
              <p>{completionError.message}</p>
            </div>
          ) : null}
          {!online ? (
            <p
              id="complete-list-offline-reason"
              role="status"
              aria-live="polite"
              className="text-sm text-warning"
            >
              Reconnect to complete this list.
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completionPending}>
              Not yet
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!online || completionPending}
              aria-describedby={
                !online ? "complete-list-offline-reason" : undefined
              }
              aria-busy={completionPending}
              onClick={(event) => void confirmCompletion(event)}
            >
              {completionPending ? "Completing…" : "Mark complete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
