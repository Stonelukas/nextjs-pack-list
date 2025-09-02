import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const store = mutation({
  args: {
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();
    
    if (existing) {
      return existing._id;
    }
    
    return await ctx.db.insert("users", {
      tokenIdentifier: args.tokenIdentifier,
      name: args.name || "Anonymous User",
      email: args.email,
      preferences: {
        theme: "system",
        defaultPriority: "medium",
        autoSave: true,
      },
    });
  },
});

export const getCurrentUser = query({
  args: {
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();
  },
});

export const updateUserPreferences = mutation({
  args: {
    tokenIdentifier: v.string(),
    preferences: v.object({
      theme: v.string(),
      defaultPriority: v.string(),
      autoSave: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    await ctx.db.patch(user._id, {
      preferences: args.preferences,
    });
    
    return user._id;
  },
});