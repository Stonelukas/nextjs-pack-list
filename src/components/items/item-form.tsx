import type { Id } from "../../../convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { Edit2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePreferences } from "@/features/settings/hooks/use-preferences";
import type {
  CategoryDocument,
  ItemDocument,
  ItemFormValue,
} from "@/features/lists/types";
import { mapError } from "@/lib/errors";

interface ItemFormProps {
  categoryId: Id<"categories">;
  item?: ItemDocument;
  availableCategories?: CategoryDocument[];
  onSubmit: (
    data: ItemFormValue,
    targetCategoryId?: Id<"categories">,
  ) => void | Promise<unknown>;
  online?: boolean;
  trigger?: React.ReactNode;
}

function emptyValue(defaultPriority: ItemFormValue["priority"]): ItemFormValue {
  return {
    name: "",
    description: "",
    quantity: 1,
    priority: defaultPriority,
    packed: false,
    notes: "",
    weight: undefined,
    tags: [],
  };
}

function itemValue(
  item: ItemDocument | undefined,
  defaultPriority: ItemFormValue["priority"],
): ItemFormValue {
  return item
    ? {
        name: item.name,
        description: item.description ?? "",
        quantity: item.quantity,
        priority: item.priority,
        packed: item.packed,
        notes: item.notes ?? "",
        weight: item.weight,
        tags: item.tags ?? [],
      }
    : emptyValue(defaultPriority);
}

export function ItemForm({
  availableCategories = [],
  categoryId,
  item,
  onSubmit,
  online = true,
  trigger,
}: ItemFormProps) {
  const { preferences } = usePreferences();
  const defaultPriority = preferences?.defaultPriority ?? "medium";
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ItemFormValue>(() =>
    itemValue(item, defaultPriority),
  );
  const [targetCategoryId, setTargetCategoryId] =
    useState<Id<"categories">>(categoryId);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submissionGuard = useRef(false);
  const draftTouched = useRef(false);

  useEffect(() => {
    if (!item && open && !draftTouched.current) {
      setFormData((current) => ({
        ...current,
        priority: defaultPriority,
      }));
    }
  }, [defaultPriority, item, open]);

  const updateFormData = (updates: Partial<ItemFormValue>) => {
    draftTouched.current = true;
    setFormData((current) => ({ ...current, ...updates }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!online || submissionGuard.current) return;
    submissionGuard.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(
        { ...formData, name: formData.name.trim() },
        item ? targetCategoryId : undefined,
      );
      setOpen(false);
      if (!item) {
        draftTouched.current = false;
        setFormData(emptyValue(defaultPriority));
      }
    } catch (error) {
      setSubmitError(mapError(error).message);
    } finally {
      submissionGuard.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (submitting && !nextOpen) return;
        setOpen(nextOpen);
        if (nextOpen) {
          draftTouched.current = false;
          setFormData(itemValue(item, defaultPriority));
          setTargetCategoryId(categoryId);
          setSubmitError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (item ? <Button variant="ghost" size="icon"><Edit2 className="h-4 w-4" /><span className="sr-only">Edit item</span></Button> : <Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" />Add item</Button>)}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" showCloseButton={!submitting}>
        <DialogHeader><DialogTitle>{item ? "Edit item" : "Add item"}</DialogTitle><DialogDescription>Set the item name, quantity, priority, and optional details.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label htmlFor="item-name">Name</Label><Input id="item-name" value={formData.name} onChange={(event) => updateFormData({ name: event.target.value })} required /></div>
            <div className="grid gap-2"><Label htmlFor="item-description">Description</Label><Textarea id="item-description" value={formData.description} onChange={(event) => updateFormData({ description: event.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="item-quantity">Quantity</Label><Input id="item-quantity" type="number" min="1" value={formData.quantity} onChange={(event) => updateFormData({ quantity: Number.parseInt(event.target.value, 10) || 1 })} /></div>
              <div className="grid gap-2"><Label htmlFor="item-priority">Priority</Label><Select value={formData.priority} onValueChange={(priority) => updateFormData({ priority: priority as ItemFormValue["priority"] })}><SelectTrigger id="item-priority"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="essential">Essential</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select></div>
            </div>
            {item && availableCategories.length > 1 ? (
              <div className="grid gap-2">
                <Label htmlFor="item-category">Category</Label>
                <Select
                  value={targetCategoryId}
                  onValueChange={(value) => {
                    draftTouched.current = true;
                    setTargetCategoryId(value as Id<"categories">);
                  }}
                >
                  <SelectTrigger id="item-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="grid gap-2"><Label htmlFor="item-weight">Weight</Label><Input id="item-weight" type="number" min="0" step="0.1" value={formData.weight ?? ""} onChange={(event) => updateFormData({ weight: event.target.value ? Number.parseFloat(event.target.value) : undefined })} /></div>
            <div className="grid gap-2"><Label htmlFor="item-notes">Notes</Label><Textarea id="item-notes" value={formData.notes} onChange={(event) => updateFormData({ notes: event.target.value })} rows={2} /></div>
          </div>
          {submitError ? (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {submitError}
            </p>
          ) : null}
          {!online ? (
            <p
              id="item-form-offline-reason"
              role="status"
              aria-live="polite"
              className="mb-4 text-sm text-warning"
            >
              Reconnect to save this item.
            </p>
          ) : null}
          <DialogFooter><Button type="button" variant="outline" disabled={submitting} onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={!online || submitting} aria-busy={submitting} aria-describedby={!online ? "item-form-offline-reason" : undefined}>{submitting ? `${item ? "Updating" : "Adding"} item…` : `${item ? "Update" : "Add"} item`}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
