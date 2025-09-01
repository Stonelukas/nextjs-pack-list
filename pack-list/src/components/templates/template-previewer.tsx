"use client"

import { Template, Priority } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Layers,
  Package,
  Clock,
  Users,
  Target,
  Calendar,
  ChevronRight,
  AlertCircle,
  Star,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TemplateManager } from "./template-manager";

interface TemplatePreviewerProps {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onUse: (template: Template, listName: string) => void;
}

export function TemplatePreviewer({
  template,
  isOpen,
  onClose,
  onUse
}: TemplatePreviewerProps) {
  const [listName, setListName] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (!template) return null;

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

  const getPriorityBadge = (priority: Priority) => {
    const color = getPriorityColor(priority);
    const icon = getPriorityIcon(priority);
    
    return (
      <Badge variant="outline" className={cn("text-xs", color)}>
        {icon}
        <span className="ml-1">
          {priority.charAt(0).toUpperCase() + priority.slice(1)}
        </span>
      </Badge>
    );
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return "text-green-600 dark:text-green-400";
      case 'intermediate':
        return "text-yellow-600 dark:text-yellow-400";
      case 'advanced':
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const totalItems = template.categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const priorityCounts = template.categories.reduce((counts, cat) => {
    cat.items.forEach(item => {
      counts[item.priority] = (counts[item.priority] || 0) + 1;
    });
    return counts;
  }, {} as Record<Priority, number>);

  const handleUseTemplate = () => {
    if (!listName.trim()) {
      setListName(template.name);
    }
    setShowCreateDialog(true);
  };

  const handleConfirmCreate = () => {
    const finalName = listName.trim() || template.name;
    onUse(template, finalName);
    setListName("");
    setShowCreateDialog(false);
    onClose();
  };

  if (showCreateDialog) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create List from Template</DialogTitle>
            <DialogDescription>
              Give your new packing list a name
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="list-name">List Name</Label>
              <Input
                id="list-name"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder={template.name}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleConfirmCreate();
                  }
                }}
              />
            </div>
            
            <div className="rounded-lg bg-muted p-3 space-y-1">
              <p className="text-sm font-medium">Template: {template.name}</p>
              <p className="text-xs text-muted-foreground">
                {template.categories.length} categories • {totalItems} items
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Back
            </Button>
            <Button onClick={handleConfirmCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Create List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <span className="text-2xl">{template.icon || "📦"}</span>
                {template.name}
              </DialogTitle>
              <DialogDescription>
                {template.description}
              </DialogDescription>
            </div>
            {template.isPublic && (
              <Badge variant="secondary">Featured</Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Metadata */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span>{template.categories.length} categories</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>{totalItems} items</span>
            </div>
            {template.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{template.duration}</span>
              </div>
            )}
            {template.difficulty && (
              <div className="flex items-center gap-1">
                <Target className={cn("h-4 w-4", getDifficultyColor(template.difficulty))} />
                <span className={getDifficultyColor(template.difficulty)}>
                  {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
                </span>
              </div>
            )}
            {template.season && template.season !== 'all' && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{template.season.charAt(0).toUpperCase() + template.season.slice(1)}</span>
              </div>
            )}
            {template.usageCount > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{template.usageCount} uses</span>
              </div>
            )}
          </div>

          {/* Priority Breakdown */}
          {Object.keys(priorityCounts).length > 0 && (
            <div className="flex gap-2">
              {Object.entries(priorityCounts).map(([priority, count]) => (
                <div key={priority} className="flex items-center gap-1">
                  {getPriorityBadge(priority as Priority)}
                  <span className="text-sm text-muted-foreground">×{count}</span>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Categories and Items */}
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-4">
              {template.categories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold">
                      {category.name}
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      {category.items.length} items
                    </Badge>
                  </div>
                  
                  <div className="ml-6 space-y-1">
                    {category.items.map((item, itemIndex) => (
                      <div 
                        key={itemIndex}
                        className="flex items-center justify-between py-1 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span>{item.name}</span>
                          {item.quantity > 1 && (
                            <Badge variant="outline" className="text-xs">
                              ×{item.quantity}
                            </Badge>
                          )}
                          {item.notes && (
                            <span className="text-xs text-muted-foreground">
                              ({item.notes})
                            </span>
                          )}
                        </div>
                        {getPriorityBadge(item.priority)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div>
            <TemplateManager template={template} onClose={onClose} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleUseTemplate}>
              <Plus className="h-4 w-4 mr-1" />
              Use This Template
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}