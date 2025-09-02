import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all lists for a user by Clerk ID
export const getUserLists = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!user) {
      return [];
    }
    
    const lists = await ctx.db
      .query("lists")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    // For each list, get its categories and items
    const listsWithCategories = await Promise.all(
      lists.map(async (list) => {
        const categories = await ctx.db
          .query("categories")
          .withIndex("by_list", (q) => q.eq("listId", list._id))
          .collect();
        
        // For each category, get its items
        const categoriesWithItems = await Promise.all(
          categories.map(async (category) => {
            const items = await ctx.db
              .query("items")
              .withIndex("by_category", (q) => q.eq("categoryId", category._id))
              .collect();
            
            return { ...category, items };
          })
        );
        
        return { ...list, categories: categoriesWithItems };
      })
    );
    
    return listsWithCategories;
  },
});

export const getList = query({
  args: {
    listId: v.id("lists"),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) return null;
    
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();
    
    const categoriesWithItems = await Promise.all(
      categories.map(async (category) => {
        const items = await ctx.db
          .query("items")
          .withIndex("by_category", (q) => q.eq("categoryId", category._id))
          .collect();
        
        return { ...category, items };
      })
    );
    
    return { ...list, categories: categoriesWithItems };
  },
});

export const createList = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    isTemplate: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Get user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    const now = Date.now();
    return await ctx.db.insert("lists", {
      userId: user._id,
      name: args.name,
      description: args.description,
      isTemplate: args.isTemplate ?? false,
      isPublic: args.isPublic ?? false,
      tags: args.tags,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateList = mutation({
  args: {
    clerkId: v.string(),
    listId: v.id("lists"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify user owns the list
    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error("List not found");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!user || list.userId !== user._id) {
      throw new Error("Unauthorized");
    }
    
    const { listId, clerkId, ...updates } = args;
    await ctx.db.patch(listId, {
      ...updates,
      updatedAt: Date.now(),
    });
    return listId;
  },
});

export const deleteList = mutation({
  args: {
    clerkId: v.string(),
    listId: v.id("lists"),
  },
  handler: async (ctx, args) => {
    // Verify user owns the list
    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error("List not found");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!user || list.userId !== user._id) {
      throw new Error("Unauthorized");
    }
    
    // Delete all items in categories of this list
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();
    
    for (const category of categories) {
      const items = await ctx.db
        .query("items")
        .withIndex("by_category", (q) => q.eq("categoryId", category._id))
        .collect();
      
      for (const item of items) {
        await ctx.db.delete(item._id);
      }
      
      await ctx.db.delete(category._id);
    }
    
    // Delete the list itself
    await ctx.db.delete(args.listId);
  },
});

// Category operations
export const addCategory = mutation({
  args: {
    listId: v.id("lists"),
    name: v.string(),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get the highest order number for existing categories
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();
    
    const maxOrder = categories.reduce((max, cat) => Math.max(max, cat.order || 0), -1);
    
    return await ctx.db.insert("categories", {
      listId: args.listId,
      name: args.name,
      color: args.color,
      icon: args.icon,
      order: args.order ?? maxOrder + 1,
      collapsed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Item operations
export const addItem = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.string(),
    quantity: v.number(),
    packed: v.optional(v.boolean()),
    priority: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("items", {
      categoryId: args.categoryId,
      name: args.name,
      quantity: args.quantity,
      packed: args.packed ?? false,
      priority: args.priority,
      notes: args.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const toggleItemPacked = mutation({
  args: {
    itemId: v.id("items"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");
    
    await ctx.db.patch(args.itemId, {
      packed: !item.packed,
      updatedAt: Date.now(),
    });
  },
});