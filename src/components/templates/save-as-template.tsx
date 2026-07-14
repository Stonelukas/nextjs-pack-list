import type { Id } from "../../../convex/_generated/dataModel";
import { useRef, useState } from "react";
import { Globe, Lock, Package, Save } from "lucide-react";
import { toast } from "sonner";

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ListDocument } from "@/features/lists/types";
import { useTemplates } from "@/features/templates/hooks/use-templates";
import { useOnlineStatus } from "@/hooks/use-online-status";

interface SaveAsTemplateProps {
  list: ListDocument;
  trigger?: React.ReactNode;
  onSaved?: (templateId: Id<"templates">) => void;
  className?: string;
}

export function SaveAsTemplate({
  list,
  trigger,
  onSaved,
  className,
}: SaveAsTemplateProps) {
  const { createTemplateFromList, error, pending } = useTemplates();
  const { online } = useOnlineStatus();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(`${list.name} Template`);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("custom");
  const [isPublic, setIsPublic] = useState(false);
  const submissionGuard = useRef(false);
  const totalItems = list.categories.reduce(
    (total, value) => total + value.items.length,
    0,
  );

  const save = async () => {
    if (
      !online ||
      submissionGuard.current ||
      !name.trim() ||
      !description.trim()
    ) {
      return;
    }

    submissionGuard.current = true;
    try {
      const templateId = await createTemplateFromList(
        {
          listId: list._id,
          name: name.trim(),
          description: description.trim(),
          category: category.trim() || undefined,
          isPublic,
        },
        { rethrow: true },
      );
      if (!templateId) return;
      toast.success(`Template “${name}” saved`);
      setOpen(false);
      onSaved?.(templateId);
    } catch {
      // useTemplates exposes the mapped failure for the dialog to render.
    } finally {
      submissionGuard.current = false;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (submissionGuard.current && !nextOpen) return;
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className={className}>
            <Save className="mr-2 h-4 w-4" />
            Save as template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save list as template</DialogTitle>
          <DialogDescription>
            Create a reusable template from this list.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-category">Category</Label>
            <Input
              id="template-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label
                htmlFor="template-public"
                className="flex items-center gap-2"
              >
                {isPublic ? (
                  <Globe className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {isPublic ? "Public template" : "Private template"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {list.categories.length} categories and {totalItems} items
              </p>
            </div>
            <Switch
              id="template-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
            <Package className="h-4 w-4" />
            All current categories and items will be copied.
          </div>
          {error ? (
            <div role="alert" className="text-sm text-destructive">
              <p className="font-semibold">{error.title}</p>
              <p>{error.message}</p>
            </div>
          ) : null}
          {!online ? (
            <p
              id="save-template-offline-reason"
              role="status"
              aria-live="polite"
              className="text-sm text-warning"
            >
              Reconnect to save this template. Your draft remains editable while
              offline.
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void save()}
            disabled={pending || !online || !name.trim() || !description.trim()}
            aria-describedby={
              !online ? "save-template-offline-reason" : undefined
            }
          >
            {pending ? "Saving…" : "Save template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
