import { convexTest } from "convex-test";
import type { FunctionArgs } from "convex/server";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
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

async function seedTenantFixture(t: ReturnType<typeof createTestBackend>) {
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
      name: "List A",
      isTemplate: false,
    });
    const listA2 = await ctx.db.insert("lists", {
      userId: userA,
      name: "List A2",
      isTemplate: false,
    });
    const listB = await ctx.db.insert("lists", {
      userId: userB,
      name: "List B",
      isTemplate: false,
    });

    const categoryA1 = await ctx.db.insert("categories", {
      listId: listA,
      name: "A1",
      order: 0,
    });
    const categoryA2 = await ctx.db.insert("categories", {
      listId: listA,
      name: "A2",
      order: 1,
    });
    const categoryAOtherList = await ctx.db.insert("categories", {
      listId: listA2,
      name: "A Other",
      order: 0,
    });
    const categoryB = await ctx.db.insert("categories", {
      listId: listB,
      name: "B",
      order: 0,
    });

    const itemA = await ctx.db.insert("items", {
      categoryId: categoryA1,
      name: "A item",
      quantity: 1,
      packed: false,
      priority: "medium",
      order: 0,
    });
    const itemB = await ctx.db.insert("items", {
      categoryId: categoryB,
      name: "B item",
      quantity: 1,
      packed: false,
      priority: "medium",
      order: 0,
    });

    return {
      listA,
      listB,
      categoryA1,
      categoryA2,
      categoryAOtherList,
      categoryB,
      itemA,
      itemB,
    };
  });
}

type ImportListArgs = FunctionArgs<typeof api.lists.importList>;

function validImportArgs(): ImportListArgs {
  return {
    version: 1,
    list: {
      name: "Imported",
      description: "Full backup",
      tags: ["travel"],
    },
    categories: [
      {
        name: "Documents",
        color: "blue",
        items: [
          {
            name: "Passport",
            quantity: 1,
            priority: "essential",
            packed: true,
            description: "Keep accessible",
            notes: "Front pocket",
            weight: 0.2,
            tags: ["documents"],
          },
        ],
      },
    ],
  };
}

async function domainDocumentCounts(t: ReturnType<typeof createTestBackend>) {
  return t.run(async (ctx) => ({
    lists: (await ctx.db.query("lists").collect()).length,
    categories: (await ctx.db.query("categories").collect()).length,
    items: (await ctx.db.query("items").collect()).length,
  }));
}

const invalidImportCases: Array<{
  label: string;
  buildArgs: () => ImportListArgs;
}> = [
  {
    label: "a blank list name",
    buildArgs: () => {
      const args = validImportArgs();
      args.list.name = "   ";
      return args;
    },
  },
  {
    label: "an oversized list name",
    buildArgs: () => {
      const args = validImportArgs();
      args.list.name = "x".repeat(201);
      return args;
    },
  },
  {
    label: "oversized list text",
    buildArgs: () => {
      const args = validImportArgs();
      args.list.description = "x".repeat(5_001);
      return args;
    },
  },
  {
    label: "too many list tags",
    buildArgs: () => {
      const args = validImportArgs();
      args.list.tags = Array.from({ length: 51 }, (_, index) => `tag-${index}`);
      return args;
    },
  },
  {
    label: "an invalid list tag",
    buildArgs: () => {
      const args = validImportArgs();
      args.list.tags = ["   "];
      return args;
    },
  },
  {
    label: "a blank category name",
    buildArgs: () => {
      const args = validImportArgs();
      args.categories[0]!.name = "   ";
      return args;
    },
  },
  {
    label: "an oversized category name",
    buildArgs: () => {
      const args = validImportArgs();
      args.categories[0]!.name = "x".repeat(201);
      return args;
    },
  },
  {
    label: "oversized category text",
    buildArgs: () => {
      const args = validImportArgs();
      args.categories[0]!.color = "x".repeat(5_001);
      return args;
    },
  },
  {
    label: "a blank item name",
    buildArgs: () => {
      const args = validImportArgs();
      args.categories[0]!.items[0]!.name = "   ";
      return args;
    },
  },
  {
    label: "an oversized item name",
    buildArgs: () => {
      const args = validImportArgs();
      args.categories[0]!.items[0]!.name = "x".repeat(201);
      return args;
    },
  },
  {
    label: "a non-positive item quantity",
    buildArgs: () => {
      const args = validImportArgs();
      args.categories[0]!.items[0]!.quantity = 0;
      return args;
    },
  },
  {
    label: "a fractional item quantity",
    buildArgs: () => {
      const args = validImportArgs();
      args.categories[0]!.items[0]!.quantity = 1.5;
      return args;
    },
  },
  {
    label: "an unsupported item priority",
    buildArgs: () => {
      const args = validImportArgs();
      args.categories[0]!.items[0]!.priority = "urgent";
      return args;
    },
  },
  {
    label: "a negative item weight",
    buildArgs: () => {
      const args = validImportArgs();
      args.categories[0]!.items[0]!.weight = -0.1;
      return args;
    },
  },
  {
    label: "a non-finite item weight",
    buildArgs: () => {
      const args = validImportArgs();
      args.categories[0]!.items[0]!.weight = Number.POSITIVE_INFINITY;
      return args;
    },
  },
  {
    label: "oversized item text",
    buildArgs: () => {
      const args = validImportArgs();
      args.categories[0]!.items[0]!.notes = "x".repeat(5_001);
      return args;
    },
  },
  {
    label: "too many item tags",
    buildArgs: () => {
      const args = validImportArgs();
      args.categories[0]!.items[0]!.tags = Array.from(
        { length: 51 },
        (_, index) => `tag-${index}`,
      );
      return args;
    },
  },
];

describe("list tenant isolation", () => {
  it("maps malformed route list identifiers to the stable NOT_FOUND domain state", async () => {
    const t = createTestBackend();
    await seedTenantFixture(t);

    await expectErrorCode(
      t.withIdentity({ subject: "user-a" }).query(api.lists.getListByRouteId, {
        listId: "example",
      }),
      "NOT_FOUND",
    );
  });

  it("derives list ownership from the authenticated identity", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    const asA = t.withIdentity({ subject: "user-a" });
    const asB = t.withIdentity({ subject: "user-b" });

    const lists = await asA.query(api.lists.getListSummaries, {
      paginationOpts: { numItems: 50, cursor: null },
    });
    expect(lists.page.map((list) => list._id)).toEqual([
      expect.any(String),
      fixture.listA,
    ]);
    const detail = await asA.query(api.lists.getList, { listId: fixture.listA });
    expect(detail).not.toHaveProperty("isTemplate");
    expect(detail).not.toHaveProperty("isPublic");
    await expectErrorCode(
      asB.query(api.lists.getList, { listId: fixture.listA }),
      "FORBIDDEN",
    );
    await expectErrorCode(
      asB.mutation(api.lists.updateList, {
        listId: fixture.listA,
        name: "Stolen",
      }),
      "FORBIDDEN",
    );
  });

  it("rejects foreign category and item mutations", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    const asB = t.withIdentity({ subject: "user-b" });

    await expectErrorCode(
      asB.mutation(api.lists.updateCategory, {
        categoryId: fixture.categoryA1,
        name: "Stolen category",
      }),
      "FORBIDDEN",
    );
    await expectErrorCode(
      asB.mutation(api.lists.updateItem, {
        itemId: fixture.itemA,
        name: "Stolen item",
      }),
      "FORBIDDEN",
    );
    await expectErrorCode(
      asB.mutation(api.lists.deleteItem, { itemId: fixture.itemA }),
      "FORBIDDEN",
    );
  });

  it("rejects deleting another tenant's list", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    const asB = t.withIdentity({ subject: "user-b" });

    await expectErrorCode(
      asB.mutation(api.lists.deleteList, { listId: fixture.listA }),
      "FORBIDDEN",
    );
    await expect(t.run((ctx) => ctx.db.get(fixture.listA))).resolves.not.toBeNull();
  });

  it("rejects deleting another tenant's category", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    const asB = t.withIdentity({ subject: "user-b" });

    await expectErrorCode(
      asB.mutation(api.lists.deleteCategory, {
        categoryId: fixture.categoryA1,
      }),
      "FORBIDDEN",
    );
    await expect(
      t.run((ctx) => ctx.db.get(fixture.categoryA1)),
    ).resolves.not.toBeNull();
  });

  it("deletes list shares and moderation metadata with an owned list", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    const linkedIds = await t.run(async (ctx) => {
      const userA = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", "user-a"))
        .unique();
      const userB = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", "user-b"))
        .unique();
      if (!userA || !userB) throw new Error("fixture users missing");

      const shareId = await ctx.db.insert("listShares", {
        listId: fixture.listA,
        sharedByUserId: userA._id,
        sharedWithUserId: userB._id,
        permission: "view",
      });
      const moderationIds = await Promise.all(
        [fixture.listA, fixture.categoryA1, fixture.itemA].map((contentId) =>
          ctx.db.insert("moderation", {
            contentId,
            contentType: "list",
            status: "pending",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }),
        ),
      );
      const historyIds = await Promise.all(
        [fixture.listA, fixture.categoryA1, fixture.itemA].map((contentId) =>
          ctx.db.insert("moderationHistory", {
            contentId,
            contentType: "list",
            action: "submitted",
            timestamp: Date.now(),
          }),
        ),
      );
      return { shareId, moderationIds, historyIds };
    });

    await t
      .withIdentity({ subject: "user-a" })
      .mutation(api.lists.deleteList, { listId: fixture.listA });

    const linkedRecords = await t.run((ctx) =>
      Promise.all([
        ctx.db.get(linkedIds.shareId),
        ...linkedIds.moderationIds.map((id) => ctx.db.get(id)),
        ...linkedIds.historyIds.map((id) => ctx.db.get(id)),
      ]),
    );
    expect(linkedRecords).toEqual(Array.from({ length: 7 }, () => null));
  });

  it("deletes moderation metadata with an owned category and its items", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    const linkedIds = await t.run(async (ctx) => ({
      moderationIds: await Promise.all(
        [fixture.categoryA1, fixture.itemA].map((contentId) =>
          ctx.db.insert("moderation", {
            contentId,
            contentType: "category",
            status: "pending",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }),
        ),
      ),
      historyIds: await Promise.all(
        [fixture.categoryA1, fixture.itemA].map((contentId) =>
          ctx.db.insert("moderationHistory", {
            contentId,
            contentType: "category",
            action: "submitted",
            timestamp: Date.now(),
          }),
        ),
      ),
    }));

    await t
      .withIdentity({ subject: "user-a" })
      .mutation(api.lists.deleteCategory, {
        categoryId: fixture.categoryA1,
      });

    const linkedRecords = await t.run((ctx) =>
      Promise.all([
        ...linkedIds.moderationIds.map((id) => ctx.db.get(id)),
        ...linkedIds.historyIds.map((id) => ctx.db.get(id)),
      ]),
    );
    expect(linkedRecords).toEqual(Array.from({ length: 4 }, () => null));
  });

  it("rejects foreign item IDs before reordering", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    const asA = t.withIdentity({ subject: "user-a" });

    await expectErrorCode(
      asA.mutation(api.lists.reorderItems, {
        categoryId: fixture.categoryA1,
        itemIds: [fixture.itemA, fixture.itemB],
      }),
      "FORBIDDEN",
    );
    const itemB = await t.run((ctx) => ctx.db.get(fixture.itemB));
    expect(itemB).toMatchObject({
      categoryId: fixture.categoryB,
      order: 0,
    });
  });

  it("rejects category IDs from another list before reordering", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    const asA = t.withIdentity({ subject: "user-a" });

    await expectErrorCode(
      asA.mutation(api.lists.reorderCategories, {
        listId: fixture.listA,
        categoryIds: [fixture.categoryA2, fixture.categoryB],
      }),
      "FORBIDDEN",
    );

    const categories = await t.run((ctx) =>
      Promise.all([
        ctx.db.get(fixture.categoryA1),
        ctx.db.get(fixture.categoryA2),
      ]),
    );
    expect(categories.map((category) => category?.order)).toEqual([0, 1]);
  });

  it("rejects moving an item to another tenant category", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    const asA = t.withIdentity({ subject: "user-a" });

    await expectErrorCode(
      asA.mutation(api.lists.moveItem, {
        itemId: fixture.itemA,
        toCategoryId: fixture.categoryB,
        toIndex: 0,
      }),
      "FORBIDDEN",
    );

    const item = await t.run((ctx) => ctx.db.get(fixture.itemA));
    expect(item).toMatchObject({
      categoryId: fixture.categoryA1,
      order: 0,
    });
  });

  it("reorders categories and moves items for the owner", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    const asA = t.withIdentity({ subject: "user-a" });

    await asA.mutation(api.lists.reorderCategories, {
      listId: fixture.listA,
      categoryIds: [fixture.categoryA2, fixture.categoryA1],
    });
    await asA.mutation(api.lists.moveItem, {
      itemId: fixture.itemA,
      toCategoryId: fixture.categoryA2,
      toIndex: 0,
    });

    const state = await t.run(async (ctx) => ({
      categoryA1: await ctx.db.get(fixture.categoryA1),
      categoryA2: await ctx.db.get(fixture.categoryA2),
      itemA: await ctx.db.get(fixture.itemA),
    }));
    expect(state.categoryA1?.order).toBe(1);
    expect(state.categoryA2?.order).toBe(0);
    expect(state.itemA).toMatchObject({
      categoryId: fixture.categoryA2,
      order: 0,
    });
  });

  it("adds the complete item payload in one mutation", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);

    const itemId = await t.withIdentity({ subject: "user-a" }).mutation(
      api.lists.addItem,
      {
        categoryId: fixture.categoryA1,
        name: "Passport",
        quantity: 1,
        packed: false,
        priority: "essential",
        notes: "Front pocket",
        description: "Keep accessible",
        weight: 0.2,
        tags: ["documents"],
      },
    );

    await expect(t.run((ctx) => ctx.db.get(itemId))).resolves.toMatchObject({
      name: "Passport",
      description: "Keep accessible",
      weight: 0.2,
      tags: ["documents"],
    });
  });

  it.each([
    ["blank list names", () => ({ name: "   " })],
    ["oversized list names", () => ({ name: "x".repeat(201) })],
    [
      "oversized list descriptions",
      () => ({ name: "Trip", description: "x".repeat(5_001) }),
    ],
    [
      "too many list tags",
      () => ({
        name: "Trip",
        tags: Array.from({ length: 51 }, (_, index) => `tag-${index}`),
      }),
    ],
    ["blank list tags", () => ({ name: "Trip", tags: ["   "] })],
    [
      "oversized list tags",
      () => ({ name: "Trip", tags: ["x".repeat(101)] }),
    ],
  ])("rejects %s at the public list mutation boundary", async (_label, buildArgs) => {
    const t = createTestBackend();
    await seedTenantFixture(t);
    await expectErrorCode(
      t
        .withIdentity({ subject: "user-a" })
        .mutation(api.lists.createList, buildArgs() as never),
      "VALIDATION",
    );
  });

  it("keeps legacy template flags storage-only and creates ordinary private lists", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    const asA = t.withIdentity({ subject: "user-a" });

    await expect(
      asA.mutation(api.lists.createList, {
        name: "Rejected legacy flags",
        isTemplate: true,
      } as never),
    ).rejects.toThrow();
    await expect(
      asA.mutation(api.lists.updateList, {
        listId: fixture.listA,
        isPublic: true,
      } as never),
    ).rejects.toThrow();

    const listId = await asA.mutation(api.lists.createList, {
      name: "Ordinary list",
    });
    await expect(t.run((ctx) => ctx.db.get(listId))).resolves.toMatchObject({
      name: "Ordinary list",
      isTemplate: false,
      isPublic: false,
    });
  });

  it.each([
    ["blank item names", { name: "   ", quantity: 1, priority: "medium" }],
    [
      "oversized item names",
      { name: "x".repeat(201), quantity: 1, priority: "medium" },
    ],
    ["zero quantities", { name: "Passport", quantity: 0, priority: "medium" }],
    [
      "fractional quantities",
      { name: "Passport", quantity: 1.5, priority: "medium" },
    ],
    [
      "unsupported priorities",
      { name: "Passport", quantity: 1, priority: "urgent" },
    ],
    [
      "negative weights",
      { name: "Passport", quantity: 1, priority: "medium", weight: -1 },
    ],
    [
      "oversized notes",
      {
        name: "Passport",
        quantity: 1,
        priority: "medium",
        notes: "x".repeat(5_001),
      },
    ],
    [
      "too many tags",
      {
        name: "Passport",
        quantity: 1,
        priority: "medium",
        tags: Array.from({ length: 51 }, (_, index) => `tag-${index}`),
      },
    ],
    [
      "blank tags",
      { name: "Passport", quantity: 1, priority: "medium", tags: ["   "] },
    ],
  ])("rejects %s for authoritative item writes", async (_label, itemArgs) => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    await expectErrorCode(
      t.withIdentity({ subject: "user-a" }).mutation(api.lists.addItem, {
        categoryId: fixture.categoryA1,
        ...itemArgs,
      } as never),
      "VALIDATION",
    );
  });

  it("trims required names and tags consistently across list, category, and item writes", async () => {
    const t = createTestBackend();
    await seedTenantFixture(t);
    const asA = t.withIdentity({ subject: "user-a" });

    const listId = await asA.mutation(api.lists.createList, {
      name: "  Trimmed list  ",
      tags: ["  travel  "],
    });
    const categoryId = await asA.mutation(api.lists.addCategory, {
      listId,
      name: "  Documents  ",
    });
    const itemId = await asA.mutation(api.lists.addItem, {
      categoryId,
      name: "  Passport  ",
      quantity: 1,
      priority: "essential",
      tags: ["  identity  "],
    });

    const stored = await t.run(async (ctx) => ({
      list: await ctx.db.get(listId),
      category: await ctx.db.get(categoryId),
      item: await ctx.db.get(itemId),
    }));
    expect(stored.list).toMatchObject({
      name: "Trimmed list",
      tags: ["travel"],
    });
    expect(stored.category).toMatchObject({ name: "Documents" });
    expect(stored.item).toMatchObject({
      name: "Passport",
      tags: ["identity"],
    });
  });

  it("applies the same semantic validation to list, category, and item updates", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    const asA = t.withIdentity({ subject: "user-a" });

    await expectErrorCode(
      asA.mutation(api.lists.updateList, {
        listId: fixture.listA,
        description: "x".repeat(5_001),
      }),
      "VALIDATION",
    );
    await expectErrorCode(
      asA.mutation(api.lists.updateCategory, {
        categoryId: fixture.categoryA1,
        name: "   ",
      }),
      "VALIDATION",
    );
    await expectErrorCode(
      asA.mutation(api.lists.updateItem, {
        itemId: fixture.itemA,
        quantity: 0,
      }),
      "VALIDATION",
    );

    const unchanged = await t.run(async (ctx) => ({
      list: await ctx.db.get(fixture.listA),
      category: await ctx.db.get(fixture.categoryA1),
      item: await ctx.db.get(fixture.itemA),
    }));
    expect(unchanged.list).toMatchObject({ name: "List A" });
    expect(unchanged.category).toMatchObject({ name: "A1" });
    expect(unchanged.item).toMatchObject({ quantity: 1 });
  });

  it("updates item fields and category atomically", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    const asA = t.withIdentity({ subject: "user-a" });

    await expectErrorCode(
      asA.mutation(api.lists.updateItemAndMove, {
        itemId: fixture.itemA,
        name: "Changed before a rejected move",
        toCategoryId: fixture.categoryB,
        toIndex: 0,
      }),
      "FORBIDDEN",
    );

    await expect(t.run((ctx) => ctx.db.get(fixture.itemA))).resolves.toMatchObject({
      name: "A item",
      categoryId: fixture.categoryA1,
      order: 0,
    });

    await asA.mutation(api.lists.updateItemAndMove, {
      itemId: fixture.itemA,
      name: "  Passport  ",
      quantity: 2,
      priority: "essential",
      toCategoryId: fixture.categoryA2,
      toIndex: 0,
    });

    await expect(t.run((ctx) => ctx.db.get(fixture.itemA))).resolves.toMatchObject({
      name: "Passport",
      quantity: 2,
      priority: "essential",
      categoryId: fixture.categoryA2,
      order: 0,
    });
  });

  it("rejects invalid atomic item edits before moving the item", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    const asA = t.withIdentity({ subject: "user-a" });

    await expectErrorCode(
      asA.mutation(api.lists.updateItemAndMove, {
        itemId: fixture.itemA,
        name: "   ",
        toCategoryId: fixture.categoryA2,
        toIndex: 0,
      }),
      "VALIDATION",
    );

    await expect(t.run((ctx) => ctx.db.get(fixture.itemA))).resolves.toMatchObject({
      name: "A item",
      categoryId: fixture.categoryA1,
      order: 0,
    });
  });

  it("adjusts item quantity from the current authoritative value", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    const asA = t.withIdentity({ subject: "user-a" });

    await Promise.all([
      asA.mutation(api.lists.adjustItemQuantity, {
        itemId: fixture.itemA,
        delta: 1,
      }),
      asA.mutation(api.lists.adjustItemQuantity, {
        itemId: fixture.itemA,
        delta: 1,
      }),
    ]);

    await expect(t.run((ctx) => ctx.db.get(fixture.itemA))).resolves.toMatchObject({
      quantity: 3,
    });
  });

  it("rejects invalid quantity deltas without changing the item", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    const asA = t.withIdentity({ subject: "user-a" });

    await expectErrorCode(
      asA.mutation(api.lists.adjustItemQuantity, {
        itemId: fixture.itemA,
        delta: -1,
      }),
      "VALIDATION",
    );
    await expectErrorCode(
      asA.mutation(api.lists.adjustItemQuantity, {
        itemId: fixture.itemA,
        delta: 0.5,
      }),
      "VALIDATION",
    );

    await expect(t.run((ctx) => ctx.db.get(fixture.itemA))).resolves.toMatchObject({
      quantity: 1,
    });
  });

  it("paginates list summaries without returning nested item documents", async () => {
    const t = createTestBackend();
    await seedTenantFixture(t);
    const page = await t.withIdentity({ subject: "user-a" }).query(
      api.lists.getListSummaries,
      { paginationOpts: { numItems: 1, cursor: null } },
    );

    expect(page.page).toHaveLength(1);
    expect(page.page[0]).toMatchObject({
      categoryCount: expect.any(Number),
      itemCount: expect.any(Number),
      packedCount: expect.any(Number),
    });
    expect(page.page[0]).not.toHaveProperty("categories");
    expect(page.page[0]).not.toHaveProperty("isTemplate");
    expect(page.page[0]).not.toHaveProperty("isPublic");
    expect(page.isDone).toBe(false);
  });

  it("excludes legacy template rows from list summaries and account export", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    await t.run(async (ctx) => {
      const source = await ctx.db.get(fixture.listA);
      if (!source) throw new Error("Expected list fixture");
      await ctx.db.insert("lists", {
        userId: source.userId,
        name: "Legacy template row",
        isTemplate: true,
        isPublic: false,
      });
    });
    const asA = t.withIdentity({ subject: "user-a" });

    const summaries = await asA.query(api.lists.getListSummaries, {
      paginationOpts: { numItems: 50, cursor: null },
    });
    const accountExport = await asA.query(api.lists.getListExportPage, {
      paginationOpts: { numItems: 50, cursor: null },
    });

    expect(summaries.page.map((list) => list.name)).not.toContain(
      "Legacy template row",
    );
    expect(accountExport.page.map((list) => list.name)).not.toContain(
      "Legacy template row",
    );
  });

  it("rejects list summary pages above the server limit", async () => {
    const t = createTestBackend();
    await seedTenantFixture(t);

    await expectErrorCode(
      t.withIdentity({ subject: "user-a" }).query(api.lists.getListSummaries, {
        paginationOpts: { numItems: 51, cursor: null },
      }),
      "VALIDATION",
    );
  });

  it("paginates full list data through the dedicated export query", async () => {
    const t = createTestBackend();
    await seedTenantFixture(t);
    const page = await t.withIdentity({ subject: "user-a" }).query(
      api.lists.getListExportPage,
      { paginationOpts: { numItems: 1, cursor: null } },
    );

    expect(page.page).toHaveLength(1);
    expect(page.page[0]?.name).toBe("List A");
    expect(page.page[0]).toHaveProperty("categories");
    expect(page.page[0]?.categories[0]).toHaveProperty("items");
    expect(page.page[0]).not.toHaveProperty("isTemplate");
    expect(page.page[0]).not.toHaveProperty("isPublic");
    expect(page.isDone).toBe(false);
  });

  it.each(invalidImportCases)(
    "rejects $label with VALIDATION and rolls back the import",
    async ({ buildArgs }) => {
      const t = createTestBackend();
      await seedTenantFixture(t);
      const before = await domainDocumentCounts(t);

      await expectErrorCode(
        t
          .withIdentity({ subject: "user-a" })
          .mutation(api.lists.importList, buildArgs()),
        "VALIDATION",
      );

      await expect(domainDocumentCounts(t)).resolves.toEqual(before);
    },
  );

  it("imports a complete list atomically for the authenticated owner", async () => {
    const t = createTestBackend();
    await seedTenantFixture(t);
    const asA = t.withIdentity({ subject: "user-a" });

    const listId = await asA.mutation(api.lists.importList, validImportArgs());

    const imported = await asA.query(api.lists.getList, { listId });
    expect(imported).toMatchObject({
      name: "Imported",
      description: "Full backup",
      tags: ["travel"],
      categories: [
        expect.objectContaining({
          name: "Documents",
          items: [
            expect.objectContaining({
              name: "Passport",
              packed: true,
              description: "Keep accessible",
              weight: 0.2,
              tags: ["documents"],
            }),
          ],
        }),
      ],
    });
  });

  it("keeps order fields behind the exact-set reorder mutations", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    const asA = t.withIdentity({ subject: "user-a" });

    await expect(
      asA.mutation(api.lists.addCategory, {
        listId: fixture.listA,
        name: "Injected order",
        order: -1,
      } as never),
    ).rejects.toThrow();
    await expect(
      asA.mutation(api.lists.updateCategory, {
        categoryId: fixture.categoryA1,
        order: 42,
      } as never),
    ).rejects.toThrow();
    await expect(
      asA.mutation(api.lists.addItem, {
        categoryId: fixture.categoryA1,
        name: "Injected item order",
        quantity: 1,
        priority: "medium",
        order: 99,
      } as never),
    ).rejects.toThrow();
  });

  it("clears an existing item weight explicitly", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    await t.run((ctx) => ctx.db.patch(fixture.itemA, { weight: 1.5 }));

    await t.withIdentity({ subject: "user-a" }).mutation(api.lists.updateItem, {
      itemId: fixture.itemA,
      weight: null,
    });

    const updated = await t.run((ctx) => ctx.db.get(fixture.itemA));
    expect(updated?._id).toBe(fixture.itemA);
    expect(updated?.weight).toBeUndefined();
  });

  it("does not rewrite sibling timestamps for a field-only item edit", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    const siblingId = await t.run(async (ctx) => {
      await ctx.db.patch(fixture.itemA, { updatedAt: 10 });
      return ctx.db.insert("items", {
        categoryId: fixture.categoryA1,
        name: "Sibling",
        quantity: 1,
        packed: false,
        priority: "low",
        order: 1,
        updatedAt: 20,
      });
    });

    await t.withIdentity({ subject: "user-a" }).mutation(
      api.lists.updateItemAndMove,
      { itemId: fixture.itemA, name: "Field edit only" },
    );

    const state = await t.run(async (ctx) => ({
      item: await ctx.db.get(fixture.itemA),
      sibling: await ctx.db.get(siblingId),
    }));
    expect(state.item?.name).toBe("Field edit only");
    expect(state.sibling?.updatedAt).toBe(20);
  });

  it("deletes moderation metadata with an owned item", async () => {
    const t = createTestBackend();
    const fixture = await seedTenantFixture(t);
    const linked = await t.run(async (ctx) => ({
      moderationId: await ctx.db.insert("moderation", {
        contentId: fixture.itemA,
        contentType: "item",
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
      historyId: await ctx.db.insert("moderationHistory", {
        contentId: fixture.itemA,
        contentType: "item",
        action: "submitted",
        timestamp: Date.now(),
      }),
    }));

    await t.withIdentity({ subject: "user-a" }).mutation(api.lists.deleteItem, {
      itemId: fixture.itemA,
    });

    await expect(
      t.run((ctx) =>
        Promise.all([
          ctx.db.get(linked.moderationId),
          ctx.db.get(linked.historyId),
        ]),
      ),
    ).resolves.toEqual([null, null]);
  });

  it("rejects imports above the safe document limit before writing", async () => {
    const t = createTestBackend();
    await seedTenantFixture(t);
    const args = validImportArgs();
    args.categories = Array.from({ length: 6 }, (_, categoryIndex) => ({
      name: `Category ${categoryIndex}`,
      items: Array.from({ length: 200 }, (_, itemIndex) => ({
        name: `Item ${categoryIndex}-${itemIndex}`,
        quantity: 1,
        priority: "medium",
      })),
    }));
    const before = await domainDocumentCounts(t);

    await expectErrorCode(
      t.withIdentity({ subject: "user-a" }).mutation(api.lists.importList, args),
      "VALIDATION",
    );
    await expect(domainDocumentCounts(t)).resolves.toEqual(before);
  });
});
