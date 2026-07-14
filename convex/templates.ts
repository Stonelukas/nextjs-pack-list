import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { requireCurrentUser } from "./lib/auth";
import { requireOwnedList } from "./lib/authorization";
import { domainError } from "./lib/errors";
import { OFFICIAL_TEMPLATES } from "./lib/official_templates";
import {
  adjustTemplateStats,
  replaceTemplateStats,
} from "./lib/template_stats";
import {
  MAX_TEMPLATE_CATEGORIES,
  MAX_TEMPLATE_ITEMS,
  MAX_TEMPLATE_ITEMS_PER_CATEGORY,
  TEMPLATE_SUMMARY_PAGE_LIMIT,
  validateNonnegativeInteger,
  validateNonnegativeWeight,
  validateOptionalText,
  validatePageSize,
  validatePositiveInteger,
  validatePriority,
  validatePublicTemplateQuota,
  validateRequiredName,
  validateTags,
  validateTemplateCounts,
} from "./lib/validation";

const TEMPLATE_EXPORT_PAGE_LIMIT = 5;

function compareOrder(
  left: { order?: number; _creationTime: number },
  right: { order?: number; _creationTime: number },
) {
  return (
    (left.order ?? 0) - (right.order ?? 0) ||
    left._creationTime - right._creationTime
  );
}

function templateSummary(template: Doc<"templates">, isOwned: boolean) {
  return {
    _id: template._id,
    _creationTime: template._creationTime,
    name: template.name,
    description: template.description,
    category: template.category,
    difficulty: template.difficulty,
    season: template.season,
    duration: template.duration,
    icon: template.icon,
    tags: template.tags,
    isPublic: template.isPublic,
    isOfficial: template.isOfficial,
    usageCount: template.usageCount,
    rating: template.rating,
    categoryCount: template.categoryCount,
    itemCount: template.itemCount,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    isOwned,
  };
}

function validateTemplateMetadata(template: {
  name: string;
  description: string;
  category?: string;
  duration?: string;
  icon?: string;
  tags?: string[];
}) {
  return {
    name: validateRequiredName(template.name, "Template name"),
    description:
      validateOptionalText(template.description, "Template description") ?? "",
    category: validateOptionalText(template.category, "Template category"),
    duration: validateOptionalText(template.duration, "Template duration"),
    icon: validateOptionalText(template.icon, "Template icon"),
    tags: validateTags(template.tags, "Template"),
  };
}

function templateItemOutput(item: Doc<"templateItems">) {
  return {
    name: validateRequiredName(item.name, "Template item name"),
    quantity: validatePositiveInteger(item.quantity, "Template item quantity"),
    packed: false,
    priority: validatePriority(item.priority, "Template item priority"),
    notes: validateOptionalText(item.notes, "Template item notes"),
    description: validateOptionalText(
      item.description,
      "Template item description",
    ),
    weight: validateNonnegativeWeight(item.weight, "Template item weight"),
    tags: validateTags(item.tags, "Template item") ?? [],
    order: validateNonnegativeInteger(
      item.order ?? 0,
      "Template item order",
    ),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

async function getTemplateCategories(
  ctx: QueryCtx | MutationCtx,
  templateId: Id<"templates">,
) {
  const [storedCategories, storedItems] = await Promise.all([
    ctx.db
      .query("templateCategories")
      .withIndex("by_template_order", (q) => q.eq("templateId", templateId))
      .take(MAX_TEMPLATE_CATEGORIES + 1),
    ctx.db
      .query("templateItems")
      .withIndex("by_template", (q) => q.eq("templateId", templateId))
      .take(MAX_TEMPLATE_ITEMS + 1),
  ]);
  const orderedItems = [...storedItems].sort(compareOrder);

  const categories = [] as Array<{
    name: string;
    color?: string;
    icon?: string;
    order: number;
    collapsed: boolean;
    createdAt?: number;
    updatedAt?: number;
    items: ReturnType<typeof templateItemOutput>[];
  }>;

  if (storedCategories.length > 0) {
    const categoryIds = new Set(storedCategories.map((category) => category._id));
    for (const category of [...storedCategories].sort(compareOrder)) {
      categories.push({
        name: validateRequiredName(category.name, "Template category name"),
        color: validateOptionalText(category.color, "Template category color"),
        icon: validateOptionalText(category.icon, "Template category icon"),
        order: validateNonnegativeInteger(
          category.order,
          "Template category order",
        ),
        collapsed: category.collapsed ?? false,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        items: orderedItems
          .filter((item) => item.templateCategoryId === category._id)
          .map(templateItemOutput),
      });
    }

    const legacyItems = orderedItems.filter(
      (item) =>
        item.templateCategoryId === undefined ||
        !categoryIds.has(item.templateCategoryId),
    );
    const legacyGroups = new Map<string, typeof legacyItems>();
    for (const item of legacyItems) {
      const group = legacyGroups.get(item.categoryName) ?? [];
      group.push(item);
      legacyGroups.set(item.categoryName, group);
    }
    for (const [legacyName, items] of legacyGroups) {
      const order = categories.length;
      const name = validateRequiredName(
        legacyName,
        "Template category name",
      );
      categories.push({
        name,
        color: getDefaultCategoryColor(order),
        icon: getDefaultCategoryIcon(name),
        order,
        collapsed: false,
        createdAt: undefined,
        updatedAt: undefined,
        items: items.map(templateItemOutput),
      });
    }
  } else {
    const categoriesMap = new Map<string, typeof orderedItems>();
    for (const item of orderedItems) {
      const group = categoriesMap.get(item.categoryName) ?? [];
      group.push(item);
      categoriesMap.set(item.categoryName, group);
    }
    for (const [legacyName, items] of categoriesMap) {
      const order = categories.length;
      const name = validateRequiredName(
        legacyName,
        "Template category name",
      );
      categories.push({
        name,
        color: getDefaultCategoryColor(order),
        icon: getDefaultCategoryIcon(name),
        order,
        collapsed: false,
        createdAt: undefined,
        updatedAt: undefined,
        items: items.map(templateItemOutput),
      });
    }
  }

  const counts = validateTemplateCounts(
    categories.map((category) => category.items.length),
  );
  return { categories, ...counts };
}

async function getAuthorizedTemplate(
  ctx: QueryCtx | MutationCtx,
  templateId: Id<"templates">,
  authenticatedUser?: Doc<"users">,
) {
  const identity = await ctx.auth.getUserIdentity();
  const user = identity
    ? (authenticatedUser ?? (await requireCurrentUser(ctx)))
    : null;
  const template = await ctx.db.get(templateId);
  if (!template || (template.isPublic !== true && !user)) {
    throw domainError("NOT_FOUND", "Template was not found");
  }
  const isOwned = user !== null && template.createdBy === user._id;
  if (template.isPublic !== true && !isOwned) {
    throw domainError("FORBIDDEN", "You cannot access this template");
  }
  return { template, isOwned };
}

async function getTemplateDetail(
  ctx: QueryCtx | MutationCtx,
  template: Doc<"templates">,
  isOwned: boolean,
) {
  const metadata = validateTemplateMetadata(template);
  const detail = await getTemplateCategories(ctx, template._id);
  return {
    ...templateSummary(template, isOwned),
    ...metadata,
    ...detail,
  };
}

export const getPublicTemplateSummaries = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    validatePageSize(
      args.paginationOpts.numItems,
      TEMPLATE_SUMMARY_PAGE_LIMIT,
      "Public template summary",
    );
    const result = await ctx.db
      .query("templates")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page.map((template) => templateSummary(template, false)),
    };
  },
});

export const getOwnedTemplateSummaries = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    validatePageSize(
      args.paginationOpts.numItems,
      TEMPLATE_SUMMARY_PAGE_LIMIT,
      "Owned template summary",
    );
    const result = await ctx.db
      .query("templates")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page.map((template) => templateSummary(template, true)),
    };
  },
});

export const getOwnedTemplateExportPage = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    validatePageSize(
      args.paginationOpts.numItems,
      TEMPLATE_EXPORT_PAGE_LIMIT,
      "Owned template export",
    );
    const result = await ctx.db
      .query("templates")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .order("asc")
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: await Promise.all(
        result.page.map((template) => getTemplateDetail(ctx, template, true)),
      ),
    };
  },
});

export const getTemplate = query({
  args: { templateId: v.id("templates") },
  handler: async (ctx, args) => {
    const { template, isOwned } = await getAuthorizedTemplate(
      ctx,
      args.templateId,
    );
    return getTemplateDetail(ctx, template, isOwned);
  },
});

export const applyTemplate = mutation({
  args: {
    templateId: v.id("templates"),
    listName: v.string(),
    listDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const listName = validateRequiredName(args.listName, "List name");
    const suppliedDescription = validateOptionalText(
      args.listDescription,
      "List description",
    );
    const { template, isOwned } = await getAuthorizedTemplate(
      ctx,
      args.templateId,
      user,
    );
    const detail = await getTemplateDetail(ctx, template, isOwned);
    const listDescription = validateOptionalText(
      suppliedDescription ?? `Created from template: ${detail.name}`,
      "List description",
    );

    const now = Date.now();
    const listId = await ctx.db.insert("lists", {
      userId: user._id,
      name: listName,
      description: listDescription,
      isTemplate: false,
      isPublic: false,
      tags: detail.tags,
      createdAt: now,
      updatedAt: now,
    });

    for (const category of detail.categories) {
      const categoryId = await ctx.db.insert("categories", {
        listId,
        name: category.name,
        color: category.color,
        icon: category.icon,
        order: category.order,
        collapsed: category.collapsed,
        createdAt: category.createdAt ?? now,
        updatedAt: category.updatedAt ?? now,
      });

      for (const item of category.items) {
        await ctx.db.insert("items", {
          categoryId,
          name: item.name,
          quantity: item.quantity,
          packed: false,
          priority: item.priority,
          notes: item.notes,
          description: item.description,
          weight: item.weight,
          tags: item.tags,
          order: item.order,
          createdAt: item.createdAt ?? now,
          updatedAt: item.updatedAt ?? now,
        });
      }
    }

    await ctx.db.patch(args.templateId, {
      usageCount: (template.usageCount ?? 0) + 1,
      updatedAt: now,
    });
    await adjustTemplateStats(ctx, { totalUsage: 1 });

    return listId;
  },
});

export const createTemplateFromList = mutation({
  args: {
    listId: v.id("lists"),
    name: v.string(),
    description: v.string(),
    category: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const list = await requireOwnedList(ctx, args.listId);
    const isPublic = args.isPublic ?? false;
    await validatePublicTemplateQuota(
      ctx,
      list.userId,
      isPublic ? 1 : 0,
    );
    const metadata = validateTemplateMetadata({
      name: args.name,
      description: args.description,
      category: args.category,
      tags: list.tags,
    });
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_list_order", (q) => q.eq("listId", args.listId))
      .take(MAX_TEMPLATE_CATEGORIES + 1);
    validateTemplateCounts(categories.map(() => 0));

    const preparedCategories = [] as Array<{
      name: string;
      color?: string;
      icon?: string;
      order: number;
      collapsed: boolean;
      createdAt?: number;
      updatedAt?: number;
      items: Array<{
        name: string;
        quantity: number;
        priority: ReturnType<typeof validatePriority>;
        notes?: string;
        description?: string;
        weight?: number;
        tags?: string[];
        order: number;
        createdAt?: number;
        updatedAt?: number;
      }>;
    }>;
    let totalItemCount = 0;
    for (const category of [...categories].sort(compareOrder)) {
      const remainingItemCapacity = MAX_TEMPLATE_ITEMS - totalItemCount;
      const itemReadLimit = Math.min(
        MAX_TEMPLATE_ITEMS_PER_CATEGORY + 1,
        remainingItemCapacity + 1,
      );
      const items = await ctx.db
        .query("items")
        .withIndex("by_category_order", (q) =>
          q.eq("categoryId", category._id),
        )
        .take(itemReadLimit);
      validateTemplateCounts([
        ...preparedCategories.map((entry) => entry.items.length),
        items.length,
      ]);
      totalItemCount += items.length;
      preparedCategories.push({
        name: validateRequiredName(category.name, "Template category name"),
        color: validateOptionalText(
          category.color,
          "Template category color",
        ),
        icon: validateOptionalText(category.icon, "Template category icon"),
        order: validateNonnegativeInteger(
          category.order,
          "Template category order",
        ),
        collapsed: category.collapsed ?? false,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        items: [...items].sort(compareOrder).map((item) => ({
          name: validateRequiredName(item.name, "Template item name"),
          quantity: validatePositiveInteger(
            item.quantity,
            "Template item quantity",
          ),
          priority: validatePriority(item.priority, "Template item priority"),
          notes: validateOptionalText(item.notes, "Template item notes"),
          description: validateOptionalText(
            item.description,
            "Template item description",
          ),
          weight: validateNonnegativeWeight(
            item.weight,
            "Template item weight",
          ),
          tags: validateTags(item.tags, "Template item"),
          order: validateNonnegativeInteger(
            item.order ?? 0,
            "Template item order",
          ),
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
      });
    }
    const counts = validateTemplateCounts(
      preparedCategories.map((category) => category.items.length),
    );

    const now = Date.now();
    const templateId = await ctx.db.insert("templates", {
      ...metadata,
      difficulty: "intermediate",
      season: "all",
      duration: "varies",
      isPublic,
      isOfficial: false,
      createdBy: list.userId,
      usageCount: 0,
      rating: 0,
      ...counts,
      createdAt: now,
      updatedAt: now,
    });
    await adjustTemplateStats(ctx, { totalTemplates: 1 });

    for (const category of preparedCategories) {
      const templateCategoryId = await ctx.db.insert("templateCategories", {
        templateId,
        name: category.name,
        color: category.color,
        icon: category.icon,
        order: category.order,
        collapsed: category.collapsed,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      });
      for (const item of category.items) {
        await ctx.db.insert("templateItems", {
          templateId,
          templateCategoryId,
          categoryName: category.name,
          ...item,
        });
      }
    }

    return templateId;
  },
});

const TEMPLATE_METADATA_MIGRATION_PAGE_SIZE = 5;

async function backfillTemplateMetadataPage(
  ctx: MutationCtx,
  cursor: string | null,
  resetStats: boolean,
) {
  if (resetStats) {
    await replaceTemplateStats(ctx, { totalTemplates: 0, totalUsage: 0 });
  }
  const page = await ctx.db
    .query("templates")
    .order("asc")
    .paginate({
      cursor,
      numItems: TEMPLATE_METADATA_MIGRATION_PAGE_SIZE,
    });
  let pageUsage = 0;
  for (const template of page.page) {
    const counts = await getTemplateCategories(ctx, template._id);
    await ctx.db.patch(template._id, {
      categoryCount: counts.categoryCount,
      itemCount: counts.itemCount,
    });
    pageUsage += template.usageCount ?? 0;
  }
  await adjustTemplateStats(ctx, {
    totalTemplates: page.page.length,
    totalUsage: pageUsage,
  });
  if (!page.isDone) {
    await ctx.scheduler.runAfter(
      0,
      internal.templates.backfillTemplateMetadata,
      { cursor: page.continueCursor, resetStats: false },
    );
  }
  return {
    complete: page.isDone,
    migrated: page.page.length,
    continueCursor: page.continueCursor,
  };
}

export const backfillTemplateMetadata = internalMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
    resetStats: v.optional(v.boolean()),
  },
  handler: (ctx, args) =>
    backfillTemplateMetadataPage(
      ctx,
      args.cursor,
      args.resetStats ?? args.cursor === null,
    ),
});

export const seedTemplates = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existingOfficialTemplates = await ctx.db
      .query("templates")
      .withIndex("by_official", (q) => q.eq("isOfficial", true))
      .collect();
    const existingNames = new Set(
      existingOfficialTemplates.map((template) => template.name),
    );
    const defaultTemplates = OFFICIAL_TEMPLATES;
    let inserted = 0;
    let skipped = 0;
    for (const templateData of defaultTemplates) {
      if (existingNames.has(templateData.name)) {
        skipped += 1;
        continue;
      }
      const metadata = validateTemplateMetadata(templateData);
      const counts = validateTemplateCounts(
        templateData.categories.map((category) => category.items.length),
      );
      const preparedCategories = templateData.categories.map(
        (categoryData) => ({
          name: validateRequiredName(
            categoryData.name,
            "Template category name",
          ),
          color: validateOptionalText(
            categoryData.color,
            "Template category color",
          ),
          icon: validateOptionalText(
            categoryData.icon,
            "Template category icon",
          ),
          order: validateNonnegativeInteger(
            categoryData.order,
            "Template category order",
          ),
          collapsed: categoryData.collapsed,
          items: categoryData.items.map((item, itemOrder) => ({
            name: validateRequiredName(item.name, "Template item name"),
            quantity: validatePositiveInteger(
              item.quantity,
              "Template item quantity",
            ),
            priority: validatePriority(item.priority, "Template item priority"),
            notes: validateOptionalText(item.notes, "Template item notes"),
            description: validateOptionalText(
              item.description,
              "Template item description",
            ),
            weight: validateNonnegativeWeight(
              item.weight,
              "Template item weight",
            ),
            tags: validateTags(item.tags, "Template item"),
            order: itemOrder,
          })),
        }),
      );
      const now = Date.now();
      const templateId = await ctx.db.insert("templates", {
        ...metadata,
        difficulty: templateData.difficulty,
        season: templateData.season,
        isPublic: true,
        isOfficial: true,
        usageCount: 0,
        rating: 5,
        ...counts,
        createdAt: now,
        updatedAt: now,
      });
      inserted += 1;
      await adjustTemplateStats(ctx, { totalTemplates: 1 });

      for (const categoryData of preparedCategories) {
        const templateCategoryId = await ctx.db.insert("templateCategories", {
          templateId,
          name: categoryData.name,
          color:
            categoryData.color ?? getDefaultCategoryColor(categoryData.order),
          icon: categoryData.icon ?? getDefaultCategoryIcon(categoryData.name),
          order: categoryData.order,
          collapsed: categoryData.collapsed,
        });
        for (const item of categoryData.items) {
          await ctx.db.insert("templateItems", {
            templateId,
            templateCategoryId,
            categoryName: categoryData.name,
            ...item,
          });
        }
      }
    }

    await backfillTemplateMetadataPage(ctx, null, true);
    return {
      message: "Official templates synchronized; metadata repair started",
      inserted,
      skipped,
      total: defaultTemplates.length,
    };
  },
});

function getDefaultCategoryColor(index: number): string {
  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];
  return colors[index % colors.length];
}

function getDefaultCategoryIcon(categoryName: string): string {
  const iconMap: Record<string, string> = {
    Clothing: "👕",
    Toiletries: "🧴",
    Electronics: "📱",
    "Professional Attire": "👔",
    "Work Essentials": "💼",
    Documents: "📄",
    "Beach Wear": "👙",
    "Sun Protection": "☀️",
    "Beach Activities": "🏖️",
  };
  return iconMap[categoryName] || "📦";
}
