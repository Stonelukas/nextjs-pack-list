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
  message?: RegExp,
) {
  try {
    await promise;
    throw new Error(`Expected ${code} error`);
  } catch (error) {
    let data = (error as { data?: unknown }).data;
    while (typeof data === "string") data = JSON.parse(data) as unknown;
    expect(data).toMatchObject({ code });
    if (message) {
      expect(data).toMatchObject({ message: expect.stringMatching(message) });
    }
  }
}

async function seedTemplateFixture(t: ReturnType<typeof createTestBackend>) {
  return t.run(async (ctx) => {
    const userA = await ctx.db.insert("users", {
      clerkId: "user-a",
      name: "User A",
      role: "user",
    });
    const userB = await ctx.db.insert("users", {
      clerkId: "user-b",
      name: "User B",
      role: "user",
    });
    const listA = await ctx.db.insert("lists", {
      userId: userA,
      name: "A list",
      description: "Reusable source",
      isTemplate: false,
      tags: ["travel"],
    });
    const listB = await ctx.db.insert("lists", {
      userId: userB,
      name: "B list",
      isTemplate: false,
    });
    const sourceCategory = await ctx.db.insert("categories", {
      listId: listA,
      name: "Documents",
      color: "blue",
      icon: "passport",
      order: 0,
    });
    const sourceItem = await ctx.db.insert("items", {
      categoryId: sourceCategory,
      name: "Passport",
      quantity: 1,
      packed: false,
      priority: "essential",
      notes: "Front pocket",
      tags: ["identity"],
      order: 0,
    });
    const publicTemplate = await ctx.db.insert("templates", {
      name: "Public",
      description: "Public template",
      isPublic: true,
      createdBy: userA,
      categoryCount: 1,
      itemCount: 1,
    });
    const publicCategory = await ctx.db.insert("templateCategories", {
      templateId: publicTemplate,
      name: "Documents",
      order: 0,
    });
    await ctx.db.insert("templateItems", {
      templateId: publicTemplate,
      templateCategoryId: publicCategory,
      categoryName: "Documents",
      name: "Passport",
      quantity: 1,
      priority: "essential",
      order: 0,
    });
    const privateA = await ctx.db.insert("templates", {
      name: "Private A",
      description: "A private template",
      isPublic: false,
      createdBy: userA,
      categoryCount: 0,
      itemCount: 0,
    });
    const privateB = await ctx.db.insert("templates", {
      name: "Private B",
      description: "B private template",
      isPublic: false,
      createdBy: userB,
      categoryCount: 1,
      itemCount: 1,
    });
    const privateBCategory = await ctx.db.insert("templateCategories", {
      templateId: privateB,
      name: "Secrets",
      order: 0,
    });
    await ctx.db.insert("templateItems", {
      templateId: privateB,
      templateCategoryId: privateBCategory,
      categoryName: "Secrets",
      name: "Secret item",
      quantity: 1,
      priority: "high",
      order: 0,
    });

    return {
      userA,
      userB,
      listA,
      listB,
      sourceCategory,
      sourceItem,
      publicTemplate,
      privateA,
      privateB,
    };
  });
}

async function templateDocumentCounts(
  t: ReturnType<typeof createTestBackend>,
) {
  return t.run(async (ctx) => ({
    templates: (await ctx.db.query("templates").collect()).length,
    categories: (await ctx.db.query("templateCategories").collect()).length,
    items: (await ctx.db.query("templateItems").collect()).length,
    lists: (await ctx.db.query("lists").collect()).length,
  }));
}

describe("bounded template visibility and ownership", () => {
  it("paginates public summaries with denormalized counts and no nested children", async () => {
    const t = createTestBackend();
    const fixture = await seedTemplateFixture(t);
    await t.run(async (ctx) => {
      for (let index = 0; index < 3; index += 1) {
        await ctx.db.insert("templates", {
          name: `Public ${index}`,
          description: "Bounded public template",
          isPublic: true,
          categoryCount: index,
          itemCount: index * 2,
        });
      }
    });

    const first = await t.query(api.templates.getPublicTemplateSummaries, {
      paginationOpts: { numItems: 2, cursor: null },
    });
    expect(first.page).toHaveLength(2);
    expect(first.isDone).toBe(false);
    expect(first.page[0]).toMatchObject({
      categoryCount: expect.any(Number),
      itemCount: expect.any(Number),
    });
    expect(first.page[0]).not.toHaveProperty("categories");
    expect(first.page[0]).not.toHaveProperty("createdBy");

    const second = await t.query(api.templates.getPublicTemplateSummaries, {
      paginationOpts: { numItems: 2, cursor: first.continueCursor },
    });
    const visibleIds = [...first.page, ...second.page].map(
      (template) => template._id,
    );
    expect(visibleIds).toContain(fixture.publicTemplate);
    expect(visibleIds).not.toContain(fixture.privateA);
    expect(visibleIds).not.toContain(fixture.privateB);
  });

  it("paginates only the authenticated owner's summaries", async () => {
    const t = createTestBackend();
    const fixture = await seedTemplateFixture(t);

    const owned = await t.withIdentity({ subject: "user-a" }).query(
      api.templates.getOwnedTemplateSummaries,
      { paginationOpts: { numItems: 50, cursor: null } },
    );
    expect(owned.page.map((template) => template._id)).toEqual(
      expect.arrayContaining([fixture.publicTemplate, fixture.privateA]),
    );
    expect(owned.page.map((template) => template._id)).not.toContain(
      fixture.privateB,
    );
    expect(owned.page.every((template) => !("categories" in template))).toBe(
      true,
    );
    expect(owned.page.every((template) => template.isOwned === true)).toBe(true);
    expect(owned.page.every((template) => !("createdBy" in template))).toBe(true);
  });

  it("paginates full owner-scoped template export data", async () => {
    const t = createTestBackend();
    const fixture = await seedTemplateFixture(t);
    const asA = t.withIdentity({ subject: "user-a" });

    const first = await asA.query(api.templates.getOwnedTemplateExportPage, {
      paginationOpts: { numItems: 1, cursor: null },
    });
    const second = await asA.query(api.templates.getOwnedTemplateExportPage, {
      paginationOpts: { numItems: 1, cursor: first.continueCursor },
    });
    const exported = [...first.page, ...second.page];

    expect(exported.map((template) => template._id)).toEqual(
      expect.arrayContaining([fixture.publicTemplate, fixture.privateA]),
    );
    expect(exported).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ _id: fixture.privateB }),
      ]),
    );
    expect(
      exported.find((template) => template._id === fixture.publicTemplate),
    ).toMatchObject({
      categories: [
        expect.objectContaining({
          name: "Documents",
          items: [expect.objectContaining({ name: "Passport" })],
        }),
      ],
    });
  });

  it("rejects summary page sizes above the server limit", async () => {
    const t = createTestBackend();
    await seedTemplateFixture(t);

    await expectErrorCode(
      t.query(api.templates.getPublicTemplateSummaries, {
        paginationOpts: { numItems: 51, cursor: null },
      }),
      "VALIDATION",
    );
  });

  it("loads children only through one authorized detail query", async () => {
    const t = createTestBackend();
    const fixture = await seedTemplateFixture(t);

    const publicDetail = await t.query(api.templates.getTemplate, {
      templateId: fixture.publicTemplate,
    });
    expect(publicDetail).toMatchObject({
      _id: fixture.publicTemplate,
      categoryCount: 1,
      itemCount: 1,
      isOwned: false,
      categories: [
        expect.objectContaining({
          name: "Documents",
          items: [expect.objectContaining({ name: "Passport" })],
        }),
      ],
    });

    expect(publicDetail).not.toHaveProperty("createdBy");

    const privateDetail = await t.withIdentity({ subject: "user-a" }).query(
      api.templates.getTemplate,
      { templateId: fixture.privateA },
    );
    expect(privateDetail._id).toBe(fixture.privateA);

    await expectErrorCode(
      t.withIdentity({ subject: "user-a" }).query(api.templates.getTemplate, {
        templateId: fixture.privateB,
      }),
      "FORBIDDEN",
    );
  });

  it("does not reveal private template existence to anonymous callers", async () => {
    const t = createTestBackend();
    const fixture = await seedTemplateFixture(t);
    const missingTemplate = await t.run(async (ctx) => {
      const templateId = await ctx.db.insert("templates", {
        name: "Deleted",
        description: "Missing after deletion",
        isPublic: false,
        createdBy: fixture.userA,
      });
      await ctx.db.delete(templateId);
      return templateId;
    });

    await expectErrorCode(
      t.query(api.templates.getTemplate, { templateId: fixture.privateA }),
      "NOT_FOUND",
    );
    await expectErrorCode(
      t.query(api.templates.getTemplate, { templateId: missingTemplate }),
      "NOT_FOUND",
    );
  });

  it("rejects oversized legacy child sets before returning detail or applying them", async () => {
    const t = createTestBackend();
    const fixture = await seedTemplateFixture(t);
    await t.run(async (ctx) => {
      for (let index = 0; index < 201; index += 1) {
        await ctx.db.insert("templateItems", {
          templateId: fixture.publicTemplate,
          categoryName: "Documents",
          name: `Overflow ${index}`,
          quantity: 1,
          priority: "medium",
          order: index + 1,
        });
      }
    });

    await expectErrorCode(
      t.query(api.templates.getTemplate, {
        templateId: fixture.publicTemplate,
      }),
      "VALIDATION",
      /item/i,
    );
    const before = await templateDocumentCounts(t);
    await expectErrorCode(
      t.withIdentity({ subject: "user-a" }).mutation(
        api.templates.applyTemplate,
        {
          templateId: fixture.publicTemplate,
          listName: "Too large",
        },
      ),
      "VALIDATION",
      /item/i,
    );
    await expect(templateDocumentCounts(t)).resolves.toEqual(before);
  });
});

describe("template write limits", () => {
  it("enforces a per-owner public-template publication quota", async () => {
    const t = createTestBackend();
    const fixture = await seedTemplateFixture(t);
    await t.run(async (ctx) => {
      for (let index = 0; index < 19; index += 1) {
        await ctx.db.insert("templates", {
          name: `Owned public ${index}`,
          description: "Published",
          createdBy: fixture.userA,
          isPublic: true,
          categoryCount: 0,
          itemCount: 0,
        });
      }
    });

    await expectErrorCode(
      t.withIdentity({ subject: "user-a" }).mutation(
        api.templates.createTemplateFromList,
        {
          listId: fixture.listA,
          name: "One too many",
          description: "Quota should reject this publication",
          isPublic: true,
        },
      ),
      "VALIDATION",
      /public template/i,
    );
  });

  it("checks the public quota before reading an oversized source list", async () => {
    const t = createTestBackend();
    const fixture = await seedTemplateFixture(t);
    await t.run(async (ctx) => {
      for (let index = 0; index < 19; index += 1) {
        await ctx.db.insert("templates", {
          name: `Owned public ${index}`,
          description: "Published",
          createdBy: fixture.userA,
          isPublic: true,
          categoryCount: 0,
          itemCount: 0,
        });
      }
      for (let index = 1; index < 201; index += 1) {
        await ctx.db.insert("items", {
          categoryId: fixture.sourceCategory,
          name: `Overflow item ${index}`,
          quantity: 1,
          packed: false,
          priority: "medium",
          order: index,
        });
      }
    });

    await expectErrorCode(
      t.withIdentity({ subject: "user-a" }).mutation(
        api.templates.createTemplateFromList,
        {
          listId: fixture.listA,
          name: "Rejected before fanout",
          description: "Quota wins",
          isPublic: true,
        },
      ),
      "VALIDATION",
      /public template/i,
    );
  });

  it.each([
    ["blank names", { name: "   ", description: "Valid" }],
    [
      "oversized descriptions",
      { name: "Valid", description: "x".repeat(5_001) },
    ],
    [
      "oversized categories",
      { name: "Valid", description: "Valid", category: "x".repeat(5_001) },
    ],
  ])("rejects %s before creating a template", async (_label, invalidArgs) => {
    const t = createTestBackend();
    const fixture = await seedTemplateFixture(t);
    const before = await templateDocumentCounts(t);

    await expectErrorCode(
      t.withIdentity({ subject: "user-a" }).mutation(
        api.templates.createTemplateFromList,
        { listId: fixture.listA, ...invalidArgs },
      ),
      "VALIDATION",
    );
    await expect(templateDocumentCounts(t)).resolves.toEqual(before);
  });

  it("validates copied category and item fields before writing", async () => {
    const invalidSources = [
      async (t: ReturnType<typeof createTestBackend>, fixture: Awaited<ReturnType<typeof seedTemplateFixture>>) => {
        await t.run((ctx) => ctx.db.patch(fixture.sourceCategory, { name: "   " }));
      },
      async (t: ReturnType<typeof createTestBackend>, fixture: Awaited<ReturnType<typeof seedTemplateFixture>>) => {
        await t.run((ctx) => ctx.db.patch(fixture.sourceItem, { quantity: 0 }));
      },
    ];

    for (const invalidate of invalidSources) {
      const t = createTestBackend();
      const fixture = await seedTemplateFixture(t);
      await invalidate(t, fixture);
      const before = await templateDocumentCounts(t);
      await expectErrorCode(
        t.withIdentity({ subject: "user-a" }).mutation(
          api.templates.createTemplateFromList,
          {
            listId: fixture.listA,
            name: "Rejected",
            description: "Invalid source",
          },
        ),
        "VALIDATION",
      );
      await expect(templateDocumentCounts(t)).resolves.toEqual(before);
    }
  });

  it("rejects lists with more than 50 categories before copying", async () => {
    const t = createTestBackend();
    const fixture = await seedTemplateFixture(t);
    await t.run(async (ctx) => {
      for (let index = 1; index < 51; index += 1) {
        await ctx.db.insert("categories", {
          listId: fixture.listA,
          name: `Category ${index}`,
          order: index,
        });
      }
    });
    const before = await templateDocumentCounts(t);

    await expectErrorCode(
      t.withIdentity({ subject: "user-a" }).mutation(
        api.templates.createTemplateFromList,
        {
          listId: fixture.listA,
          name: "Too many categories",
          description: "Rejected",
        },
      ),
      "VALIDATION",
      /categories/i,
    );
    await expect(templateDocumentCounts(t)).resolves.toEqual(before);
  });

  it("rejects categories with more than 200 items before copying", async () => {
    const t = createTestBackend();
    const fixture = await seedTemplateFixture(t);
    await t.run(async (ctx) => {
      for (let index = 1; index < 201; index += 1) {
        await ctx.db.insert("items", {
          categoryId: fixture.sourceCategory,
          name: `Item ${index}`,
          quantity: 1,
          packed: false,
          priority: "medium",
          order: index,
        });
      }
    });
    const before = await templateDocumentCounts(t);

    await expectErrorCode(
      t.withIdentity({ subject: "user-a" }).mutation(
        api.templates.createTemplateFromList,
        {
          listId: fixture.listA,
          name: "Too many items",
          description: "Rejected",
        },
      ),
      "VALIDATION",
      /items/i,
    );
    await expect(templateDocumentCounts(t)).resolves.toEqual(before);
  });

  it("stores validated summary counts when creating a template", async () => {
    const t = createTestBackend();
    const fixture = await seedTemplateFixture(t);

    const templateId = await t.withIdentity({ subject: "user-a" }).mutation(
      api.templates.createTemplateFromList,
      {
        listId: fixture.listA,
        name: "  Owned  ",
        description: "Reusable",
      },
    );

    await expect(t.run((ctx) => ctx.db.get(templateId))).resolves.toMatchObject({
      name: "Owned",
      categoryCount: 1,
      itemCount: 1,
      createdBy: fixture.userA,
      isPublic: false,
    });
  });

  it("validates destination list fields before applying a template", async () => {
    const t = createTestBackend();
    const fixture = await seedTemplateFixture(t);
    const before = await templateDocumentCounts(t);

    await expectErrorCode(
      t.withIdentity({ subject: "user-a" }).mutation(
        api.templates.applyTemplate,
        { templateId: fixture.publicTemplate, listName: "   " },
      ),
      "VALIDATION",
    );
    await expectErrorCode(
      t.withIdentity({ subject: "user-a" }).mutation(
        api.templates.applyTemplate,
        {
          templateId: fixture.publicTemplate,
          listName: "Applied",
          listDescription: "x".repeat(5_001),
        },
      ),
      "VALIDATION",
    );
    await expect(templateDocumentCounts(t)).resolves.toEqual(before);
  });

  it("rejects applying another user's private template", async () => {
    const t = createTestBackend();
    const fixture = await seedTemplateFixture(t);

    await expectErrorCode(
      t.withIdentity({ subject: "user-a" }).mutation(
        api.templates.applyTemplate,
        {
          templateId: fixture.privateB,
          listName: "Copied secrets",
        },
      ),
      "FORBIDDEN",
    );
  });

  it("creates templates only from lists owned by the caller", async () => {
    const t = createTestBackend();
    const fixture = await seedTemplateFixture(t);

    await expectErrorCode(
      t.withIdentity({ subject: "user-a" }).mutation(
        api.templates.createTemplateFromList,
        {
          listId: fixture.listB,
          name: "Stolen",
          description: "Stolen template",
        },
      ),
      "FORBIDDEN",
    );
  });

  it("repairs missing summary counts when official templates already exist", async () => {
    vi.useFakeTimers();
    const t = createTestBackend();
    const templateId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("templates", {
        name: "Existing official",
        description: "Created before summary counts",
        isOfficial: true,
        isPublic: true,
      });
      const categoryId = await ctx.db.insert("templateCategories", {
        templateId: id,
        name: "Documents",
        order: 0,
      });
      await ctx.db.insert("templateItems", {
        templateId: id,
        templateCategoryId: categoryId,
        categoryName: "Documents",
        name: "Passport",
        quantity: 1,
        priority: "essential",
        order: 0,
      });
      return id;
    });

    await t.mutation(internal.templates.seedTemplates, {});
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    vi.useRealTimers();

    await expect(t.run((ctx) => ctx.db.get(templateId))).resolves.toMatchObject({
      categoryCount: 1,
      itemCount: 1,
    });
  });

  it("repairs pre-count user templates while seeding a fresh official catalog", async () => {
    vi.useFakeTimers();
    const t = createTestBackend();
    const templateId = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        clerkId: "legacy-template-owner",
        name: "Legacy Owner",
      });
      const id = await ctx.db.insert("templates", {
        name: "Legacy personal template",
        description: "Created before summary counts",
        createdBy: userId,
        isPublic: false,
      });
      const categoryId = await ctx.db.insert("templateCategories", {
        templateId: id,
        name: "Documents",
        order: 0,
      });
      await ctx.db.insert("templateItems", {
        templateId: id,
        templateCategoryId: categoryId,
        categoryName: "Documents",
        name: "Passport",
        quantity: 1,
        priority: "essential",
        order: 0,
      });
      return id;
    });

    await t.mutation(internal.templates.seedTemplates, {});
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    vi.useRealTimers();

    await expect(t.run((ctx) => ctx.db.get(templateId))).resolves.toMatchObject({
      categoryCount: 1,
      itemCount: 1,
    });
  });

  it("idempotently seeds the merged official catalog with summary counts", async () => {
    vi.useFakeTimers();
    const t = createTestBackend();

    await expect(t.mutation(internal.templates.seedTemplates, {})).resolves.toEqual({
      message: "Official templates synchronized; metadata repair started",
      inserted: 9,
      skipped: 0,
      total: 9,
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    await expect(t.mutation(internal.templates.seedTemplates, {})).resolves.toEqual({
      message: "Official templates synchronized; metadata repair started",
      inserted: 0,
      skipped: 9,
      total: 9,
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    vi.useRealTimers();
    const seeded = await t.run(async (ctx) => ({
      templates: await ctx.db
        .query("templates")
        .withIndex("by_official", (q) => q.eq("isOfficial", true))
        .collect(),
      categories: await ctx.db.query("templateCategories").collect(),
      items: await ctx.db.query("templateItems").collect(),
    }));
    expect(seeded.templates).toHaveLength(9);
    expect(seeded.templates.map((template) => template.name).sort()).toEqual([
      "Beach Vacation",
      "Business Trip",
      "Camping Adventure",
      "International Travel",
      "Road Trip Essentials",
      "Ski/Snowboard Trip",
      "Traveling with Baby",
      "Wedding Guest",
      "Weekend Getaway",
    ]);
    expect(seeded.templates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Beach Vacation",
          categoryCount: 4,
          itemCount: 30,
        }),
        expect.objectContaining({
          name: "International Travel",
          categoryCount: 4,
          itemCount: 20,
        }),
      ]),
    );
    expect(seeded.categories).toHaveLength(39);
    expect(seeded.items).toHaveLength(264);
  });
});
