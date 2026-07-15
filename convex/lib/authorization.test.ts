import { afterEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";
import { requireAdmin, requireCurrentUser, requireIdentity } from "./auth";
import {
  requireOwnedCategory,
  requireOwnedItem,
  requireOwnedList,
} from "./authorization";
import { domainError, type DomainErrorCode } from "./errors";

const modules = import.meta.glob(["../**/*.ts", "!../**/*.test.ts"]);

type UserRole = "user" | "admin";

function createTestBackend() {
  return convexTest(schema, modules);
}

async function seedUser(
  t: ReturnType<typeof createTestBackend>,
  clerkId: string,
  role?: UserRole,
) {
  return t.run(async (ctx) =>
    ctx.db.insert("users", {
      clerkId,
      name: `${clerkId} name`,
      ...(role === undefined ? {} : { role }),
    }),
  );
}

async function seedOwnedTree(
  t: ReturnType<typeof createTestBackend>,
  userId: Awaited<ReturnType<typeof seedUser>>,
) {
  return t.run(async (ctx) => {
    const listId = await ctx.db.insert("lists", {
      userId,
      name: "Trip",
      isTemplate: false,
    });
    const categoryId = await ctx.db.insert("categories", {
      listId,
      name: "Clothes",
      order: 0,
    });
    const itemId = await ctx.db.insert("items", {
      categoryId,
      name: "Shirt",
      quantity: 1,
      packed: false,
      priority: "medium",
    });

    return { listId, categoryId, itemId };
  });
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

    while (typeof data === "string") {
      data = JSON.parse(data) as unknown;
    }

    expect(data).toMatchObject({ code });
  }
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("stable Convex errors", () => {
  it("exposes machine-readable public error data", () => {
    expect(domainError("OFFLINE", "Network unavailable")).toMatchObject({
      data: { code: "OFFLINE", message: "Network unavailable" },
    });
  });
});

describe("identity and current-user helpers", () => {
  it("rejects unauthenticated requests", async () => {
    const t = createTestBackend();

    await expectErrorCode(t.run(requireIdentity), "UNAUTHENTICATED");
  });

  it("rejects identities without a matching user record", async () => {
    const t = createTestBackend();
    const asMissingUser = t.withIdentity({ subject: "missing-clerk-user" });

    await expectErrorCode(asMissingUser.run(requireCurrentUser), "NOT_FOUND");
  });

  it("uses a stable validation error for duplicate Clerk user records", async () => {
    const t = createTestBackend();
    await seedUser(t, "duplicate-clerk-user");
    await seedUser(t, "duplicate-clerk-user");
    const asDuplicateUser = t.withIdentity({ subject: "duplicate-clerk-user" });

    await expectErrorCode(asDuplicateUser.run(requireCurrentUser), "VALIDATION");
  });

  it("looks up the current user by the Clerk subject", async () => {
    const t = createTestBackend();
    const userId = await seedUser(t, "clerk-owner");
    const asOwner = t.withIdentity({ subject: "clerk-owner" });

    await expect(asOwner.run(requireCurrentUser)).resolves.toMatchObject({
      _id: userId,
      clerkId: "clerk-owner",
    });
  });
});

describe("admin authorization", () => {
  it("treats a missing migrated role as a non-admin user", async () => {
    const t = createTestBackend();
    await seedUser(t, "legacy-user");
    const asLegacyUser = t.withIdentity({ subject: "legacy-user" });

    await expectErrorCode(asLegacyUser.run(requireAdmin), "FORBIDDEN");
  });

  it("rejects an explicit non-admin user", async () => {
    const t = createTestBackend();
    await seedUser(t, "regular-user", "user");
    const asUser = t.withIdentity({ subject: "regular-user" });

    await expectErrorCode(asUser.run(requireAdmin), "FORBIDDEN");
  });

  it("returns an admin user", async () => {
    const t = createTestBackend();
    const adminId = await seedUser(t, "admin-user", "admin");
    const asAdmin = t.withIdentity({ subject: "admin-user" });

    await expect(asAdmin.run(requireAdmin)).resolves.toMatchObject({
      _id: adminId,
      role: "admin",
    });
  });
});

describe("ownership traversal", () => {
  it("authenticates before looking up a category", async () => {
    const t = createTestBackend();
    const ownerId = await seedUser(t, "clerk-owner");
    const { categoryId } = await seedOwnedTree(t, ownerId);
    await t.run((ctx) => ctx.db.delete(categoryId));

    await expectErrorCode(
      t.run((ctx) => requireOwnedCategory(ctx, categoryId)),
      "UNAUTHENTICATED",
    );
  });

  it("authenticates before looking up an item", async () => {
    const t = createTestBackend();
    const ownerId = await seedUser(t, "clerk-owner");
    const { itemId } = await seedOwnedTree(t, ownerId);
    await t.run((ctx) => ctx.db.delete(itemId));

    await expectErrorCode(
      t.run((ctx) => requireOwnedItem(ctx, itemId)),
      "UNAUTHENTICATED",
    );
  });

  it("returns a list owned by the current user", async () => {
    const t = createTestBackend();
    const ownerId = await seedUser(t, "clerk-owner");
    const { listId } = await seedOwnedTree(t, ownerId);
    const asOwner = t.withIdentity({ subject: "clerk-owner" });

    await expect(
      asOwner.run((ctx) => requireOwnedList(ctx, listId)),
    ).resolves.toMatchObject({ _id: listId, userId: ownerId });
  });

  it("rejects a list owned by another user", async () => {
    const t = createTestBackend();
    const ownerId = await seedUser(t, "clerk-owner");
    await seedUser(t, "clerk-stranger");
    const { listId } = await seedOwnedTree(t, ownerId);
    const asStranger = t.withIdentity({ subject: "clerk-stranger" });

    await expectErrorCode(
      asStranger.run((ctx) => requireOwnedList(ctx, listId)),
      "FORBIDDEN",
    );
  });

  it("returns a category only after traversing to its owned list", async () => {
    const t = createTestBackend();
    const ownerId = await seedUser(t, "clerk-owner");
    const { listId, categoryId } = await seedOwnedTree(t, ownerId);
    const asOwner = t.withIdentity({ subject: "clerk-owner" });

    await expect(
      asOwner.run((ctx) => requireOwnedCategory(ctx, categoryId)),
    ).resolves.toMatchObject({
      category: { _id: categoryId, listId },
      list: { _id: listId, userId: ownerId },
    });
  });

  it("rejects a foreign category through list ownership", async () => {
    const t = createTestBackend();
    const ownerId = await seedUser(t, "clerk-owner");
    await seedUser(t, "clerk-stranger");
    const { categoryId } = await seedOwnedTree(t, ownerId);
    const asStranger = t.withIdentity({ subject: "clerk-stranger" });

    await expectErrorCode(
      asStranger.run((ctx) => requireOwnedCategory(ctx, categoryId)),
      "FORBIDDEN",
    );
  });

  it("returns an item only after traversing its category and owned list", async () => {
    const t = createTestBackend();
    const ownerId = await seedUser(t, "clerk-owner");
    const { listId, categoryId, itemId } = await seedOwnedTree(t, ownerId);
    const asOwner = t.withIdentity({ subject: "clerk-owner" });

    await expect(
      asOwner.run((ctx) => requireOwnedItem(ctx, itemId)),
    ).resolves.toMatchObject({
      item: { _id: itemId, categoryId },
      category: { _id: categoryId, listId },
      list: { _id: listId, userId: ownerId },
    });
  });

  it("uses stable not-found errors for missing resources", async () => {
    const t = createTestBackend();
    const ownerId = await seedUser(t, "clerk-owner");
    const asOwner = t.withIdentity({ subject: "clerk-owner" });
    const missingListId = await t.run((ctx) =>
      ctx.db.insert("lists", {
        userId: ownerId,
        name: "Temporary",
        isTemplate: false,
      }),
    );
    await t.run((ctx) => ctx.db.delete(missingListId));

    await expectErrorCode(
      asOwner.run((ctx) => requireOwnedList(ctx, missingListId)),
      "NOT_FOUND",
    );
  });
});

describe("Clerk auth configuration", () => {
  it("rejects a missing Clerk JWT issuer domain", async () => {
    vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", "   ");

    // @ts-expect-error Convex requires this configuration module to remain JavaScript.
    await expect(import("../auth.config.js")).rejects.toThrow(
      "Missing required environment variable: CLERK_JWT_ISSUER_DOMAIN",
    );
  });

  it("rejects a Clerk issuer without an HTTPS URL", async () => {
    vi.stubEnv(
      "CLERK_JWT_ISSUER_DOMAIN",
      "example.clerk.accounts.dev",
    );

    // @ts-expect-error Convex requires this configuration module to remain JavaScript.
    await expect(import("../auth.config.js")).rejects.toThrow(
      "CLERK_JWT_ISSUER_DOMAIN must be a valid HTTPS URL",
    );
  });

  it("trims the configured Clerk JWT issuer domain", async () => {
    vi.stubEnv(
      "CLERK_JWT_ISSUER_DOMAIN",
      "  https://example.clerk.accounts.dev  ",
    );

    // @ts-expect-error Convex requires this configuration module to remain JavaScript.
    const { default: authConfig } = await import("../auth.config.js");

    expect(authConfig).toEqual({
      providers: [
        {
          domain: "https://example.clerk.accounts.dev",
          applicationID: "convex",
        },
      ],
    });
  });
});
