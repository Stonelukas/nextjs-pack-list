"use client"

import { useState } from "react";
import { Item, Priority } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ItemForm } from "./item-form";
import { 
  Trash2, 
  GripVertical, 
  Plus, 
  Minus, 
  AlertCircle,
  Star,
  Package,
  Edit2,
  Check,
  X
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
import { SwipeableItem } from "@/components/gestures/swipeable-item";

interface ItemRowProps {
  item: Item;
  onTogglePacked: (itemId: string) => void;
  onUpdate: (itemId: string, updates: Partial<Item>) => void;
  onDelete: (itemId: string) => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export function ItemRow({ 
  item, 
  onTogglePacked, 
  onUpdate, 
  onDelete,
  isDragging,
  dragHandleProps
}: ItemRowProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(item.name);
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [editedQuantity, setEditedQuantity] = useState(item.quantity.toString());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleNameSave = () => {
    if (editedName.trim() && editedName !== item.name) {
      onUpdate((item as any)._id || item.id, { name: editedName.trim() });
    } else {
      setEditedName(item.name);
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setEditedName(item.name);
    setIsEditingName(false);
  };

  const handleQuantitySave = () => {
    const qty = parseInt(editedQuantity);
    if (!isNaN(qty) && qty > 0 && qty !== item.quantity) {
      onUpdate((item as any)._id || item.id, { quantity: qty });
    } else {
      setEditedQuantity(item.quantity.toString());
    }
    setIsEditingQuantity(false);
  };

  const handleQuantityCancel = () => {
    setEditedQuantity(item.quantity.toString());
    setIsEditingQuantity(false);
  };

  const incrementQuantity = () => {
    onUpdate((item as any)._id || item.id, { quantity: item.quantity + 1 });
  };

  const decrementQuantity = () => {
    if (item.quantity > 1) {
      onUpdate((item as any)._id || item.id, { quantity: item.quantity - 1 });
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.ESSENTIAL:
        return "destructive";
      case Priority.HIGH:
        return "default";
      case Priority.MEDIUM:
        return "secondary";
      case Priority.LOW:
        return "outline";
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

  const itemContent = (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all",
        item.packed && "opacity-60",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
        {/* Drag Handle */}
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Checkbox */}
        <Checkbox
          checked={item.packed}
          onCheckedChange={() => onTogglePacked((item as any)._id || item.id)}
          className="h-5 w-5"
        />

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Name with inline editing */}
            {isEditingName ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleNameSave();
                    if (e.key === "Escape") handleNameCancel();
                  }}
                  className="h-7 text-sm"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={handleNameSave}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={handleNameCancel}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <h4 
                className={cn(
                  "font-medium cursor-pointer hover:underline",
                  item.packed && "line-through"
                )}
                onClick={() => setIsEditingName(true)}
              >
                {item.name}
              </h4>
            )}

            {/* Priority Badge */}
            <Badge variant={getPriorityColor(item.priority)} className="gap-1">
              {getPriorityIcon(item.priority)}
              {item.priority}
            </Badge>

            {/* Weight */}
            {item.weight && (
              <span className="text-xs text-muted-foreground">
                {item.weight}kg
              </span>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {item.description}
            </p>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={decrementQuantity}
            disabled={item.quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          
          {isEditingQuantity ? (
            <Input
              value={editedQuantity}
              onChange={(e) => setEditedQuantity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleQuantitySave();
                if (e.key === "Escape") handleQuantityCancel();
              }}
              onBlur={handleQuantitySave}
              className="h-7 w-12 text-center text-sm"
              autoFocus
            />
          ) : (
            <div 
              className="min-w-[2rem] text-center font-medium cursor-pointer hover:bg-muted rounded px-1"
              onClick={() => setIsEditingQuantity(true)}
            >
              {item.quantity}
            </div>
          )}
          
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={incrementQuantity}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <ItemForm
            categoryId={item.categoryId}
            item={item}
            onSubmit={(data) => onUpdate((item as any)._id || item.id, data)}
          />
          
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
    </div>
  );

  return (
    <>
      {/* Mobile view with swipe gestures */}
      <div className="md:hidden">
        <SwipeableItem
          onSwipeLeft={() => setShowDeleteDialog(true)}
          onSwipeRight={() => onTogglePacked((item as any)._id || item.id)}
          leftAction={{
            icon: item.packed ? <X className="h-5 w-5" /> : <Check className="h-5 w-5" />,
            label: item.packed ? "Unpack" : "Pack",
            color: item.packed ? "bg-orange-500" : "bg-green-500"
          }}
          rightAction={{
            icon: <Trash2 className="h-5 w-5" />,
            label: "Delete",
            color: "bg-red-500"
          }}
        >
          {itemContent}
        </SwipeableItem>
      </div>

      {/* Desktop view without swipe */}
      <div className="hidden md:block">
        {itemContent}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{item.name}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete((item as any)._id || item.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}