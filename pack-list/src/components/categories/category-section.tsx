"use client"

import { useState } from "react";
import { Category, Item } from "@/types";
import { usePackListStore } from "@/store/usePackListStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "../progress/progress-bar";
import { getItemsStats, areEssentialsPacked } from "@/lib/progress-utils";
import { ItemForm } from "../items/item-form";
import { SortableItem } from "../dnd/sortable-item";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Check,
  X,
  Package,
  CheckCircle2,
  GripVertical,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { toast } from "sonner";

interface CategorySectionProps {
  listId: string;
  category: Category;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
}

export function CategorySection({ 
  listId, 
  category, 
  dragHandleProps,
  isDragging 
}: CategorySectionProps) {
  const {
    addItem,
    updateItem,
    deleteItem,
    toggleItemPacked,
    reorderItems,
    updateCategory,
    deleteCategory,
    toggleCategoryCollapse,
  } = usePackListStore();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(category.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = category.items.findIndex((item) => item.id === active.id);
      const newIndex = category.items.findIndex((item) => item.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(category.items, oldIndex, newIndex);
        reorderItems(listId, category.id, newOrder.map(item => item.id));
      }
    }
  };

  const handleNameSave = () => {
    if (editedName.trim() && editedName !== category.name) {
      updateCategory(listId, category.id, { name: editedName.trim() });
      toast.success("Category name updated");
    } else {
      setEditedName(category.name);
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setEditedName(category.name);
    setIsEditingName(false);
  };

  const handleAddItem = (itemData: Omit<Item, "id" | "categoryId" | "createdAt" | "updatedAt">) => {
    addItem(listId, category.id, { ...itemData, categoryId: category.id });
    toast.success("Item added successfully");
  };

  const handleUpdateItem = (itemId: string, updates: Partial<Item>) => {
    updateItem(listId, category.id, itemId, updates);
  };

  const handleDeleteItem = (itemId: string) => {
    deleteItem(listId, category.id, itemId);
    toast.success("Item deleted");
  };

  const handleToggleItemPacked = (itemId: string) => {
    toggleItemPacked(listId, category.id, itemId);
  };

  const handleDeleteCategory = () => {
    deleteCategory(listId, category.id);
    toast.success("Category deleted");
  };

  // Calculate category statistics
  const stats = getItemsStats(category.items);
  const essentialsPacked = areEssentialsPacked(category.items);

  return (
    <>
      <Card className={cn("transition-all", isDragging && "opacity-50 shadow-lg")}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              {/* Drag Handle for Category */}
              <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              
              {/* Collapse Toggle - Touch optimized */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 md:h-6 md:w-6 p-0"
                onClick={() => toggleCategoryCollapse(listId, category.id)}
              >
                {category.collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {/* Category Name with Inline Editing */}
              {isEditingName ? (
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleNameSave();
                      if (e.key === "Escape") handleNameCancel();
                    }}
                    className="h-7"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 md:h-6 md:w-6"
                    onClick={handleNameSave}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 md:h-6 md:w-6"
                    onClick={handleNameCancel}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <h3 
                  className="font-semibold cursor-pointer hover:underline"
                  onClick={() => setIsEditingName(true)}
                >
                  {category.name}
                </h3>
              )}

              {/* Category Stats */}
              <Badge variant="secondary" className="ml-2">
                {stats.total} {stats.total === 1 ? "item" : "items"}
              </Badge>
              
              {stats.progress > 0 && (
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {stats.progress}%
                </Badge>
              )}
              
              {!essentialsPacked && stats.byPriority.essential > 0 && (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  {stats.byPriority.essential - stats.packedByPriority.essential} essential
                </Badge>
              )}
            </div>

            {/* Category Actions */}
            <div className="flex items-center gap-1">
              <ItemForm
                categoryId={category.id}
                onSubmit={handleAddItem}
              />
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsEditingName(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {!category.collapsed && stats.total > 0 && (
            <div className="mt-3">
              <ProgressBar 
                value={stats.progress} 
                size="sm"
                showPercentage={false}
                animated
                className="space-y-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.packed} of {stats.total} items packed
              </p>
            </div>
          )}
        </CardHeader>

        {!category.collapsed && (
          <CardContent className="pt-0">
            {category.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">
                  No items in this category yet.
                </p>
                <ItemForm
                  categoryId={category.id}
                  onSubmit={handleAddItem}
                  trigger={
                    <Button size="sm" className="mt-3">
                      Add First Item
                    </Button>
                  }
                />
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={category.items.map(item => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {category.items.map((item) => (
                      <SortableItem
                        key={item.id}
                        item={item}
                        onTogglePacked={handleToggleItemPacked}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDeleteItem}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        )}
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{category.name}&rdquo; and all its items? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}