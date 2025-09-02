"use client"

// React imports
import { useState, useMemo, useCallback } from "react";

// Third-party imports
import { format } from "date-fns";
import { toast } from "sonner";
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
  Plus, 
  Edit2, 
  Package,
  CheckCircle2,
  AlertCircle,
  Star,
  Calendar
} from "lucide-react";

// Local imports - Types
import { List, Category, Priority } from "@/types";

// Local imports - Store
import { useConvexStore } from "@/hooks/use-convex-store";

// Local imports - Utils
import { debounce, measurePerformance } from "@/lib/performance";

// Local imports - UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Local imports - Feature Components
import { SortableCategory } from "../dnd/sortable-category";
import { ListProgress } from "../progress/list-progress";
import { SaveAsTemplate } from "../templates/save-as-template";
import { LazyExportDialog } from "../lazy/lazy-export-dialog";
import { LazyImportDialog } from "../lazy/lazy-import-dialog";
import { FloatingActionButton, SpeedDialAction } from "@/components/mobile/floating-action-button";
import { PullToRefresh } from "@/components/mobile/pull-to-refresh";

interface ListDetailProps {
  listId: string;
}

export function ListDetail({ listId }: ListDetailProps) {
  const { lists, addCategory, reorderCategories, getListStatistics } = useConvexStore();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const list = useMemo(() => 
    lists.find(l => l.id === listId),
    [lists, listId]
  );
  
  const listCategories = useMemo(() => 
    list ? [...list.categories].sort((a, b) => a.order - b.order) : [],
    [list]
  );
  
  const stats = useMemo(() => 
    list ? getListStatistics(list.id) : null,
    [list, getListStatistics]
  );
  
  // Extract all items from categories for export functionality
  const listItems = useMemo(() =>
    listCategories.flatMap(category => category.items || []),
    [listCategories]
  );

  // Debounced category name input for better performance
  const debouncedSetCategoryName = useCallback(
    debounce((value: string) => {
      setNewCategoryName(value);
    }, 300),
    [setNewCategoryName]
  );

  const handleAddCategory = useCallback(() => {
    measurePerformance('add-category', () => {
      if (!newCategoryName.trim()) {
        toast.error("Please enter a category name");
        return;
      }

      const categoryId = addCategory(listId, {
        name: newCategoryName.trim(),
        order: listCategories.length,
        items: [],
        collapsed: false
      });

      if (categoryId) {
        toast.success("Category added successfully");
        setNewCategoryName("");
        setIsAddingCategory(false);
      }
    });
  }, [newCategoryName, listId, listCategories.length, addCategory]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = listCategories.findIndex((cat) => cat.id === active.id);
      const newIndex = listCategories.findIndex((cat) => cat.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newCategories = arrayMove(listCategories, oldIndex, newIndex);
        const updatedCategories = newCategories.map((cat, index) => ({
          ...cat,
          order: index
        }));

        reorderCategories(listId, updatedCategories.map(cat => cat.id));
      }
    }
  }, [listCategories, listId, reorderCategories]);

  if (!list) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Package className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">List not found</h2>
        <p className="text-muted-foreground">The list you&apos;re looking for doesn&apos;t exist.</p>
      </div>
    );
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.ESSENTIAL:
        return "text-red-600 dark:text-red-400";
      case Priority.HIGH:
        return "text-orange-600 dark:text-orange-400";
      case Priority.MEDIUM:
        return "text-yellow-600 dark:text-yellow-400";
      case Priority.LOW:
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case Priority.ESSENTIAL:
        return <AlertCircle className="h-4 w-4" />;
      case Priority.HIGH:
      case Priority.MEDIUM:
        return <Star className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleRefresh = async () => {
    // Simulate refresh - in a real app, this would reload data from the server
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("List refreshed");
  };

  const mainContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">{list.name}</h1>
            {list.description && (
              <p className="text-muted-foreground">{list.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <LazyExportDialog listId={listId} />
            <LazyImportDialog />
            <SaveAsTemplate list={list} />
            <Button variant="outline" size="icon">
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Enhanced Progress Display */}
        <ListProgress list={list} />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Packed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.packedItems || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{listCategories.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {(stats?.totalItems || 0) - (stats?.packedItems || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      <Separator />

      {/* Categories Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Categories</h2>
          <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>
                  Create a new category to organize your packing items.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="category-name">Category Name</Label>
                  <Input
                    id="category-name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., Clothing, Electronics, Documents"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddCategory();
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingCategory(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCategory}>Add Category</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories List */}
        {listCategories.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-center">
                No categories yet. Add your first category to start organizing items.
              </p>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={listCategories.map(cat => cat.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {listCategories.map((category) => (
                  <SortableCategory
                    key={category.id}
                    listId={listId}
                    category={category}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* List Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">List Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Created</span>
              <p className="font-medium">{format(new Date(list.createdAt), "PPP")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Last Updated</span>
              <p className="font-medium">{format(new Date(list.updatedAt), "PPP")}</p>
            </div>
            {list.tags && list.tags.length > 0 && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Tags</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {list.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {/* Mobile view with pull-to-refresh */}
      <div className="md:hidden">
        <PullToRefresh onRefresh={handleRefresh}>
          {mainContent}
        </PullToRefresh>
        
        {/* Floating Action Button for Mobile */}
        <FloatingActionButton
          onClick={() => setIsAddingCategory(true)}
          icon={<Plus className="h-6 w-6" />}
          label="Add Category"
        >
          <SpeedDialAction
            icon={<Plus className="h-4 w-4" />}
            label="Add Category"
            onClick={() => setIsAddingCategory(true)}
          />
          <SpeedDialAction
            icon={<Package className="h-4 w-4" />}
            label="Quick Add Item"
            onClick={() => toast.info("Quick add item coming soon")}
          />
        </FloatingActionButton>
      </div>

      {/* Desktop view without pull-to-refresh */}
      <div className="hidden md:block">
        {mainContent}
      </div>
    </>
  );
}