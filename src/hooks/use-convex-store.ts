"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

export function useConvexStore() {
  const { user } = useUser();
  const clerkId = user?.id;

  // Queries
  const lists = useQuery(api.lists.getUserLists, clerkId ? { clerkId } : "skip") || [];
  const convexUser = useQuery(api.users.getUserByClerkId, clerkId ? { clerkId } : "skip");
  const templates = useQuery(api.templates.getPublicTemplates) || [];

  // Mutations
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const createListMutation = useMutation(api.lists.createList);
  const updateListMutation = useMutation(api.lists.updateList);
  const deleteListMutation = useMutation(api.lists.deleteList);
  const addCategoryMutation = useMutation(api.lists.addCategory);
  const addItemMutation = useMutation(api.lists.addItem);
  const toggleItemPackedMutation = useMutation(api.lists.toggleItemPacked);

  // Ensure user exists in Convex
  useEffect(() => {
    if (user && !convexUser) {
      getOrCreateUser({
        clerkId: user.id,
        name: user.fullName || user.firstName || "User",
        email: user.primaryEmailAddress?.emailAddress || undefined,
        imageUrl: user.imageUrl || undefined,
      }).catch((error) => {
        console.error("Failed to create user in Convex:", error);
        toast.error("Failed to sync user data");
      });
    }
  }, [user, convexUser, getOrCreateUser]);

  // List operations
  const createList = useCallback(
    async (name: string, description?: string, tags?: string[]) => {
      if (!clerkId) {
        toast.error("Please sign in to create lists");
        return null;
      }

      try {
        const listId = await createListMutation({
          clerkId,
          name,
          description,
          tags,
        });
        toast.success("List created successfully");
        return listId;
      } catch (error) {
        console.error("Failed to create list:", error);
        toast.error("Failed to create list");
        return null;
      }
    },
    [clerkId, createListMutation]
  );

  const updateList = useCallback(
    async (
      listId: Id<"lists">,
      updates: { name?: string; description?: string; tags?: string[] }
    ) => {
      if (!clerkId) {
        toast.error("Please sign in to update lists");
        return;
      }

      try {
        await updateListMutation({
          clerkId,
          listId,
          ...updates,
        });
        toast.success("List updated successfully");
      } catch (error) {
        console.error("Failed to update list:", error);
        toast.error("Failed to update list");
      }
    },
    [clerkId, updateListMutation]
  );

  const deleteList = useCallback(
    async (listId: Id<"lists">) => {
      if (!clerkId) {
        toast.error("Please sign in to delete lists");
        return;
      }

      try {
        await deleteListMutation({
          clerkId,
          listId,
        });
        toast.success("List deleted successfully");
      } catch (error) {
        console.error("Failed to delete list:", error);
        toast.error("Failed to delete list");
      }
    },
    [clerkId, deleteListMutation]
  );

  // Category operations
  const addCategory = useCallback(
    async (
      listId: Id<"lists">,
      name: string,
      color?: string,
      icon?: string
    ) => {
      if (!clerkId) {
        toast.error("Please sign in to add categories");
        return null;
      }

      try {
        const categoryId = await addCategoryMutation({
          listId,
          name,
          color,
          icon,
        });
        toast.success("Category added successfully");
        return categoryId;
      } catch (error) {
        console.error("Failed to add category:", error);
        toast.error("Failed to add category");
        return null;
      }
    },
    [clerkId, addCategoryMutation]
  );

  // Item operations
  const addItem = useCallback(
    async (
      categoryId: Id<"categories">,
      name: string,
      quantity: number,
      priority: string,
      notes?: string
    ) => {
      if (!clerkId) {
        toast.error("Please sign in to add items");
        return null;
      }

      try {
        const itemId = await addItemMutation({
          categoryId,
          name,
          quantity,
          priority,
          notes,
        });
        toast.success("Item added successfully");
        return itemId;
      } catch (error) {
        console.error("Failed to add item:", error);
        toast.error("Failed to add item");
        return null;
      }
    },
    [clerkId, addItemMutation]
  );

  const toggleItemPacked = useCallback(
    async (itemId: Id<"items">) => {
      if (!clerkId) {
        toast.error("Please sign in to update items");
        return;
      }

      try {
        await toggleItemPackedMutation({
          itemId,
        });
      } catch (error) {
        console.error("Failed to toggle item:", error);
        toast.error("Failed to update item");
      }
    },
    [clerkId, toggleItemPackedMutation]
  );

  // Calculate list progress
  const getListProgress = useCallback(
    (listId: Id<"lists">) => {
      const list = lists.find((l) => l._id === listId);
      if (!list) {
        return {
          totalItems: 0,
          packedItems: 0,
          completionPercentage: 0,
        };
      }

      let totalItems = 0;
      let packedItems = 0;

      list.categories?.forEach((category) => {
        category.items?.forEach((item) => {
          totalItems++;
          if (item.packed) {
            packedItems++;
          }
        });
      });

      return {
        totalItems,
        packedItems,
        completionPercentage:
          totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0,
      };
    },
    [lists]
  );

  return {
    // Data
    lists,
    user: convexUser,
    isAuthenticated: !!user,
    isLoading: clerkId && !convexUser,
    templates, // Now fetching from Convex

    // List operations
    createList,
    updateList,
    deleteList,

    // Category operations
    addCategory,

    // Item operations
    addItem,
    toggleItemPacked,

    // Template operations (TODO: Implement these)
    applyTemplate: async (templateId: string, listName: string) => {
      toast.info("Template functionality coming soon");
      // For now, create a regular empty list
      const newListId = await createList(
        listName,
        "Created from template (template system coming soon)",
        ["from-template"]
      );
      return newListId;
    },
    saveAsTemplate: async (listId: string, name: string, description: string) => {
      toast.info("Template functionality coming soon");
      return null;
    },
    duplicateList: (listId: string) => {
      toast.info("Duplicate functionality coming soon");
      return null;
    },

    // Utility
    getListProgress,
  };
}