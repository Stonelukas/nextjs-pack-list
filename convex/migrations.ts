import { v, type Infer } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireCurrentUser } from "./lib/auth";
import { domainError } from "./lib/errors";
import { defaultPreferences } from "./lib/preferences";
import {
  fingerprintLegacyData,
  getLegacyImportLimitError,
  LEGACY_MANUAL_EXPORT_GUIDANCE,
  LEGACY_MAX_NAME_LENGTH,
  LEGACY_MAX_OPTIONAL_TEXT_LENGTH,
  LEGACY_MAX_TAG_LENGTH,
  LEGACY_MAX_TAGS_PER_RECORD,
} from "./lib/legacy_import";
import { adjustTemplateStats } from "./lib/template_stats";
import {
  validatePublicTemplateQuota,
  validateTemplateCounts,
} from "./lib/validation";

const sourceKeyValidator = v.literal("zustand:pack-list-storage:v1");
const priorityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("essential"),
);
const themeValidator = v.union(
  v.literal("light"),
  v.literal("dark"),
  v.literal("system"),
);
const legacyPreferencesValidator = v.object({
  theme: v.optional(themeValidator),
  defaultPriority: v.optional(priorityValidator),
  autoSave: v.optional(v.boolean()),
});
const difficultyValidator = v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
  v.literal("advanced"),
);
const seasonValidator = v.union(
  v.literal("spring"),
  v.literal("summer"),
  v.literal("fall"),
  v.literal("winter"),
  v.literal("all"),
);

const legacyItemValidator = v.object({
  name: v.string(),
  quantity: v.number(),
  packed: v.boolean(),
  priority: priorityValidator,
  notes: v.optional(v.string()),
  description: v.optional(v.string()),
  weight: v.optional(v.number()),
  tags: v.array(v.string()),
  order: v.number(),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
});

const legacyCategoryValidator = v.object({
  name: v.string(),
  color: v.optional(v.string()),
  icon: v.optional(v.string()),
  order: v.number(),
  collapsed: v.boolean(),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  items: v.array(legacyItemValidator),
});

const legacyListValidator = v.object({
  name: v.string(),
  description: v.optional(v.string()),
  tags: v.array(v.string()),
  completedAt: v.optional(v.number()),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  categories: v.array(legacyCategoryValidator),
});

const legacyTemplateValidator = v.object({
  name: v.string(),
  description: v.string(),
  tags: v.array(v.string()),
  isPublic: v.boolean(),
  usageCount: v.number(),
  icon: v.optional(v.string()),
  duration: v.optional(v.string()),
  difficulty: v.optional(difficultyValidator),
  season: v.optional(seasonValidator),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  categories: v.array(legacyCategoryValidator),
});

type LegacyItemInput = Infer<typeof legacyItemValidator>;
type LegacyCategoryInput = Infer<typeof legacyCategoryValidator>;
type LegacyListInput = Infer<typeof legacyListValidator>;
type LegacyTemplateInput = Infer<typeof legacyTemplateValidator>;

function validationError(message: string): never {
  throw domainError("VALIDATION", message);
}

function validateRequiredText(value: string, label: string) {
  if (!value.trim()) validationError(`${label} is required`);
  if (value.length > LEGACY_MAX_NAME_LENGTH) {
    validationError(`${label} must be ${LEGACY_MAX_NAME_LENGTH} characters or fewer`);
  }
}

function validateOptionalText(value: string | undefined, label: string) {
  if (value !== undefined && value.length > LEGACY_MAX_OPTIONAL_TEXT_LENGTH) {
    validationError(`${label} is too long`);
  }
}

function validateDate(value: number | undefined, label: string) {
  if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
    validationError(`${label} must be a valid timestamp`);
  }
}

function validateOrder(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0) {
    validationError(`${label} must be a non-negative integer`);
  }
}

function validateTags(tags: string[], label: string) {
  if (tags.length > LEGACY_MAX_TAGS_PER_RECORD) validationError(`${label} has too many tags`);
  for (const tag of tags) {
    if (!tag.trim() || tag.length > LEGACY_MAX_TAG_LENGTH) {
      validationError(`${label} contains an invalid tag`);
    }
  }
}

function validateItem(item: LegacyItemInput, label: string) {
  validateRequiredText(item.name, `${label} name`);
  if (!Number.isInteger(item.quantity) || item.quantity < 1) {
    validationError(`${label} quantity must be a positive integer`);
  }
  if (
    item.weight !== undefined &&
    (!Number.isFinite(item.weight) || item.weight < 0)
  ) {
    validationError(`${label} weight must be a non-negative number`);
  }
  validateOptionalText(item.notes, `${label} notes`);
  validateOptionalText(item.description, `${label} description`);
  validateTags(item.tags, label);
  validateOrder(item.order, `${label} order`);
  validateDate(item.createdAt, `${label} createdAt`);
  validateDate(item.updatedAt, `${label} updatedAt`);
}

function validateCategory(category: LegacyCategoryInput, label: string) {
  validateRequiredText(category.name, `${label} name`);
  validateOptionalText(category.color, `${label} color`);
  validateOptionalText(category.icon, `${label} icon`);
  validateOrder(category.order, `${label} order`);
  validateDate(category.createdAt, `${label} createdAt`);
  validateDate(category.updatedAt, `${label} updatedAt`);
  category.items.forEach((item, index) =>
    validateItem(item, `${label} item ${index + 1}`),
  );
}

function validateList(list: LegacyListInput, index: number) {
  const label = `List ${index + 1}`;
  validateRequiredText(list.name, `${label} name`);
  validateOptionalText(list.description, `${label} description`);
  validateTags(list.tags, label);
  validateDate(list.completedAt, `${label} completedAt`);
  validateDate(list.createdAt, `${label} createdAt`);
  validateDate(list.updatedAt, `${label} updatedAt`);
  list.categories.forEach((category, categoryIndex) =>
    validateCategory(category, `${label} category ${categoryIndex + 1}`),
  );
}

function validateTemplate(template: LegacyTemplateInput, index: number) {
  const label = `Template ${index + 1}`;
  validateRequiredText(template.name, `${label} name`);
  validateOptionalText(template.description, `${label} description`);
  validateTags(template.tags, label);
  if (!Number.isInteger(template.usageCount) || template.usageCount < 0) {
    validationError(`${label} usage count must be a non-negative integer`);
  }
  validateOptionalText(template.icon, `${label} icon`);
  validateOptionalText(template.duration, `${label} duration`);
  validateDate(template.createdAt, `${label} createdAt`);
  validateDate(template.updatedAt, `${label} updatedAt`);
  validateTemplateCounts(
    template.categories.map((category) => category.items.length),
    label,
  );
  template.categories.forEach((category, categoryIndex) =>
    validateCategory(category, `${label} category ${categoryIndex + 1}`),
  );
}

function validateImportPayload(args: {
  fingerprint: string;
  lists: LegacyListInput[];
  templates: LegacyTemplateInput[];
  preferences?: Infer<typeof legacyPreferencesValidator>;
}) {
  if (!/^fnv1a128:[0-9a-f]{32}$/.test(args.fingerprint)) {
    validationError("Legacy import fingerprint is invalid");
  }
  const payload = {
    lists: args.lists,
    templates: args.templates,
    preferences: args.preferences,
  };
  const expectedFingerprint = fingerprintLegacyData(payload);
  if (args.fingerprint !== expectedFingerprint) {
    validationError("Legacy import fingerprint does not match the submitted data");
  }

  const limitError = getLegacyImportLimitError(payload);
  if (limitError) validationError(LEGACY_MANUAL_EXPORT_GUIDANCE);
  if (
    args.lists.length + args.templates.length === 0 &&
    args.preferences === undefined
  ) {
    validationError("No valid legacy lists, templates, or preferences were provided");
  }

  args.lists.forEach(validateList);
  args.templates.forEach(validateTemplate);
}

export const getLegacyImportStatus = query({
  args: {
    sourceKey: sourceKeyValidator,
    fingerprint: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const existing = await ctx.db
      .query("legacyImports")
      .withIndex("by_user_source_fingerprint", (q) =>
        q
          .eq("userId", user._id)
          .eq("sourceKey", args.sourceKey)
          .eq("fingerprint", args.fingerprint),
      )
      .unique();
    return existing
      ? {
          status: "already_imported" as const,
          listsImported: existing.listsImported,
          templatesImported: existing.templatesImported,
        }
      : null;
  },
});

export const importLegacyData = mutation({
  args: {
    sourceKey: sourceKeyValidator,
    fingerprint: v.string(),
    lists: v.array(legacyListValidator),
    templates: v.array(legacyTemplateValidator),
    preferences: v.optional(legacyPreferencesValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    validateImportPayload(args);
    const existing = await ctx.db
      .query("legacyImports")
      .withIndex("by_user_source_fingerprint", (q) =>
        q
          .eq("userId", user._id)
          .eq("sourceKey", args.sourceKey)
          .eq("fingerprint", args.fingerprint),
      )
      .unique();
    if (existing) {
      return {
        status: "already_imported" as const,
        listsImported: existing.listsImported,
        templatesImported: existing.templatesImported,
      };
    }

    await validatePublicTemplateQuota(
      ctx,
      user._id,
      args.templates.filter((template) => template.isPublic).length,
    );

    if (args.preferences) {
      await ctx.db.patch(user._id, {
        preferences: {
          ...defaultPreferences,
          ...user.preferences,
          ...args.preferences,
        },
        updatedAt: Date.now(),
      });
    }

    for (const list of args.lists) {
      const listId = await ctx.db.insert("lists", {
        userId: user._id,
        name: list.name.trim(),
        description: list.description,
        isTemplate: false,
        isPublic: false,
        tags: list.tags,
        completedAt: list.completedAt,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      });
      for (const category of list.categories) {
        const categoryId = await ctx.db.insert("categories", {
          listId,
          name: category.name.trim(),
          color: category.color,
          icon: category.icon,
          order: category.order,
          collapsed: category.collapsed,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        });
        for (const item of category.items) {
          await ctx.db.insert("items", {
            categoryId,
            name: item.name.trim(),
            quantity: item.quantity,
            packed: item.packed,
            priority: item.priority,
            notes: item.notes,
            description: item.description,
            weight: item.weight,
            tags: item.tags,
            order: item.order,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          });
        }
      }
    }

    for (const template of args.templates) {
      const counts = validateTemplateCounts(
        template.categories.map((category) => category.items.length),
      );
      const templateId = await ctx.db.insert("templates", {
        name: template.name.trim(),
        description: template.description,
        difficulty: template.difficulty,
        season: template.season,
        duration: template.duration,
        icon: template.icon,
        tags: template.tags,
        isPublic: template.isPublic,
        isOfficial: false,
        createdBy: user._id,
        usageCount: template.usageCount,
        rating: 0,
        ...counts,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      });
      await adjustTemplateStats(ctx, {
        totalTemplates: 1,
        totalUsage: template.usageCount,
      });
      for (const category of template.categories) {
        const templateCategoryId = await ctx.db.insert("templateCategories", {
          templateId,
          name: category.name.trim(),
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
            categoryName: category.name.trim(),
            name: item.name.trim(),
            quantity: item.quantity,
            priority: item.priority,
            notes: item.notes,
            description: item.description,
            weight: item.weight,
            tags: item.tags,
            order: item.order,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          });
        }
      }
    }

    await ctx.db.insert("legacyImports", {
      userId: user._id,
      sourceKey: args.sourceKey,
      fingerprint: args.fingerprint,
      listsImported: args.lists.length,
      templatesImported: args.templates.length,
      importedAt: Date.now(),
    });

    return {
      status: "imported" as const,
      listsImported: args.lists.length,
      templatesImported: args.templates.length,
    };
  },
});
