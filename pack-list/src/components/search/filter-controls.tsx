"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Filter, X } from "lucide-react";
import { Priority } from "@/types";
import { cn } from "@/lib/utils";

export interface FilterOptions {
  categories?: string[];
  priorities?: Priority[];
  packedStatus?: "all" | "packed" | "unpacked";
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

interface FilterControlsProps {
  availableCategories: string[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  className?: string;
}

export function FilterControls({
  availableCategories,
  filters,
  onFiltersChange,
  className,
}: FilterControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCategoryToggle = (category: string) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    
    onFiltersChange({
      ...filters,
      categories: newCategories.length > 0 ? newCategories : undefined,
    });
  };

  const handlePriorityToggle = (priority: Priority) => {
    const currentPriorities = filters.priorities || [];
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter(p => p !== priority)
      : [...currentPriorities, priority];
    
    onFiltersChange({
      ...filters,
      priorities: newPriorities.length > 0 ? newPriorities : undefined,
    });
  };

  const handlePackedStatusChange = (status: "all" | "packed" | "unpacked") => {
    onFiltersChange({
      ...filters,
      packedStatus: status === "all" ? undefined : status,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = 
    (filters.categories?.length || 0) +
    (filters.priorities?.length || 0) +
    (filters.packedStatus ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Categories */}
          {availableCategories.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs">Categories</DropdownMenuLabel>
              {availableCategories.map(category => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={filters.categories?.includes(category) || false}
                  onCheckedChange={() => handleCategoryToggle(category)}
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Priorities */}
          <DropdownMenuLabel className="text-xs">Priority</DropdownMenuLabel>
          {Object.values(Priority).map(priority => (
            <DropdownMenuCheckboxItem
              key={priority}
              checked={filters.priorities?.includes(priority) || false}
              onCheckedChange={() => handlePriorityToggle(priority)}
            >
              {priority}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          
          {/* Packed Status */}
          <DropdownMenuLabel className="text-xs">Status</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handlePackedStatusChange("all")}>
            All Items
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePackedStatusChange("packed")}>
            Packed Only
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePackedStatusChange("unpacked")}>
            Unpacked Only
          </DropdownMenuItem>
          
          {activeFilterCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearFilters} className="text-destructive">
                Clear All Filters
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1">
          {filters.categories?.map(category => (
            <Badge key={category} variant="secondary" className="gap-1">
              {category}
              <button
                onClick={() => handleCategoryToggle(category)}
                className="ml-1 hover:text-destructive"
                aria-label={`Remove ${category} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.priorities?.map(priority => (
            <Badge key={priority} variant="secondary" className="gap-1">
              {priority}
              <button
                onClick={() => handlePriorityToggle(priority)}
                className="ml-1 hover:text-destructive"
                aria-label={`Remove ${priority} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.packedStatus && (
            <Badge variant="secondary" className="gap-1">
              {filters.packedStatus}
              <button
                onClick={() => handlePackedStatusChange("all")}
                className="ml-1 hover:text-destructive"
                aria-label="Remove status filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}