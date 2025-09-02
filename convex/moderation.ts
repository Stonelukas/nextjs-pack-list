import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Content moderation status enum
export const ModerationStatus = {
  PENDING: "pending",
  APPROVED: "approved", 
  REJECTED: "rejected",
  FLAGGED: "flagged",
} as const;

// Content types that can be moderated
export const ContentType = {
  LIST: "list",
  TEMPLATE: "template", 
  USER_PROFILE: "user_profile",
  CATEGORY: "category",
} as const;

// Get all content pending moderation
export const getModerationQueue = query({
  args: {
    contentType: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { contentType, status = "pending", limit = 50 } = args;

    // Get moderation records from database
    let moderationQuery = ctx.db.query("moderation");

    // Apply filters
    if (status) {
      moderationQuery = moderationQuery.filter((q) => q.eq(q.field("status"), status));
    }
    if (contentType && contentType !== "all") {
      moderationQuery = moderationQuery.filter((q) => q.eq(q.field("contentType"), contentType));
    }

    const moderationRecords = await moderationQuery
      .order("desc")
      .take(limit);

    // Get the actual content for each moderation record
    const moderationItems = [];

    for (const record of moderationRecords) {
      let content = null;
      let author = "Unknown";
      let authorId = null;

      try {
        switch (record.contentType) {
          case ContentType.LIST:
          case ContentType.TEMPLATE:
            content = await ctx.db.get(record.contentId as any);
            if (content) {
              const user = await ctx.db.get(content.userId);
              author = user?.name || "Unknown";
              authorId = content.userId;
            }
            break;
          case ContentType.USER_PROFILE:
            content = await ctx.db.get(record.contentId as any);
            if (content) {
              author = content.name;
              authorId = content._id;
            }
            break;
          case ContentType.CATEGORY:
            content = await ctx.db.get(record.contentId as any);
            if (content) {
              author = "System";
              authorId = null;
            }
            break;
        }

        if (content) {
          moderationItems.push({
            id: record.contentId,
            type: record.contentType,
            title: content.name || content.title || "Untitled",
            description: content.description || content.email || "",
            content,
            author,
            authorId,
            createdAt: record.createdAt,
            status: record.status,
            flaggedReason: record.flaggedReason || "Flagged for review",
            moderationId: record._id,
          });
        }
      } catch (error) {
        // Content might have been deleted, skip this record
        console.warn(`Content not found for moderation record ${record._id}`);
      }
    }

    return moderationItems;
  },
});

// Get moderation statistics
export const getModerationStats = query({
  args: {},
  handler: async (ctx) => {
    const allModerationRecords = await ctx.db.query("moderation").collect();

    // Calculate stats by status
    const pendingCount = allModerationRecords.filter(r => r.status === "pending").length;
    const approvedCount = allModerationRecords.filter(r => r.status === "approved").length;
    const rejectedCount = allModerationRecords.filter(r => r.status === "rejected").length;
    const flaggedCount = allModerationRecords.filter(r => r.status === "flagged").length;

    // Calculate stats by content type
    const pendingByType = {
      lists: allModerationRecords.filter(r => r.contentType === "list" && r.status === "pending").length,
      users: allModerationRecords.filter(r => r.contentType === "user_profile" && r.status === "pending").length,
      categories: allModerationRecords.filter(r => r.contentType === "category" && r.status === "pending").length,
      templates: allModerationRecords.filter(r => r.contentType === "template" && r.status === "pending").length,
    };

    // Calculate recent activity (last 24 hours)
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentRecords = allModerationRecords.filter(r => r.updatedAt >= dayAgo);

    const recentActivity = {
      approved: recentRecords.filter(r => r.status === "approved").length,
      rejected: recentRecords.filter(r => r.status === "rejected").length,
      flagged: recentRecords.filter(r => r.status === "flagged").length,
    };

    // Calculate moderation load
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const thisWeekRecords = allModerationRecords.filter(r => r.createdAt >= weekAgo);

    return {
      totalPending: pendingCount,
      pendingByType,
      recentActivity,
      moderationLoad: {
        today: recentRecords.length,
        thisWeek: thisWeekRecords.length,
        avgResponseTime: "2.5 hours", // Could be calculated from actual data
      },
      totalStats: {
        total: allModerationRecords.length,
        approved: approvedCount,
        rejected: rejectedCount,
        flagged: flaggedCount,
        pending: pendingCount,
      },
    };
  },
});

// Approve content
export const approveContent = mutation({
  args: {
    contentId: v.string(),
    contentType: v.string(),
    moderatorNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { contentId, contentType, moderatorNotes } = args;

    // Find the moderation record
    const moderationRecord = await ctx.db
      .query("moderation")
      .filter((q) =>
        q.and(
          q.eq(q.field("contentId"), contentId),
          q.eq(q.field("contentType"), contentType)
        )
      )
      .first();

    if (!moderationRecord) {
      throw new ConvexError("Moderation record not found");
    }

    // Update the moderation status
    await ctx.db.patch(moderationRecord._id, {
      status: "approved",
      moderatorNotes,
      updatedAt: Date.now(),
    });

    // Add to moderation history
    await ctx.db.insert("moderationHistory", {
      contentId,
      contentType,
      action: "approved",
      moderatorName: "Admin", // In real app, get from auth
      notes: moderatorNotes,
      timestamp: Date.now(),
    });

    console.log(`Content approved: ${contentType}:${contentId}`, { moderatorNotes });

    return {
      success: true,
      action: "approved",
      contentId,
      contentType,
      timestamp: Date.now(),
    };
  },
});

// Reject content
export const rejectContent = mutation({
  args: {
    contentId: v.string(),
    contentType: v.string(),
    reason: v.string(),
    moderatorNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { contentId, contentType, reason, moderatorNotes } = args;

    // Find the moderation record
    const moderationRecord = await ctx.db
      .query("moderation")
      .filter((q) =>
        q.and(
          q.eq(q.field("contentId"), contentId),
          q.eq(q.field("contentType"), contentType)
        )
      )
      .first();

    if (!moderationRecord) {
      throw new ConvexError("Moderation record not found");
    }

    // Update the moderation status
    await ctx.db.patch(moderationRecord._id, {
      status: "rejected",
      rejectionReason: reason,
      moderatorNotes,
      updatedAt: Date.now(),
    });

    // Add to moderation history
    await ctx.db.insert("moderationHistory", {
      contentId,
      contentType,
      action: "rejected",
      moderatorName: "Admin",
      notes: moderatorNotes,
      reason,
      timestamp: Date.now(),
    });

    console.log(`Content rejected: ${contentType}:${contentId}`, { reason, moderatorNotes });

    return {
      success: true,
      action: "rejected",
      contentId,
      contentType,
      reason,
      timestamp: Date.now(),
    };
  },
});

// Flag content for further review
export const flagContent = mutation({
  args: {
    contentId: v.string(),
    contentType: v.string(),
    flagReason: v.string(),
    severity: v.string(), // low, medium, high
    moderatorNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { contentId, contentType, flagReason, severity, moderatorNotes } = args;

    // Find the moderation record
    const moderationRecord = await ctx.db
      .query("moderation")
      .filter((q) =>
        q.and(
          q.eq(q.field("contentId"), contentId),
          q.eq(q.field("contentType"), contentType)
        )
      )
      .first();

    if (!moderationRecord) {
      throw new ConvexError("Moderation record not found");
    }

    // Update the moderation status
    await ctx.db.patch(moderationRecord._id, {
      status: "flagged",
      flaggedReason: flagReason,
      flagSeverity: severity,
      moderatorNotes,
      updatedAt: Date.now(),
    });

    // Add to moderation history
    await ctx.db.insert("moderationHistory", {
      contentId,
      contentType,
      action: "flagged",
      moderatorName: "Admin",
      notes: moderatorNotes,
      reason: flagReason,
      timestamp: Date.now(),
    });

    console.log(`Content flagged: ${contentType}:${contentId}`, {
      flagReason,
      severity,
      moderatorNotes
    });

    return {
      success: true,
      action: "flagged",
      contentId,
      contentType,
      flagReason,
      severity,
      timestamp: Date.now(),
    };
  },
});

// Create a moderation record for content that needs review
export const createModerationRecord = mutation({
  args: {
    contentId: v.string(),
    contentType: v.string(),
    flaggedReason: v.string(),
  },
  handler: async (ctx, args) => {
    const { contentId, contentType, flaggedReason } = args;

    // Check if moderation record already exists
    const existing = await ctx.db
      .query("moderation")
      .filter((q) =>
        q.and(
          q.eq(q.field("contentId"), contentId),
          q.eq(q.field("contentType"), contentType)
        )
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new moderation record
    const moderationId = await ctx.db.insert("moderation", {
      contentId,
      contentType,
      status: "pending",
      flaggedReason,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add initial history entry
    await ctx.db.insert("moderationHistory", {
      contentId,
      contentType,
      action: "submitted",
      moderatorName: "System",
      notes: "Content submitted for review",
      timestamp: Date.now(),
    });

    return moderationId;
  },
});

// Get moderation history for a specific piece of content
export const getModerationHistory = query({
  args: {
    contentId: v.string(),
    contentType: v.string(),
  },
  handler: async (ctx, args) => {
    const { contentId, contentType } = args;

    const history = await ctx.db
      .query("moderationHistory")
      .filter((q) =>
        q.and(
          q.eq(q.field("contentId"), contentId),
          q.eq(q.field("contentType"), contentType)
        )
      )
      .order("desc")
      .collect();

    return history.map(entry => ({
      id: entry._id,
      action: entry.action,
      moderator: entry.moderatorName || "Unknown",
      timestamp: entry.timestamp,
      notes: entry.notes || "",
      reason: entry.reason,
    }));
  },
});

// Get automated content flags based on keywords/rules
export const getAutomatedFlags = query({
  args: {
    content: v.string(),
    contentType: v.string(),
  },
  handler: async (ctx, args) => {
    const { content, contentType } = args;
    
    const flags = [];
    const flaggedKeywords = ["spam", "inappropriate", "test", "fake"];
    const contentLower = content.toLowerCase();
    
    // Check for flagged keywords
    for (const keyword of flaggedKeywords) {
      if (contentLower.includes(keyword)) {
        flags.push({
          type: "keyword",
          severity: "medium",
          reason: `Contains flagged keyword: "${keyword}"`,
          keyword,
        });
      }
    }
    
    // Check content length
    if (content.length > 1000) {
      flags.push({
        type: "length",
        severity: "low",
        reason: "Content exceeds recommended length",
        details: `${content.length} characters`,
      });
    }
    
    // Check for excessive capitalization
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.5 && content.length > 20) {
      flags.push({
        type: "formatting",
        severity: "medium", 
        reason: "Excessive use of capital letters",
        details: `${Math.round(capsRatio * 100)}% capitalized`,
      });
    }
    
    return flags;
  },
});

// Initialize moderation records for existing content that needs review
export const initializeModerationRecords = mutation({
  args: {},
  handler: async (ctx) => {
    const lists = await ctx.db.query("lists").collect();
    const users = await ctx.db.query("users").collect();
    const categories = await ctx.db.query("categories").collect();

    let created = 0;

    // Check lists that need moderation
    for (const list of lists) {
      const needsModeration = list.isTemplate ||
        (list.name && list.name.length > 100) ||
        (list.description && list.description.length > 500);

      if (needsModeration) {
        // Check if moderation record already exists
        const existing = await ctx.db
          .query("moderation")
          .filter((q) =>
            q.and(
              q.eq(q.field("contentId"), list._id),
              q.eq(q.field("contentType"), list.isTemplate ? "template" : "list")
            )
          )
          .first();

        if (!existing) {
          const flaggedReason = list.isTemplate ? "Template submission" : "Long content";
          await ctx.db.insert("moderation", {
            contentId: list._id,
            contentType: list.isTemplate ? "template" : "list",
            status: "pending",
            flaggedReason,
            createdAt: list.createdAt || Date.now(),
            updatedAt: Date.now(),
          });
          created++;
        }
      }
    }

    // Check users that need moderation
    for (const user of users) {
      const needsModeration = user.name.length > 50 ||
        (user.email && user.email.includes("test"));

      if (needsModeration) {
        // Check if moderation record already exists
        const existing = await ctx.db
          .query("moderation")
          .filter((q) =>
            q.and(
              q.eq(q.field("contentId"), user._id),
              q.eq(q.field("contentType"), "user_profile")
            )
          )
          .first();

        if (!existing) {
          const flaggedReason = user.name.length > 50 ? "Long username" : "Test account";
          await ctx.db.insert("moderation", {
            contentId: user._id,
            contentType: "user_profile",
            status: "pending",
            flaggedReason,
            createdAt: user.createdAt || Date.now(),
            updatedAt: Date.now(),
          });
          created++;
        }
      }
    }

    // Check categories that need moderation
    for (const category of categories) {
      const needsModeration = category.name.length > 30;

      if (needsModeration) {
        // Check if moderation record already exists
        const existing = await ctx.db
          .query("moderation")
          .filter((q) =>
            q.and(
              q.eq(q.field("contentId"), category._id),
              q.eq(q.field("contentType"), "category")
            )
          )
          .first();

        if (!existing) {
          await ctx.db.insert("moderation", {
            contentId: category._id,
            contentType: "category",
            status: "pending",
            flaggedReason: "Long category name",
            createdAt: category.createdAt || Date.now(),
            updatedAt: Date.now(),
          });
          created++;
        }
      }
    }

    return { created };
  },
});

// Clean up duplicate moderation records
export const cleanupDuplicateModerationRecords = mutation({
  args: {},
  handler: async (ctx) => {
    const allRecords = await ctx.db.query("moderation").collect();
    const seen = new Set();
    let removed = 0;

    for (const record of allRecords) {
      const key = `${record.contentId}-${record.contentType}`;
      if (seen.has(key)) {
        // This is a duplicate, remove it
        await ctx.db.delete(record._id);
        removed++;
      } else {
        seen.add(key);
      }
    }

    return { removed };
  },
});

// Create test content for moderation testing
export const createTestModerationContent = mutation({
  args: {},
  handler: async (ctx) => {
    let created = 0;

    // Create test users with different characteristics
    const testUsers = [
      {
        clerkId: `test_user_${Date.now()}_1`,
        name: "TestUserWithVeryLongNameThatExceedsFiftyCharactersLimit",
        email: "long-name-user@example.com",
      },
      {
        clerkId: `test_user_${Date.now()}_2`,
        name: "TestUser",
        email: "test-account@example.com",
      },
      {
        clerkId: `test_user_${Date.now()}_3`,
        name: "SpamUser",
        email: "spam-test@example.com",
      }
    ];

    for (const userData of testUsers) {
      const userId = await ctx.db.insert("users", {
        ...userData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Create moderation record
      const flaggedReason = userData.name.length > 50 ? "Long username" : "Test account";
      await ctx.db.insert("moderation", {
        contentId: userId,
        contentType: "user_profile",
        status: "pending",
        flaggedReason,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      created++;
    }

    return { created };
  },
});
