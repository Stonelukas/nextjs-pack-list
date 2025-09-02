"use client"

import { useState, useCallback, useMemo } from "react";
import { Template } from "@/types";
import { useConvexStore } from "@/hooks/use-convex-store";
import { defaultTemplates } from "@/data/default-templates";
import { debounce } from "@/lib/performance";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit2, Trash2, Copy, Shield, Globe } from "lucide-react";
import { toast } from "sonner";

interface TemplateManagerProps {
  template: Template;
  onClose?: () => void;
}

export function TemplateManager({ template, onClose }: TemplateManagerProps) {
  const { templates, updateTemplate, deleteTemplate } = useConvexStore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: template.name,
    description: template.description,
    icon: template.icon || "📦",
    duration: template.duration || "",
    difficulty: template.difficulty || "beginner",
    season: template.season || "all",
    isPublic: template.isPublic,
    tags: template.tags.join(", "),
  });
  
  // Check if template is a default template - memoized for performance
  const isDefaultTemplate = useMemo(() => 
    defaultTemplates.some(t => t.id === template.id),
    [template.id]
  );
  
  const isUserTemplate = useMemo(() => 
    templates.some(t => t.id === template.id),
    [template.id, templates]
  );
  
  // Debounced form change handler for better performance
  const debouncedFormChange = useCallback(
    debounce((field: keyof typeof editForm, value: string | boolean) => {
      setEditForm(prev => ({ ...prev, [field]: value }));
    }, 300),
    []
  );
  
  const handleEdit = useCallback(() => {
    if (isDefaultTemplate) {
      toast.error("Default templates cannot be edited");
      return;
    }
    
    updateTemplate(template.id, {
      name: editForm.name,
      description: editForm.description,
      icon: editForm.icon,
      duration: editForm.duration,
      difficulty: editForm.difficulty as Template["difficulty"],
      season: editForm.season as Template["season"],
      isPublic: editForm.isPublic,
      tags: editForm.tags.split(",").map(tag => tag.trim()).filter(Boolean),
      updatedAt: new Date(),
    });
    
    toast.success("Template updated successfully");
    setIsEditDialogOpen(false);
  }, [template.id, editForm, isDefaultTemplate, updateTemplate]);
  
  const handleDelete = useCallback(() => {
    if (isDefaultTemplate) {
      toast.error("Default templates cannot be deleted");
      return;
    }
    
    deleteTemplate(template.id);
    toast.success("Template deleted successfully");
    setIsDeleteDialogOpen(false);
    onClose?.();
  }, [template.id, isDefaultTemplate, deleteTemplate, onClose]);
  
  const handleDuplicate = useCallback((newName: string) => {
    const duplicatedTemplate: Template = {
      ...template,
      id: crypto.randomUUID(),
      name: newName,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      isPublic: false,
    };
    
    // Add to user templates
    const store = useConvexStore.getState();
    store.templates.push(duplicatedTemplate);
    
    toast.success(`Template "${newName}" created successfully`);
    setIsDuplicateDialogOpen(false);
  }, [template]);
  
  return (
    <>
      {/* Management Actions */}
      <div className="flex items-center gap-2">
        {isUserTemplate && !isDefaultTemplate && (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditDialogOpen(true)}
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsDuplicateDialogOpen(true)}
          className="gap-2"
        >
          <Copy className="h-4 w-4" />
          Duplicate
        </Button>
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Modify your template details and settings
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Template Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Describe what this template is for"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-icon">Icon</Label>
                  <Input
                    id="edit-icon"
                    value={editForm.icon}
                    onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                    placeholder="📦"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-duration">Duration</Label>
                  <Input
                    id="edit-duration"
                    value={editForm.duration}
                    onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                    placeholder="e.g., 3-5 days"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-difficulty">Difficulty</Label>
                  <Select
                    value={editForm.difficulty}
                    onValueChange={(value) => setEditForm({ ...editForm, difficulty: value })}
                  >
                    <SelectTrigger id="edit-difficulty">
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
                  <Label htmlFor="edit-season">Season</Label>
                  <Select
                    value={editForm.season}
                    onValueChange={(value) => setEditForm({ ...editForm, season: value })}
                  >
                    <SelectTrigger id="edit-season">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Seasons</SelectItem>
                      <SelectItem value="spring">Spring</SelectItem>
                      <SelectItem value="summer">Summer</SelectItem>
                      <SelectItem value="fall">Fall</SelectItem>
                      <SelectItem value="winter">Winter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                <Input
                  id="edit-tags"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  placeholder="travel, vacation, essentials"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-public"
                    checked={editForm.isPublic}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, isPublic: checked })}
                  />
                  <Label htmlFor="edit-public" className="flex items-center gap-2 cursor-pointer">
                    {editForm.isPublic ? (
                      <>
                        <Globe className="h-4 w-4" />
                        Public Template
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        Private Template
                      </>
                    )}
                  </Label>
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{template.name}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Duplicate Dialog */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Template</DialogTitle>
            <DialogDescription>
              Create a copy of &ldquo;{template.name}&rdquo; that you can customize
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duplicate-name">New Template Name</Label>
              <Input
                id="duplicate-name"
                defaultValue={`${template.name} (Copy)`}
                placeholder="Enter a name for the duplicated template"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const input = e.target as HTMLInputElement;
                    handleDuplicate(input.value);
                  }
                }}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDuplicateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              const input = document.getElementById("duplicate-name") as HTMLInputElement;
              handleDuplicate(input.value);
            }}>
              Create Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}