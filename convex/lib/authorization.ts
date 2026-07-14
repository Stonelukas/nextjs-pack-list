import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { requireCurrentUser } from "./auth";
import { domainError } from "./errors";

type AuthCtx = QueryCtx | MutationCtx;

async function getOwnedList(
  ctx: AuthCtx,
  userId: Id<"users">,
  listId: Id<"lists">,
): Promise<Doc<"lists">> {
  const list = await ctx.db.get(listId);

  if (!list) {
    throw domainError("NOT_FOUND", "List was not found");
  }

  if (list.userId !== userId) {
    throw domainError("FORBIDDEN", "You do not own this list");
  }

  return list;
}

async function getOwnedCategory(
  ctx: AuthCtx,
  userId: Id<"users">,
  categoryId: Id<"categories">,
): Promise<{ category: Doc<"categories">; list: Doc<"lists"> }> {
  const category = await ctx.db.get(categoryId);

  if (!category) {
    throw domainError("NOT_FOUND", "Category was not found");
  }

  const list = await getOwnedList(ctx, userId, category.listId);
  return { category, list };
}

export async function requireOwnedList(
  ctx: AuthCtx,
  listId: Id<"lists">,
): Promise<Doc<"lists">> {
  const user = await requireCurrentUser(ctx);
  return getOwnedList(ctx, user._id, listId);
}

export async function requireOwnedCategory(
  ctx: AuthCtx,
  categoryId: Id<"categories">,
): Promise<{ category: Doc<"categories">; list: Doc<"lists"> }> {
  const user = await requireCurrentUser(ctx);
  return getOwnedCategory(ctx, user._id, categoryId);
}

export async function requireOwnedItem(
  ctx: AuthCtx,
  itemId: Id<"items">,
): Promise<{
  item: Doc<"items">;
  category: Doc<"categories">;
  list: Doc<"lists">;
}> {
  const user = await requireCurrentUser(ctx);
  const item = await ctx.db.get(itemId);

  if (!item) {
    throw domainError("NOT_FOUND", "Item was not found");
  }

  const { category, list } = await getOwnedCategory(
    ctx,
    user._id,
    item.categoryId,
  );
  return { item, category, list };
}
