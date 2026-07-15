import { convexTest } from "convex-test";
import type { FunctionArgs } from "convex/server";
import { describe, expect, it } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";
import type { DomainErrorCode } from "./lib/errors";
import { fingerprintLegacyData } from "../src/features/legacy-migration/normalize";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

function createTestBackend() {
  return convexTest(schema, modules);
}

async function expectErrorCode(
  promise: Promise<unknown>,
  code: DomainErrorCode,
  message?: RegExp,
) {
  try {
    await promise;
    throw new Error(`Expected ${code} error`);
  } catch (error) {
    let data = (error as { data?: unknown }).data;
    while (typeof data === "string") data = JSON.parse(data) as unknown;
    expect(data).toMatchObject({ code });
    if (message) expect(data).toMatchObject({ message: expect.stringMatching(message) });
  }
}

async function seedUsers(t: ReturnType<typeof createTestBackend>) {
  return t.run(async (ctx) => ({
    userA: await ctx.db.insert("users", {
      clerkId: "migration-user-a",
      name: "Migration User A",
    }),
    userB: await ctx.db.insert("users", {
      clerkId: "migration-user-b",
      name: "Migration User B",
    }),
  }));
}

type ImportLegacyDataArgs = FunctionArgs<
  typeof api.migrations.importLegacyData
>;

function createImportArgs(fingerprint?: string): ImportLegacyDataArgs {
  const payload = {
    lists: [
      {
        name: "Alpine weekend",
        description: "Cold-weather trip",
        tags: ["mountains"],
        completedAt: 1_704_164_645_000,
        createdAt: 1_577_934_245_000,
        updatedAt: 1_704_164_645_000,
        categories: [
          {
            name: "Clothing",
            color: "#334455",
            icon: "shirt",
            order: 0,
            collapsed: true,
            createdAt: 1_577_934_245_000,
            updatedAt: 1_577_934_245_000,
            items: [
              {
                name: "Wool socks",
                quantity: 3,
                packed: true,
                priority: "high" as const,
                notes: "Two hiking pairs",
                description: "Warm merino socks",
                weight: 0.2,
                tags: ["warm"],
                order: 0,
                createdAt: 1_577_934_245_000,
                updatedAt: 1_577_934_245_000,
              },
            ],
          },
        ],
      },
    ],
    preferences: {
      theme: "dark" as const,
      defaultPriority: "high" as const,
      autoSave: false,
    },
    templates: [
      {
        name: "Custom conference",
        description: "Personal event template",
        tags: ["business"],
        isPublic: false,
        usageCount: 2,
        icon: "briefcase-business",
        duration: "3 days",
        difficulty: "intermediate" as const,
        season: "all" as const,
        createdAt: 1_623_050_950_000,
        updatedAt: 1_623_137_350_000,
        categories: [
          {
            name: "Work",
            color: "#123456",
            icon: "laptop",
            order: 7,
            collapsed: true,
            createdAt: 1_600_000_000_000,
            updatedAt: 1_600_000_100_000,
            items: [
              {
                name: "Laptop",
                quantity: 1,
                packed: false,
                priority: "essential" as const,
                notes: "Encrypted",
                description: "Workstation",
                weight: 1.75,
                tags: ["electronics", "work"],
                order: 4,
                createdAt: 1_600_000_200_000,
                updatedAt: 1_600_000_300_000,
              },
            ],
          },
          {
            name: "Work",
            color: "#654321",
            icon: "briefcase",
            order: 2,
            collapsed: false,
            createdAt: 1_500_000_000_000,
            updatedAt: 1_500_000_100_000,
            items: [],
          },
        ],
      },
    ],
  };
  return {
    sourceKey: "zustand:pack-list-storage:v1" as const,
    fingerprint: fingerprint ?? fingerprintLegacyData(payload),
    ...payload,
  };
}

function refreshFingerprint(args: ReturnType<typeof createImportArgs>) {
  args.fingerprint = fingerprintLegacyData({
    lists: args.lists,
    templates: args.templates,
    preferences: args.preferences,
  });
  return args;
}

describe("legacy data migration", () => {
  it("requires authentication before inspecting or importing legacy data", async () => {
    const t = createTestBackend();
    await expectErrorCode(
      t.mutation(api.migrations.importLegacyData, createImportArgs()),
      "UNAUTHENTICATED",
    );
  });

  it("imports lists and templates atomically under the server-derived user", async () => {
    const t = createTestBackend();
    const { userA } = await seedUsers(t);
    const asA = t.withIdentity({ subject: "migration-user-a" });

    await expect(
      asA.mutation(api.migrations.importLegacyData, createImportArgs()),
    ).resolves.toEqual({
      status: "imported",
      listsImported: 1,
      templatesImported: 1,
    });

    const records = await t.run(async (ctx) => ({
      users: await ctx.db.query("users").collect(),
      lists: await ctx.db.query("lists").collect(),
      categories: await ctx.db.query("categories").collect(),
      items: await ctx.db.query("items").collect(),
      templates: await ctx.db.query("templates").collect(),
      templateCategories: await ctx.db.query("templateCategories").collect(),
      templateItems: await ctx.db.query("templateItems").collect(),
      imports: await ctx.db.query("legacyImports").collect(),
    }));
    expect(records.users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _id: userA,
          preferences: {
            theme: "dark",
            defaultPriority: "high",
            autoSave: false,
          },
        }),
      ]),
    );
    expect(records.lists).toEqual([
      expect.objectContaining({
        userId: userA,
        name: "Alpine weekend",
        completedAt: 1_704_164_645_000,
      }),
    ]);
    expect(records.categories).toEqual([
      expect.objectContaining({ name: "Clothing", collapsed: true }),
    ]);
    expect(records.items).toEqual([
      expect.objectContaining({ name: "Wool socks", packed: true, priority: "high" }),
    ]);
    expect(records.templates).toEqual([
      expect.objectContaining({
        createdBy: userA,
        name: "Custom conference",
        icon: "briefcase-business",
        isOfficial: false,
        categoryCount: 2,
        itemCount: 1,
      }),
    ]);
    expect(records.templateCategories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Work",
          color: "#123456",
          icon: "laptop",
          order: 7,
          collapsed: true,
          createdAt: 1_600_000_000_000,
          updatedAt: 1_600_000_100_000,
        }),
        expect.objectContaining({
          name: "Work",
          color: "#654321",
          icon: "briefcase",
          order: 2,
          collapsed: false,
        }),
      ]),
    );
    expect(records.templateItems).toEqual([
      expect.objectContaining({
        categoryName: "Work",
        templateCategoryId: expect.any(String),
        name: "Laptop",
        priority: "essential",
        notes: "Encrypted",
        description: "Workstation",
        weight: 1.75,
        tags: ["electronics", "work"],
        order: 4,
        createdAt: 1_600_000_200_000,
        updatedAt: 1_600_000_300_000,
      }),
    ]);
    expect(records.imports).toEqual([
      expect.objectContaining({
        userId: userA,
        sourceKey: "zustand:pack-list-storage:v1",
        listsImported: 1,
        templatesImported: 1,
      }),
    ]);
  });

  it("rejects imported public templates above the authenticated owner's publication quota", async () => {
    const t = createTestBackend();
    const { userA } = await seedUsers(t);
    await t.run(async (ctx) => {
      for (let index = 0; index < 20; index += 1) {
        await ctx.db.insert("templates", {
          name: `Published ${index}`,
          description: "Existing public template",
          createdBy: userA,
          isPublic: true,
          categoryCount: 0,
          itemCount: 0,
        });
      }
    });
    const args = createImportArgs();
    args.lists = [];
    args.preferences = undefined;
    args.templates[0].isPublic = true;
    refreshFingerprint(args);

    await expectErrorCode(
      t.withIdentity({ subject: "migration-user-a" }).mutation(
        api.migrations.importLegacyData,
        args,
      ),
      "VALIDATION",
      /public template/i,
    );
    const counts = await t.run(async (ctx) => ({
      templates: (await ctx.db.query("templates").collect()).length,
      imports: (await ctx.db.query("legacyImports").collect()).length,
    }));
    expect(counts).toEqual({ templates: 20, imports: 0 });
  });

  it("rejects imported templates above per-template category and item limits", async () => {
    const buildOversizedImports = [
      () => {
        const args = createImportArgs();
        args.lists = [];
        args.preferences = undefined;
        args.templates[0].categories = Array.from(
          { length: 51 },
          (_, index) => ({
            ...structuredClone(args.templates[0].categories[1]!),
            name: `Category ${index}`,
            order: index,
          }),
        );
        return args;
      },
      () => {
        const args = createImportArgs();
        args.lists = [];
        args.preferences = undefined;
        args.templates[0].categories = [
          {
            ...structuredClone(args.templates[0].categories[0]!),
            items: Array.from({ length: 201 }, (_, index) => ({
              ...structuredClone(args.templates[0].categories[0]!.items[0]!),
              name: `Item ${index}`,
              order: index,
            })),
          },
        ];
        return args;
      },
    ];

    for (const buildArgs of buildOversizedImports) {
      const t = createTestBackend();
      await seedUsers(t);
      const args = refreshFingerprint(buildArgs());
      await expectErrorCode(
        t.withIdentity({ subject: "migration-user-a" }).mutation(
          api.migrations.importLegacyData,
          args,
        ),
        "VALIDATION",
      );
      const counts = await t.run(async (ctx) => ({
        templates: (await ctx.db.query("templates").collect()).length,
        imports: (await ctx.db.query("legacyImports").collect()).length,
      }));
      expect(counts).toEqual({ templates: 0, imports: 0 });
    }
  });

  it("round-trips empty and duplicate-name template categories through reads and application", async () => {
    const t = createTestBackend();
    await seedUsers(t);
    const asA = t.withIdentity({ subject: "migration-user-a" });
    await asA.mutation(api.migrations.importLegacyData, createImportArgs());

    const templates = await asA.query(api.templates.getOwnedTemplateSummaries, {
      paginationOpts: { numItems: 50, cursor: null },
    });
    const importedSummary = templates.page.find(
      (template) => template.name === "Custom conference",
    );
    const importedTemplate = await asA.query(api.templates.getTemplate, {
      templateId: importedSummary!._id,
    });
    expect(importedTemplate.categories).toEqual([
      expect.objectContaining({
        name: "Work",
        color: "#654321",
        icon: "briefcase",
        order: 2,
        collapsed: false,
        items: [],
      }),
      expect.objectContaining({
        name: "Work",
        color: "#123456",
        icon: "laptop",
        order: 7,
        collapsed: true,
        items: [
          expect.objectContaining({
            name: "Laptop",
            description: "Workstation",
            weight: 1.75,
            tags: ["electronics", "work"],
            order: 4,
            createdAt: 1_600_000_200_000,
            updatedAt: 1_600_000_300_000,
          }),
        ],
      }),
    ]);

    const listId = await asA.mutation(api.templates.applyTemplate, {
      templateId: importedTemplate!._id,
      listName: "Applied conference",
    });
    const applied = await t.run(async (ctx) => {
      const categories = (
        await ctx.db
          .query("categories")
          .withIndex("by_list", (q) => q.eq("listId", listId))
          .collect()
      ).sort((left, right) => left.order - right.order);
      const items = (
        await Promise.all(
          categories.map((category) =>
            ctx.db
              .query("items")
              .withIndex("by_category", (q) => q.eq("categoryId", category._id))
              .collect(),
          ),
        )
      ).flat();
      return { categories, items };
    });
    expect(applied.categories).toEqual([
      expect.objectContaining({
        name: "Work",
        color: "#654321",
        icon: "briefcase",
        order: 2,
        collapsed: false,
        createdAt: 1_500_000_000_000,
        updatedAt: 1_500_000_100_000,
      }),
      expect.objectContaining({
        name: "Work",
        color: "#123456",
        icon: "laptop",
        order: 7,
        collapsed: true,
        createdAt: 1_600_000_000_000,
        updatedAt: 1_600_000_100_000,
      }),
    ]);
    expect(applied.items).toEqual([
      expect.objectContaining({
        name: "Laptop",
        packed: false,
        description: "Workstation",
        weight: 1.75,
        tags: ["electronics", "work"],
        order: 4,
        createdAt: 1_600_000_200_000,
        updatedAt: 1_600_000_300_000,
      }),
    ]);
  });

  it("returns already_imported for the same user and fingerprint without duplicating records", async () => {
    const t = createTestBackend();
    await seedUsers(t);
    const asA = t.withIdentity({ subject: "migration-user-a" });
    const args = createImportArgs();

    await asA.mutation(api.migrations.importLegacyData, args);
    await expect(asA.mutation(api.migrations.importLegacyData, args)).resolves.toEqual({
      status: "already_imported",
      listsImported: 1,
      templatesImported: 1,
    });
    await expect(
      asA.query(api.migrations.getLegacyImportStatus, {
        sourceKey: args.sourceKey,
        fingerprint: args.fingerprint,
      }),
    ).resolves.toEqual({
      status: "already_imported",
      listsImported: 1,
      templatesImported: 1,
    });

    const counts = await t.run(async (ctx) => ({
      lists: (await ctx.db.query("lists").collect()).length,
      templates: (await ctx.db.query("templates").collect()).length,
      imports: (await ctx.db.query("legacyImports").collect()).length,
    }));
    expect(counts).toEqual({ lists: 1, templates: 1, imports: 1 });
  });

  it("scopes deduplication to the authenticated user", async () => {
    const t = createTestBackend();
    await seedUsers(t);
    const args = createImportArgs();

    await t
      .withIdentity({ subject: "migration-user-a" })
      .mutation(api.migrations.importLegacyData, args);
    await expect(
      t
        .withIdentity({ subject: "migration-user-b" })
        .mutation(api.migrations.importLegacyData, args),
    ).resolves.toMatchObject({ status: "imported" });

    const counts = await t.run(async (ctx) => ({
      lists: (await ctx.db.query("lists").collect()).length,
      templates: (await ctx.db.query("templates").collect()).length,
      imports: (await ctx.db.query("legacyImports").collect()).length,
    }));
    expect(counts).toEqual({ lists: 2, templates: 2, imports: 2 });
  });

  it("validates the entire payload before writing any records", async () => {
    const t = createTestBackend();
    const { userA } = await seedUsers(t);
    const args = createImportArgs();
    args.templates[0].categories[0].items[0].name = "";
    refreshFingerprint(args);

    await expectErrorCode(
      t
        .withIdentity({ subject: "migration-user-a" })
        .mutation(api.migrations.importLegacyData, args),
      "VALIDATION",
      /name/i,
    );

    const counts = await t.run(async (ctx) => ({
      user: await ctx.db.get(userA),
      lists: (await ctx.db.query("lists").collect()).length,
      categories: (await ctx.db.query("categories").collect()).length,
      items: (await ctx.db.query("items").collect()).length,
      templates: (await ctx.db.query("templates").collect()).length,
      imports: (await ctx.db.query("legacyImports").collect()).length,
    }));
    expect(counts.user?.preferences).toBeUndefined();
    expect(counts).toMatchObject({
      lists: 0,
      categories: 0,
      items: 0,
      templates: 0,
      imports: 0,
    });
  });

  it("rejects oversized imports with manual-export guidance before writing", async () => {
    const t = createTestBackend();
    await seedUsers(t);
    const args = createImportArgs();
    args.lists = Array.from({ length: 101 }, (_, index) => ({
      ...args.lists[0],
      name: `List ${index}`,
    }));
    refreshFingerprint(args);

    await expectErrorCode(
      t
        .withIdentity({ subject: "migration-user-a" })
        .mutation(api.migrations.importLegacyData, args),
      "VALIDATION",
      /manual export/i,
    );
    expect(
      await t.run(async (ctx) => (await ctx.db.query("legacyImports").collect()).length),
    ).toBe(0);
  });

  it("rejects a caller-supplied fingerprint that does not match the normalized payload", async () => {
    const t = createTestBackend();
    await seedUsers(t);
    const args = createImportArgs("fnv1a128:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

    await expectErrorCode(
      t
        .withIdentity({ subject: "migration-user-a" })
        .mutation(api.migrations.importLegacyData, args),
      "VALIDATION",
      /fingerprint.*match/i,
    );

    const counts = await t.run(async (ctx) => ({
      lists: (await ctx.db.query("lists").collect()).length,
      templates: (await ctx.db.query("templates").collect()).length,
      imports: (await ctx.db.query("legacyImports").collect()).length,
    }));
    expect(counts).toEqual({ lists: 0, templates: 0, imports: 0 });
  });

  it("rejects payloads whose total atomic document writes exceed the safe bound", async () => {
    const t = createTestBackend();
    await seedUsers(t);
    const args = createImportArgs();
    args.templates = [];
    args.lists[0].categories[0].items = Array.from(
      { length: 2_000 },
      (_, index) => ({
        name: `Item ${index}`,
        quantity: 1,
        packed: false,
        priority: "high" as const,
        notes: "",
        description: "",
        weight: 0,
        tags: [],
        order: index,
        createdAt: 0,
        updatedAt: 0,
      }),
    );
    refreshFingerprint(args);

    await expectErrorCode(
      t
        .withIdentity({ subject: "migration-user-a" })
        .mutation(api.migrations.importLegacyData, args),
      "VALIDATION",
      /manual export/i,
    );
    expect(
      await t.run(async (ctx) => (await ctx.db.query("lists").collect()).length),
    ).toBe(0);
  });

  it("rejects a large valid-text payload before exceeding transaction byte limits", async () => {
    const t = createTestBackend();
    await seedUsers(t);
    const base = createImportArgs();
    const longDescription = "D".repeat(5_000);
    const maximumTags = Array.from(
      { length: 50 },
      (_, index) => `${index}`.padEnd(100, "t"),
    );
    base.lists = Array.from({ length: 100 }, (_, index) => ({
      ...structuredClone(base.lists[0]),
      name: `List ${index}`,
      description: longDescription,
      tags: maximumTags,
      categories: [],
    }));
    base.templates = Array.from({ length: 100 }, (_, index) => ({
      ...structuredClone(base.templates[0]),
      name: `Template ${index}`,
      description: longDescription,
      tags: maximumTags,
      categories: [],
    }));
    refreshFingerprint(base);

    await expectErrorCode(
      t
        .withIdentity({ subject: "migration-user-a" })
        .mutation(api.migrations.importLegacyData, base),
      "VALIDATION",
      /manual export/i,
    );
    const counts = await t.run(async (ctx) => ({
      lists: (await ctx.db.query("lists").collect()).length,
      templates: (await ctx.db.query("templates").collect()).length,
      imports: (await ctx.db.query("legacyImports").collect()).length,
    }));
    expect(counts).toEqual({ lists: 0, templates: 0, imports: 0 });
  });
});
