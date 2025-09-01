"use client"

// React imports
import { useState } from "react";

// Types
import { Item, Priority } from "@/types";

// Constants
import { DEFAULTS, PRIORITY_CONFIG } from "@/constants";

// Icons
import { Plus, Edit2 } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ItemFormProps {
  categoryId: string;
  item?: Partial<Item>;
  onSubmit: (data: Omit<Item, "id" | "categoryId" | "createdAt" | "updatedAt">) => void;
  trigger?: React.ReactNode;
}

export function ItemForm({ categoryId, item, onSubmit, trigger }: ItemFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: item?.name || "",
    description: item?.description || "",
    quantity: item?.quantity || 1,
    priority: item?.priority || Priority.MEDIUM,
    packed: item?.packed || false,
    notes: item?.notes || "",
    weight: item?.weight || undefined,
    tags: item?.tags || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setOpen(false);
    if (!item) {
      // Reset form for new items
      setFormData({
        name: "",
        description: "",
        quantity: 1,
        priority: Priority.MEDIUM,
        packed: false,
        notes: "",
        weight: undefined,
        tags: [],
      });
    }
  };

  const defaultTrigger = item ? (
    <Button variant="ghost" size="icon">
      <Edit2 className="h-4 w-4" />
    </Button>
  ) : (
    <Button size="sm" variant="outline" className="gap-2">
      <Plus className="h-4 w-4" />
      Add Item
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "Add New Item"}</DialogTitle>
          <DialogDescription>
            {item ? "Update the item details below." : "Add a new item to this category."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., T-shirts"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., 5 cotton t-shirts for daily wear"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: Priority) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Priority.ESSENTIAL}>Essential</SelectItem>
                    <SelectItem value={Priority.HIGH}>High</SelectItem>
                    <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={Priority.LOW}>Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="weight">Weight (optional)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                value={formData.weight || ""}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="e.g., 2.5 kg"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {item ? "Update" : "Add"} Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}