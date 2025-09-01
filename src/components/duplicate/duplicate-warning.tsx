"use client"

import { Item } from "@/types";
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
import { AlertTriangle, Package } from "lucide-react";
import { similarityScore } from "@/lib/duplicate-utils";

interface DuplicateWarningProps {
  isOpen: boolean;
  onClose: () => void;
  newItemName: string;
  duplicates: Item[];
  onAddAnyway: () => void;
  onCancel: () => void;
  onUseExisting?: (item: Item) => void;
}

export function DuplicateWarning({
  isOpen,
  onClose,
  newItemName,
  duplicates,
  onAddAnyway,
  onCancel,
  onUseExisting,
}: DuplicateWarningProps) {
  const getSimilarityBadge = (score: number) => {
    if (score >= 0.9) return { label: "Exact Match", variant: "destructive" as const };
    if (score >= 0.7) return { label: "Very Similar", variant: "default" as const };
    return { label: "Similar", variant: "secondary" as const };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <DialogTitle>Potential Duplicate Detected</DialogTitle>
          </div>
          <DialogDescription>
            We found similar items already in your list. Would you like to use an existing item instead?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 my-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium">New Item:</div>
            <div className="text-lg">{newItemName}</div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Similar existing items:</div>
            {duplicates.slice(0, 3).map((item) => {
              const score = similarityScore(newItemName, item.name);
              const badge = getSimilarityBadge(score);
              
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-muted-foreground">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    {onUseExisting && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUseExisting(item)}
                      >
                        Use This
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onAddAnyway}>
            Add Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}