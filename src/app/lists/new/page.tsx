"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexStore } from "@/hooks/use-convex-store";
import { useRoleBasedAccess } from "@/hooks/use-role-based-navigation";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Lock, LogIn } from "lucide-react";
import { toast } from "sonner";

export default function NewListPage() {
  const router = useRouter();
  const { createList } = useConvexStore();
  const { hasPermission } = useRoleBasedAccess();
  const { isSignedIn, isLoaded } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  // Check if user has permission to create lists
  const canCreateLists = hasPermission("create_lists");

  useEffect(() => {
    if (isLoaded && !canCreateLists) {
      // Don't redirect immediately, show access denied message instead
    }
  }, [isLoaded, canCreateLists]);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tags: [] as string[],
    tagInput: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("List name is required");
      return;
    }

    setIsCreating(true);
    try {
      const listId = await createList(
        formData.name,
        formData.description,
        formData.tags
      );
      
      if (listId) {
        toast.success("List created successfully");
        router.push(`/lists/${listId}`);
      }
    } catch (error) {
      console.error("Failed to create list:", error);
      toast.error("Failed to create list");
    } finally {
      setIsCreating(false);
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

  // Show loading state while auth is loading
  if (!isLoaded) {
    return (
      <div className="container mx-auto py-8 max-w-3xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Show access denied for users without permission
  if (!canCreateLists) {
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
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Access Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to sign in to create new packing lists.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => router.push("/sign-in?redirect=" + encodeURIComponent("/lists/new"))}
                className="w-full"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/lists")}
                className="w-full"
              >
                Go to Lists
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        
        <h1 className="text-3xl font-bold mb-2">Create New List</h1>
        <p className="text-muted-foreground">
          Create a new packing list for your next adventure
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>List Details</CardTitle>
          <CardDescription>
            Enter the basic information for your new packing list
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
                autoFocus
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
                disabled={isCreating}
                className="flex-1"
              >
                {isCreating ? "Creating..." : "Create List"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isCreating}
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