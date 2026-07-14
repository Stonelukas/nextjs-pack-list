import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireCurrentUser } from "./lib/auth";
import {
  requireOwnedCategory,
  requireOwnedItem,
  requireOwnedList,
} from "./lib/authorization";
import { cleanupLinkedRecords } from "./lib/deletion";
import { domainError } from "./lib/errors";
import {
  getImportPayloadLimitError,
  MAX_IMPORT_JSON_BYTES,
  utf8ByteLength,
} from "./lib/import_limits";
import {
  validateNonnegativeWeight,
  validateOptionalText,
  validatePositiveInteger,
  validatePriority,
  validateRequiredName,
  validateTags,
} from "./lib/validation";

async function getCategoriesWithItems(
  ctx: Parameters<typeof requireOwnedList>[0],
  listId: Id<"lists">,
) {
  const categories = await ctx.db
    .query("categories")
    .withIndex("by_list", (q) => q.eq("listId", listId))
    .collect();

  const categoriesWithItems = await Promise.all(
    categories.map(async (category) => {
      const items = await ctx.db
        .query("items")
        .withIndex("by_category", (q) => q.eq("categoryId", category._id))
        .collect();
      return {
        ...category,
        items: items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      };
    }),
  );

  return categoriesWithItems.sort((a, b) => a.order - b.order);
}

async function validateExactIds<T extends Doc<"categories"> | Doc<"items">>(
  suppliedIds: string[],
  records: T[],
  label: string,
) {
  const expectedIds = new Set(records.map((record) => record._id));
  const suppliedIdSet = new Set(suppliedIds);
  if (
    suppliedIdSet.size !== suppliedIds.length ||
    suppliedIdSet.size !== expectedIds.size ||
    suppliedIds.some((id) => !expectedIds.has(id as T["_id"]))
  ) {
    throw domainError(
      "FORBIDDEN",
      `${label} must contain every owned record exactly once`,
    );
  }
}

const LIST_SUMMARY_PAGE_LIMIT = 50;
const LIST_EXPORT_PAGE_LIMIT = 50;

function validatePageSize(numItems: number, maximum: number, label: string) {
  if (!Number.isInteger(numItems) || numItems < 1 || numItems > maximum) {
    throw domainError(
      "VALIDATION",
      `${label} page size must be between 1 and ${maximum}`,
    );
  }
}

function clientListOutput(list: Doc<"lists">) {
  const { isPublic, isTemplate, ...output } = list;
  void isPublic;
  void isTemplate;
  return output;
}

async function getListSummary(
  ctx: Parameters<typeof requireOwnedList>[0],
  list: Doc<"lists">,
) {
  const categories = await ctx.db
    .query("categories")
    .withIndex("by_list", (q) => q.eq("listId", list._id))
    .collect();
  const itemGroups = await Promise.all(
    categories.map((category) =>
      ctx.db
        .query("items")
        .withIndex("by_category", (q) => q.eq("categoryId", category._id))
        .collect(),
    ),
  );
  const items = itemGroups.flat();

  return {
    ...clientListOutput(list),
    categoryCount: categories.length,
    itemCount: items.length,
    packedCount: items.filter((item) => item.packed).length,
  };
}

export const getListSummaries = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    validatePageSize(
      args.paginationOpts.numItems,
      LIST_SUMMARY_PAGE_LIMIT,
      "List summary",
    );
    const result = await ctx.db
      .query("lists")
      .withIndex("by_user_template", (q) =>
        q.eq("userId", user._id).eq("isTemplate", false),
      )
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...result,
      page: await Promise.all(
        result.page.map((list) => getListSummary(ctx, list)),
      ),
    };
  },
});

export const getListExportPage = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    validatePageSize(
      args.paginationOpts.numItems,
      LIST_EXPORT_PAGE_LIMIT,
      "List export",
    );
    const result = await ctx.db
      .query("lists")
      .withIndex("by_user_template", (q) =>
        q.eq("userId", user._id).eq("isTemplate", false),
      )
      .order("asc")
      .paginate(args.paginationOpts);

    return {
      ...result,
      page: await Promise.all(
        result.page.map(async (list) => ({
          ...clientListOutput(list),
          categories: await getCategoriesWithItems(ctx, list._id),
        })),
      ),
    };
  },
});

export const getList = query({
  args: { listId: v.id("lists") },
  handler: async (ctx, args) => {
    const list = await requireOwnedList(ctx, args.listId);
    return {
      ...clientListOutput(list),
      categories: await getCategoriesWithItems(ctx, list._id),
    };
  },
});

export const getListByRouteId = query({
  args: { listId: v.string() },
  handler: async (ctx, args) => {
    const listId = ctx.db.normalizeId("lists", args.listId);
    if (!listId) throw domainError("NOT_FOUND", "List was not found");
    const list = await requireOwnedList(ctx, listId);
    return {
      ...clientListOutput(list),
      categories: await getCategoriesWithItems(ctx, list._id),
    };
  },
});

export const createList = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const name = validateRequiredName(args.name, "List name");
    const description = validateOptionalText(args.description, "List description");
    const tags = validateTags(args.tags, "List");
    const now = Date.now();
    return ctx.db.insert("lists", {
      userId: user._id,
      name,
      description,
      isTemplate: false,
      isPublic: false,
      tags,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateList = mutation({
  args: {
    listId: v.id("lists"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireOwnedList(ctx, args.listId);
    const updates: Partial<Doc<"lists">> = {};
    if (args.name !== undefined) {
      updates.name = validateRequiredName(args.name, "List name");
    }
    if (args.description !== undefined) {
      updates.description = validateOptionalText(
        args.description,
        "List description",
      );
    }
    if (args.tags !== undefined) {
      updates.tags = validateTags(args.tags, "List");
    }
    await ctx.db.patch(args.listId, { ...updates, updatedAt: Date.now() });
    return args.listId;
  },
});

export const markListCompleted = mutation({
  args: { listId: v.id("lists") },
  handler: async (ctx, args) => {
    await requireOwnedList(ctx, args.listId);
    const now = Date.now();
    await ctx.db.patch(args.listId, { completedAt: now, updatedAt: now });
    return args.listId;
  },
});

export const markListIncomplete = mutation({
  args: { listId: v.id("lists") },
  handler: async (ctx, args) => {
    await requireOwnedList(ctx, args.listId);
    await ctx.db.patch(args.listId, {
      completedAt: undefined,
      updatedAt: Date.now(),
    });
    return args.listId;
  },
});

export const deleteList = mutation({
  args: { listId: v.id("lists") },
  handler: async (ctx, args) => {
    await requireOwnedList(ctx, args.listId);
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();

    const itemGroups = await Promise.all(
      categories.map((category) =>
        ctx.db
          .query("items")
          .withIndex("by_category", (q) => q.eq("categoryId", category._id))
          .collect(),
      ),
    );
    const items = itemGroups.flat();
    await cleanupLinkedRecords(ctx, {
      contentIds: [
        args.listId,
        ...categories.map((category) => category._id),
        ...items.map((item) => item._id),
      ],
      listIds: [args.listId],
    });

    for (const item of items) await ctx.db.delete(item._id);
    for (const category of categories) await ctx.db.delete(category._id);
    await ctx.db.delete(args.listId);
  },
});

export const addCategory = mutation({
  args: {
    listId: v.id("lists"),
    name: v.string(),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwnedList(ctx, args.listId);
    const name = validateRequiredName(args.name, "Category name");
    const color = validateOptionalText(args.color, "Category color");
    const icon = validateOptionalText(args.icon, "Category icon");
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();
    const maxOrder = categories.reduce(
      (max, category) => Math.max(max, category.order),
      -1,
    );
    const now = Date.now();
    return ctx.db.insert("categories", {
      listId: args.listId,
      name,
      color,
      icon,
      order: maxOrder + 1,
      collapsed: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwnedCategory(ctx, args.categoryId);
    const updates: Partial<Doc<"categories">> = {};
    if (args.name !== undefined) {
      updates.name = validateRequiredName(args.name, "Category name");
    }
    if (args.color !== undefined) {
      updates.color = validateOptionalText(args.color, "Category color");
    }
    if (args.icon !== undefined) {
      updates.icon = validateOptionalText(args.icon, "Category icon");
    }
    await ctx.db.patch(args.categoryId, {
      ...updates,
      updatedAt: Date.now(),
    });
    return args.categoryId;
  },
});

export const deleteCategory = mutation({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    await requireOwnedCategory(ctx, args.categoryId);
    const items = await ctx.db
      .query("items")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();
    await cleanupLinkedRecords(ctx, {
      contentIds: [args.categoryId, ...items.map((item) => item._id)],
    });
    for (const item of items) await ctx.db.delete(item._id);
    await ctx.db.delete(args.categoryId);
  },
});

export const toggleCategoryCollapse = mutation({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    const { category } = await requireOwnedCategory(ctx, args.categoryId);
    await ctx.db.patch(args.categoryId, {
      collapsed: !category.collapsed,
      updatedAt: Date.now(),
    });
  },
});

export const reorderCategories = mutation({
  args: {
    listId: v.id("lists"),
    categoryIds: v.array(v.id("categories")),
  },
  handler: async (ctx, args) => {
    await requireOwnedList(ctx, args.listId);
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();
    await validateExactIds(args.categoryIds, categories, "Category IDs");

    const now = Date.now();
    for (const [order, categoryId] of args.categoryIds.entries()) {
      await ctx.db.patch(categoryId, { order, updatedAt: now });
    }
  },
});

export const addItem = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.string(),
    quantity: v.number(),
    packed: v.optional(v.boolean()),
    priority: v.string(),
    notes: v.optional(v.string()),
    description: v.optional(v.string()),
    weight: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireOwnedCategory(ctx, args.categoryId);
    const name = validateRequiredName(args.name, "Item name");
    const quantity = validatePositiveInteger(args.quantity, "Item quantity");
    const priority = validatePriority(args.priority, "Item priority");
    const notes = validateOptionalText(args.notes, "Item notes");
    const description = validateOptionalText(
      args.description,
      "Item description",
    );
    const weight = validateNonnegativeWeight(args.weight, "Item weight");
    const tags = validateTags(args.tags, "Item");
    const items = await ctx.db
      .query("items")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();
    const maxOrder = items.reduce(
      (max, item) => Math.max(max, item.order ?? 0),
      -1,
    );
    const now = Date.now();
    return ctx.db.insert("items", {
      categoryId: args.categoryId,
      name,
      quantity,
      packed: args.packed ?? false,
      priority,
      notes,
      description,
      weight,
      tags,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const toggleItemPacked = mutation({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    const { item } = await requireOwnedItem(ctx, args.itemId);
    await ctx.db.patch(args.itemId, {
      packed: !item.packed,
      updatedAt: Date.now(),
    });
  },
});

type ItemFieldUpdates = Partial<
  Pick<
    Doc<"items">,
    | "name"
    | "quantity"
    | "priority"
    | "notes"
    | "description"
    | "weight"
    | "tags"
  >
>;

type ItemFieldInput = {
  name?: string;
  quantity?: number;
  priority?: string;
  notes?: string;
  description?: string;
  weight?: number | null;
  tags?: string[];
};

function validateItemUpdates(args: ItemFieldInput): ItemFieldUpdates {
  const updates: ItemFieldUpdates = {};
  if (args.name !== undefined) {
    updates.name = validateRequiredName(args.name, "Item name");
  }
  if (args.quantity !== undefined) {
    updates.quantity = validatePositiveInteger(args.quantity, "Item quantity");
  }
  if (args.priority !== undefined) {
    updates.priority = validatePriority(args.priority, "Item priority");
  }
  if (args.notes !== undefined) {
    updates.notes = validateOptionalText(args.notes, "Item notes");
  }
  if (args.description !== undefined) {
    updates.description = validateOptionalText(
      args.description,
      "Item description",
    );
  }
  if (Object.prototype.hasOwnProperty.call(args, "weight")) {
    updates.weight =
      args.weight === null
        ? undefined
        : validateNonnegativeWeight(args.weight, "Item weight");
  }
  if (args.tags !== undefined) {
    updates.tags = validateTags(args.tags, "Item");
  }
  return updates;
}

export const updateItem = mutation({
  args: {
    itemId: v.id("items"),
    name: v.optional(v.string()),
    quantity: v.optional(v.number()),
    priority: v.optional(v.string()),
    notes: v.optional(v.string()),
    description: v.optional(v.string()),
    weight: v.optional(v.union(v.number(), v.null())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireOwnedItem(ctx, args.itemId);
    const updates = validateItemUpdates(args);
    await ctx.db.patch(args.itemId, { ...updates, updatedAt: Date.now() });
    return args.itemId;
  },
});

export const deleteItem = mutation({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    await requireOwnedItem(ctx, args.itemId);
    await cleanupLinkedRecords(ctx, { contentIds: [args.itemId] });
    await ctx.db.delete(args.itemId);
  },
});

export const reorderItems = mutation({
  args: {
    categoryId: v.id("categories"),
    itemIds: v.array(v.id("items")),
  },
  handler: async (ctx, args) => {
    await requireOwnedCategory(ctx, args.categoryId);
    const items = await ctx.db
      .query("items")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();
    await validateExactIds(args.itemIds, items, "Item IDs");

    const now = Date.now();
    for (const [order, itemId] of args.itemIds.entries()) {
      await ctx.db.patch(itemId, { order, updatedAt: now });
    }
  },
});

type PreparedItemMove = {
  item: Doc<"items">;
  sourceCategoryId: Id<"categories">;
  sourceItems: Doc<"items">[];
  destinationCategoryId: Id<"categories">;
  destinationItems: Doc<"items">[];
};

async function prepareItemMove(
  ctx: MutationCtx,
  item: Doc<"items">,
  destinationCategoryId: Id<"categories">,
  destinationIndex: number,
): Promise<PreparedItemMove> {
  await requireOwnedCategory(ctx, destinationCategoryId);
  const sourceCategoryId = item.categoryId;
  const sourceItems = (
    await ctx.db
      .query("items")
      .withIndex("by_category", (q) => q.eq("categoryId", sourceCategoryId))
      .collect()
  )
    .filter((candidate) => candidate._id !== item._id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const destinationItems =
    sourceCategoryId === destinationCategoryId
      ? sourceItems
      : (
          await ctx.db
            .query("items")
            .withIndex("by_category", (q) =>
              q.eq("categoryId", destinationCategoryId),
            )
            .collect()
        ).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (
    !Number.isInteger(destinationIndex) ||
    destinationIndex < 0 ||
    destinationIndex > destinationItems.length
  ) {
    throw domainError("VALIDATION", "Destination index is out of range");
  }

  destinationItems.splice(destinationIndex, 0, item);
  return {
    item,
    sourceCategoryId,
    sourceItems,
    destinationCategoryId,
    destinationItems,
  };
}

async function applyItemMove(
  ctx: MutationCtx,
  move: PreparedItemMove,
  itemUpdates: ItemFieldUpdates = {},
) {
  const now = Date.now();
  if (move.sourceCategoryId !== move.destinationCategoryId) {
    for (const [order, sourceItem] of move.sourceItems.entries()) {
      await ctx.db.patch(sourceItem._id, { order, updatedAt: now });
    }
  }

  for (const [order, destinationItem] of move.destinationItems.entries()) {
    await ctx.db.patch(destinationItem._id, {
      ...(destinationItem._id === move.item._id ? itemUpdates : {}),
      categoryId: move.destinationCategoryId,
      order,
      updatedAt: now,
    });
  }
}

export const moveItem = mutation({
  args: {
    itemId: v.id("items"),
    toCategoryId: v.id("categories"),
    toIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const { item } = await requireOwnedItem(ctx, args.itemId);
    const move = await prepareItemMove(
      ctx,
      item,
      args.toCategoryId,
      args.toIndex,
    );
    await applyItemMove(ctx, move);
  },
});

export const updateItemAndMove = mutation({
  args: {
    itemId: v.id("items"),
    name: v.optional(v.string()),
    quantity: v.optional(v.number()),
    priority: v.optional(v.string()),
    notes: v.optional(v.string()),
    description: v.optional(v.string()),
    weight: v.optional(v.union(v.number(), v.null())),
    tags: v.optional(v.array(v.string())),
    toCategoryId: v.optional(v.id("categories")),
    toIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { item } = await requireOwnedItem(ctx, args.itemId);
    const updates = validateItemUpdates(args);
    const hasCategory = args.toCategoryId !== undefined;
    const hasIndex = args.toIndex !== undefined;
    if (hasCategory !== hasIndex) {
      throw domainError(
        "VALIDATION",
        "Destination category and index must be provided together",
      );
    }

    if (args.toCategoryId !== undefined && args.toIndex !== undefined) {
      const move = await prepareItemMove(
        ctx,
        item,
        args.toCategoryId,
        args.toIndex,
      );
      await applyItemMove(ctx, move, updates);
    } else {
      await ctx.db.patch(args.itemId, {
        ...updates,
        updatedAt: Date.now(),
      });
    }
    return args.itemId;
  },
});

export const adjustItemQuantity = mutation({
  args: {
    itemId: v.id("items"),
    delta: v.number(),
  },
  handler: async (ctx, args) => {
    const { item } = await requireOwnedItem(ctx, args.itemId);
    if (!Number.isInteger(args.delta)) {
      throw domainError("VALIDATION", "Quantity delta must be an integer");
    }
    const quantity = validatePositiveInteger(
      item.quantity + args.delta,
      "Item quantity",
    );
    await ctx.db.patch(args.itemId, { quantity, updatedAt: Date.now() });
    return args.itemId;
  },
});

const importedItemValidator = v.object({
  name: v.string(),
  quantity: v.number(),
  priority: v.string(),
  packed: v.optional(v.boolean()),
  description: v.optional(v.string()),
  notes: v.optional(v.string()),
  weight: v.optional(v.number()),
  tags: v.optional(v.array(v.string())),
});

export const importList = mutation({
  args: {
    version: v.literal(1),
    list: v.object({
      name: v.string(),
      description: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
    }),
    categories: v.array(
      v.object({
        name: v.string(),
        color: v.optional(v.string()),
        icon: v.optional(v.string()),
        items: v.array(importedItemValidator),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const structuralLimitError = getImportPayloadLimitError(args);
    if (structuralLimitError) {
      throw domainError("VALIDATION", structuralLimitError);
    }
    if (utf8ByteLength(JSON.stringify(args)) > MAX_IMPORT_JSON_BYTES) {
      throw domainError(
        "VALIDATION",
        `Import files must be ${MAX_IMPORT_JSON_BYTES} bytes or smaller`,
      );
    }
    const list = {
      name: validateRequiredName(args.list.name, "Imported list name"),
      description: validateOptionalText(
        args.list.description,
        "Imported list description",
      ),
      tags: validateTags(args.list.tags, "Imported list"),
    };
    const categories = args.categories.map((category) => ({
      name: validateRequiredName(category.name, "Imported category name"),
      color: validateOptionalText(category.color, "Imported category color"),
      icon: validateOptionalText(category.icon, "Imported category icon"),
      items: category.items.map((item) => ({
        ...item,
        name: validateRequiredName(item.name, "Imported item name"),
        quantity: validatePositiveInteger(
          item.quantity,
          "Imported item quantity",
        ),
        priority: validatePriority(item.priority, "Imported item priority"),
        notes: validateOptionalText(item.notes, "Imported item notes"),
        description: validateOptionalText(
          item.description,
          "Imported item description",
        ),
        weight: validateNonnegativeWeight(item.weight, "Imported item weight"),
        tags: validateTags(item.tags, "Imported item"),
      })),
    }));

    const now = Date.now();
    const listId = await ctx.db.insert("lists", {
      userId: user._id,
      name: list.name,
      description: list.description,
      isTemplate: false,
      isPublic: false,
      tags: list.tags,
      createdAt: now,
      updatedAt: now,
    });

    for (const [categoryOrder, category] of categories.entries()) {
      const categoryId = await ctx.db.insert("categories", {
        listId,
        name: category.name,
        color: category.color,
        icon: category.icon,
        order: categoryOrder,
        collapsed: false,
        createdAt: now,
        updatedAt: now,
      });

      for (const [itemOrder, item] of category.items.entries()) {
        await ctx.db.insert("items", {
          categoryId,
          name: item.name,
          quantity: item.quantity,
          packed: item.packed ?? false,
          priority: item.priority,
          notes: item.notes,
          description: item.description,
          weight: item.weight,
          tags: item.tags,
          order: itemOrder,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return listId;
  },
});

export const duplicateList = mutation({
  args: {
    listId: v.id("lists"),
    newName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const sourceList = await requireOwnedList(ctx, args.listId);
    const name = validateRequiredName(
      args.newName ?? `Copy of ${sourceList.name}`,
      "List name",
    );
    const description = validateOptionalText(
      sourceList.description,
      "List description",
    );
    const tags = validateTags(sourceList.tags, "List");
    const now = Date.now();
    const newListId = await ctx.db.insert("lists", {
      userId: user._id,
      name,
      description,
      isTemplate: false,
      isPublic: false,
      tags,
      createdAt: now,
      updatedAt: now,
    });

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();
    categories.sort((a, b) => a.order - b.order);

    for (const category of categories) {
      const newCategoryId = await ctx.db.insert("categories", {
        listId: newListId,
        name: category.name,
        color: category.color,
        icon: category.icon,
        order: category.order,
        collapsed: category.collapsed,
        createdAt: now,
        updatedAt: now,
      });
      const items = await ctx.db
        .query("items")
        .withIndex("by_category", (q) => q.eq("categoryId", category._id))
        .collect();
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      for (const item of items) {
        await ctx.db.insert("items", {
          categoryId: newCategoryId,
          name: item.name,
          quantity: item.quantity,
          packed: false,
          priority: item.priority,
          notes: item.notes,
          description: item.description,
          weight: item.weight,
          tags: item.tags,
          order: item.order,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return newListId;
  },
});
