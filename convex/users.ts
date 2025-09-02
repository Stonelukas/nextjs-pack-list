import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get or create user based on Clerk ID
export const getOrCreateUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      // Update user info if changed
      if (
        existingUser.name !== args.name ||
        existingUser.email !== args.email ||
        existingUser.imageUrl !== args.imageUrl
      ) {
        await ctx.db.patch(existingUser._id, {
          name: args.name,
          email: args.email,
          imageUrl: args.imageUrl,
          updatedAt: Date.now(),
        });
      }
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
      preferences: {
        theme: "system",
        defaultPriority: "medium",
        autoSave: true,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return userId;
  },
});

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    return user;
  },
});

// Update user preferences
export const updateUserPreferences = mutation({
  args: {
    clerkId: v.string(),
    preferences: v.object({
      theme: v.string(),
      defaultPriority: v.string(),
      autoSave: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      preferences: args.preferences,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

// Admin function to get all users with pagination
export const getAllUsers = query({
  args: {
    paginationOpts: v.optional(v.object({
      numItems: v.number(),
      cursor: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // TODO: Add admin role check here
    const { paginationOpts } = args;

    if (paginationOpts) {
      return await ctx.db
        .query("users")
        .order("desc")
        .paginate(paginationOpts);
    } else {
      const users = await ctx.db
        .query("users")
        .order("desc")
        .collect();
      return { page: users, isDone: true, continueCursor: null };
    }
  },
});

// Admin function to get user statistics
export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    // TODO: Add admin role check here
    const users = await ctx.db.query("users").collect();
    const lists = await ctx.db.query("lists").collect();

    const totalUsers = users.length;
    const activeUsers = users.filter(user => {
      // Consider users active if they have lists or logged in recently
      const userLists = lists.filter(list => list.userId === user._id);
      return userLists.length > 0;
    }).length;

    const newUsersThisMonth = users.filter(user => {
      const monthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      return user.createdAt && user.createdAt > monthAgo;
    }).length;

    return {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      inactiveUsers: totalUsers - activeUsers,
    };
  },
});

// Admin function to search users
export const searchUsers = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // TODO: Add admin role check here
    const { searchTerm, limit = 50 } = args;

    const users = await ctx.db.query("users").collect();

    const filteredUsers = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    ).slice(0, limit);

    return filteredUsers;
  },
});

// Admin function to get user details with related data
export const getUserDetails = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // TODO: Add admin role check here
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // Get user's lists
    const lists = await ctx.db
      .query("lists")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Calculate user activity stats
    const totalLists = lists.length;
    const completedLists = lists.filter(list => list.completedAt).length;
    const templateLists = lists.filter(list => list.isTemplate).length;

    return {
      user,
      stats: {
        totalLists,
        completedLists,
        templateLists,
        activeLists: totalLists - completedLists,
      },
      recentLists: lists
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .slice(0, 5),
    };
  },
});

// Admin function to update user information
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    updates: v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      preferences: v.optional(v.object({
        theme: v.string(),
        defaultPriority: v.string(),
        autoSave: v.boolean(),
      })),
    }),
  },
  handler: async (ctx, args) => {
    // TODO: Add admin role check here
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    await ctx.db.patch(args.userId, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    return args.userId;
  },
});

// Admin function to delete user (soft delete by marking as deleted)
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // TODO: Add admin role check here
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // Instead of hard delete, we could mark as deleted
    // For now, we'll do a hard delete but in production you might want soft delete
    await ctx.db.delete(args.userId);

    // Also delete user's lists (or transfer them)
    const userLists = await ctx.db
      .query("lists")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const list of userLists) {
      await ctx.db.delete(list._id);
    }

    return { success: true };
  },
});

// Admin function to get user activity timeline
export const getUserActivity = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // TODO: Add admin role check here
    const { userId, limit = 20 } = args;

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // Get user's lists with timestamps
    const lists = await ctx.db
      .query("lists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Create activity timeline
    const activities = [];

    // Add list creation activities
    for (const list of lists) {
      if (list.createdAt) {
        activities.push({
          type: "list_created",
          timestamp: list.createdAt,
          data: { listName: list.name, listId: list._id },
        });
      }

      if (list.completedAt) {
        activities.push({
          type: "list_completed",
          timestamp: list.completedAt,
          data: { listName: list.name, listId: list._id },
        });
      }
    }

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },
});

// Webhook functions for Clerk integration
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
      role: "user", // Default role
      preferences: {
        theme: "system",
        defaultPriority: "medium",
        autoSave: true,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return userId;
  },
});

export const updateUserFromWebhook = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      // If user doesn't exist, create them
      return await ctx.db.insert("users", {
        clerkId: args.clerkId,
        name: args.name,
        email: args.email,
        imageUrl: args.imageUrl,
        role: "user",
        preferences: {
          theme: "system",
          defaultPriority: "medium",
          autoSave: true,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Update existing user
    await ctx.db.patch(user._id, {
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

export const deleteUserFromWebhook = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (user) {
      await ctx.db.delete(user._id);
    }

    return { success: true };
  },
});