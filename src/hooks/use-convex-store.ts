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
  const markListCompletedMutation = useMutation(api.lists.markListCompleted);
  const markListIncompleteMutation = useMutation(api.lists.markListIncomplete);
  const addCategoryMutation = useMutation(api.lists.addCategory);
  const addItemMutation = useMutation(api.lists.addItem);
  const toggleItemPackedMutation = useMutation(api.lists.toggleItemPacked);

  // Template mutations
  const applyTemplateMutation = useMutation(api.templates.applyTemplate);
  const saveAsTemplateMutation = useMutation(api.templates.createTemplateFromList);
  const duplicateListMutation = useMutation(api.lists.duplicateList);

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

  // Item management mutations
  const updateItemMutation = useMutation(api.lists.updateItem);
  const updateItem = useCallback(
    async (listId: string, categoryId: string, itemId: string, updates: any) => {
      try {
        await updateItemMutation({
          itemId: itemId as any,
          ...updates
        });
        toast.success("Item updated successfully");
      } catch (error) {
        console.error("Failed to update item:", error);
        toast.error("Failed to update item");
      }
    },
    [updateItemMutation]
  );

  const deleteItemMutation = useMutation(api.lists.deleteItem);
  const deleteItem = useCallback(
    async (listId: string, categoryId: string, itemId: string) => {
      try {
        await deleteItemMutation({
          itemId: itemId as any
        });
        toast.success("Item deleted successfully");
      } catch (error) {
        console.error("Failed to delete item:", error);
        toast.error("Failed to delete item");
      }
    },
    [deleteItemMutation]
  );

  const updateCategoryMutation = useMutation(api.lists.updateCategory);
  const updateCategory = useCallback(
    async (listId: string, categoryId: string, updates: any) => {
      try {
        await updateCategoryMutation({
          categoryId: categoryId as any,
          ...updates
        });
        toast.success("Category updated successfully");
      } catch (error) {
        console.error("Failed to update category:", error);
        toast.error("Failed to update category");
      }
    },
    [updateCategoryMutation]
  );

  const deleteCategoryMutation = useMutation(api.lists.deleteCategory);
  const deleteCategory = useCallback(
    async (listId: string, categoryId: string) => {
      try {
        await deleteCategoryMutation({
          categoryId: categoryId as any
        });
        toast.success("Category deleted successfully");
      } catch (error) {
        console.error("Failed to delete category:", error);
        toast.error("Failed to delete category");
      }
    },
    [deleteCategoryMutation]
  );

  const toggleCategoryCollapseMutation = useMutation(api.lists.toggleCategoryCollapse);
  const toggleCategoryCollapse = useCallback(
    async (listId: string, categoryId: string) => {
      try {
        await toggleCategoryCollapseMutation({
          categoryId: categoryId as any
        });
        // No toast for this as it's a frequent action
      } catch (error) {
        console.error("Failed to toggle category collapse:", error);
        toast.error("Failed to toggle category");
      }
    },
    [toggleCategoryCollapseMutation]
  );

  const reorderItemsMutation = useMutation(api.lists.reorderItems);
  const reorderItems = useCallback(
    async (listId: string, categoryId: string, itemIds: string[]) => {
      try {
        await reorderItemsMutation({
          categoryId: categoryId as any,
          itemIds: itemIds as any
        });
        // No toast for this as it's a frequent action during drag and drop
      } catch (error) {
        console.error("Failed to reorder items:", error);
        toast.error("Failed to reorder items");
      }
    },
    [reorderItemsMutation]
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
    updateCategory,
    deleteCategory,
    toggleCategoryCollapse,

    // Item operations
    addItem,
    updateItem,
    deleteItem,
    toggleItemPacked,
    reorderItems,

    // Template operations
    applyTemplate: async (templateId: string, listName: string) => {
      try {
        const newListId = await applyTemplateMutation({
          clerkId,
          templateId: templateId as any,
          listName,
        });
        toast.success(`Created "${listName}" from template`);
        return newListId;
      } catch (error) {
        console.error("Failed to apply template:", error);
        toast.error("Failed to create list from template");
        return null;
      }
    },
    saveAsTemplate: async (listId: string, name: string, description: string) => {
      try {
        const templateId = await saveAsTemplateMutation({
          listId: listId as any,
          name,
          description,
          isPublic: false,
        });
        toast.success(`Template "${name}" saved successfully`);
        return templateId;
      } catch (error) {
        console.error("Failed to save template:", error);
        toast.error("Failed to save template");
        return null;
      }
    },
    duplicateList: async (listId: string) => {
      try {
        const newListId = await duplicateListMutation({
          clerkId,
          listId: listId as any,
        });
        toast.success("List duplicated successfully");
        return newListId;
      } catch (error) {
        console.error("Failed to duplicate list:", error);
        toast.error("Failed to duplicate list");
        return null;
      }
    },
    markListCompleted: async (listId: string) => {
      try {
        await markListCompletedMutation({
          clerkId,
          listId: listId as any,
        });
        toast.success("List marked as completed");
        return true;
      } catch (error) {
        console.error("Failed to mark list as completed:", error);
        toast.error("Failed to mark list as completed");
        return false;
      }
    },
    markListIncomplete: async (listId: string) => {
      try {
        await markListIncompleteMutation({
          clerkId,
          listId: listId as any,
        });
        toast.success("List marked as incomplete");
        return true;
      } catch (error) {
        console.error("Failed to mark list as incomplete:", error);
        toast.error("Failed to mark list as incomplete");
        return false;
      }
    },

    // Utility
    getListProgress,
  };
}