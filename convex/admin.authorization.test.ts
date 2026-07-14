import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import type { DomainErrorCode } from "./lib/errors";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

function createTestBackend() {
  return convexTest(schema, modules);
}

async function expectErrorCode(
  promise: Promise<unknown>,
  code: DomainErrorCode,
) {
  try {
    await promise;
    throw new Error(`Expected ${code} error`);
  } catch (error) {
    let data = (error as { data?: unknown }).data;
    while (typeof data === "string") data = JSON.parse(data) as unknown;
    expect(data).toMatchObject({ code });
  }
}

async function seedAdminFixture(t: ReturnType<typeof createTestBackend>) {
  return t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      clerkId: "regular-user",
      name: "Regular User",
      role: "user",
    });
    const adminId = await ctx.db.insert("users", {
      clerkId: "admin-user",
      name: "Admin User",
      role: "admin",
    });
    return { userId, adminId };
  });
}

function validSettings() {
  return {
    general: {
      siteName: "Pack List",
      siteDescription: "Smart Packing List Tracker",
      contactEmail: "contact@packlistapp.com",
      supportEmail: "support@packlistapp.com",
      maintenanceMode: false,
      registrationEnabled: true,
      maxUsersPerAccount: 1000,
      defaultUserRole: "user",
    },
    security: {
      passwordMinLength: 8,
      requireTwoFactor: false,
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      enableCaptcha: false,
      allowedDomains: [],
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      adminAlerts: true,
      userWelcomeEmail: true,
      systemUpdates: true,
    },
    appearance: {
      defaultTheme: "system",
      allowThemeSelection: true,
      customLogo: "",
      primaryColor: "#0f172a",
      accentColor: "#3b82f6",
    },
    performance: {
      cacheEnabled: true,
      cacheDuration: 3600,
      compressionEnabled: true,
      cdnEnabled: false,
      maxFileSize: 10,
    },
  };
}

async function seedOwnedUserData(t: ReturnType<typeof createTestBackend>) {
  return t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", {
      clerkId: "delete-me",
      name: "Delete Me",
      role: "user",
    });
    const otherId = await ctx.db.insert("users", {
      clerkId: "other-user",
      name: "Other User",
      role: "user",
    });
    const listId = await ctx.db.insert("lists", {
      userId: ownerId,
      name: "Owned list",
      isTemplate: false,
    });
    const categoryId = await ctx.db.insert("categories", {
      listId,
      name: "Owned category",
      order: 0,
    });
    const itemId = await ctx.db.insert("items", {
      categoryId,
      name: "Owned item",
      quantity: 1,
      packed: false,
      priority: "medium",
      order: 0,
    });
    const templateId = await ctx.db.insert("templates", {
      name: "Owned template",
      description: "Owned",
      createdBy: ownerId,
      isPublic: false,
    });
    const templateCategoryId = await ctx.db.insert("templateCategories", {
      templateId,
      name: "Owned category",
      order: 0,
      collapsed: false,
    });
    const templateItemId = await ctx.db.insert("templateItems", {
      templateId,
      templateCategoryId,
      categoryName: "Owned category",
      name: "Owned template item",
      quantity: 1,
      priority: "medium",
    });
    const preferenceId = await ctx.db.insert("userPreferences", {
      userId: ownerId,
      theme: "system",
    });
    const legacyImportId = await ctx.db.insert("legacyImports", {
      userId: ownerId,
      sourceKey: "zustand:pack-list-storage:v1",
      fingerprint: "fnv1a128:33333333333333333333333333333333",
      listsImported: 1,
      templatesImported: 1,
      importedAt: Date.now(),
    });
    const outgoingShareId = await ctx.db.insert("listShares", {
      listId,
      sharedByUserId: ownerId,
      sharedWithUserId: otherId,
      permission: "view",
    });
    const incomingShareId = await ctx.db.insert("listShares", {
      listId,
      sharedByUserId: otherId,
      sharedWithUserId: ownerId,
      permission: "edit",
    });
    const moderationId = await ctx.db.insert("moderation", {
      contentId: templateId,
      contentType: "template",
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    const historyId = await ctx.db.insert("moderationHistory", {
      contentId: listId,
      contentType: "list",
      action: "submitted",
      timestamp: Date.now(),
    });

    return {
      ownerId,
      listId,
      categoryId,
      itemId,
      templateId,
      templateCategoryId,
      templateItemId,
      preferenceId,
      legacyImportId,
      outgoingShareId,
      incomingShareId,
      moderationId,
      historyId,
    };
  });
}

describe("current-user access", () => {
  it("reports anonymous, user, and admin access without clerkId arguments", async () => {
    const t = createTestBackend();
    await seedAdminFixture(t);

    await expect(t.query(api.users.getCurrentAccess, {})).resolves.toEqual({
      authenticated: false,
      role: null,
    });
    await expect(
      t.withIdentity({ subject: "regular-user" }).query(
        api.users.getCurrentAccess,
        {},
      ),
    ).resolves.toEqual({ authenticated: true, role: "user" });
    await expect(
      t.withIdentity({ subject: "admin-user" }).query(
        api.users.getCurrentAccess,
        {},
      ),
    ).resolves.toEqual({ authenticated: true, role: "admin" });
  });
});

describe("admin-only APIs", () => {
  it("rejects user administration for non-admin users", async () => {
    const t = createTestBackend();
    const { userId } = await seedAdminFixture(t);
    const asUser = t.withIdentity({ subject: "regular-user" });

    await expectErrorCode(
      asUser.query(api.users.getAllUsers, {
        paginationOpts: { numItems: 50, cursor: null },
      }),
      "FORBIDDEN",
    );
    await expectErrorCode(
      asUser.mutation(api.users.updateUser, {
        userId,
        updates: { name: "Escalated" },
      }),
      "FORBIDDEN",
    );
  });

  it("rejects analytics, moderation, and settings for non-admin users", async () => {
    const t = createTestBackend();
    await seedAdminFixture(t);
    const asUser = t.withIdentity({ subject: "regular-user" });

    await expectErrorCode(
      asUser.query(api.analytics.getDashboardMetrics, {}),
      "FORBIDDEN",
    );
    await expectErrorCode(
      asUser.query(api.moderation.getModerationQueue, {
        paginationOpts: { numItems: 50, cursor: null },
      }),
      "FORBIDDEN",
    );
    await expectErrorCode(
      asUser.mutation(api.moderation.createModerationRecord, {
        contentId: "content-id",
        contentType: "list",
        flaggedReason: "test",
      }),
      "FORBIDDEN",
    );
    await expectErrorCode(
      asUser.query(api.settings.getSystemSettings, {}),
      "FORBIDDEN",
    );
    await expectErrorCode(
      asUser.mutation(api.settings.updateSettingValue, {
        section: "general",
        key: "siteName",
        value: "Compromised",
      }),
      "FORBIDDEN",
    );
  });

  it("allows administrators to read administration data", async () => {
    const t = createTestBackend();
    await seedAdminFixture(t);
    const asAdmin = t.withIdentity({ subject: "admin-user" });

    await expect(
      asAdmin.query(api.users.getAllUsers, {
        paginationOpts: { numItems: 50, cursor: null },
      }),
    ).resolves.toMatchObject({ page: expect.any(Array), isDone: true });
    await expect(
      asAdmin.query(api.analytics.getDashboardMetrics, {}),
    ).resolves.toBeTypeOf("object");
    await expect(
      asAdmin.query(api.settings.getSystemSettings, {}),
    ).resolves.toBeTypeOf("object");
  });

  it("returns the authoritative updated user to administrator editors", async () => {
    const t = createTestBackend();
    const { userId } = await seedAdminFixture(t);

    const updated = await t
      .withIdentity({ subject: "admin-user" })
      .mutation(api.users.updateUser, {
        userId,
        updates: { name: "Updated User" },
      });

    expect(updated).toMatchObject({
      _id: userId,
      name: "Updated User",
      updatedAt: expect.any(Number),
    });
  });

  it("rejects deleting the authenticated administrator's own user record", async () => {
    const t = createTestBackend();
    const { adminId } = await seedAdminFixture(t);

    await expectErrorCode(
      t.withIdentity({ subject: "admin-user" }).mutation(api.users.deleteUser, {
        userId: adminId,
      }),
      "FORBIDDEN",
    );

    await expect(t.run((ctx) => ctx.db.get(adminId))).resolves.toMatchObject({
      clerkId: "admin-user",
      role: "admin",
    });
  });

  it("paginates administrator user reads instead of collecting the table", async () => {
    const t = createTestBackend();
    await seedAdminFixture(t);
    await t.run(async (ctx) => {
      for (let index = 0; index < 3; index += 1) {
        await ctx.db.insert("users", {
          clerkId: `paged-user-${index}`,
          name: `Paged User ${index}`,
          role: "user",
        });
      }
    });
    const asAdmin = t.withIdentity({ subject: "admin-user" });

    const firstPage = await asAdmin.query(api.users.getAllUsers, {
      paginationOpts: { numItems: 2, cursor: null },
    });
    expect(firstPage.page).toHaveLength(2);
    expect(firstPage.isDone).toBe(false);

    const secondPage = await asAdmin.query(api.users.getAllUsers, {
      paginationOpts: {
        numItems: 2,
        cursor: firstPage.continueCursor,
      },
    });
    expect(secondPage.page).toHaveLength(2);
  });

  it("returns zero activity without fabricating online presence", async () => {
    const t = createTestBackend();
    await seedAdminFixture(t);

    const metrics = await t
      .withIdentity({ subject: "admin-user" })
      .query(api.analytics.getDashboardMetrics, {});

    expect(metrics.realTime).toMatchObject({ activeUsers: 0, onlineNow: 0 });
    expect(typeof metrics.trends.growthRate).toBe("string");
    expect(metrics.trends.growthRate).toBe("0.0");
    expect(metrics.trends.growth).toMatchObject({
      status: "unavailable",
      percentage: null,
      formatted: "Unavailable",
      reason: "zero_baseline",
    });
  });

  it("excludes legacy template rows from dashboard activity metrics", async () => {
    const t = createTestBackend();
    const { userId } = await seedAdminFixture(t);
    const now = Date.now();
    await t.run(async (ctx) => {
      const templateOwnerId = await ctx.db.insert("users", {
        clerkId: "legacy-template-owner",
        name: "Legacy Template Owner",
      });
      await ctx.db.insert("lists", {
        userId,
        name: "Recent packing list",
        isTemplate: false,
        createdAt: now - 60_000,
        completedAt: now - 30_000,
      });
      await ctx.db.insert("lists", {
        userId: templateOwnerId,
        name: "Legacy template",
        isTemplate: true,
        createdAt: now - 60_000,
        completedAt: now - 30_000,
      });
    });

    const metrics = await t
      .withIdentity({ subject: "admin-user" })
      .query(api.analytics.getDashboardMetrics, {});

    expect(metrics.realTime).toMatchObject({
      activeUsers: 1,
      listsToday: 1,
      completionsToday: 1,
    });
    expect(metrics.trends.newListsToday).toBe(1);
    expect(metrics.trends.newListsWeek).toBe(1);
  });

  it("marks positive registration growth from a zero baseline as unavailable", async () => {
    const t = createTestBackend();
    await seedAdminFixture(t);
    const now = Date.now();
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        clerkId: "current-only",
        name: "Current Only",
        createdAt: now - 24 * 60 * 60 * 1000,
      });
    });

    const metrics = await t
      .withIdentity({ subject: "admin-user" })
      .query(api.analytics.getDashboardMetrics, {});

    const growthRate: string = metrics.trends.growthRate;
    expect(metrics.trends.newUsersWeek).toBe(1);
    expect(typeof growthRate).toBe("string");
    expect(growthRate).toBe("0.0");
    expect(metrics.trends.growth).toMatchObject({
      status: "unavailable",
      percentage: null,
      formatted: "Unavailable",
      reason: "zero_baseline",
    });
  });

  it("calculates growth when the prior seven-day registration baseline is positive", async () => {
    const t = createTestBackend();
    const { userId } = await seedAdminFixture(t);
    const now = Date.now();
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        clerkId: "current-one",
        name: "Current One",
        createdAt: now - 24 * 60 * 60 * 1000,
      });
      await ctx.db.insert("users", {
        clerkId: "current-two",
        name: "Current Two",
        createdAt: now - 2 * 24 * 60 * 60 * 1000,
      });
      await ctx.db.insert("users", {
        clerkId: "prior-one",
        name: "Prior One",
        createdAt: now - 8 * 24 * 60 * 60 * 1000,
      });
      await ctx.db.insert("lists", {
        userId,
        name: "Active route",
        isTemplate: false,
        createdAt: now - 3 * 24 * 60 * 60 * 1000,
      });
    });

    const metrics = await t
      .withIdentity({ subject: "admin-user" })
      .query(api.analytics.getDashboardMetrics, {});

    expect(metrics.realTime.activeUsers).toBe(1);
    expect(metrics.trends.newUsersWeek).toBe(2);
    expect(typeof metrics.trends.growthRate).toBe("string");
    expect(metrics.trends.growthRate).toBe("100.0");
    expect(metrics.trends.growth).toMatchObject({
      status: "available",
      percentage: 100,
      formatted: "+100.0%",
    });
  });
});

describe("canonical administration data", () => {
  it("reports ordinary lists and canonical templates in user details", async () => {
    const t = createTestBackend();
    const { userId } = await seedAdminFixture(t);
    await t.run(async (ctx) => {
      await ctx.db.insert("lists", {
        userId,
        name: "Ordinary list",
        isTemplate: false,
        updatedAt: 30,
      });
      await ctx.db.insert("lists", {
        userId,
        name: "Legacy template row",
        isTemplate: true,
        updatedAt: 40,
      });
      await ctx.db.insert("templates", {
        name: "Canonical template",
        description: "Current storage model",
        createdBy: userId,
        isPublic: false,
      });
    });

    const details = await t
      .withIdentity({ subject: "admin-user" })
      .query(api.users.getUserDetails, { userId });

    expect(details.stats).toEqual({
      totalLists: 1,
      completedLists: 0,
      templateCount: 1,
      activeLists: 1,
    });
    expect(details.recentLists).toEqual([
      expect.objectContaining({ name: "Ordinary list" }),
    ]);
    expect(details.recentLists[0]).not.toHaveProperty("isTemplate");
    expect(details.recentLists[0]).not.toHaveProperty("isPublic");
  });

  it("calculates positive and negative changes from adjacent seven-day periods", async () => {
    const t = createTestBackend();
    const { userId } = await seedAdminFixture(t);
    const now = Date.now();

    await t.run(async (ctx) => {
      const currentUserId = await ctx.db.insert("users", {
        clerkId: "current-active-user",
        name: "Current Active User",
      });

      await ctx.db.insert("lists", {
        userId,
        name: "Current completed list",
        isTemplate: false,
        createdAt: now - 2 * 24 * 60 * 60 * 1000,
        completedAt: now - 24 * 60 * 60 * 1000,
      });
      await ctx.db.insert("lists", {
        userId: currentUserId,
        name: "Current open list",
        isTemplate: false,
        createdAt: now - 3 * 24 * 60 * 60 * 1000,
      });

      for (let index = 0; index < 4; index += 1) {
        await ctx.db.insert("lists", {
          userId,
          name: `Prior list ${index + 1}`,
          isTemplate: false,
          createdAt: now - (8 + index) * 24 * 60 * 60 * 1000,
          completedAt:
            index < 3 ? now - (8 + index) * 24 * 60 * 60 * 1000 : undefined,
        });
      }

      await ctx.db.insert("templates", {
        name: "Used template",
        description: "Cumulative usage only",
        usageCount: 7,
      });
      await ctx.db.insert("templateStats", {
        key: "global",
        totalTemplates: 1,
        totalUsage: 7,
        updatedAt: now,
      });
    });

    const usage = await t
      .withIdentity({ subject: "admin-user" })
      .query(api.analytics.getSystemUsageAnalytics, {});
    const metrics = Object.fromEntries(
      usage.topMetrics.map((metric) => [metric.name, metric]),
    );

    expect(metrics["Active Users"]).toMatchObject({
      value: 2,
      change: { status: "available", percentage: 100, formatted: "+100.0%" },
    });
    expect(metrics["Lists Created"]).toMatchObject({
      value: 2,
      change: { status: "available", percentage: -50, formatted: "-50.0%" },
    });
    expect(metrics["Completion Rate"]).toMatchObject({
      value: "50%",
      change: {
        status: "available",
        percentage: expect.closeTo(-33.333, 2),
        formatted: "-33.3%",
      },
    });
    expect(metrics["Templates Used"]).toMatchObject({
      value: 7,
      change: {
        status: "unavailable",
        percentage: null,
        formatted: "Unavailable",
        reason: "historical_data_unavailable",
      },
    });
  });

  it("marks zero-baseline comparable changes as unavailable", async () => {
    const t = createTestBackend();
    const { userId } = await seedAdminFixture(t);
    const now = Date.now();
    await t.run(async (ctx) => {
      await ctx.db.insert("lists", {
        userId,
        name: "Only current list",
        isTemplate: false,
        createdAt: now - 24 * 60 * 60 * 1000,
        completedAt: now - 12 * 60 * 60 * 1000,
      });
    });

    const usage = await t
      .withIdentity({ subject: "admin-user" })
      .query(api.analytics.getSystemUsageAnalytics, {});

    for (const metric of usage.topMetrics.slice(0, 3)) {
      expect(metric.change).toMatchObject({
        status: "unavailable",
        percentage: null,
        formatted: "Unavailable",
        reason: "zero_baseline",
      });
    }
  });

  it("counts templates from the canonical templates table", async () => {
    const t = createTestBackend();
    await seedAdminFixture(t);
    await t.run(async (ctx) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", "regular-user"))
        .unique();
      if (!user) throw new Error("fixture user missing");
      await ctx.db.insert("lists", {
        userId: user._id,
        name: "Regular list",
        isTemplate: false,
      });
      await ctx.db.insert("lists", {
        userId: user._id,
        name: "Legacy template list",
        isTemplate: true,
      });
      await ctx.db.insert("templates", {
        name: "Canonical one",
        description: "One",
      });
      await ctx.db.insert("templates", {
        name: "Canonical two",
        description: "Two",
      });
      await ctx.db.insert("templateStats", {
        key: "global",
        totalTemplates: 2,
        totalUsage: 0,
        updatedAt: Date.now(),
      });
    });
    const asAdmin = t.withIdentity({ subject: "admin-user" });

    const listAnalytics = await asAdmin.query(api.analytics.getListAnalytics, {});
    const usage = await asAdmin.query(api.analytics.getSystemUsageAnalytics, {});
    expect(listAnalytics.summary).toMatchObject({
      totalLists: 1,
      totalTemplates: 2,
    });
    expect(usage.overview).toMatchObject({
      totalLists: 1,
      totalTemplates: 2,
    });
  });

  it("uses the template aggregate and usage index for dashboard analytics", async () => {
    const t = createTestBackend();
    await seedAdminFixture(t);
    await t.run(async (ctx) => {
      for (let index = 0; index < 12; index += 1) {
        await ctx.db.insert("templates", {
          name: `Template ${index}`,
          description: "Analytics fixture",
          usageCount: index,
        });
      }
      await ctx.db.insert("templateStats" as never, {
        key: "global",
        totalTemplates: 999,
        totalUsage: 777,
        updatedAt: Date.now(),
      } as never);
    });
    const asAdmin = t.withIdentity({ subject: "admin-user" });

    const [listAnalytics, usage, templates] = await Promise.all([
      asAdmin.query(api.analytics.getListAnalytics, {}),
      asAdmin.query(api.analytics.getSystemUsageAnalytics, {}),
      asAdmin.query(api.analytics.getTemplateAnalytics, {}),
    ]);

    expect(listAnalytics.summary.totalTemplates).toBe(999);
    expect(usage.overview.totalTemplates).toBe(999);
    expect(
      usage.topMetrics.find((metric) => metric.name === "Templates Used")?.value,
    ).toBe(777);
    expect(templates).toMatchObject({
      totalTemplates: 999,
      totalUsage: 777,
      averageUsage: 777 / 999,
    });
    expect(templates.popularTemplates).toHaveLength(10);
    expect(templates.popularTemplates[0]).toMatchObject({ usageCount: 11 });
    expect(templates.popularTemplates[9]).toMatchObject({ usageCount: 2 });
  });

  it("initializes template moderation from canonical template IDs", async () => {
    const t = createTestBackend();
    await seedAdminFixture(t);
    const ids = await t.run(async (ctx) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", "regular-user"))
        .unique();
      if (!user) throw new Error("fixture user missing");
      const legacyListId = await ctx.db.insert("lists", {
        userId: user._id,
        name: "Legacy template list",
        isTemplate: true,
      });
      const templateId = await ctx.db.insert("templates", {
        name: "Canonical template",
        description: "Moderate me",
        createdBy: user._id,
      });
      return { legacyListId, templateId };
    });
    const asAdmin = t.withIdentity({ subject: "admin-user" });

    await asAdmin.mutation(api.moderation.initializeModerationRecords, {});
    const records = await t.run((ctx) => ctx.db.query("moderation").collect());
    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          contentId: ids.templateId,
          contentType: "template",
        }),
      ]),
    );
    expect(records).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          contentId: ids.legacyListId,
          contentType: "template",
        }),
      ]),
    );
  });

  it("validates every full-settings contract invariant with stable codes", async () => {
    const cases: Array<{
      name: string;
      mutate: (settings: ReturnType<typeof validSettings>) => void;
    }> = [
      {
        name: "max users lower bound",
        mutate: (settings) => {
          settings.general.maxUsersPerAccount = 0;
        },
      },
      {
        name: "max users upper bound",
        mutate: (settings) => {
          settings.general.maxUsersPerAccount = 10001;
        },
      },
      {
        name: "max users integer",
        mutate: (settings) => {
          settings.general.maxUsersPerAccount = 1.5;
        },
      },
      {
        name: "max users finite",
        mutate: (settings) => {
          settings.general.maxUsersPerAccount = Number.NaN;
        },
      },
      {
        name: "default role enum",
        mutate: (settings) => {
          settings.general.defaultUserRole = "owner";
        },
      },
      {
        name: "password length integer",
        mutate: (settings) => {
          settings.security.passwordMinLength = 8.5;
        },
      },
      {
        name: "session timeout integer",
        mutate: (settings) => {
          settings.security.sessionTimeout = 24.5;
        },
      },
      {
        name: "login attempts lower bound",
        mutate: (settings) => {
          settings.security.maxLoginAttempts = 2;
        },
      },
      {
        name: "login attempts upper bound",
        mutate: (settings) => {
          settings.security.maxLoginAttempts = 11;
        },
      },
      {
        name: "login attempts integer",
        mutate: (settings) => {
          settings.security.maxLoginAttempts = 5.5;
        },
      },
      {
        name: "default theme enum",
        mutate: (settings) => {
          settings.appearance.defaultTheme = "sepia";
        },
      },
      {
        name: "cache duration integer",
        mutate: (settings) => {
          settings.performance.cacheDuration = 3600.5;
        },
      },
      {
        name: "file size integer",
        mutate: (settings) => {
          settings.performance.maxFileSize = 10.5;
        },
      },
    ];

    for (const testCase of cases) {
      const t = createTestBackend();
      await seedAdminFixture(t);
      const settings = validSettings();
      testCase.mutate(settings);
      await expectErrorCode(
        t.withIdentity({ subject: "admin-user" }).mutation(
          api.settings.updateSystemSettings,
          { settings },
        ),
        "VALIDATION",
      );
    }
  });

  it("validates single-setting names, types, ranges, integers, and enums", async () => {
    const cases = [
      { section: "missing", key: "siteName", value: "Nope" },
      { section: "general", key: "siteName", value: false },
      { section: "general", key: "maxUsersPerAccount", value: 0 },
      { section: "general", key: "maxUsersPerAccount", value: 1.5 },
      { section: "general", key: "defaultUserRole", value: "owner" },
      { section: "security", key: "passwordMinLength", value: 8.5 },
      { section: "security", key: "sessionTimeout", value: 24.5 },
      { section: "security", key: "maxLoginAttempts", value: 2 },
      { section: "security", key: "maxLoginAttempts", value: 5.5 },
      { section: "appearance", key: "defaultTheme", value: "sepia" },
      { section: "performance", key: "cacheDuration", value: 3600.5 },
      { section: "performance", key: "cacheDuration", value: Infinity },
      { section: "performance", key: "maxFileSize", value: 10.5 },
    ];

    for (const testCase of cases) {
      const t = createTestBackend();
      await seedAdminFixture(t);
      await expectErrorCode(
        t.withIdentity({ subject: "admin-user" }).mutation(
          api.settings.updateSettingValue,
          testCase,
        ),
        "VALIDATION",
      );
    }
  });

  it("paginates moderation queues beyond the first fifty records", async () => {
    const t = createTestBackend();
    const { userId } = await seedAdminFixture(t);
    await t.run(async (ctx) => {
      for (let index = 0; index < 55; index += 1) {
        const listId = await ctx.db.insert("lists", {
          userId,
          name: `Moderated list ${index}`,
          isTemplate: false,
        });
        await ctx.db.insert("moderation", {
          contentId: listId,
          contentType: "list",
          status: "pending",
          flaggedReason: "Review",
          createdAt: index,
          updatedAt: index,
        });
      }
    });
    const asAdmin = t.withIdentity({ subject: "admin-user" });

    const first = await asAdmin.query(api.moderation.getModerationQueue, {
      status: "pending",
      paginationOpts: { numItems: 50, cursor: null },
    });
    const second = await asAdmin.query(api.moderation.getModerationQueue, {
      status: "pending",
      paginationOpts: { numItems: 50, cursor: first.continueCursor },
    });

    expect(first.page).toHaveLength(50);
    expect(first.isDone).toBe(false);
    expect(second.page).toHaveLength(5);
    expect(second.isDone).toBe(true);
  });

  it("returns NOT_FOUND codes for missing moderation records", async () => {
    const t = createTestBackend();
    await seedAdminFixture(t);
    const asAdmin = t.withIdentity({ subject: "admin-user" });

    await expectErrorCode(
      asAdmin.mutation(api.moderation.approveContent, {
        contentId: "missing",
        contentType: "list",
      }),
      "NOT_FOUND",
    );
    await expectErrorCode(
      asAdmin.mutation(api.moderation.rejectContent, {
        contentId: "missing",
        contentType: "list",
        reason: "invalid",
      }),
      "NOT_FOUND",
    );
    await expectErrorCode(
      asAdmin.mutation(api.moderation.flagContent, {
        contentId: "missing",
        contentType: "list",
        flagReason: "invalid",
        severity: "high",
      }),
      "NOT_FOUND",
    );
  });
});

describe("Clerk synchronization API visibility", () => {
  it("synchronizes users only through internal mutations", async () => {
    vi.useFakeTimers();
    const t = createTestBackend();

    const userId = await t.mutation(internal.users.upsertFromClerk, {
      clerkId: "webhook-user",
      name: "Webhook User",
      email: "webhook@example.com",
      role: "admin",
    });
    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user).toMatchObject({
      clerkId: "webhook-user",
      role: "admin",
    });

    await t.mutation(internal.users.deleteFromClerk, {
      clerkId: "webhook-user",
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    await expect(t.run((ctx) => ctx.db.get(userId))).resolves.toBeNull();
    vi.useRealTimers();
  });

  it("deletes all owned records when Clerk deletes a user", async () => {
    vi.useFakeTimers();
    const t = createTestBackend();
    const fixture = await seedOwnedUserData(t);

    await t.mutation(internal.users.deleteFromClerk, {
      clerkId: "delete-me",
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const records = await t.run(async (ctx) =>
      Promise.all([
        ctx.db.get(fixture.ownerId),
        ctx.db.get(fixture.listId),
        ctx.db.get(fixture.categoryId),
        ctx.db.get(fixture.itemId),
        ctx.db.get(fixture.templateId),
        ctx.db.get(fixture.templateCategoryId),
        ctx.db.get(fixture.templateItemId),
        ctx.db.get(fixture.preferenceId),
        ctx.db.get(fixture.legacyImportId),
        ctx.db.get(fixture.outgoingShareId),
        ctx.db.get(fixture.incomingShareId),
        ctx.db.get(fixture.moderationId),
        ctx.db.get(fixture.historyId),
      ]),
    );
    expect(records).toEqual(Array.from({ length: 13 }, () => null));
    vi.useRealTimers();
  });

  it("deletes large template ownership graphs through scheduled batches", async () => {
    vi.useFakeTimers();
    const t = createTestBackend();
    const fixture = await seedOwnedUserData(t);
    await t.run(async (ctx) => {
      for (let index = 0; index < 120; index += 1) {
        await ctx.db.insert("templateItems", {
          templateId: fixture.templateId,
          templateCategoryId: fixture.templateCategoryId,
          categoryName: "Owned category",
          name: `Owned template item ${index}`,
          quantity: 1,
          priority: "medium",
          order: index + 1,
        });
      }
    });

    await t.mutation(internal.users.deleteFromClerk, {
      clerkId: "delete-me",
    });

    await expect(t.run((ctx) => ctx.db.get(fixture.ownerId))).resolves.not.toBeNull();
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const remaining = await t.run(async (ctx) => ({
      user: await ctx.db.get(fixture.ownerId),
      templates: await ctx.db
        .query("templates")
        .withIndex("by_creator", (q) => q.eq("createdBy", fixture.ownerId))
        .collect(),
      templateItems: await ctx.db
        .query("templateItems")
        .withIndex("by_template", (q) => q.eq("templateId", fixture.templateId))
        .collect(),
    }));
    expect(remaining).toEqual({ user: null, templates: [], templateItems: [] });
    vi.useRealTimers();
  });
});

// These compile-time assertions intentionally fail if webhook synchronization
// is ever added back to the browser-callable public API.
// @ts-expect-error Clerk synchronization must remain internal-only.
void api.users.upsertFromClerk;
// @ts-expect-error Clerk synchronization must remain internal-only.
void api.users.deleteFromClerk;
