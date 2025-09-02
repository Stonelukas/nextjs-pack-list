import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(), // Clerk user ID
    name: v.string(),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    tokenIdentifier: v.optional(v.string()), // For Convex auth
    preferences: v.optional(v.object({
      theme: v.string(),
      defaultPriority: v.string(),
      autoSave: v.boolean(),
    })),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"]),
  
  lists: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    isTemplate: v.boolean(),
    isPublic: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    completedAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_template", ["isTemplate"])
    .index("by_public", ["isPublic"])
    .index("by_completed", ["completedAt"]),
  
  categories: defineTable({
    listId: v.id("lists"),
    name: v.string(),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.number(),
    collapsed: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_list", ["listId"])
    .index("by_list_order", ["listId", "order"]),
  
  items: defineTable({
    categoryId: v.id("categories"),
    name: v.string(),
    quantity: v.number(),
    packed: v.boolean(),
    priority: v.string(),
    notes: v.optional(v.string()),
    description: v.optional(v.string()),
    weight: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_category", ["categoryId"])
    .index("by_packed", ["packed"])
    .index("by_priority", ["priority"])
    .index("by_category_order", ["categoryId", "order"]),
  
  templates: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    season: v.optional(v.string()),
    duration: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isPublic: v.optional(v.boolean()),
    isOfficial: v.optional(v.boolean()),
    createdBy: v.optional(v.id("users")),
    usageCount: v.optional(v.number()),
    rating: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_category", ["category"])
    .index("by_public", ["isPublic"])
    .index("by_creator", ["createdBy"])
    .index("by_official", ["isOfficial"])
    .index("by_usage", ["usageCount"])
    .index("by_rating", ["rating"]),
  
  templateItems: defineTable({
    templateId: v.id("templates"),
    categoryName: v.string(),
    name: v.string(),
    quantity: v.number(),
    priority: v.string(),
    notes: v.optional(v.string()),
    order: v.optional(v.number()),
  })
    .index("by_template", ["templateId"])
    .index("by_template_category", ["templateId", "categoryName"]),
  
  listShares: defineTable({
    listId: v.id("lists"),
    sharedByUserId: v.id("users"),
    sharedWithUserId: v.id("users"),
    permission: v.string(),
    createdAt: v.optional(v.number()),
  })
    .index("by_list", ["listId"])
    .index("by_shared_with", ["sharedWithUserId"])
    .index("by_shared_by", ["sharedByUserId"]),
  
  userPreferences: defineTable({
    userId: v.id("users"),
    key: v.optional(v.string()),
    value: v.optional(v.any()),
    // Direct preference fields (for existing data)
    defaultView: v.optional(v.string()),
    language: v.optional(v.string()),
    theme: v.optional(v.string()),
    units: v.optional(v.string()),
    notifications: v.optional(v.object({
      email: v.boolean(),
      push: v.boolean(),
      reminders: v.boolean(),
    })),
  })
    .index("by_user", ["userId"]),
});