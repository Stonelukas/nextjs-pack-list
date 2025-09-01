"use client"

import { useState } from "react";
import { usePackListStore } from "@/store/usePackListStore";
import { useAuth } from "@/contexts/auth-context";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileText, Package } from "lucide-react";
import { toast } from "sonner";

interface CreateListFormProps {
  onSuccess?: (listId: string) => void;
  trigger?: React.ReactNode;
}

export function CreateListForm({ onSuccess, trigger }: CreateListFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createFrom, setCreateFrom] = useState<"scratch" | "template">("scratch");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  const { createList, templates, applyTemplate } = usePackListStore();
  const { user } = useAuth();
  const { trackListCreated, trackTemplateUsed } = useAnalytics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter a list name");
      return;
    }

    setIsCreating(true);

    try {
      let listId: string;
      
      if (createFrom === "template" && selectedTemplateId) {
        // Create list from template
        listId = applyTemplate(selectedTemplateId, name.trim());
        const template = templates.find(t => t.id === selectedTemplateId);

        // Track template usage
        if (template) {
          trackTemplateUsed(
            template.name,
            template.categories?.length || 0,
            template.categories?.reduce((total, cat) => total + (cat.items?.length || 0), 0) || 0
          );
        }
        trackListCreated('template', template?.name);
        toast.success("List created from template!");
      } else {
        // Create list from scratch
        listId = createList({
          name: name.trim(),
          description: description.trim(),
          categories: [],
          tags: [],
          isTemplate: false,
          userId: user?.id || "anonymous"
        });
        trackListCreated('custom');
        toast.success("List created successfully!");
      }

      // Reset form
      setName("");
      setDescription("");
      setCreateFrom("scratch");
      setSelectedTemplateId("");
      setOpen(false);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(listId);
      }
    } catch (error) {
      toast.error("Failed to create list");
      console.error("Error creating list:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setName("");
    setDescription("");
    setCreateFrom("scratch");
    setSelectedTemplateId("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create New List
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Packing List</DialogTitle>
            <DialogDescription>
              Start a new packing list from scratch or use a template to get started quickly.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Create From Selection */}
            <div className="grid gap-2">
              <Label>Start from</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={createFrom === "scratch" ? "default" : "outline"}
                  className="justify-start gap-2"
                  onClick={() => setCreateFrom("scratch")}
                >
                  <Package className="h-4 w-4" />
                  Scratch
                </Button>
                <Button
                  type="button"
                  variant={createFrom === "template" ? "default" : "outline"}
                  className="justify-start gap-2"
                  onClick={() => setCreateFrom("template")}
                  disabled={templates.length === 0}
                >
                  <FileText className="h-4 w-4" />
                  Template
                </Button>
              </div>
            </div>

            {/* Template Selection */}
            {createFrom === "template" && templates.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="template">Choose Template</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          {template.description && (
                            <div className="text-sm text-muted-foreground">{template.description}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* List Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">List Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Weekend Beach Trip"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any notes or details about this packing list..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !name.trim()}>
              {isCreating ? "Creating..." : "Create List"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}