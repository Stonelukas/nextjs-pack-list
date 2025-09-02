import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all public templates
export const getPublicTemplates = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db
      .query("templates")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();
    
    // For each template, get its items
    const templatesWithItems = await Promise.all(
      templates.map(async (template) => {
        const items = await ctx.db
          .query("templateItems")
          .withIndex("by_template", (q) => q.eq("templateId", template._id))
          .collect();
        
        // Group items by category
        const categoriesMap = new Map<string, any[]>();
        items.forEach(item => {
          if (!categoriesMap.has(item.categoryName)) {
            categoriesMap.set(item.categoryName, []);
          }
          categoriesMap.get(item.categoryName)!.push({
            name: item.name,
            quantity: item.quantity,
            priority: item.priority,
            notes: item.notes,
          });
        });
        
        // Convert map to array of categories
        const categories = Array.from(categoriesMap.entries()).map(([name, items], index) => ({
          name,
          color: getDefaultCategoryColor(index),
          icon: getDefaultCategoryIcon(name),
          order: index,
          items,
        }));
        
        return { ...template, categories };
      })
    );
    
    return templatesWithItems;
  },
});

// Create a template from a list
export const createTemplateFromList = mutation({
  args: {
    listId: v.id("lists"),
    name: v.string(),
    description: v.string(),
    category: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error("List not found");
    }
    
    // Get categories and items for the list
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();
    
    // Create the template
    const templateId = await ctx.db.insert("templates", {
      name: args.name,
      description: args.description,
      category: args.category || "custom",
      difficulty: "intermediate",
      season: "all",
      duration: "varies",
      tags: list.tags,
      isPublic: args.isPublic ?? false,
      isOfficial: false,
      createdBy: list.userId,
      usageCount: 0,
      rating: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Create template items for each category
    for (const category of categories) {
      const items = await ctx.db
        .query("items")
        .withIndex("by_category", (q) => q.eq("categoryId", category._id))
        .collect();
      
      for (const item of items) {
        await ctx.db.insert("templateItems", {
          templateId,
          categoryName: category.name,
          name: item.name,
          quantity: item.quantity,
          priority: item.priority,
          notes: item.notes,
          order: category.order,
        });
      }
    }
    
    return templateId;
  },
});

// Seed default templates (run once)
export const seedTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if templates already exist
    const existingTemplates = await ctx.db
      .query("templates")
      .withIndex("by_official", (q) => q.eq("isOfficial", true))
      .first();
    
    if (existingTemplates) {
      return { message: "Templates already seeded" };
    }
    
    // Default templates data
    const defaultTemplates = [
      {
        name: "Weekend Getaway",
        description: "Perfect for a 2-3 day trip to explore a new city or relax",
        category: "travel",
        difficulty: "beginner",
        season: "all",
        duration: "2-3 days",
        tags: ["travel", "weekend", "city"],
        items: [
          { category: "Clothing", items: [
            { name: "T-shirts", quantity: 3, priority: "high" },
            { name: "Jeans/Pants", quantity: 2, priority: "high" },
            { name: "Underwear", quantity: 3, priority: "essential" },
            { name: "Socks", quantity: 3, priority: "essential" },
            { name: "Comfortable walking shoes", quantity: 1, priority: "essential" },
          ]},
          { category: "Toiletries", items: [
            { name: "Toothbrush", quantity: 1, priority: "essential" },
            { name: "Toothpaste", quantity: 1, priority: "essential" },
            { name: "Shampoo", quantity: 1, priority: "high" },
            { name: "Deodorant", quantity: 1, priority: "high" },
          ]},
          { category: "Electronics", items: [
            { name: "Phone charger", quantity: 1, priority: "essential" },
            { name: "Power bank", quantity: 1, priority: "medium" },
            { name: "Headphones", quantity: 1, priority: "medium" },
          ]},
        ],
      },
      {
        name: "Business Trip",
        description: "Essential items for professional travel",
        category: "business",
        difficulty: "intermediate",
        season: "all",
        duration: "3-5 days",
        tags: ["business", "professional", "work"],
        items: [
          { category: "Professional Attire", items: [
            { name: "Business suits", quantity: 2, priority: "essential" },
            { name: "Dress shirts", quantity: 4, priority: "essential" },
            { name: "Ties", quantity: 3, priority: "high" },
            { name: "Dress shoes", quantity: 2, priority: "essential" },
            { name: "Belt", quantity: 1, priority: "high" },
          ]},
          { category: "Work Essentials", items: [
            { name: "Laptop", quantity: 1, priority: "essential" },
            { name: "Laptop charger", quantity: 1, priority: "essential" },
            { name: "Business cards", quantity: 50, priority: "high" },
            { name: "Notebook", quantity: 1, priority: "medium" },
            { name: "Pens", quantity: 3, priority: "medium" },
          ]},
          { category: "Documents", items: [
            { name: "ID/Passport", quantity: 1, priority: "essential" },
            { name: "Travel itinerary", quantity: 1, priority: "essential" },
            { name: "Hotel confirmation", quantity: 1, priority: "essential" },
          ]},
        ],
      },
      {
        name: "Beach Vacation",
        description: "Everything you need for a perfect beach holiday",
        category: "travel",
        difficulty: "beginner",
        season: "summer",
        duration: "1 week",
        tags: ["beach", "summer", "vacation"],
        items: [
          { category: "Beach Wear", items: [
            { name: "Swimsuits", quantity: 2, priority: "essential" },
            { name: "Beach towel", quantity: 1, priority: "essential" },
            { name: "Sunglasses", quantity: 1, priority: "high" },
            { name: "Sun hat", quantity: 1, priority: "high" },
            { name: "Flip flops", quantity: 1, priority: "high" },
          ]},
          { category: "Sun Protection", items: [
            { name: "Sunscreen SPF 50+", quantity: 2, priority: "essential" },
            { name: "After-sun lotion", quantity: 1, priority: "high" },
            { name: "Lip balm with SPF", quantity: 1, priority: "medium" },
          ]},
          { category: "Beach Activities", items: [
            { name: "Snorkel gear", quantity: 1, priority: "low" },
            { name: "Beach games", quantity: 2, priority: "low" },
            { name: "Waterproof phone case", quantity: 1, priority: "medium" },
            { name: "Beach bag", quantity: 1, priority: "high" },
          ]},
        ],
      },
    ];
    
    // Insert templates
    for (const templateData of defaultTemplates) {
      const { items, ...templateInfo } = templateData;
      
      const templateId = await ctx.db.insert("templates", {
        ...templateInfo,
        isPublic: true,
        isOfficial: true,
        usageCount: 0,
        rating: 5,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      // Insert template items
      for (const categoryData of items) {
        for (const item of categoryData.items) {
          await ctx.db.insert("templateItems", {
            templateId,
            categoryName: categoryData.category,
            name: item.name,
            quantity: item.quantity,
            priority: item.priority,
            notes: item.notes,
            order: items.indexOf(categoryData),
          });
        }
      }
    }
    
    return { message: "Templates seeded successfully" };
  },
});

// Helper functions
function getDefaultCategoryColor(index: number): string {
  const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
  return colors[index % colors.length];
}

function getDefaultCategoryIcon(categoryName: string): string {
  const iconMap: Record<string, string> = {
    "Clothing": "👕",
    "Toiletries": "🧴",
    "Electronics": "📱",
    "Professional Attire": "👔",
    "Work Essentials": "💼",
    "Documents": "📄",
    "Beach Wear": "👙",
    "Sun Protection": "☀️",
    "Beach Activities": "🏖️",
  };
  return iconMap[categoryName] || "📦";
}