import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { internal } from "./_generated/api";
import {
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { requireAdmin, requireCurrentUser, requireIdentity } from "./lib/auth";
import { cleanupLinkedContentBatch } from "./lib/deletion";
import { domainError } from "./lib/errors";
import { defaultPreferences, preferencesValidator } from "./lib/preferences";
import { adjustTemplateStats } from "./lib/template_stats";

const USER_DELETION_BATCH_SIZE = 20;

async function scheduleUserDeletion(
  ctx: MutationCtx,
  jobId: Id<"userDeletionJobs">,
) {
  await ctx.scheduler.runAfter(0, internal.users.continueUserDeletion, {
    jobId,
  });
}

async function startUserDeletion(ctx: MutationCtx, userId: Id<"users">) {
  const existing = await ctx.db
    .query("userDeletionJobs")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  const now = Date.now();
  const jobId = existing
    ? existing._id
    : await ctx.db.insert("userDeletionJobs", {
        userId,
        createdAt: now,
        updatedAt: now,
      });
  await scheduleUserDeletion(ctx, jobId);
  return jobId;
}

async function cleanupContentBeforeDelete(
  ctx: MutationCtx,
  contentId: string,
) {
  return (
    (await cleanupLinkedContentBatch(
      ctx,
      contentId,
      USER_DELETION_BATCH_SIZE,
    )) === 0
  );
}

async function continueUserDeletionJob(
  ctx: MutationCtx,
  jobId: Id<"userDeletionJobs">,
) {
  const job = await ctx.db.get(jobId);
  if (!job) return { complete: true as const };
  const user = await ctx.db.get(job.userId);
  if (!user) {
    await ctx.db.delete(jobId);
    return { complete: true as const };
  }

  const template = await ctx.db
    .query("templates")
    .withIndex("by_creator", (q) => q.eq("createdBy", job.userId))
    .first();
  if (template) {
    const items = await ctx.db
      .query("templateItems")
      .withIndex("by_template", (q) => q.eq("templateId", template._id))
      .take(USER_DELETION_BATCH_SIZE);
    if (items.length > 0) {
      for (const item of items) {
        if (!(await cleanupContentBeforeDelete(ctx, item._id))) break;
        await ctx.db.delete(item._id);
      }
      await scheduleUserDeletion(ctx, jobId);
      return { complete: false as const, stage: "templateItems" as const };
    }

    const categories = await ctx.db
      .query("templateCategories")
      .withIndex("by_template", (q) => q.eq("templateId", template._id))
      .take(USER_DELETION_BATCH_SIZE);
    if (categories.length > 0) {
      for (const category of categories) {
        if (!(await cleanupContentBeforeDelete(ctx, category._id))) break;
        await ctx.db.delete(category._id);
      }
      await scheduleUserDeletion(ctx, jobId);
      return { complete: false as const, stage: "templateCategories" as const };
    }

    if (!(await cleanupContentBeforeDelete(ctx, template._id))) {
      await scheduleUserDeletion(ctx, jobId);
      return { complete: false as const, stage: "templateLinks" as const };
    }
    await adjustTemplateStats(ctx, {
      totalTemplates: -1,
      totalUsage: -(template.usageCount ?? 0),
    });
    await ctx.db.delete(template._id);
    await scheduleUserDeletion(ctx, jobId);
    return { complete: false as const, stage: "templates" as const };
  }

  const list = await ctx.db
    .query("lists")
    .withIndex("by_user", (q) => q.eq("userId", job.userId))
    .first();
  if (list) {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_list", (q) => q.eq("listId", list._id))
      .first();
    if (category) {
      const items = await ctx.db
        .query("items")
        .withIndex("by_category", (q) => q.eq("categoryId", category._id))
        .take(USER_DELETION_BATCH_SIZE);
      if (items.length > 0) {
        for (const item of items) {
          if (!(await cleanupContentBeforeDelete(ctx, item._id))) break;
          await ctx.db.delete(item._id);
        }
        await scheduleUserDeletion(ctx, jobId);
        return { complete: false as const, stage: "items" as const };
      }
      if (!(await cleanupContentBeforeDelete(ctx, category._id))) {
        await scheduleUserDeletion(ctx, jobId);
        return { complete: false as const, stage: "categoryLinks" as const };
      }
      await ctx.db.delete(category._id);
      await scheduleUserDeletion(ctx, jobId);
      return { complete: false as const, stage: "categories" as const };
    }

    const shares = await ctx.db
      .query("listShares")
      .withIndex("by_list", (q) => q.eq("listId", list._id))
      .take(USER_DELETION_BATCH_SIZE);
    if (shares.length > 0) {
      for (const share of shares) await ctx.db.delete(share._id);
      await scheduleUserDeletion(ctx, jobId);
      return { complete: false as const, stage: "listShares" as const };
    }
    if (!(await cleanupContentBeforeDelete(ctx, list._id))) {
      await scheduleUserDeletion(ctx, jobId);
      return { complete: false as const, stage: "listLinks" as const };
    }
    await ctx.db.delete(list._id);
    await scheduleUserDeletion(ctx, jobId);
    return { complete: false as const, stage: "lists" as const };
  }

  const preferences = await ctx.db
    .query("userPreferences")
    .withIndex("by_user", (q) => q.eq("userId", job.userId))
    .take(USER_DELETION_BATCH_SIZE);
  if (preferences.length > 0) {
    for (const preference of preferences) await ctx.db.delete(preference._id);
    await scheduleUserDeletion(ctx, jobId);
    return { complete: false as const, stage: "preferences" as const };
  }

  const legacyImports = await ctx.db
    .query("legacyImports")
    .withIndex("by_user", (q) => q.eq("userId", job.userId))
    .take(USER_DELETION_BATCH_SIZE);
  if (legacyImports.length > 0) {
    for (const legacyImport of legacyImports) {
      await ctx.db.delete(legacyImport._id);
    }
    await scheduleUserDeletion(ctx, jobId);
    return { complete: false as const, stage: "legacyImports" as const };
  }

  const outgoingShares = await ctx.db
    .query("listShares")
    .withIndex("by_shared_by", (q) => q.eq("sharedByUserId", job.userId))
    .take(USER_DELETION_BATCH_SIZE);
  if (outgoingShares.length > 0) {
    for (const share of outgoingShares) await ctx.db.delete(share._id);
    await scheduleUserDeletion(ctx, jobId);
    return { complete: false as const, stage: "outgoingShares" as const };
  }

  const incomingShares = await ctx.db
    .query("listShares")
    .withIndex("by_shared_with", (q) => q.eq("sharedWithUserId", job.userId))
    .take(USER_DELETION_BATCH_SIZE);
  if (incomingShares.length > 0) {
    for (const share of incomingShares) await ctx.db.delete(share._id);
    await scheduleUserDeletion(ctx, jobId);
    return { complete: false as const, stage: "incomingShares" as const };
  }

  const moderated = await ctx.db
    .query("moderation")
    .withIndex("by_moderator", (q) => q.eq("moderatorId", job.userId))
    .take(USER_DELETION_BATCH_SIZE);
  if (moderated.length > 0) {
    for (const record of moderated) {
      await ctx.db.patch(record._id, { moderatorId: undefined });
    }
    await scheduleUserDeletion(ctx, jobId);
    return { complete: false as const, stage: "moderation" as const };
  }

  const moderationHistory = await ctx.db
    .query("moderationHistory")
    .withIndex("by_moderator", (q) => q.eq("moderatorId", job.userId))
    .take(USER_DELETION_BATCH_SIZE);
  if (moderationHistory.length > 0) {
    for (const entry of moderationHistory) {
      await ctx.db.patch(entry._id, { moderatorId: undefined });
    }
    await scheduleUserDeletion(ctx, jobId);
    return { complete: false as const, stage: "moderationHistory" as const };
  }

  if (!(await cleanupContentBeforeDelete(ctx, job.userId))) {
    await scheduleUserDeletion(ctx, jobId);
    return { complete: false as const, stage: "userLinks" as const };
  }
  await ctx.db.delete(job.userId);
  await ctx.db.delete(jobId);
  return { complete: true as const };
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const ensureCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (existing) return existing._id;

    const now = Date.now();
    return ctx.db.insert("users", {
      clerkId: identity.subject,
      name: identity.name ?? "Anonymous User",
      email: identity.email,
      role: "user",
      preferences: defaultPreferences,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateCurrentUserPreferences = mutation({
  args: { preferences: preferencesValidator },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    await ctx.db.patch(user._id, {
      preferences: args.preferences,
      updatedAt: Date.now(),
    });
    return user._id;
  },
});

export const getCurrentAccess = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { authenticated: false as const, role: null };
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    return {
      authenticated: true as const,
      role: user?.role === "admin" ? ("admin" as const) : ("user" as const),
    };
  },
});

export const getAllUsers = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db.query("users").order("desc").paginate(args.paginationOpts);
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").collect();
    const lists = await ctx.db
      .query("lists")
      .withIndex("by_template", (q) => q.eq("isTemplate", false))
      .collect();
    const activeUsers = users.filter((user) =>
      lists.some((list) => list.userId === user._id),
    ).length;
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const newUsersThisMonth = users.filter(
      (user) => user.createdAt !== undefined && user.createdAt > monthAgo,
    ).length;
    return {
      totalUsers: users.length,
      activeUsers,
      newUsersThisMonth,
      inactiveUsers: users.length - activeUsers,
    };
  },
});

export const searchUsers = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const searchTerm = args.searchTerm.toLowerCase();
    return (await ctx.db.query("users").collect())
      .filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm) ||
          user.email?.toLowerCase().includes(searchTerm),
      )
      .slice(0, args.limit ?? 50);
  },
});

export const getUserDetails = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user) throw domainError("NOT_FOUND", "User was not found");
    const [lists, templates] = await Promise.all([
      ctx.db
        .query("lists")
        .withIndex("by_user_template", (q) =>
          q.eq("userId", args.userId).eq("isTemplate", false),
        )
        .collect(),
      ctx.db
        .query("templates")
        .withIndex("by_creator", (q) => q.eq("createdBy", args.userId))
        .collect(),
    ]);
    const completedLists = lists.filter((list) => list.completedAt).length;
    return {
      user,
      stats: {
        totalLists: lists.length,
        completedLists,
        templateCount: templates.length,
        activeLists: lists.length - completedLists,
      },
      recentLists: lists
        .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
        .slice(0, 5)
        .map((list) => ({
          _id: list._id,
          _creationTime: list._creationTime,
          userId: list.userId,
          name: list.name,
          description: list.description,
          tags: list.tags,
          completedAt: list.completedAt,
          createdAt: list.createdAt,
          updatedAt: list.updatedAt,
        })),
    };
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    updates: v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      preferences: v.optional(preferencesValidator),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user) throw domainError("NOT_FOUND", "User was not found");
    const updatedAt = Date.now();
    await ctx.db.patch(args.userId, {
      ...args.updates,
      updatedAt,
    });
    return { ...user, ...args.updates, updatedAt };
  },
});

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const administrator = await requireAdmin(ctx);
    if (administrator._id === args.userId) {
      throw domainError(
        "FORBIDDEN",
        "Administrators cannot delete their own account",
      );
    }
    const user = await ctx.db.get(args.userId);
    if (!user) throw domainError("NOT_FOUND", "User was not found");

    await startUserDeletion(ctx, args.userId);
    return { success: true, pending: true };
  },
});

export const getUserActivity = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user) throw domainError("NOT_FOUND", "User was not found");
    const lists = await ctx.db
      .query("lists")
      .withIndex("by_user_template", (q) =>
        q.eq("userId", args.userId).eq("isTemplate", false),
      )
      .collect();
    const activities: Array<{
      type: string;
      timestamp: number;
      data: { listName: string; listId: typeof lists[number]["_id"] };
    }> = [];
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
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, args.limit ?? 20);
  },
});

export const upsertFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        imageUrl: args.imageUrl,
        role: args.role,
        updatedAt: now,
      });
      return existing._id;
    }
    return ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
      role: args.role,
      preferences: defaultPreferences,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const continueUserDeletion = internalMutation({
  args: { jobId: v.id("userDeletionJobs") },
  handler: (ctx, args) => continueUserDeletionJob(ctx, args.jobId),
});

export const deleteFromClerk = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (user) await startUserDeletion(ctx, user._id);
    return { success: true, pending: user !== null };
  },
});
