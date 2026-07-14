import type { Id } from "../../../convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CategoryDocument, ItemFormValue } from "@/features/lists/types";
import { usePreferences } from "@/features/settings/hooks/use-preferences";
import { mapError } from "@/lib/errors";

interface QuickAddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryDocument[];
  onAddItem: (
    categoryId: Id<"categories">,
    itemData: ItemFormValue,
  ) => void | Promise<unknown>;
  online?: boolean;
}

export function QuickAddItemDialog({ open, onOpenChange, categories, onAddItem, online = true }: QuickAddItemDialogProps) {
  const { preferences } = usePreferences();
  const defaultPriority = preferences?.defaultPriority ?? "medium";
  const [selectedCategoryId, setSelectedCategoryId] = useState<Id<"categories"> | "">("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState<ItemFormValue["priority"]>(
    defaultPriority,
  );
  const [notes, setNotes] = useState("");
  const [description, setDescription] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submissionGuard = useRef(false);
  const draftTouched = useRef(false);

  useEffect(() => {
    if (!draftTouched.current) setPriority(defaultPriority);
  }, [defaultPriority]);

  const reset = () => {
    draftTouched.current = false;
    setSelectedCategoryId("");
    setName("");
    setQuantity(1);
    setPriority(defaultPriority);
    setNotes("");
    setDescription("");
    setSubmitError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!online || submissionGuard.current) return;
    if (!selectedCategoryId || !name.trim()) {
      toast.error("Select a category and enter an item name");
      return;
    }
    submissionGuard.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onAddItem(selectedCategoryId, {
        name: name.trim(),
        quantity,
        priority,
        notes: notes.trim() || undefined,
        description: description.trim() || undefined,
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      setSubmitError(mapError(error).message);
    } finally {
      submissionGuard.current = false;
      setSubmitting(false);
    }
  };

  return <Dialog open={open} onOpenChange={(nextOpen) => { if (submitting && !nextOpen) return; onOpenChange(nextOpen); if (!nextOpen) reset(); }}><DialogContent showCloseButton={!submitting}><DialogHeader><DialogTitle>Quick add item</DialogTitle><DialogDescription>Add an item to any category.</DialogDescription></DialogHeader><form onSubmit={handleSubmit}><div className="grid gap-4 py-4"><div className="grid gap-2"><Label htmlFor="quick-category">Category</Label><Select value={selectedCategoryId} onValueChange={(value) => { draftTouched.current = true; setSelectedCategoryId(value as Id<"categories">); }}><SelectTrigger id="quick-category"><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent>{categories.map((category) => <SelectItem key={category._id} value={category._id}>{category.name}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="quick-name">Item name</Label><Input id="quick-name" value={name} onChange={(event) => { draftTouched.current = true; setName(event.target.value); }} required /></div><div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label htmlFor="quick-quantity">Quantity</Label><Input id="quick-quantity" type="number" min="1" value={quantity} onChange={(event) => { draftTouched.current = true; setQuantity(Number.parseInt(event.target.value, 10) || 1); }} /></div><div className="grid gap-2"><Label htmlFor="quick-priority">Priority</Label><Select value={priority} onValueChange={(value) => { draftTouched.current = true; setPriority(value as ItemFormValue["priority"]); }}><SelectTrigger id="quick-priority"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="essential">Essential</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select></div></div><div className="grid gap-2"><Label htmlFor="quick-description">Description</Label><Textarea id="quick-description" value={description} onChange={(event) => { draftTouched.current = true; setDescription(event.target.value); }} /></div><div className="grid gap-2"><Label htmlFor="quick-notes">Notes</Label><Textarea id="quick-notes" value={notes} onChange={(event) => { draftTouched.current = true; setNotes(event.target.value); }} /></div></div>{submitError ? <p role="alert" className="text-sm text-destructive">{submitError}</p> : null}{!online ? <p id="quick-add-item-offline-reason" role="status" aria-live="polite" className="text-sm text-warning">Reconnect to add this item.</p> : null}<DialogFooter><Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={!online || submitting} aria-busy={submitting} aria-describedby={!online ? "quick-add-item-offline-reason" : undefined}><Plus className="mr-2 h-4 w-4" />{submitting ? "Adding item…" : "Add item"}</Button></DialogFooter></form></DialogContent></Dialog>;
}
