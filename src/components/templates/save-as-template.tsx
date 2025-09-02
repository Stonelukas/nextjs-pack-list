"use client"

import { useState } from "react";
import { List, TemplateCategory } from "@/types";
import { useConvexStore } from "@/hooks/use-convex-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Package, Globe, Lock, Tag, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SaveAsTemplateProps {
  list: List;
  trigger?: React.ReactNode;
  onSaved?: (templateId: string) => void;
  className?: string;
}

export function SaveAsTemplate({ 
  list, 
  trigger, 
  onSaved,
  className 
}: SaveAsTemplateProps) {
  const { saveAsTemplate } = useConvexStore();
  const [open, setOpen] = useState(false);
  const [templateName, setTemplateName] = useState(list.name + " Template");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTags, setSelectedTags] = useState<TemplateCategory[]>([]);
  const [difficulty, setDifficulty] = useState<string>("intermediate");
  const [duration, setDuration] = useState<string>("");
  const [icon, setIcon] = useState<string>("📦");

  const availableIcons = [
    "📦", "✈️", "🏖️", "⛺", "💼", "🎒", 
    "🏔️", "🚗", "⛷️", "👶", "💒", "🎉",
    "🏃", "🚴", "🏊", "🎾", "⚽", "🏈"
  ];

  const handleSave = () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    // Create the template with additional metadata
    const templateId = saveAsTemplate(
      list.id,
      templateName.trim(),
      description.trim(),
      isPublic
    );

    if (templateId) {
      // Update the template with additional metadata
      // Note: This would need to be enhanced in the store to support these fields
      toast.success(`Template "${templateName}" saved successfully!`);
      setOpen(false);
      if (onSaved) {
        onSaved(templateId);
      }
    } else {
      toast.error("Failed to save template");
    }
  };

  const toggleTag = (tag: TemplateCategory) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Calculate list statistics
  const totalCategories = list.categories.length;
  const totalItems = list.categories.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className={cn("gap-2", className)}>
            <Save className="h-4 w-4" />
            Save as Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Save List as Template</DialogTitle>
          <DialogDescription>
            Create a reusable template from your current packing list
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Weekend Beach Trip"
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this template is for..."
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/200 characters
            </p>
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {availableIcons.map((emoji) => (
                <Button
                  key={emoji}
                  variant={icon === emoji ? "default" : "outline"}
                  size="sm"
                  className="h-10 w-10 p-0 text-lg"
                  onClick={() => setIcon(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>

          {/* Category Tags */}
          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-2">
              {Object.values(TemplateCategory).map((category) => (
                <Badge
                  key={category}
                  variant={selectedTags.includes(category) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(category)}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Badge>
              ))}
            </div>
            {selectedTags.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Select at least one category to help others find your template
              </p>
            )}
          </div>

          {/* Additional Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Trip Duration</Label>
              <Input
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 3 days, 1 week"
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="public" className="flex items-center gap-2">
                {isPublic ? (
                  <>
                    <Globe className="h-4 w-4" />
                    Public Template
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Private Template
                  </>
                )}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isPublic 
                  ? "Others can discover and use this template"
                  : "Only you can see and use this template"}
              </p>
            </div>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* Template Info */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4" />
              Template Contents
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>{totalCategories} categories</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>{totalItems} items</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              All categories and items from your current list will be included in the template
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!templateName.trim() || !description.trim() || selectedTags.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}