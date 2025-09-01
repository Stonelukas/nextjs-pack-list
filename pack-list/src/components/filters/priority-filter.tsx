"use client"

import { Priority } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, AlertCircle, Star } from "lucide-react";
import { getPriorityColor, getPriorityBgColor } from "@/lib/progress-utils";
import { cn } from "@/lib/utils";

interface PriorityFilterProps {
  selectedPriorities: Priority[];
  onPriorityToggle: (priority: Priority) => void;
  onClearAll: () => void;
  onSelectAll: () => void;
  className?: string;
}

export function PriorityFilter({
  selectedPriorities,
  onPriorityToggle,
  onClearAll,
  onSelectAll,
  className,
}: PriorityFilterProps) {
  const allPriorities = [
    Priority.ESSENTIAL,
    Priority.HIGH,
    Priority.MEDIUM,
    Priority.LOW,
  ];

  const getPriorityLabel = (priority: Priority) => {
    switch (priority) {
      case Priority.ESSENTIAL:
        return "Essential";
      case Priority.HIGH:
        return "High";
      case Priority.MEDIUM:
        return "Medium";
      case Priority.LOW:
        return "Low";
    }
  };

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case Priority.ESSENTIAL:
        return <AlertCircle className="h-3 w-3" />;
      case Priority.HIGH:
      case Priority.MEDIUM:
        return <Star className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          <Filter className="h-4 w-4" />
          Priority
          {selectedPriorities.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1">
              {selectedPriorities.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {allPriorities.map((priority) => (
          <DropdownMenuCheckboxItem
            key={priority}
            checked={selectedPriorities.includes(priority)}
            onCheckedChange={() => onPriorityToggle(priority)}
            className="gap-2"
          >
            <div className="flex items-center gap-2 flex-1">
              <div className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                getPriorityColor(priority),
                getPriorityBgColor(priority)
              )}>
                {getPriorityIcon(priority)}
                {getPriorityLabel(priority)}
              </div>
            </div>
          </DropdownMenuCheckboxItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <div className="flex gap-2 p-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={onSelectAll}
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={onClearAll}
          >
            Clear All
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}