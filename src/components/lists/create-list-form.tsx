import type { Id } from "../../../convex/_generated/dataModel";
import { useRef, useState } from "react";
import { FileText, Package, Plus } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useListActions } from "@/features/lists/hooks/use-list-actions";
import {
  useTemplateDetail,
  useTemplates,
} from "@/features/templates/hooks/use-templates";
import { useOnlineStatus } from "@/hooks/use-online-status";

interface CreateListFormProps {
  onSuccess?: (listId: Id<"lists">) => void;
  trigger?: React.ReactNode;
}

export function CreateListForm({ onSuccess, trigger }: CreateListFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createFrom, setCreateFrom] = useState<"scratch" | "template">("scratch");
  const [selectedTemplateId, setSelectedTemplateId] = useState<Id<"templates"> | "">("");
  const submissionGuard = useRef(false);
  const { online } = useOnlineStatus();
  const {
    createList,
    error: listError,
    pending: listPending,
  } = useListActions();
  const {
    applyTemplate,
    error: templateError,
    pending: templatePending,
    templates,
  } = useTemplates();
  const { template: selectedTemplate, loading: selectedTemplateLoading } =
    useTemplateDetail(
      createFrom === "template" && selectedTemplateId
        ? selectedTemplateId
        : undefined,
    );
  const pending = listPending || templatePending;
  const error = createFrom === "template" ? templateError : listError;
  const templateUnavailable =
    createFrom === "template" &&
    (!selectedTemplateId || selectedTemplateLoading || !selectedTemplate);

  const reset = () => {
    setName("");
    setDescription("");
    setCreateFrom("scratch");
    setSelectedTemplateId("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!online || submissionGuard.current) return;
    if (!name.trim()) {
      toast.error("Please enter a list name");
      return;
    }
    if (createFrom === "template" && !selectedTemplate) return;

    submissionGuard.current = true;
    try {
      const listId =
        createFrom === "template" && selectedTemplate
          ? await applyTemplate({
              templateId: selectedTemplate._id,
              listName: name.trim(),
              listDescription: description.trim() || undefined,
            })
          : await createList({
              name: name.trim(),
              description: description.trim() || undefined,
              tags: [],
            });

      if (!listId) return;
      toast.success(
        createFrom === "template"
          ? "List created from template"
          : "List created successfully",
      );
      reset();
      setOpen(false);
      onSuccess?.(listId);
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
        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? <Button><Plus className="mr-2 h-4 w-4" />Create new list</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create new packing list</DialogTitle>
            <DialogDescription>Start from scratch or apply a visible template.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">Start from</legend>
              <RadioGroup
                aria-label="Start from"
                value={createFrom}
                onValueChange={(value) => setCreateFrom(value as "scratch" | "template")}
                className="grid grid-cols-2 gap-2"
              >
                <Label
                  htmlFor="create-from-scratch"
                  className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary has-[[data-state=checked]]:text-primary-foreground"
                >
                  <RadioGroupItem id="create-from-scratch" value="scratch" />
                  <Package className="h-4 w-4" aria-hidden="true" />Scratch
                </Label>
                <Label
                  htmlFor="create-from-template"
                  className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary has-[[data-state=checked]]:text-primary-foreground"
                >
                  <RadioGroupItem
                    id="create-from-template"
                    value="template"
                    disabled={!templates?.length}
                  />
                  <FileText className="h-4 w-4" aria-hidden="true" />Template
                </Label>
              </RadioGroup>
            </fieldset>
            {createFrom === "template" ? (
              <div className="grid gap-2">
                <Label htmlFor="create-template">Template</Label>
                <Select value={selectedTemplateId} onValueChange={(value) => setSelectedTemplateId(value as Id<"templates">)}>
                  <SelectTrigger id="create-template"><SelectValue placeholder="Select a template" /></SelectTrigger>
                  <SelectContent>{(templates ?? []).map((template) => <SelectItem key={template._id} value={template._id}>{template.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="grid gap-2"><Label htmlFor="create-name">List name</Label><Input id="create-name" value={name} onChange={(event) => setName(event.target.value)} required autoFocus /></div>
            <div className="grid gap-2"><Label htmlFor="create-description">Description</Label><Textarea id="create-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} /></div>
            {error ? (
              <div role="alert" className="text-sm text-destructive">
                <p className="font-semibold">{error.title}</p>
                <p>{error.message}</p>
              </div>
            ) : null}
            {!online ? (
              <p
                id="create-list-dialog-offline-reason"
                role="status"
                aria-live="polite"
                className="text-sm text-warning"
              >
                Reconnect to create this list.
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || !online || !name.trim() || templateUnavailable}
              aria-busy={pending || selectedTemplateLoading}
              aria-describedby={!online ? "create-list-dialog-offline-reason" : undefined}
            >
              {selectedTemplateLoading
                ? "Loading template…"
                : pending
                  ? "Creating…"
                  : "Create list"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
