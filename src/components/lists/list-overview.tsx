"use client"

import { useState, useMemo, useEffect } from "react";
import { useConvexStore } from "@/hooks/use-convex-store";
import { ListCard } from "./list-card";
import { CreateListForm } from "./create-list-form";
import { QuickStartTemplates } from "../templates/quick-start-templates";
import { SearchBar } from "@/components/search/search-bar";
import { ImportDialog } from "../export/import-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SortAsc, Grid3x3, List as ListIcon, Package } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { searchLists } from "@/lib/search-utils";

type SortOption = "name" | "date" | "completion";
type ViewMode = "grid" | "list";

export function ListOverview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lists } = useConvexStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showTemplates, setShowTemplates] = useState(true);

  // Get status filter from URL query parameters
  const statusFilter = searchParams.get("status");

  // Filter and sort lists
  const filteredAndSortedLists = useMemo(() => {
    let filtered = lists.filter(list => !list.isTemplate);

    // Apply status filter from URL
    if (statusFilter) {
      switch (statusFilter) {
        case "active":
          filtered = filtered.filter(list => !list.completedAt);
          break;
        case "completed":
          filtered = filtered.filter(list => list.completedAt);
          break;
        case "archived":
          // For now, archived lists are those marked as archived (future implementation)
          filtered = filtered.filter(list => (list as any).archived === true);
          break;
      }
    }

    // Apply search filter using our search utility
    if (searchQuery) {
      filtered = searchLists(filtered, searchQuery);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "completion":
          // TODO: Implement getListProgress for Convex
          const statsA = { completionPercentage: 0 };
          const statsB = { completionPercentage: 0 };
          return (statsB?.completionPercentage || 0) - (statsA?.completionPercentage || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [lists, searchQuery, sortBy, statusFilter]);

  const handleListClick = (listId: string) => {
    router.push(`/lists/${listId}`);
  };

  const handleListEdit = (listId: string) => {
    router.push(`/lists/${listId}/edit`);
  };

  const handleCreateSuccess = (listId: string) => {
    router.push(`/lists/${listId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {statusFilter === "active" && "Active Packing Lists"}
            {statusFilter === "completed" && "Completed Packing Lists"}
            {statusFilter === "archived" && "Archived Packing Lists"}
            {!statusFilter && "My Packing Lists"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {statusFilter === "active" && "Lists you're currently working on"}
            {statusFilter === "completed" && "Lists you've finished packing"}
            {statusFilter === "archived" && "Your archived packing lists"}
            {!statusFilter && "Manage and organize all your packing lists in one place"}
          </p>
        </div>
        <div className="flex gap-2">
          <ImportDialog />
          <CreateListForm onSuccess={handleCreateSuccess} />
        </div>
      </div>

      {/* Quick Start Templates - Show when no lists or at the top */}
      {(lists.filter(l => !l.isTemplate).length === 0 || showTemplates) && (
        <QuickStartTemplates
          className="mb-6"
          maxTemplates={lists.filter(l => !l.isTemplate).length === 0 ? 6 : 3}
        />
      )}

      {/* Filters and Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          placeholder="Search lists..."
          onSearch={setSearchQuery}
          className="flex-1 max-w-sm"
        />
        
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[140px]">
              <SortAsc className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date Created</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="completion">Completion</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-1 border rounded-md p-1">
            <Button
              size="sm"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("list")}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Lists Display */}
      {filteredAndSortedLists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {searchQuery ? "No lists found" : "No packing lists yet"}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            {searchQuery 
              ? "Try adjusting your search query" 
              : "Create your first packing list to get started organizing your trips"}
          </p>
          {!searchQuery && <CreateListForm onSuccess={handleCreateSuccess} />}
        </div>
      ) : (
        <div className={
          viewMode === "grid" 
            ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            : "space-y-4"
        }>
          {filteredAndSortedLists.map((list: any) => (
            <ListCard
              key={list._id}
              list={list}
              onClick={() => handleListClick(list._id)}
              onEdit={() => handleListEdit(list._id)}
            />
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {lists.length > 0 && (
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{lists.filter(l => !l.isTemplate).length}</div>
              <div className="text-sm text-muted-foreground">Active Lists</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {lists.filter(l => {
                  // TODO: Implement getListProgress(l.id);
                  const stats = null;
                  return stats?.completionPercentage === 100;
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {lists.reduce((total, list) => {
                  // TODO: Implement getListProgress(list.id);
                  const stats = null;
                  return total + (stats?.totalItems || 0);
                }, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {Math.round(
                  lists.reduce((total, list) => {
                    // TODO: Implement getListProgress(list.id);
                    const stats = null;
                    return total + (stats?.completionPercentage || 0);
                  }, 0) / (lists.length || 1)
                )}%
              </div>
              <div className="text-sm text-muted-foreground">Avg. Completion</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}