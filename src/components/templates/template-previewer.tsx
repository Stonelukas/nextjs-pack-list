import { useRef, useState } from "react";
import {
  AlertCircle,
  ChevronRight,
  Clock,
  Layers,
  Package,
  Plus,
  Star,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type {
  TemplateSummary,
  TemplateWithCategories,
} from "@/features/templates/hooks/use-templates";
import { mapError } from "@/lib/errors";
import { TemplateManager } from "./template-manager";

interface TemplatePreviewerProps {
  template: TemplateWithCategories | null;
  summary?: TemplateSummary | null;
  loading?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onUse: (template: TemplateSummary, listName: string) => void | Promise<void>;
  useAvailability?: {
    disabled: boolean;
    message: string;
    onRetry?: () => void;
  };
}

type TemplatePreviewerContentProps = Pick<
  TemplatePreviewerProps,
  "isOpen" | "onClose" | "onUse" | "useAvailability"
> & {
  template: TemplateWithCategories;
};

function TemplatePreviewerContent({
  template,
  isOpen,
  onClose,
  onUse,
  useAvailability,
}: TemplatePreviewerContentProps) {
  const [creating, setCreating] = useState(false);
  const [listName, setListName] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submissionGuard = useRef(false);

  const reset = () => {
    setCreating(false);
    setListName("");
    setSubmitError(null);
  };

  const handleClose = () => {
    if (submissionGuard.current) return;
    reset();
    onClose();
  };

  const totalItems = template.categories.reduce(
    (total, category) => total + category.items.length,
    0,
  );
  const priorityBadge = (priority: string) => (
    <Badge variant="outline">
      {priority === "essential" ? (
        <AlertCircle className="mr-1 h-3 w-3" />
      ) : priority === "high" || priority === "medium" ? (
        <Star className="mr-1 h-3 w-3" />
      ) : null}
      {priority}
    </Badge>
  );

  const confirmCreate = async () => {
    if (submissionGuard.current) return;
    submissionGuard.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onUse(template, listName.trim() || template.name);
      reset();
      onClose();
    } catch (error) {
      setSubmitError(mapError(error).message);
    } finally {
      submissionGuard.current = false;
      setSubmitting(false);
    }
  };

  if (creating) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent showCloseButton={!submitting}>
          <DialogHeader>
            <DialogTitle>Create list from template</DialogTitle>
            <DialogDescription>Name the new packing list.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="template-list-name">List name</Label>
            <Input
              id="template-list-name"
              value={listName}
              onChange={(event) => setListName(event.target.value)}
              placeholder={template.name}
              autoFocus
            />
          </div>
          {submitError ? (
            <p role="alert" className="text-sm text-destructive">
              {submitError}
            </p>
          ) : null}
          {useAvailability?.disabled ? (
            <div
              id="template-use-unavailable"
              role="status"
              className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"
            >
              <span>{useAvailability.message}</span>
              {useAvailability.onRetry ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={useAvailability.onRetry}
                >
                  Retry account setup
                </Button>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={submitting}
              onClick={() => {
                setCreating(false);
                setListName("");
                setSubmitError(null);
              }}
            >
              Back
            </Button>
            <Button
              disabled={submitting || useAvailability?.disabled}
              aria-busy={submitting}
              aria-describedby={
                useAvailability?.disabled
                  ? "template-use-unavailable"
                  : undefined
              }
              onClick={() => void confirmCreate()}
            >
              <Plus className="mr-1 h-4 w-4" />
              {submitting ? "Creating list…" : "Create list"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[80vh] max-w-3xl">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-1"><Layers className="h-4 w-4" />{template.categories.length} categories</span>
          <span className="flex items-center gap-1"><Package className="h-4 w-4" />{totalItems} items</span>
          {template.duration ? <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{template.duration}</span> : null}
          {template.usageCount ? <span className="flex items-center gap-1"><Users className="h-4 w-4" />{template.usageCount} uses</span> : null}
        </div>
        <Separator />
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-4">
            {template.categories.map((category) => (
              <div key={category.name}>
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4" />
                  <h4 className="font-semibold">{category.name}</h4>
                  <Badge variant="secondary">{category.items.length}</Badge>
                </div>
                <div className="ml-6 mt-2 space-y-2">
                  {category.items.map((item, index) => (
                    <div key={`${category.name}-${item.name}-${index}`} className="flex justify-between gap-4 text-sm">
                      <span>{item.quantity > 1 ? `${item.quantity}× ` : ""}{item.name}</span>
                      {priorityBadge(item.priority)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        {useAvailability?.disabled ? (
          <div
            id="template-use-unavailable"
            role="status"
            className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"
          >
            <span>{useAvailability.message}</span>
            {useAvailability.onRetry ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={useAvailability.onRetry}
              >
                Retry account setup
              </Button>
            ) : null}
          </div>
        ) : null}
        <DialogFooter className="justify-between">
          <TemplateManager template={template} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>Close</Button>
            <Button
              disabled={useAvailability?.disabled}
              aria-describedby={
                useAvailability?.disabled
                  ? "template-use-unavailable"
                  : undefined
              }
              onClick={() => {
                setSubmitError(null);
                setListName(template.name);
                setCreating(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" />Use template
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TemplatePreviewer(props: TemplatePreviewerProps) {
  if (!props.template) {
    if (!props.loading || !props.summary) return null;
    return (
      <Dialog
        open={props.isOpen}
        onOpenChange={(open) => !open && props.onClose()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{props.summary.name}</DialogTitle>
            <DialogDescription>{props.summary.description}</DialogDescription>
          </DialogHeader>
          <p role="status" className="py-8 text-center text-muted-foreground">
            Loading template details…
          </p>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <TemplatePreviewerContent
      key={props.template._id}
      isOpen={props.isOpen}
      onClose={props.onClose}
      onUse={props.onUse}
      template={props.template}
      useAvailability={props.useAvailability}
    />
  );
}
