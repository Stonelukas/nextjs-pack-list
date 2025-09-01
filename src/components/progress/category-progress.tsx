"use client"

import { Category, Item } from "@/types";
import { ProgressBar } from "./progress-bar";
import { getItemsStats, areEssentialsPacked } from "@/lib/progress-utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryProgressProps {
  category: Category;
  className?: string;
  showDetails?: boolean;
}

export function CategoryProgress({ 
  category, 
  className,
  showDetails = true 
}: CategoryProgressProps) {
  const stats = getItemsStats(category.items);
  const essentialsPacked = areEssentialsPacked(category.items);

  if (category.items.length === 0) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Package className="h-4 w-4" />
        <span>No items yet</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <ProgressBar
        value={stats.progress}
        label={category.name}
        showEmoji
        size="md"
        animated
      />
      
      {showDetails && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Package className="h-3 w-3" />
            {stats.packed}/{stats.total} items
          </Badge>
          
          {stats.progress === 100 && (
            <Badge variant="default" className="gap-1 bg-green-600">
              <CheckCircle2 className="h-3 w-3" />
              Complete
            </Badge>
          )}
          
          {!essentialsPacked && stats.byPriority.essential > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {stats.byPriority.essential - stats.packedByPriority.essential} essential items remaining
            </Badge>
          )}
          
          {essentialsPacked && stats.byPriority.essential > 0 && stats.progress < 100 && (
            <Badge variant="outline" className="gap-1 border-green-600 text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              Essentials packed
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}