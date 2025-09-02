"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useConvexStore } from "@/hooks/use-convex-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { toast } from "sonner";

export default function EditListPage() {
  const router = useRouter();
  const params = useParams();
  const listId = params.id as string;
  
  const { lists, updateList } = useConvexStore();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const list = lists.find(l => l._id === listId);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tags: [] as string[],
    tagInput: "",
  });

  useEffect(() => {
    if (list) {
      setFormData({
        name: list.name,
        description: list.description || "",
        tags: list.tags || [],
        tagInput: "",
      });
    }
  }, [list]);

  if (!list) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">List not found</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => router.push("/lists")}>
                Back to Lists
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("List name is required");
      return;
    }

    setIsUpdating(true);
    try {
      await updateList(listId, {
        name: formData.name,
        description: formData.description,
        tags: formData.tags,
      });
      
      toast.success("List updated successfully");
      router.push(`/lists/${listId}`);
    } catch (error) {
      console.error("Failed to update list:", error);
      toast.error("Failed to update list");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: "",
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target === document.getElementById("tag-input")) {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Edit List</h1>
        <p className="text-muted-foreground">
          Update the details of your packing list
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>List Details</CardTitle>
          <CardDescription>
            Modify the information for your packing list
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">List Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Weekend Beach Trip"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your trip or packing needs..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag-input">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tag-input"
                  placeholder="Add a tag and press Enter"
                  value={formData.tagInput}
                  onChange={(e) => setFormData(prev => ({ ...prev, tagInput: e.target.value }))}
                  onKeyPress={handleKeyPress}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isUpdating}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? "Updating..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/lists/${listId}`)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}